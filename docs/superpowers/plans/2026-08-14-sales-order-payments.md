# Sales Order Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record and void partial payments on saved sales orders from the list 3-dot menu (walk-in cash only; customer sales: Cash, PDC, Bank Transfer, Online Payment), and allow Void sale only while the order has zero payments.

**Architecture:** Dedicated `sales_order_payments` table mirroring purchased-order payments (inbound). `SalesOrder` derives `amount_paid`, `balance_due`, and `payment_status`. PDC creates a company `bank_checks` row; voiding a PDC payment deletes the payment and sets `bank_checks.voided_at`. No AR module.

**Tech Stack:** Laravel 13, PHP 8.3+, Inertia.js v3, React 19 JSX, Wayfinder, Form Requests, PHPUnit, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-08-14-sales-order-payments-design.md`

## Global Constraints

- Partial payments allowed until `balance_due` is 0; amount `> 0` and ≤ remaining balance.
- Walk-in (`customer_id` null): method locked to `cash`; server rejects any other method.
- Customer set: `cash` | `online_payment` | `bank_transfer` | `post_dated_check` (do **not** reuse `PurchasedOrderPaymentMethod` / `bank_deposit`).
- Void sales order only while there are **zero payment rows** (UI hide + server reject). Stock moves only on void/restore of the **sales order**, never on payment store/void.
- Void payment deletes the row; PDC also voids the linked bank check (`voided_at`), does not delete the check.
- Daily sales chart stays `grand_total` of active orders (not cash collected).
- JSX only; no hand-edits of Wayfinder files; Form Request for store payment; tablet+ usable (~44px targets).
- Toasts via `Inertia::flash('toast', ['type' => …, 'message' => …])`.

## File Structure

| File | Responsibility |
|------|----------------|
| `database/migrations/2026_08_14_100000_create_sales_order_payments_table.php` | `sales_order_payments` schema |
| `app/Enums/SalesOrderPaymentMethod.php` | Cash / Online Payment / Bank Transfer / PDC |
| `app/Models/SalesOrderPayment.php` | Payment model + `toArrayPayload()` |
| `database/factories/SalesOrderPaymentFactory.php` | Test factory + method states |
| `app/Models/SalesOrder.php` | `payments()`, totals, flags, payload |
| `app/Models/BankCheck.php` | `salesOrderPayment()`; `isLinked()` includes sales payments |
| `app/Http/Requests/StoreSalesOrderPaymentRequest.php` | Validation + attribute builders |
| `app/Http/Controllers/SalesOrderController.php` | `storePayment`, `destroyPayment`; index props; void-sale guard |
| `app/Http/Controllers/BankCheckController.php` | Block void when `isLinked()`; generic payment message |
| `app/Services/BankAccountAuditor.php` | Subject type `sales_order_payment` |
| `routes/web.php` | `sales-orders.payments.store` / `destroy` |
| `resources/js/components/sales-order-payment-modal.jsx` | Add Payment slide-down modal |
| `resources/js/components/sales-order-detail-modal.jsx` | Paid/balance, payments list, void payment |
| `resources/js/pages/sales-orders/index.jsx` | Menu, chips, Payment column, wire modal |
| `tests/Feature/SalesOrderTest.php` | Payment feature coverage |
| `tests/Feature/BankCheckTest.php` | Linked sales-payment check cannot be voided from bank UI |
| `.cursor/rules/PRD.mdc`, `README.md` | Domain/UX/routes; payments shipped, AR still later |

---

### Task 1: Schema, enum, models, index payload

**Files:**
- Create: `database/migrations/2026_08_14_100000_create_sales_order_payments_table.php`
- Create: `app/Enums/SalesOrderPaymentMethod.php`
- Create: `app/Models/SalesOrderPayment.php`
- Create: `database/factories/SalesOrderPaymentFactory.php`
- Modify: `app/Models/SalesOrder.php`
- Modify: `app/Http/Controllers/SalesOrderController.php` (`index` eager-load + picker props)
- Test: `tests/Feature/SalesOrderTest.php`

**Interfaces:**
- Consumes: `SalesOrder`, `BankAccount`, `BankAccountStatus` (active picker)
- Produces:
  - `SalesOrderPaymentMethod` cases: `cash`, `online_payment`, `bank_transfer`, `post_dated_check`
  - `SalesOrder::payments(): HasMany<SalesOrderPayment>`
  - `SalesOrder::amountPaid(): string`, `balanceDue(): string`, `paymentStatus(): string` (`unpaid`\|`partial`\|`paid`)
  - `SalesOrder::canAddPayment(): bool`, `canVoid(): bool`
  - Payload keys: `amount_paid`, `balance_due`, `payment_status`, `payments`, `can_add_payment`, `can_void`
  - Index props: `paymentMethods` (`list<{value,label}>`), `bankAccounts` (`list<{id,name}>`)

- [ ] **Step 1: Write the failing tests**

Add to `tests/Feature/SalesOrderTest.php` (keep existing imports). Add:

```php
use App\Models\BankAccount;
```

Extend `test_authenticated_users_can_view_sales_order_index` assertions (after existing `where` calls):

```php
->where('orders.data.0.amount_paid', '0.00')
->where('orders.data.0.balance_due', '40.00')
->where('orders.data.0.payment_status', 'unpaid')
->where('orders.data.0.can_add_payment', true)
->where('orders.data.0.can_void', true)
->has('orders.data.0.payments', 0)
->has('paymentMethods', 4)
->where('paymentMethods.0.value', 'cash')
->where('paymentMethods.2.value', 'bank_transfer')
```

Add new tests:

```php
public function test_index_includes_active_bank_accounts_only(): void
{
    $admin = User::factory()->create();
    BankAccount::factory()->active()->create(['name' => 'BPI Checking']);
    BankAccount::factory()->inactive()->create(['name' => 'Hidden Bank']);

    $this->actingAs($admin)
        ->get(route('sales-orders.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('sales-orders/index')
            ->has('bankAccounts', 1)
            ->where('bankAccounts.0.name', 'BPI Checking')
        );
}

public function test_zero_total_order_is_paid_without_add_payment_and_still_voidable(): void
{
    $admin = User::factory()->create();
    $order = SalesOrder::factory()->create(['grand_total' => '0.00']);

    $this->actingAs($admin)
        ->get(route('sales-orders.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data.0.id', $order->id)
            ->where('orders.data.0.payment_status', 'paid')
            ->where('orders.data.0.can_add_payment', false)
            ->where('orders.data.0.can_void', true)
        );
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
php artisan test --filter=test_authenticated_users_can_view_sales_order_index
php artisan test --filter=test_index_includes_active_bank_accounts_only
php artisan test --filter=test_zero_total_order_is_paid_without_add_payment_and_still_voidable
```

Expected: FAIL — missing `amount_paid` / `paymentMethods` / `bankAccounts` (or `where` mismatch).

- [ ] **Step 3: Create enum, migration, model, factory**

`app/Enums/SalesOrderPaymentMethod.php`:

```php
<?php

namespace App\Enums;

enum SalesOrderPaymentMethod: string
{
    case Cash = 'cash';
    case OnlinePayment = 'online_payment';
    case BankTransfer = 'bank_transfer';
    case PostDatedCheck = 'post_dated_check';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Cash',
            self::OnlinePayment => 'Online Payment',
            self::BankTransfer => 'Bank Transfer',
            self::PostDatedCheck => 'Post Dated Check',
        };
    }
}
```

`database/migrations/2026_08_14_100000_create_sales_order_payments_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_order_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')
                ->constrained('sales_orders')
                ->cascadeOnDelete();
            $table->string('method');
            $table->decimal('amount', 14, 2);
            $table->text('notes')->nullable();
            $table->string('platform')->nullable();
            $table->string('reference_number')->nullable();
            $table->string('bank_name')->nullable();
            $table->foreignId('bank_check_id')
                ->nullable()
                ->unique()
                ->constrained('bank_checks')
                ->nullOnDelete();
            $table->string('recorded_by');
            $table->timestamp('paid_at');
            $table->timestamps();

            $table->index('method');
            $table->index('paid_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_order_payments');
    }
};
```

`app/Models/SalesOrderPayment.php`:

```php
<?php

namespace App\Models;

use App\Enums\SalesOrderPaymentMethod;
use Database\Factories\SalesOrderPaymentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'sales_order_id',
    'method',
    'amount',
    'notes',
    'platform',
    'reference_number',
    'bank_name',
    'bank_check_id',
    'recorded_by',
    'paid_at',
])]
class SalesOrderPayment extends Model
{
    /** @use HasFactory<SalesOrderPaymentFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'method' => SalesOrderPaymentMethod::class,
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<SalesOrder, $this>
     */
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    /**
     * @return BelongsTo<BankCheck, $this>
     */
    public function bankCheck(): BelongsTo
    {
        return $this->belongsTo(BankCheck::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArrayPayload(): array
    {
        $bankCheck = $this->relationLoaded('bankCheck') ? $this->bankCheck : null;

        if ($bankCheck !== null && ! $bankCheck->relationLoaded('bankAccount')) {
            $bankCheck->load('bankAccount');
        }

        return [
            'id' => $this->id,
            'sales_order_id' => $this->sales_order_id,
            'method' => $this->method->value,
            'method_label' => $this->method->label(),
            'amount' => $this->amount,
            'notes' => $this->notes,
            'platform' => $this->platform,
            'reference_number' => $this->reference_number,
            'bank_name' => $this->bank_name,
            'bank_check_id' => $this->bank_check_id,
            'bank_check' => $bankCheck?->toArrayPayload(),
            'recorded_by' => $this->recorded_by,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
```

`database/factories/SalesOrderPaymentFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Enums\SalesOrderPaymentMethod;
use App\Models\SalesOrder;
use App\Models\SalesOrderPayment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SalesOrderPayment>
 */
class SalesOrderPaymentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sales_order_id' => SalesOrder::factory(),
            'method' => SalesOrderPaymentMethod::Cash,
            'amount' => fake()->randomFloat(2, 50, 5000),
            'notes' => fake()->optional(0.3)->sentence(),
            'platform' => null,
            'reference_number' => null,
            'bank_name' => null,
            'bank_check_id' => null,
            'recorded_by' => fake()->name(),
            'paid_at' => now(),
        ];
    }

    public function cash(): static
    {
        return $this->state(fn () => [
            'method' => SalesOrderPaymentMethod::Cash,
            'platform' => null,
            'reference_number' => null,
            'bank_name' => null,
            'bank_check_id' => null,
        ]);
    }

    public function onlinePayment(): static
    {
        return $this->state(fn () => [
            'method' => SalesOrderPaymentMethod::OnlinePayment,
            'platform' => 'GCash',
            'reference_number' => fake()->numerify('REF########'),
            'bank_name' => null,
            'bank_check_id' => null,
        ]);
    }

    public function bankTransfer(): static
    {
        return $this->state(fn () => [
            'method' => SalesOrderPaymentMethod::BankTransfer,
            'platform' => null,
            'bank_name' => 'BDO',
            'reference_number' => fake()->numerify('TRN########'),
            'bank_check_id' => null,
        ]);
    }
}
```

- [ ] **Step 4: Wire SalesOrder helpers and index props**

In `app/Models/SalesOrder.php`, add `HasMany` import if missing and:

```php
/**
 * @return HasMany<SalesOrderPayment, $this>
 */
public function payments(): HasMany
{
    return $this->hasMany(SalesOrderPayment::class)->orderByDesc('paid_at')->orderByDesc('id');
}

public function amountPaid(): string
{
    $sum = $this->relationLoaded('payments')
        ? $this->payments->sum(fn (SalesOrderPayment $payment) => (float) $payment->amount)
        : (float) $this->payments()->sum('amount');

    return number_format($sum, 2, '.', '');
}

public function balanceDue(): string
{
    $balance = (float) $this->grand_total - (float) $this->amountPaid();

    return number_format(max(0, $balance), 2, '.', '');
}

public function paymentStatus(): string
{
    $hasPayments = $this->relationLoaded('payments')
        ? $this->payments->isNotEmpty()
        : $this->payments()->exists();

    if (! $hasPayments) {
        return (float) $this->grand_total <= 0 ? 'paid' : 'unpaid';
    }

    return (float) $this->balanceDue() > 0 ? 'partial' : 'paid';
}

public function canAddPayment(): bool
{
    return $this->deleted_at === null && (float) $this->balanceDue() > 0;
}

public function canVoid(): bool
{
    if ($this->deleted_at !== null) {
        return false;
    }

    return $this->relationLoaded('payments')
        ? $this->payments->isEmpty()
        : $this->payments()->doesntExist();
}
```

Replace `toArrayPayload()` payment-related keys. Keep existing fields; change `can_void` and add:

```php
$amountPaid = $this->amountPaid();
$balanceDue = $this->balanceDue();

return [
    // …existing keys through item_count/items…
    'grand_total' => $this->grand_total,
    'amount_paid' => $amountPaid,
    'balance_due' => $balanceDue,
    'payment_status' => $this->paymentStatus(),
    'notes' => $this->notes,
    'item_count' => $this->relationLoaded('items')
        ? $this->items->count()
        : $this->items()->count(),
    'items' => $this->relationLoaded('items')
        ? $this->items->map(fn (SalesOrderItem $item) => $item->toArrayPayload())->values()->all()
        : [],
    'payments' => $this->relationLoaded('payments')
        ? $this->payments->map(fn (SalesOrderPayment $payment) => $payment->toArrayPayload())->values()->all()
        : [],
    'can_void' => $this->canVoid(),
    'can_add_payment' => $this->canAddPayment(),
    'can_restore' => $this->deleted_at !== null,
    'deleted_at' => $this->deleted_at?->toIso8601String(),
    'created_at' => $this->created_at?->toIso8601String(),
];
```

In `SalesOrderController@index`:

1. Add imports: `App\Enums\BankAccountStatus`, `App\Enums\SalesOrderPaymentMethod`, `App\Models\BankAccount`.
2. Change eager load to `->with(['customer', 'items.product', 'payments.bankCheck.bankAccount'])`.
3. Add to `Inertia::render` (alongside existing props):

```php
'paymentMethods' => $this->paymentMethodOptions(),
'bankAccounts' => BankAccount::query()
    ->where('status', BankAccountStatus::Active)
    ->orderBy('name')
    ->get()
    ->map(fn (BankAccount $bankAccount) => [
        'id' => $bankAccount->id,
        'name' => $bankAccount->name,
    ])
    ->values()
    ->all(),
```

4. Add private helper:

```php
/**
 * @return list<array{value: string, label: string}>
 */
private function paymentMethodOptions(): array
{
    return array_map(
        fn (SalesOrderPaymentMethod $method) => [
            'value' => $method->value,
            'label' => $method->label(),
        ],
        SalesOrderPaymentMethod::cases(),
    );
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
php artisan test --filter=SalesOrderTest
vendor/bin/pint --dirty
```

Expected: PASS (existing void/stock tests still pass; `can_void` remains true with no payments).

- [ ] **Step 6: Commit**

```bash
git add database/migrations/2026_08_14_100000_create_sales_order_payments_table.php \
  app/Enums/SalesOrderPaymentMethod.php \
  app/Models/SalesOrderPayment.php \
  database/factories/SalesOrderPaymentFactory.php \
  app/Models/SalesOrder.php \
  app/Http/Controllers/SalesOrderController.php \
  tests/Feature/SalesOrderTest.php
git commit -m "feat: add sales order payment schema and index payload"
```

---

### Task 2: Store payment (HTTP + validation)

**Files:**
- Create: `app/Http/Requests/StoreSalesOrderPaymentRequest.php`
- Modify: `app/Http/Controllers/SalesOrderController.php`
- Modify: `app/Services/BankAccountAuditor.php`
- Modify: `routes/web.php`
- Test: `tests/Feature/SalesOrderTest.php`

**Interfaces:**
- Consumes: `SalesOrder::canAddPayment()`, `balanceDue()`, `StoreSalesOrderPaymentRequest::paymentAttributes(string $recordedBy): array`, `bankCheckAttributes(string $issuedBy): ?array`
- Produces: `POST sales-orders/{sales_order}/payments` named `sales-orders.payments.store` → `SalesOrderController::storePayment`
- Auditor: `BankAccountAuditor::subjectType` maps `SalesOrderPayment` → `'sales_order_payment'`

- [ ] **Step 1: Write the failing tests**

Add imports:

```php
use App\Enums\SalesOrderPaymentMethod;
use App\Models\BankCheck;
use App\Models\SalesOrderPayment;
use App\Models\StockMovement;
```

(`StockMovement` / `StockMovementType` already imported if present.)

```php
public function test_walk_in_can_record_cash_payment(): void
{
    $admin = User::factory()->create(['name' => 'Admin User']);
    $order = SalesOrder::factory()->create(['grand_total' => '100.00']);

    $this->actingAs($admin)
        ->post(route('sales-orders.payments.store', $order), [
            'method' => SalesOrderPaymentMethod::Cash->value,
            'amount' => '40.00',
            'notes' => 'Partial cash',
        ])
        ->assertRedirect(route('sales-orders.index'));

    $this->assertDatabaseHas('sales_order_payments', [
        'sales_order_id' => $order->id,
        'method' => SalesOrderPaymentMethod::Cash->value,
        'amount' => '40.00',
        'recorded_by' => 'Admin User',
        'notes' => 'Partial cash',
    ]);
}

public function test_walk_in_rejects_non_cash_payment(): void
{
    $admin = User::factory()->create();
    $order = SalesOrder::factory()->create(['grand_total' => '100.00']);

    $this->actingAs($admin)
        ->from(route('sales-orders.index'))
        ->post(route('sales-orders.payments.store', $order), [
            'method' => SalesOrderPaymentMethod::OnlinePayment->value,
            'amount' => '10.00',
            'platform' => 'GCash',
        ])
        ->assertRedirect(route('sales-orders.index'))
        ->assertSessionHasErrors('method');

    $this->assertDatabaseCount('sales_order_payments', 0);
}

public function test_customer_sale_can_record_each_payment_method(): void
{
    $admin = User::factory()->create(['name' => 'Check Issuer']);
    $customer = Customer::factory()->active()->create();
    $bankAccount = BankAccount::factory()->active()->create(['name' => 'BPI']);
    $dueDate = now()->addDays(14)->toDateString();

    $cashOrder = SalesOrder::factory()->create([
        'customer_id' => $customer->id,
        'grand_total' => '100.00',
    ]);
    $onlineOrder = SalesOrder::factory()->create([
        'customer_id' => $customer->id,
        'grand_total' => '100.00',
    ]);
    $transferOrder = SalesOrder::factory()->create([
        'customer_id' => $customer->id,
        'grand_total' => '100.00',
    ]);
    $pdcOrder = SalesOrder::factory()->create([
        'customer_id' => $customer->id,
        'grand_total' => '100.00',
    ]);

    $this->actingAs($admin)
        ->post(route('sales-orders.payments.store', $cashOrder), [
            'method' => SalesOrderPaymentMethod::Cash->value,
            'amount' => '10.00',
        ])
        ->assertRedirect(route('sales-orders.index'));

    $this->actingAs($admin)
        ->post(route('sales-orders.payments.store', $onlineOrder), [
            'method' => SalesOrderPaymentMethod::OnlinePayment->value,
            'amount' => '25.00',
            'platform' => 'GCash',
            'reference_number' => 'GC-123',
        ])
        ->assertRedirect(route('sales-orders.index'));

    $this->actingAs($admin)
        ->post(route('sales-orders.payments.store', $transferOrder), [
            'method' => SalesOrderPaymentMethod::BankTransfer->value,
            'amount' => '30.00',
            'bank_name' => 'BDO',
            'reference_number' => 'TRN-999',
        ])
        ->assertRedirect(route('sales-orders.index'));

    $this->actingAs($admin)
        ->post(route('sales-orders.payments.store', $pdcOrder), [
            'method' => SalesOrderPaymentMethod::PostDatedCheck->value,
            'amount' => '50.00',
            'bank_account_id' => $bankAccount->id,
            'check_number' => 'CHK-2001',
            'due_date' => $dueDate,
            'notes' => 'Customer PDC',
        ])
        ->assertRedirect(route('sales-orders.index'));

    $this->assertDatabaseHas('sales_order_payments', [
        'sales_order_id' => $onlineOrder->id,
        'method' => SalesOrderPaymentMethod::OnlinePayment->value,
        'platform' => 'GCash',
        'reference_number' => 'GC-123',
    ]);
    $this->assertDatabaseHas('sales_order_payments', [
        'sales_order_id' => $transferOrder->id,
        'method' => SalesOrderPaymentMethod::BankTransfer->value,
        'bank_name' => 'BDO',
        'reference_number' => 'TRN-999',
    ]);

    $check = BankCheck::query()->where('check_number', 'CHK-2001')->first();
    $this->assertNotNull($check);
    $this->assertSame($bankAccount->id, $check->bank_account_id);
    $this->assertSame('50.00', $check->amount);
    $this->assertSame($dueDate, $check->due_date?->toDateString());
    $this->assertSame('Check Issuer', $check->issued_by);

    $this->assertDatabaseHas('sales_order_payments', [
        'sales_order_id' => $pdcOrder->id,
        'method' => SalesOrderPaymentMethod::PostDatedCheck->value,
        'bank_check_id' => $check->id,
        'recorded_by' => 'Check Issuer',
    ]);
    $this->assertDatabaseHas('bank_account_audit_logs', [
        'bank_account_id' => $bankAccount->id,
        'action' => 'check.created',
        'subject_type' => 'bank_check',
    ]);
    $this->assertDatabaseHas('bank_account_audit_logs', [
        'bank_account_id' => $bankAccount->id,
        'action' => 'payment.recorded',
        'subject_type' => 'sales_order_payment',
    ]);
}

public function test_payment_amount_cannot_exceed_balance(): void
{
    $admin = User::factory()->create();
    $order = SalesOrder::factory()->create(['grand_total' => '100.00']);
    SalesOrderPayment::factory()->cash()->create([
        'sales_order_id' => $order->id,
        'amount' => '80.00',
    ]);

    $this->actingAs($admin)
        ->from(route('sales-orders.index'))
        ->post(route('sales-orders.payments.store', $order), [
            'method' => SalesOrderPaymentMethod::Cash->value,
            'amount' => '30.00',
        ])
        ->assertRedirect(route('sales-orders.index'))
        ->assertSessionHasErrors('amount');

    $this->assertDatabaseCount('sales_order_payments', 1);
}

public function test_second_partial_payment_is_allowed_until_paid(): void
{
    $admin = User::factory()->create();
    $order = SalesOrder::factory()->create(['grand_total' => '100.00']);
    SalesOrderPayment::factory()->cash()->create([
        'sales_order_id' => $order->id,
        'amount' => '40.00',
    ]);

    $this->actingAs($admin)
        ->post(route('sales-orders.payments.store', $order), [
            'method' => SalesOrderPaymentMethod::Cash->value,
            'amount' => '60.00',
        ])
        ->assertRedirect(route('sales-orders.index'));

    $this->actingAs($admin)
        ->get(route('sales-orders.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data.0.id', $order->id)
            ->where('orders.data.0.amount_paid', '100.00')
            ->where('orders.data.0.balance_due', '0.00')
            ->where('orders.data.0.payment_status', 'paid')
            ->where('orders.data.0.can_add_payment', false)
            ->where('orders.data.0.can_void', false)
        );
}

public function test_cannot_add_payment_when_fully_paid(): void
{
    $admin = User::factory()->create();
    $order = SalesOrder::factory()->create(['grand_total' => '50.00']);
    SalesOrderPayment::factory()->cash()->create([
        'sales_order_id' => $order->id,
        'amount' => '50.00',
    ]);

    $this->actingAs($admin)
        ->post(route('sales-orders.payments.store', $order), [
            'method' => SalesOrderPaymentMethod::Cash->value,
            'amount' => '1.00',
        ])
        ->assertRedirect(route('sales-orders.index'));

    $this->assertDatabaseCount('sales_order_payments', 1);
}

public function test_recording_payment_does_not_change_stock(): void
{
    $admin = User::factory()->create();
    $product = Product::factory()->available()->create(['quantity' => 10]);

    $this->actingAs($admin)
        ->post(route('sales-orders.store'), [
            'items' => [[
                'product_id' => $product->id,
                'selling_price' => '8.00',
                'quantity' => 2,
            ]],
        ])
        ->assertRedirect(route('sales-orders.index'));

    $order = SalesOrder::query()->first();
    $movementsBefore = StockMovement::query()->count();

    $this->actingAs($admin)
        ->post(route('sales-orders.payments.store', $order), [
            'method' => SalesOrderPaymentMethod::Cash->value,
            'amount' => '16.00',
        ])
        ->assertRedirect(route('sales-orders.index'));

    $this->assertSame(8, $product->fresh()->quantity);
    $this->assertSame($movementsBefore, StockMovement::query()->count());
}

public function test_daily_sales_series_still_sums_grand_total_not_payments(): void
{
    $admin = User::factory()->create();

    Carbon::setTestNow(Carbon::parse('2026-08-14 12:00:00', config('app.timezone')));

    try {
        $order = SalesOrder::factory()->create([
            'grand_total' => '80.00',
            'created_at' => Carbon::parse('2026-08-14 09:00:00'),
            'updated_at' => Carbon::parse('2026-08-14 09:00:00'),
        ]);
        SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $order->id,
            'amount' => '20.00',
        ]);

        $this->actingAs($admin)
            ->get(route('sales-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('dailySales.labels.89', '2026-08-14')
                ->where('dailySales.totals.89', 80)
            );
    } finally {
        Carbon::setTestNow();
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
php artisan test --filter=test_walk_in_can_record_cash_payment
```

Expected: FAIL — route `sales-orders.payments.store` not defined.

- [ ] **Step 3: Implement Form Request, route, controller, auditor**

`app/Http/Requests/StoreSalesOrderPaymentRequest.php` — mirror `StorePurchasedOrderPaymentRequest`, swapping enum and `BankTransfer` for `BankDeposit`, plus walk-in cash-only:

```php
<?php

namespace App\Http\Requests;

use App\Enums\BankAccountStatus;
use App\Enums\SalesOrderPaymentMethod;
use App\Models\SalesOrder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreSalesOrderPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'method' => ['required', Rule::enum(SalesOrderPaymentMethod::class)],
            'amount' => ['required', 'numeric', 'gt:0'],
            'notes' => ['nullable', 'string'],
            'platform' => [
                'nullable',
                'required_if:method,'.SalesOrderPaymentMethod::OnlinePayment->value,
                'string',
                'max:255',
            ],
            'reference_number' => [
                'nullable',
                'required_if:method,'.SalesOrderPaymentMethod::BankTransfer->value,
                'string',
                'max:255',
            ],
            'bank_name' => [
                'nullable',
                'required_if:method,'.SalesOrderPaymentMethod::BankTransfer->value,
                'string',
                'max:255',
            ],
            'bank_account_id' => [
                'nullable',
                'required_if:method,'.SalesOrderPaymentMethod::PostDatedCheck->value,
                'integer',
                Rule::exists('bank_accounts', 'id')->where(function ($query) {
                    $query->where('status', BankAccountStatus::Active->value)
                        ->whereNull('deleted_at');
                }),
            ],
            'check_number' => [
                'nullable',
                'required_if:method,'.SalesOrderPaymentMethod::PostDatedCheck->value,
                'string',
                'max:100',
            ],
            'due_date' => [
                'nullable',
                'required_if:method,'.SalesOrderPaymentMethod::PostDatedCheck->value,
                'date',
                'after_or_equal:today',
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var SalesOrder|null $order */
            $order = $this->route('sales_order');

            if (! $order instanceof SalesOrder) {
                return;
            }

            if ($order->customer_id === null
                && $this->input('method') !== SalesOrderPaymentMethod::Cash->value
                && ! $validator->errors()->has('method')
            ) {
                $validator->errors()->add(
                    'method',
                    'Walk-in sales only accept cash payments.',
                );
            }

            if ($validator->errors()->has('amount')) {
                return;
            }

            $amount = (float) $this->input('amount');
            $balanceDue = (float) $order->balanceDue();

            if ($amount > $balanceDue + 0.00001) {
                $validator->errors()->add(
                    'amount',
                    'The amount may not exceed the remaining balance of '.number_format($balanceDue, 2, '.', '').'.',
                );
            }
        });
    }

    public function paymentMethod(): SalesOrderPaymentMethod
    {
        return SalesOrderPaymentMethod::from($this->validated('method'));
    }

    /**
     * @return array<string, mixed>
     */
    public function paymentAttributes(string $recordedBy): array
    {
        $method = $this->paymentMethod();
        $validated = $this->validated();

        return [
            'method' => $method,
            'amount' => number_format((float) $validated['amount'], 2, '.', ''),
            'notes' => $validated['notes'] ?? null,
            'platform' => $method === SalesOrderPaymentMethod::OnlinePayment
                ? ($validated['platform'] ?? null)
                : null,
            'reference_number' => in_array($method, [
                SalesOrderPaymentMethod::OnlinePayment,
                SalesOrderPaymentMethod::BankTransfer,
            ], true)
                ? ($validated['reference_number'] ?? null)
                : null,
            'bank_name' => $method === SalesOrderPaymentMethod::BankTransfer
                ? ($validated['bank_name'] ?? null)
                : null,
            'recorded_by' => $recordedBy,
            'paid_at' => now(),
        ];
    }

    /**
     * @return array{bank_account_id: int, check_number: string, amount: string, due_date: string, issued_by: string, notes: string|null}|null
     */
    public function bankCheckAttributes(string $issuedBy): ?array
    {
        if ($this->paymentMethod() !== SalesOrderPaymentMethod::PostDatedCheck) {
            return null;
        }

        $validated = $this->validated();

        return [
            'bank_account_id' => (int) $validated['bank_account_id'],
            'check_number' => $validated['check_number'],
            'amount' => number_format((float) $validated['amount'], 2, '.', ''),
            'due_date' => $validated['due_date'],
            'issued_by' => $issuedBy,
            'notes' => $validated['notes'] ?? null,
        ];
    }
}
```

In `routes/web.php`, immediately after the restore route (before the sales-orders resource):

```php
Route::post('sales-orders/{sales_order}/payments', [SalesOrderController::class, 'storePayment'])
    ->name('sales-orders.payments.store');
```

In `BankAccountAuditor::subjectType`, add before the default:

```php
$subject instanceof SalesOrderPayment => 'sales_order_payment',
```

Import `App\Models\SalesOrderPayment`.

In `SalesOrderController`, add imports: `StoreSalesOrderPaymentRequest`, `BankCheck`, `BankAccountAuditor`, `SalesOrderPayment`. Add:

```php
public function storePayment(
    StoreSalesOrderPaymentRequest $request,
    SalesOrder $salesOrder,
): RedirectResponse {
    if (! $salesOrder->canAddPayment()) {
        Inertia::flash('toast', [
            'type' => 'error',
            'message' => 'Payments can only be added when there is a remaining balance.',
        ]);

        return redirect()->route('sales-orders.index');
    }

    $userName = $request->user()?->name ?? 'Unknown';
    $paymentAttributes = $request->paymentAttributes($userName);
    $bankCheckAttributes = $request->bankCheckAttributes($userName);

    $createdBankCheck = null;
    $createdPayment = null;

    DB::transaction(function () use ($salesOrder, $paymentAttributes, $bankCheckAttributes, &$createdBankCheck, &$createdPayment): void {
        if ($bankCheckAttributes !== null) {
            $createdBankCheck = BankCheck::query()->create($bankCheckAttributes);
            $paymentAttributes['bank_check_id'] = $createdBankCheck->id;
        }

        $createdPayment = $salesOrder->payments()->create($paymentAttributes);
    });

    if ($createdBankCheck !== null && $createdPayment !== null) {
        $createdBankCheck->load('bankAccount');
        $auditor = app(BankAccountAuditor::class);
        $account = $createdBankCheck->bankAccount;

        if ($account !== null) {
            $auditor->record(
                $account,
                'check.created',
                $createdBankCheck,
                "Issued check #{$createdBankCheck->check_number}",
                null,
                $createdBankCheck->toArrayPayload(),
                $request->user(),
            );
            $auditor->record(
                $account,
                'payment.recorded',
                $createdPayment,
                "Recorded check payment {$createdPayment->amount}",
                null,
                $createdPayment->toArrayPayload(),
                $request->user(),
            );
        }
    }

    Inertia::flash('toast', [
        'type' => 'success',
        'message' => 'Payment recorded.',
    ]);

    return redirect()->route('sales-orders.index');
}
```

Regenerate Wayfinder (do not hand-edit generated files):

```bash
php artisan wayfinder:generate
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
php artisan test --filter=SalesOrderTest
vendor/bin/pint --dirty
```

Expected: PASS. Fully-paid store flashes error and does not insert a second row.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Requests/StoreSalesOrderPaymentRequest.php \
  app/Http/Controllers/SalesOrderController.php \
  app/Services/BankAccountAuditor.php \
  routes/web.php \
  tests/Feature/SalesOrderTest.php \
  resources/js/actions resources/js/routes
git commit -m "feat: record sales order payments including walk-in cash lock"
```

(Only add Wayfinder files if `wayfinder:generate` changed them.)

---

### Task 3: Void payment, block void sale, bank-check linkage

**Files:**
- Modify: `app/Http/Controllers/SalesOrderController.php` (`destroy`, `destroyPayment`)
- Modify: `app/Models/BankCheck.php`
- Modify: `app/Http/Controllers/BankCheckController.php`
- Modify: `routes/web.php`
- Test: `tests/Feature/SalesOrderTest.php`, `tests/Feature/BankCheckTest.php`

**Interfaces:**
- Consumes: `SalesOrderPayment` belonging to `{sales_order}`; `BankCheck::salesOrderPayment(): HasOne<SalesOrderPayment>`
- Produces: `DELETE sales-orders/{sales_order}/payments/{sales_order_payment}` named `sales-orders.payments.destroy` → `destroyPayment`
- `BankCheck::isLinked()` true if PO **or** sales payment exists
- `SalesOrderController::destroy` no-ops stock restore when payments exist (toast error)

- [ ] **Step 1: Write the failing tests**

```php
public function test_void_sale_is_rejected_when_any_payment_exists(): void
{
    $admin = User::factory()->create();
    $product = Product::factory()->available()->create(['quantity' => 10]);

    $this->actingAs($admin)
        ->post(route('sales-orders.store'), [
            'items' => [[
                'product_id' => $product->id,
                'selling_price' => '8.00',
                'quantity' => 3,
            ]],
        ])
        ->assertRedirect(route('sales-orders.index'));

    $order = SalesOrder::query()->first();
    SalesOrderPayment::factory()->cash()->create([
        'sales_order_id' => $order->id,
        'amount' => '8.00',
    ]);

    $this->actingAs($admin)
        ->delete(route('sales-orders.destroy', $order))
        ->assertRedirect(route('sales-orders.index'));

    $this->assertNull($order->fresh()->deleted_at);
    $this->assertSame(7, $product->fresh()->quantity);
    $this->assertDatabaseCount('sales_order_payments', 1);
}

public function test_void_payment_restores_unpaid_and_can_void_sale(): void
{
    $admin = User::factory()->create();
    $order = SalesOrder::factory()->create(['grand_total' => '100.00']);
    $payment = SalesOrderPayment::factory()->cash()->create([
        'sales_order_id' => $order->id,
        'amount' => '40.00',
    ]);

    $this->actingAs($admin)
        ->delete(route('sales-orders.payments.destroy', [$order, $payment]))
        ->assertRedirect(route('sales-orders.index'));

    $this->assertDatabaseCount('sales_order_payments', 0);

    $this->actingAs($admin)
        ->get(route('sales-orders.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data.0.id', $order->id)
            ->where('orders.data.0.payment_status', 'unpaid')
            ->where('orders.data.0.can_void', true)
            ->where('orders.data.0.can_add_payment', true)
        );
}

public function test_void_pdc_payment_voids_bank_check_without_deleting_it(): void
{
    $admin = User::factory()->create(['name' => 'Admin User']);
    $customer = Customer::factory()->active()->create();
    $bankAccount = BankAccount::factory()->active()->create();
    $order = SalesOrder::factory()->create([
        'customer_id' => $customer->id,
        'grand_total' => '100.00',
    ]);
    $dueDate = now()->addDays(7)->toDateString();

    $this->actingAs($admin)
        ->post(route('sales-orders.payments.store', $order), [
            'method' => SalesOrderPaymentMethod::PostDatedCheck->value,
            'amount' => '100.00',
            'bank_account_id' => $bankAccount->id,
            'check_number' => 'CHK-VOID-1',
            'due_date' => $dueDate,
        ])
        ->assertRedirect(route('sales-orders.index'));

    $payment = SalesOrderPayment::query()->first();
    $check = BankCheck::query()->where('check_number', 'CHK-VOID-1')->first();
    $this->assertNotNull($check);
    $this->assertNull($check->voided_at);

    $this->actingAs($admin)
        ->delete(route('sales-orders.payments.destroy', [$order, $payment]))
        ->assertRedirect(route('sales-orders.index'));

    $this->assertDatabaseCount('sales_order_payments', 0);
    $this->assertNotNull($check->fresh()->voided_at);
    $this->assertDatabaseHas('bank_checks', [
        'id' => $check->id,
        'check_number' => 'CHK-VOID-1',
    ]);
    $this->assertDatabaseHas('bank_account_audit_logs', [
        'bank_account_id' => $bankAccount->id,
        'action' => 'check.voided',
    ]);
}

public function test_void_payment_for_another_order_returns_not_found(): void
{
    $admin = User::factory()->create();
    $orderA = SalesOrder::factory()->create(['grand_total' => '50.00']);
    $orderB = SalesOrder::factory()->create(['grand_total' => '50.00']);
    $payment = SalesOrderPayment::factory()->cash()->create([
        'sales_order_id' => $orderB->id,
        'amount' => '10.00',
    ]);

    $this->actingAs($admin)
        ->delete(route('sales-orders.payments.destroy', [$orderA, $payment]))
        ->assertNotFound();

    $this->assertDatabaseHas('sales_order_payments', ['id' => $payment->id]);
}
```

In `tests/Feature/BankCheckTest.php`, add imports for `SalesOrder` and `SalesOrderPayment`, then:

```php
public function test_cannot_void_check_linked_to_sales_order_payment(): void
{
    $admin = User::factory()->create();
    $account = BankAccount::factory()->active()->create();
    $check = BankCheck::factory()->create([
        'bank_account_id' => $account->id,
    ]);
    $order = SalesOrder::factory()->create(['grand_total' => '100.00']);
    SalesOrderPayment::factory()->create([
        'sales_order_id' => $order->id,
        'bank_check_id' => $check->id,
        'amount' => $check->amount,
        'method' => \App\Enums\SalesOrderPaymentMethod::PostDatedCheck,
    ]);

    $this->actingAs($admin)
        ->from(route('bank-accounts.show', $account))
        ->post(route('bank-accounts.checks.void', [$account, $check]))
        ->assertRedirect(route('bank-accounts.show', $account))
        ->assertSessionHasErrors('void');

    $this->assertNull($check->fresh()->voided_at);
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
php artisan test --filter=test_void_sale_is_rejected_when_any_payment_exists
php artisan test --filter=test_void_payment_restores_unpaid_and_can_void_sale
php artisan test --filter=test_cannot_void_check_linked_to_sales_order_payment
```

Expected: FAIL — void sale still succeeds / destroy-payment route missing / bank void still allowed.

- [ ] **Step 3: Implement void payment, sale guard, BankCheck linkage**

`routes/web.php`:

```php
Route::delete('sales-orders/{sales_order}/payments/{sales_order_payment}', [SalesOrderController::class, 'destroyPayment'])
    ->name('sales-orders.payments.destroy');
```

`SalesOrderController::destroy` — reject before the stock transaction:

```php
public function destroy(SalesOrder $salesOrder, StockService $stock, Request $request): RedirectResponse
{
    if (! $salesOrder->canVoid()) {
        Inertia::flash('toast', [
            'type' => 'error',
            'message' => 'Void is only available while the sales order is unpaid. Void payments first.',
        ]);

        return redirect()->route('sales-orders.index');
    }

    $createdBy = $request->user()?->name ?? 'Unknown';

    DB::transaction(function () use ($salesOrder, $stock, $createdBy): void {
        $salesOrder->load('items.product');
        $salesOrder->delete();
        $stock->restoreStockFromSalesOrder($salesOrder, $createdBy);
    });

    Inertia::flash('toast', [
        'type' => 'success',
        'message' => 'Sales order voided. Stock restored.',
    ]);

    return redirect()->route('sales-orders.index');
}
```

Add `destroyPayment`:

```php
public function destroyPayment(
    Request $request,
    SalesOrder $salesOrder,
    SalesOrderPayment $salesOrderPayment,
    BankAccountAuditor $auditor,
): RedirectResponse {
    abort_unless(
        (int) $salesOrderPayment->sales_order_id === (int) $salesOrder->id,
        404,
    );

    $salesOrderPayment->load('bankCheck.bankAccount');
    $bankCheck = $salesOrderPayment->bankCheck;

    DB::transaction(function () use ($salesOrderPayment, $bankCheck): void {
        $salesOrderPayment->delete();

        if ($bankCheck !== null && $bankCheck->voided_at === null) {
            $bankCheck->update(['voided_at' => now()]);
        }
    });

    if ($bankCheck !== null) {
        $account = $bankCheck->bankAccount;

        if ($account !== null) {
            $auditor->record(
                $account,
                'check.voided',
                $bankCheck->fresh(),
                "Voided check #{$bankCheck->check_number}",
                ['voided_at' => null],
                ['voided_at' => $bankCheck->fresh()->voided_at?->toIso8601String()],
                $request->user(),
            );
        }
    }

    Inertia::flash('toast', [
        'type' => 'success',
        'message' => 'Payment voided.',
    ]);

    return redirect()->route('sales-orders.index');
}
```

In `BankCheck`, add `HasOne` import if needed and:

```php
/**
 * @return HasOne<SalesOrderPayment, $this>
 */
public function salesOrderPayment(): HasOne
{
    return $this->hasOne(SalesOrderPayment::class);
}

public function isLinked(): bool
{
    return $this->payment()->exists() || $this->salesOrderPayment()->exists();
}
```

Keep existing `payment(): HasOne<PurchasedOrderPayment>`.

In `BankCheckController::voidCheck`, replace `$bankCheck->payment()->exists()` with `$bankCheck->isLinked()` and change the error string to:

```
Void is blocked while this check is linked to a payment.
```

Existing `test_cannot_void_linked_check` still passes (message text is not asserted).

```bash
php artisan wayfinder:generate
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
php artisan test --filter=SalesOrderTest
php artisan test --filter=BankCheckTest
vendor/bin/pint --dirty
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/SalesOrderController.php \
  app/Models/BankCheck.php \
  app/Http/Controllers/BankCheckController.php \
  routes/web.php \
  tests/Feature/SalesOrderTest.php \
  tests/Feature/BankCheckTest.php \
  resources/js/actions resources/js/routes
git commit -m "feat: void sales payments and block voiding paid sales"
```

---

### Task 4: UI + docs

**Files:**
- Create: `resources/js/components/sales-order-payment-modal.jsx`
- Modify: `resources/js/components/sales-order-detail-modal.jsx`
- Modify: `resources/js/pages/sales-orders/index.jsx`
- Modify: `.cursor/rules/PRD.mdc`
- Modify: `README.md`

**Interfaces:**
- Consumes: Wayfinder `storePayment.url(order.id)`, `destroyPayment.url({ sales_order: order.id, sales_order_payment: payment.id })`; index props `paymentMethods`, `bankAccounts`; order flags `can_add_payment`, `can_void`, `payment_status`, `payments`
- Produces: Add Payment menu item before Void; payment chips; Payment column; detail payments + void payment

- [ ] **Step 1: Add `sales-order-payment-modal.jsx`**

New file. Copy the structure of `resources/js/components/purchased-order-prepayment-modal.jsx` with these exact differences:

- Import `storePayment` from `@/actions/App/Http/Controllers/SalesOrderController`
- Default export name `SalesOrderPaymentModal`
- Props: `{ open, order, paymentMethods = [], bankAccounts = [], onClose }`
- Title: `Add payment`; submit label: `Record payment`
- Summary row: **Customer** (`order.customer_name || 'Walk-in'`) instead of Supplier
- On open, reset form including `amount: order.balance_due ?? order.grand_total ?? ''` and `method: walk-in ? 'cash' : (paymentMethods[0]?.value ?? 'cash')`
- `const isWalkIn = !order.customer_id`
- `const methods = isWalkIn ? paymentMethods.filter((item) => item.value === 'cash') : paymentMethods`
- Method `<select>` is `disabled={isWalkIn}`
- Extra fields: `online_payment` (platform + optional ref), `bank_transfer` (bank name + required ref) — **not** `bank_deposit`, `post_dated_check` (bank account, check number, due date, issued-by readonly)
- `form.transform` uses `bank_transfer` instead of `bank_deposit`
- `form.post(storePayment.url(order.id), { preserveScroll: true, onSuccess: () => onClose() })`
- Dialog `aria-labelledby="sales-order-payment-title"`
- Teal submit button (`bg-teal-700`), min-h-11 controls

Keep FIELD_CLASS, portal, Escape/overflow, and `emptyFields()` the same as the PO modal.

- [ ] **Step 2: Update list page**

In `resources/js/pages/sales-orders/index.jsx`:

1. Import `storePayment` is unused on the page if the modal posts itself; import `destroyPayment` only if voiding from the page. Void payment will live on the detail modal using `destroyPayment`.
2. Import `SalesOrderPaymentModal`.
3. Extend page props: `paymentMethods = []`, `bankAccounts = []`.
4. State: `paymentOrder` (null | order).
5. Add helper `paymentStatusBadge(order)`:

```jsx
function paymentStatusBadge(order) {
    if (order.deleted_at) {
        return (
            <Badge className="border-red-600/30 bg-red-400/10 text-red-700">
                Voided
            </Badge>
        );
    }

    const status = order.payment_status ?? 'unpaid';
    const styles = {
        unpaid: 'border-amber-600/30 bg-amber-400/10 text-amber-800',
        partial: 'border-teal-700/30 bg-teal-700/10 text-teal-800',
        paid: 'border-green-600/30 bg-green-400/10 text-green-700',
    };
    const labels = {
        unpaid: 'Unpaid',
        partial: 'Partial',
        paid: 'Paid',
    };

    return (
        <Badge className={styles[status] ?? styles.unpaid}>
            {labels[status] ?? 'Unpaid'}
        </Badge>
    );
}
```

6. `RowActionsMenu` props: add `onAddPayment`. Inside the menu, **before** Void:

```jsx
{!isDeleted && order.can_add_payment ? (
    <button
        type="button"
        role="menuitem"
        onClick={(event) => {
            event.stopPropagation();
            onClose();
            onAddPayment(order);
        }}
        className="block w-full px-3 py-2.5 text-left text-sm text-ink transition hover:bg-mist"
    >
        Add Payment
    </button>
) : null}
```

Keep Void gated on `order.can_void` (already). Touch target stays `size-11` / `py-2.5`.

7. Replace the card “Completed” chip with `paymentStatusBadge(order)`. Keep Voided via the same helper.
8. Desktop table: add `<th>Payment</th>` after Total; cell renders `paymentStatusBadge(order)`. Widen `min-w-[720px]` to `min-w-[820px]` and keep `overflow` on the existing wrapper so tablet scrolls the table instead of the page.
9. Pass `onAddPayment={(order) => { setPaymentOrder(order); setActionsOrderId(null); }}` into both menus.
10. Render:

```jsx
<SalesOrderPaymentModal
    open={Boolean(paymentOrder)}
    order={paymentOrder}
    paymentMethods={paymentMethods}
    bankAccounts={bankAccounts}
    onClose={() => setPaymentOrder(null)}
/>
```

11. Pass through to detail modal: `onAddPayment`, `onVoidPayment`, `paymentMethods` not required on detail if Add Payment sets `paymentOrder`.

`voidPayment` on the index:

```jsx
function voidPayment(order, payment) {
    if (!window.confirm('Void this payment?')) {
        return;
    }

    router.delete(
        destroyPayment.url({
            sales_order: order.id,
            sales_order_payment: payment.id,
        }),
        {
            preserveScroll: true,
            onSuccess: () => {
                setDetailOrder(null);
                setPaymentOrder(null);
            },
        },
    );
}
```

Import `destroyPayment` from `@/actions/App/Http/Controllers/SalesOrderController`.

- [ ] **Step 3: Update detail modal**

`resources/js/components/sales-order-detail-modal.jsx`:

- Props: add `onAddPayment`, `onVoidPayment`.
- In the summary `<dl>`, change Status from `Completed` to payment status labels (`Unpaid` / `Partial` / `Paid`) when not deleted; keep `Voided` when deleted.
- Add **Amount paid** and **Balance due** using `formatMoney(order.amount_paid ?? 0)` and `formatMoney(order.balance_due ?? order.grand_total)`.
- After the lines table, render a Payments block (same detail-line construction as `purchased-order-detail-modal.jsx`: platform, bank_name, reference, bank_check fields). Each row includes a **Void payment** button (`min-h-11`) calling `onVoidPayment(order, payment)` when `onVoidPayment` is set and the order is not deleted.
- Footer: **Add Payment** when `order.can_add_payment && onAddPayment` (teal, min-h-11); **Void sale** only when `order.can_void && onVoid`.

- [ ] **Step 4: Update PRD and README**

`.cursor/rules/PRD.mdc` Sales Order domain — add rows:

| `amount_paid` / `balance_due` | Derived from `sales_order_payments`; not stored on the order |
| `payment_status` | `unpaid` \| `partial` \| `paid` |
| Payments | Partial OK; walk-in cash only; customer: Cash, PDC, Bank Transfer, Online Payment |

UX bullets:

- List: Unpaid / Partial / Paid chip; 3-dot **Add Payment** then **Void** (Void only while unpaid)
- Detail: payment list + void payment; Add Payment while balance remains
- Routes: add `sales-orders.payments.store`, `sales-orders.payments.destroy`

Out of scope: change `sales payments/AR` to `Accounts Receivable` (payments shipped on the sales order; no AR module).

Recommended next: drop “Sales payments /”; keep “Accounts Receivable”.

`README.md` Sales Orders row: mention payments (partial, walk-in cash, void payment).

- [ ] **Step 5: Verify**

```bash
php artisan test --filter=SalesOrderTest
php artisan test --filter=BankCheckTest
vendor/bin/pint --dirty
```

Expected: PASS.

Manual (tablet+ ~768px):

1. Create walk-in sale → menu Add Payment → method locked Cash → record partial → chip Partial → Void hidden.
2. Add remaining → chip Paid → Add Payment hidden.
3. Void payment on detail → Unpaid + Void returns.
4. Customer sale → all four methods; PDC appears on bank account checks; void payment voids the check.
5. Walk-in cannot pick PDC in the UI; over-balance shows `amount` error.
6. 3-dot menu and modal actions remain tappable; no horizontal page scroll.

- [ ] **Step 6: Commit**

```bash
git add resources/js/components/sales-order-payment-modal.jsx \
  resources/js/components/sales-order-detail-modal.jsx \
  resources/js/pages/sales-orders/index.jsx \
  .cursor/rules/PRD.mdc \
  README.md
git commit -m "feat: add sales order payment menu, modal, and status chips"
```

---

## Self-review

| Spec requirement | Task |
|------------------|------|
| `sales_order_payments` table + enum (incl. `bank_transfer`) | 1 |
| Derived totals / status / flags on index | 1 |
| `paymentMethods` + active `bankAccounts` | 1 |
| Partial payments; amount ≤ balance | 2 |
| Walk-in cash only (server) | 2 |
| Customer four methods + PDC `bank_checks` + auditor | 2 |
| Fully paid rejects further store | 2 |
| Payments do not move stock; chart still `grand_total` | 2 |
| Void sale blocked when payments exist | 3 |
| Void payment deletes row; PDC voids check | 3 |
| `BankCheck::isLinked()` includes sales payments | 3 |
| Menu Add Payment before Void; chips; detail list | 4 |
| Walk-in method locked in UI | 4 |
| PRD / README | 4 |
| Out of scope (AR, refunds, auto-cash at create) | not implemented |

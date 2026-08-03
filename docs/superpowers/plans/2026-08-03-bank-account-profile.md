# Bank Account Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an ops hub at `/bank-accounts/{bank_account}` with checks (filtered), payments, audit log, account edit, standalone and PO-linked check issue, and void blocked for linked checks.

**Architecture:** Extend `BankAccountController` with `show` plus nested check store/update/void. Append-only `bank_account_audit_logs` written via `BankAccountAuditor`. PO-linked checks reuse existing `purchased-orders.payments.store` (method `post_dated_check`, bank locked) with redirect back to the profile. Frontend is a dense Inertia page matching AP show patterns.

**Tech Stack:** Laravel 13, Inertia React JSX, Form Requests, Eloquent SoftDeletes, PHPUnit, Wayfinder, Tailwind v4, existing teal/ink tokens

## Global Constraints

- Route: `GET /bank-accounts/{bank_account}` → `bank-accounts/show`
- Full ops hub: edit account + issue checks (Against PO | Standalone)
- One Checks tab with All / Upcoming / Overdue filters (not separate tabs)
- Void **blocked** when check is linked to a PO payment (UI + server)
- Audit everything for this bank: account, checks, payments (including PO/AP flows)
- Lightweight `bank_account_audit_logs` — no Spatie
- JSX only; no hand-edit of Wayfinder generated files — regenerate after routes
- Tablet+ usable; reuse AppLayout / existing modal patterns
- Flash toasts via `Inertia::flash('toast', …)`

## File map

| File | Responsibility |
|------|----------------|
| `database/migrations/2026_08_03_100000_add_voided_at_to_bank_checks_table.php` | Add `voided_at` |
| `database/migrations/2026_08_03_100100_create_bank_account_audit_logs_table.php` | Audit table |
| `app/Models/BankAccountAuditLog.php` | Audit Eloquent model + `toArrayPayload` |
| `app/Services/BankAccountAuditor.php` | Single `record(...)` write API |
| `app/Models/BankCheck.php` | `voided_at` cast, scopes, richer payload |
| `app/Models/BankAccount.php` | `auditLogs()` relation; optional KPI helpers |
| `app/Http/Controllers/BankAccountController.php` | `show`, check mutations, audit on update, redirect-to-show |
| `app/Http/Controllers/BankCheckController.php` | Nested store/update/void (keeps BankAccountController thinner) |
| `app/Http/Requests/StoreBankCheckRequest.php` | Standalone create validation |
| `app/Http/Requests/UpdateBankCheckRequest.php` | Edit validation |
| `app/Http/Controllers/PurchasedOrderController.php` | Audit on check payment create |
| `app/Http/Controllers/AccountsPayableController.php` | Same audit hook |
| `routes/web.php` | Enable `show`; nest check routes |
| `resources/js/pages/bank-accounts/show.jsx` | Profile UI |
| `resources/js/pages/bank-accounts/index.jsx` | Name link + View action |
| `resources/js/components/bank-check-standalone-modal.jsx` | Issue standalone |
| `resources/js/components/bank-check-edit-modal.jsx` | Edit check |
| `resources/js/components/bank-check-against-po-modal.jsx` | Issue against PO |
| `tests/Feature/BankAccountProfileTest.php` | Show + KPI + filters |
| `tests/Feature/BankCheckTest.php` | Standalone CRUD, void guard, audit |
| `database/factories/BankCheckFactory.php` | `voided()` state |
| `database/factories/BankAccountAuditLogFactory.php` | Optional for tests |

---

### Task 1: Schema, models, auditor

**Files:**
- Create: migrations above
- Create: `app/Models/BankAccountAuditLog.php`
- Create: `app/Services/BankAccountAuditor.php`
- Modify: `app/Models/BankCheck.php`
- Modify: `app/Models/BankAccount.php`
- Modify: `database/factories/BankCheckFactory.php`
- Test: `tests/Feature/BankAccountAuditorTest.php` (unit-style feature test)

**Interfaces:**
- Produces:
  - `BankAccountAuditor::record(BankAccount $account, string $action, ?Model $subject, string $summary, ?array $before, ?array $after, ?User $actor): BankAccountAuditLog`
  - `BankCheck` casts `voided_at` datetime; `isVoided(): bool`; `isLinked(): bool` (has payment); `dueStatus(): string` → `voided|overdue|due_today|upcoming`
  - `BankCheck::toArrayPayload()` includes `voided_at`, `due_status`, `is_linked`, `purchased_order_reference` (when payment+order loaded)
  - `BankAccount::auditLogs(): HasMany`

- [ ] **Step 1: Write failing auditor test**

```php
<?php

namespace Tests\Feature;

use App\Models\BankAccount;
use App\Models\User;
use App\Services\BankAccountAuditor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BankAccountAuditorTest extends TestCase
{
    use RefreshDatabase;

    public function test_record_writes_append_only_audit_row(): void
    {
        $user = User::factory()->create(['name' => 'Admin']);
        $account = BankAccount::factory()->active()->create(['name' => 'BDO']);

        $log = app(BankAccountAuditor::class)->record(
            $account,
            'account.updated',
            $account,
            'Updated bank account BDO',
            ['name' => 'Old'],
            ['name' => 'BDO'],
            $user,
        );

        $this->assertDatabaseHas('bank_account_audit_logs', [
            'id' => $log->id,
            'bank_account_id' => $account->id,
            'actor_user_id' => $user->id,
            'action' => 'account.updated',
            'subject_type' => 'bank_account',
            'subject_id' => $account->id,
            'summary' => 'Updated bank account BDO',
        ]);
    }
}
```

- [ ] **Step 2: Run test — expect FAIL** (missing table/class)

Run: `php artisan test --filter=BankAccountAuditorTest`

- [ ] **Step 3: Migrations**

`voided_at` on `bank_checks`:

```php
Schema::table('bank_checks', function (Blueprint $table) {
    $table->timestamp('voided_at')->nullable()->after('notes');
    $table->index('voided_at');
});
```

`bank_account_audit_logs`:

```php
Schema::create('bank_account_audit_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('bank_account_id')->constrained('bank_accounts')->restrictOnDelete();
    $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->string('action');
    $table->string('subject_type');
    $table->unsignedBigInteger('subject_id')->nullable();
    $table->string('summary');
    $table->json('before')->nullable();
    $table->json('after')->nullable();
    $table->timestamp('created_at')->useCurrent();

    $table->index(['bank_account_id', 'created_at']);
    $table->index(['subject_type', 'subject_id']);
});
```

- [ ] **Step 4: Model + auditor implementation**

`BankAccountAuditor::record` maps subject to short keys: `bank_account`, `bank_check`, `purchased_order_payment`. Persist `actor_user_id` from `$actor?->id`. Never update existing rows.

Update `BankCheck`: fillable unchanged; cast `voided_at`; implement helpers above; extend `toArrayPayload`.

Update `BankAccount` with `auditLogs()` HasMany.

Factory state:

```php
public function voided(): static
{
    return $this->state(fn () => ['voided_at' => now()]);
}
```

- [ ] **Step 5: Run test — expect PASS**

Run: `php artisan test --filter=BankAccountAuditorTest`

- [ ] **Step 6: Commit**

```bash
git add database/migrations app/Models app/Services database/factories tests/Feature/BankAccountAuditorTest.php
git commit -m "feat: add bank check voided_at and account audit log"
```

---

### Task 2: Profile show endpoint (read-only)

**Files:**
- Modify: `routes/web.php` (include `show` on resource; `withTrashed` on show)
- Modify: `app/Http/Controllers/BankAccountController.php` — add `show`
- Create: `tests/Feature/BankAccountProfileTest.php`

**Interfaces:**
- Consumes: `BankCheck::toArrayPayload`, `BankAccount::toArrayPayload`, payments via check
- Produces Inertia props:
  - `bankAccount` — account payload
  - `kpis` — `{ open_total, overdue_count, overdue_amount, upcoming_count, upcoming_amount, issued_count }` (non-voided only)
  - `checks` — paginated or full list (cap/paginate 50) with filters applied server-side from query: `due`=`all|upcoming|overdue`, `q`, `linkage`=`all|linked|standalone`, `tab`
  - `payments` — list of payment payloads for checks on this account (include PO reference + supplier id for links)
  - `auditLogs` — newest first, limit 50, optional `audit_q`
  - `eligibleOrders` — `[{ id, reference, supplier_name, balance_due }]` where `canAddPrepayment()`
  - `filters` — echoed query state
  - `statuses` — reuse status options if edit modal needs them

- [ ] **Step 1: Failing tests**

```php
public function test_guests_cannot_view_bank_account_profile(): void
{
    $account = BankAccount::factory()->create();
    $this->get(route('bank-accounts.show', $account))
        ->assertRedirect(route('login'));
}

public function test_authenticated_users_can_view_bank_account_profile(): void
{
    $admin = User::factory()->create();
    $account = BankAccount::factory()->active()->create(['name' => 'BDO Ops']);
    BankCheck::factory()->create([
        'bank_account_id' => $account->id,
        'amount' => '100.00',
        'due_date' => now()->addDays(5)->toDateString(),
    ]);
    BankCheck::factory()->create([
        'bank_account_id' => $account->id,
        'amount' => '50.00',
        'due_date' => now()->subDay()->toDateString(),
    ]);

    $this->actingAs($admin)
        ->get(route('bank-accounts.show', $account))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('bank-accounts/show')
            ->where('bankAccount.name', 'BDO Ops')
            ->where('kpis.issued_count', 2)
            ->where('kpis.overdue_count', 1)
            ->where('kpis.upcoming_count', 1)
            ->has('checks')
            ->has('payments')
            ->has('auditLogs')
            ->has('eligibleOrders')
        );
}

public function test_upcoming_filter_excludes_voided_and_overdue(): void
{
    // create upcoming, overdue, voided; GET ?due=upcoming; assert only upcoming in checks
}
```

- [ ] **Step 2: Run — expect FAIL** (show excepted / missing)

Run: `php artisan test --filter=BankAccountProfileTest`

- [ ] **Step 3: Routes**

```php
Route::get('bank-accounts/{bank_account}', [BankAccountController::class, 'show'])
    ->withTrashed()
    ->name('bank-accounts.show');
Route::resource('bank-accounts', BankAccountController::class)->except(['show', 'create', 'edit']);
```

(Keep restore route as today. Explicit `show` with `withTrashed` before or after resource is fine.)

- [ ] **Step 4: Implement `show`**

Load checks with `payment.purchasedOrder.supplier`. Compute KPIs in PHP from non-voided checks. Apply `due` / `q` / `linkage` filters. Soft-deleted account still renders (mutations disabled on UI later).

Minimal stub page so Inertia resolves:

```jsx
// resources/js/pages/bank-accounts/show.jsx
import AppLayout from '@/layouts/app-layout';

export default function BankAccountShow({ bankAccount }) {
    return (
        <AppLayout title={bankAccount?.name ?? 'Bank account'}>
            <div className="p-4">{bankAccount?.name}</div>
        </AppLayout>
    );
}
```

- [ ] **Step 5: Run tests — PASS**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: add bank account profile show endpoint"
```

---

### Task 3: Standalone check store / update / void

**Files:**
- Create: `app/Http/Controllers/BankCheckController.php`
- Create: `app/Http/Requests/StoreBankCheckRequest.php`
- Create: `app/Http/Requests/UpdateBankCheckRequest.php`
- Modify: `routes/web.php`
- Create: `tests/Feature/BankCheckTest.php`

**Interfaces:**
- Routes:
  - `POST bank-accounts/{bank_account}/checks` → `bank-accounts.checks.store`
  - `PATCH bank-accounts/{bank_account}/checks/{bank_check}` → `bank-accounts.checks.update` (scoped)
  - `POST bank-accounts/{bank_account}/checks/{bank_check}/void` → `bank-accounts.checks.void`
- Validation: check_number required max 100; amount gt 0; due_date required date; issued_by required max 255; notes nullable
- Void: if `$bankCheck->payment()->exists()` → 422 with message about linked payment; else set `voided_at = now()`
- All three write audit via `BankAccountAuditor`
- Redirect: `route('bank-accounts.show', $bankAccount)` + success toast

- [ ] **Step 1: Failing tests**

```php
public function test_can_create_standalone_check_and_audit(): void { /* post store; assert DB + audit check.created */ }

public function test_can_update_check_fields_and_audit(): void { /* patch; assert before/after */ }

public function test_can_void_standalone_check(): void { /* void; voided_at set; audit check.voided */ }

public function test_cannot_void_linked_check(): void
{
    // create check + PurchasedOrderPayment pointing at it
    // post void → assertSessionHasErrors or 422; voided_at still null
}
```

- [ ] **Step 2: Run — FAIL**

Run: `php artisan test --filter=BankCheckTest`

- [ ] **Step 3: Implement controller + requests + routes**

Scoped binding:

```php
Route::post('bank-accounts/{bank_account}/checks', [BankCheckController::class, 'store'])
    ->name('bank-accounts.checks.store');
Route::patch('bank-accounts/{bank_account}/checks/{bank_check}', [BankCheckController::class, 'update'])
    ->scopeBindings()
    ->name('bank-accounts.checks.update');
Route::post('bank-accounts/{bank_account}/checks/{bank_check}/void', [BankCheckController::class, 'voidCheck'])
    ->scopeBindings()
    ->name('bank-accounts.checks.void');
```

Ensure `BankCheck` belongs to account via `bank_account_id` for scopeBindings.

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: standalone bank check create update and void"
```

---

### Task 4: Audit hooks on account update and PO/AP payments

**Files:**
- Modify: `app/Http/Controllers/BankAccountController.php` (`update`, optional `destroy`/`restore` audits out of scope unless cheap — **v1: update only** per spec)
- Modify: `app/Http/Controllers/PurchasedOrderController.php` `storePayment`
- Modify: `app/Http/Controllers/AccountsPayableController.php` `storePayment`
- Modify: `tests/Feature/BankAccountTest.php` or extend `BankCheckTest` / payment tests

**Interfaces:**
- On account update: diff changed attributes → `account.updated`
- On payment store when `$bankCheckAttributes !== null`: after create, `check.created` then `payment.recorded` with `bank_account_id` from the check
- Optional: accept `return_to` = `bank-accounts.show` URL or `bank_account_id` in request; if present and valid, redirect there instead of PO/AP index (needed for Against PO modal)

- [ ] **Step 1: Failing tests**

```php
public function test_updating_bank_account_writes_audit_log(): void { /* put update; assert audit */ }

public function test_po_check_payment_writes_bank_audit_logs(): void
{
    // create ordered PO with balance; post payment method post_dated_check;
    // assert check.created + payment.recorded for that bank_account_id
}
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement auditor calls + redirect helper**

In both payment controllers, after transaction:

```php
if ($bankCheck !== null) {
    $auditor->record($bankCheck->bankAccount, 'check.created', $bankCheck, "Issued check #{$bankCheck->check_number}", null, $bankCheck->toArrayPayload(), $request->user());
    $auditor->record($bankCheck->bankAccount, 'payment.recorded', $payment, "Recorded check payment {$payment->amount}", null, $payment->toArrayPayload(), $request->user());
}
```

Capture `$bankCheck` / `$payment` from inside the transaction (assign to variables by reference).

Redirect:

```php
if ($request->filled('return_bank_account_id')) {
    return redirect()->route('bank-accounts.show', (int) $request->input('return_bank_account_id'));
}
```

- [ ] **Step 4: Run related tests — PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: audit bank account updates and check payments"
```

---

### Task 5: Profile page UI — shell, KPIs, tabs, checks table

**Files:**
- Replace: `resources/js/pages/bank-accounts/show.jsx`
- Modify: `resources/js/pages/bank-accounts/index.jsx` (link name + View — can be Task 7; do link here if small)

**Interfaces:**
- Consumes props from Task 2
- Tab state via Inertia `router.get` with `tab`, preserve filters
- Filter chips call `router.get(show.url(id), { …filters, due })`

- [ ] **Step 1: Build show page layout**

Structure:

1. Breadcrumb → `bank-accounts.index`
2. Header: name, account_name, account_number, status badge, notes; placeholder buttons Edit / Issue check (wire in Task 6)
3. KPI strip: four metrics using `formatMoney`
4. Tabs: Checks | Payments | Audit
5. Checks: chips All/Upcoming/Overdue; search input; linkage select; table with horizontal scroll; empty state
6. Payments table (read-only)
7. Audit list with expandable before/after (`<details>` or button toggle)

Match AP show spacing (`flex flex-col gap-4 p-4`), status badges, `min-h-11` controls.

Derived row status label from `due_status`. Voided badge. Linked PO: `Link` to `accounts-payable.show` when `posted_to_ap` / else purchased-orders — use reference + supplier id from payload; if only reference available, link to PO index with q=reference is acceptable; prefer AP show URL when `supplier_id` + `reference` present on check payload.

- [ ] **Step 2: Manual smoke** — `composer run dev`, open `/bank-accounts/{id}`

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: bank account profile UI shell with checks payments audit"
```

---

### Task 6: Modals — edit account, standalone check, edit/void check, against PO

**Files:**
- Create: `resources/js/components/bank-check-standalone-modal.jsx`
- Create: `resources/js/components/bank-check-edit-modal.jsx`
- Create: `resources/js/components/bank-check-against-po-modal.jsx`
- Modify: `resources/js/pages/bank-accounts/show.jsx`
- Reuse: `resources/js/components/bank-account-modal.jsx`

**Interfaces:**
- Standalone: `useForm` → `store` from Wayfinder `bank-accounts.checks.store`
- Edit: `useForm` → update URL
- Void: `router.post` void URL with confirm dialog (`window.confirm` OK for v1)
- Against PO: form posts to `purchased-orders.payments.store` with `method: 'post_dated_check'`, `bank_account_id` locked, `return_bank_account_id`, fields from existing prepayment check UX
- Soft-deleted account: hide Issue/Edit/Void; show Restore link using existing restore action if desired

- [ ] **Step 1: Implement standalone + edit modals** (portal, Escape, focus — copy patterns from `bank-account-modal.jsx` / prepayment modal)

- [ ] **Step 2: Against PO modal** — select from `eligibleOrders`; show balance_due; submit check payment

- [ ] **Step 3: Wire header Issue check split button** (two menu items) and row Edit/Void

- [ ] **Step 4: Regenerate Wayfinder**

Run: `php artisan wayfinder:generate` (or project’s usual command)

- [ ] **Step 5: Feature test still green + manual smoke of create/edit/void/PO**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: bank account profile check and payment modals"
```

---

### Task 7: Index entry points + update redirect from profile

**Files:**
- Modify: `resources/js/pages/bank-accounts/index.jsx`
- Modify: `app/Http/Controllers/BankAccountController.php` `update`/`destroy`/`restore` redirects when `return_to=show`

- [ ] **Step 1: Index** — wrap bank name in `<Link href={show.url(row.id)}>`; add View to row menu

- [ ] **Step 2: Profile Edit** — open `BankAccountModal`; on submit include `return_to: 'show'` or post with redirect field; controller:

```php
if ($request->input('return_to') === 'show') {
    return redirect()->route('bank-accounts.show', $bankAccount);
}
return redirect()->route('bank-accounts.index');
```

- [ ] **Step 3: Test update from profile redirects to show**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: link bank accounts index to profile and return after edit"
```

---

### Task 8: Verification + acceptance sweep

**Files:** none new unless gaps found

- [ ] **Step 1: Run full related suite**

```bash
php artisan test --filter='BankAccount|BankCheck|BankAccountAuditor|PurchasedOrderPayment'
```

Fix failures.

- [ ] **Step 2: Checklist vs spec acceptance criteria**

- [ ] Show route renders header, KPIs, three tabs  
- [ ] Checks filters All/Upcoming/Overdue; voided only in All  
- [ ] Standalone + Against PO issue  
- [ ] Edit check; void blocked when linked  
- [ ] Account edit + audit  
- [ ] PO/AP payment audit  
- [ ] Index links  
- [ ] Tablet: table `overflow-x-auto`, 44px targets  

- [ ] **Step 3: Pint + ESLint on touched files**

```bash
vendor/bin/pint --dirty
# npm run lint if configured for touched JSX
```

- [ ] **Step 4: Final commit if cleanup needed**

```bash
git commit -m "chore: polish bank account profile after acceptance sweep"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Show route + withTrashed | 2 |
| KPIs non-voided | 2 |
| Checks tab merged filters | 2, 5 |
| Payments tab | 2, 5 |
| Audit tab | 1, 2, 5 |
| Standalone issue | 3, 6 |
| Against PO | 4 (redirect), 6 |
| Edit check | 3, 6 |
| Void blocked if linked | 3, 6 |
| Account edit + audit | 4, 6, 7 |
| PO/AP audit | 4 |
| Index links | 7 |
| Feature tests | 1–4, 7–8 |
| No Spatie / no cleared status | honored |

No TBD placeholders. `BankCheckController` vs nesting on `BankAccountController` is fixed: dedicated `BankCheckController` for thinner files.

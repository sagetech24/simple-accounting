# Ops Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the authenticated `/` → Products redirect with a procurement ops snapshot dashboard (KPIs + needs-attention list) and a Dashboard sidebar entry.

**Architecture:** One `DashboardController@index` composes KPI counts and a capped attention list, then renders `dashboard/index` via Inertia inside existing `AppLayout`. Login and authenticated-user redirects point at `route('home')` (`/`). No public marketing page.

**Tech Stack:** Laravel 13, Inertia.js v3, React 19 JSX, Wayfinder routes/actions, PHPUnit, Tailwind v4 (existing paper/teal tokens).

**Spec:** `docs/superpowers/specs/2026-07-31-ops-dashboard-design.md`

## Global Constraints

- Guests still only see login; no public landing or marketing site.
- Dashboard is read-only (no mutations, no toasts).
- Soft-deleted records excluded from KPIs and attention.
- Low stock = `low_stock_threshold` not null AND `quantity <= low_stock_threshold` (same as `Product::isLowStock()`).
- AP balance due = sum of `PurchasedOrder::balanceDue()` for non-trashed posted POs (`posted_to_ap_at` set) with balance > 0.
- Attention list: up to 3 newest per type, types in order pending RFQ → ordered PO → AP balance → low stock, then slice to 12.
- JSX only (`.jsx`); do not hand-edit generated Wayfinder files — regenerate after route changes.
- Tablet+ usable: KPI grid wraps; large tap targets; no horizontal page scroll.
- Preserve existing visual language (paper/teal); no new purple/cream marketing themes.

## File Structure

| File | Responsibility |
|------|----------------|
| `app/Http/Controllers/DashboardController.php` | Compose `kpis` + `attention`; `Inertia::render('dashboard/index', …)` |
| `resources/js/pages/dashboard/index.jsx` | KPI cards + needs-attention list UI |
| `routes/web.php` | `GET /` → `DashboardController@index` named `home` |
| `bootstrap/app.php` | `redirectUsersTo` → `route('home')` |
| `app/Http/Controllers/Auth/AuthenticatedSessionController.php` | Post-login `intended(route('home'))` |
| `resources/js/layouts/app-layout.jsx` | Dashboard first in `navItems`; exact `/` active match |
| `resources/js/components/nav-icons.jsx` | `DashboardNavIcon` |
| `tests/Feature/DashboardTest.php` | Dashboard auth, KPIs, attention exclusions |
| `tests/Feature/ExampleTest.php` | Update home/login redirect expectations |
| `.cursor/rules/PRD.mdc` | Home = dashboard; add Dashboard to nav table |
| Wayfinder generated under `resources/js/routes` | Regenerated only — never hand-edited |

`HomeController` stays responsible for `/products` browse. Do not overload it for the dashboard.

---

### Task 1: Route home to dashboard + redirect targets

**Files:**
- Create: `app/Http/Controllers/DashboardController.php`
- Modify: `routes/web.php` (home route)
- Modify: `bootstrap/app.php:18`
- Modify: `app/Http/Controllers/Auth/AuthenticatedSessionController.php:32`
- Modify: `tests/Feature/ExampleTest.php`
- Test: `tests/Feature/ExampleTest.php`, `tests/Feature/DashboardTest.php` (guest + empty dashboard smoke)

**Interfaces:**
- Consumes: none
- Produces: `DashboardController::index(): \Inertia\Response` rendering `dashboard/index` with at least `kpis` and `attention` keys (empty-safe defaults OK for this task); named route `home` → `GET /`

- [ ] **Step 1: Write the failing tests**

Update `tests/Feature/ExampleTest.php`:

```php
public function test_authenticated_users_see_dashboard_at_home(): void
{
    $this->actingAs(User::factory()->create())
        ->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/index')
            ->has('kpis')
            ->has('attention')
        );
}

public function test_login_redirects_to_home(): void
{
    $this->seed();

    $this->post(route('login.store'), [
        'email' => 'admin@example.com',
        'password' => 'password',
    ])->assertRedirect(route('home'));
}
```

Remove or replace `test_authenticated_users_are_redirected_from_home_to_products` and `test_login_redirects_to_products`.

Create `tests/Feature/DashboardTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_dashboard(): void
    {
        $this->get(route('home'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_see_zero_kpis_when_empty(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/index')
                ->where('kpis.pending_rfqs', 0)
                ->where('kpis.draft_pos', 0)
                ->where('kpis.ordered_pos', 0)
                ->where('kpis.ap_balance_due', '0.00')
                ->where('kpis.low_stock', 0)
                ->where('attention', [])
            );
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `php artisan test --filter='ExampleTest::test_authenticated_users_see_dashboard_at_home|ExampleTest::test_login_redirects_to_home|DashboardTest'`

Expected: FAIL (redirect to products and/or missing component / controller).

- [ ] **Step 3: Minimal controller + route + redirects**

`app/Http/Controllers/DashboardController.php`:

```php
<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('dashboard/index', [
            'kpis' => [
                'pending_rfqs' => 0,
                'draft_pos' => 0,
                'ordered_pos' => 0,
                'ap_balance_due' => '0.00',
                'low_stock' => 0,
            ],
            'attention' => [],
        ]);
    }
}
```

In `routes/web.php` inside the `auth` group, replace:

```php
Route::redirect('/', '/products')->name('home');
```

with:

```php
Route::get('/', [DashboardController::class, 'index'])->name('home');
```

Add `use App\Http\Controllers\DashboardController;` at the top.

`bootstrap/app.php`:

```php
$middleware->redirectUsersTo(fn () => route('home'));
```

`AuthenticatedSessionController::store`:

```php
return redirect()->intended(route('home'));
```

Create a minimal Inertia page so the component resolves — `resources/js/pages/dashboard/index.jsx`:

```jsx
import AppLayout from '@/layouts/app-layout';

export default function Dashboard({ kpis, attention }) {
    return (
        <AppLayout title="Dashboard">
            <div className="p-4">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                    Dashboard
                </h2>
            </div>
        </AppLayout>
    );
}
```

(Full UI comes in Task 4; this unblocks Inertia component assertions.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `php artisan test --filter='ExampleTest|DashboardTest'`

Expected: PASS for guest redirect, empty KPIs, home renders dashboard, login → home. Other ExampleTest cases still pass.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/DashboardController.php routes/web.php bootstrap/app.php \
  app/Http/Controllers/Auth/AuthenticatedSessionController.php \
  resources/js/pages/dashboard/index.jsx \
  tests/Feature/ExampleTest.php tests/Feature/DashboardTest.php
git commit -m "$(cat <<'EOF'
feat: route authenticated home to ops dashboard

EOF
)"
```

---

### Task 2: KPI aggregates

**Files:**
- Modify: `app/Http/Controllers/DashboardController.php`
- Modify: `tests/Feature/DashboardTest.php`

**Interfaces:**
- Consumes: `RequestQuotation`, `PurchasedOrder`, `Product` models; `RequestQuotationStatus`, `PurchasedOrderStatus` enums
- Produces: `kpis` prop shape:

```php
[
  'pending_rfqs' => int,
  'draft_pos' => int,
  'ordered_pos' => int,
  'ap_balance_due' => string, // number_format(..., 2, '.', '')
  'low_stock' => int,
]
```

- [ ] **Step 1: Write the failing KPI test**

Append to `DashboardTest.php` (import factories/enums as needed):

```php
public function test_kpis_reflect_procurement_snapshot(): void
{
    $admin = User::factory()->create();
    $supplier = \App\Models\Supplier::factory()->active()->create();

    \App\Models\RequestQuotation::factory()->pending()->create(['supplier_id' => $supplier->id]);
    \App\Models\RequestQuotation::factory()->draft()->create(['supplier_id' => $supplier->id]);
    \App\Models\RequestQuotation::factory()->pending()->create(['supplier_id' => $supplier->id])->delete();

    \App\Models\PurchasedOrder::factory()->draft()->create([
        'supplier_id' => $supplier->id,
        'grand_total' => '10.00',
    ]);
    \App\Models\PurchasedOrder::factory()->ordered()->create([
        'supplier_id' => $supplier->id,
        'grand_total' => '20.00',
    ]);
    \App\Models\PurchasedOrder::factory()->ordered()->create([
        'supplier_id' => $supplier->id,
        'grand_total' => '5.00',
    ])->delete();

    $posted = \App\Models\PurchasedOrder::factory()
        ->received()
        ->postedToAccountsPayable()
        ->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '100.00',
        ]);
    \App\Models\PurchasedOrderPayment::factory()->create([
        'purchased_order_id' => $posted->id,
        'amount' => '40.00',
    ]);

    $settled = \App\Models\PurchasedOrder::factory()
        ->received()
        ->postedToAccountsPayable()
        ->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '50.00',
        ]);
    \App\Models\PurchasedOrderPayment::factory()->create([
        'purchased_order_id' => $settled->id,
        'amount' => '50.00',
    ]);

    \App\Models\Product::factory()->available()->create([
        'name' => 'Low Widget',
        'quantity' => 2,
        'low_stock_threshold' => 5,
    ]);
    \App\Models\Product::factory()->available()->create([
        'name' => 'Ok Widget',
        'quantity' => 20,
        'low_stock_threshold' => 5,
    ]);
    \App\Models\Product::factory()->available()->create([
        'name' => 'No Threshold',
        'quantity' => 0,
        'low_stock_threshold' => null,
    ]);

    $this->actingAs($admin)
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('kpis.pending_rfqs', 1)
            ->where('kpis.draft_pos', 1)
            ->where('kpis.ordered_pos', 1)
            ->where('kpis.ap_balance_due', '60.00')
            ->where('kpis.low_stock', 1)
        );
}
```

If `PurchasedOrderPayment::factory()` or `RequestQuotation::factory()->draft()` differs in this repo, match existing factory APIs used in `AccountsPayableTest` / `RequestQuotationTest`. Prefer `received()` or `ordered()` states that already exist on `PurchasedOrderFactory`.

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=DashboardTest::test_kpis_reflect_procurement_snapshot`

Expected: FAIL (zeros or wrong AP sum).

- [ ] **Step 3: Implement KPI queries in `DashboardController`**

```php
use App\Enums\PurchasedOrderStatus;
use App\Enums\RequestQuotationStatus;
use App\Models\Product;
use App\Models\PurchasedOrder;
use App\Models\RequestQuotation;

// inside index():
$pendingRfqs = RequestQuotation::query()
    ->where('status', RequestQuotationStatus::Pending)
    ->count();

$draftPos = PurchasedOrder::query()
    ->where('status', PurchasedOrderStatus::Draft)
    ->count();

$orderedPos = PurchasedOrder::query()
    ->where('status', PurchasedOrderStatus::Ordered)
    ->count();

$apBalanceDue = PurchasedOrder::query()
    ->postedToAccountsPayable()
    ->with('payments')
    ->get()
    ->sum(fn (PurchasedOrder $order) => (float) $order->balanceDue());

$lowStock = Product::query()
    ->whereNotNull('low_stock_threshold')
    ->whereColumn('quantity', '<=', 'low_stock_threshold')
    ->count();

'kpis' => [
    'pending_rfqs' => $pendingRfqs,
    'draft_pos' => $draftPos,
    'ordered_pos' => $orderedPos,
    'ap_balance_due' => number_format($apBalanceDue, 2, '.', ''),
    'low_stock' => $lowStock,
],
```

SoftDeletes on these models already exclude trashed from default queries.

- [ ] **Step 4: Run tests**

Run: `php artisan test --filter=DashboardTest`

Expected: PASS (empty + KPI tests).

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/DashboardController.php tests/Feature/DashboardTest.php
git commit -m "$(cat <<'EOF'
feat: compute procurement KPI counts for dashboard

EOF
)"
```

---

### Task 3: Needs-attention list

**Files:**
- Modify: `app/Http/Controllers/DashboardController.php`
- Modify: `tests/Feature/DashboardTest.php`

**Interfaces:**
- Consumes: same models; named routes `request-quotations.index`, `purchased-orders.index`, `accounts-payable.show`, `inventory.index`
- Produces: `attention` array of up to 12 items:

```php
[
  'type' => 'pending_rfq' | 'ordered_po' | 'ap_balance' | 'low_stock',
  'title' => string,
  'reason' => string,
  'href' => string,
]
```

Build rules: up to 3 newest (`orderByDesc('created_at')->orderByDesc('id')`) per type; concatenate in type order; `array_slice(..., 0, 12)`.

- [ ] **Step 1: Write the failing attention tests**

```php
public function test_attention_list_includes_actionable_rows_and_excludes_noise(): void
{
    $admin = User::factory()->create();
    $supplier = \App\Models\Supplier::factory()->active()->create(['name' => 'Acme']);

    $rfq = \App\Models\RequestQuotation::factory()->pending()->create([
        'supplier_id' => $supplier->id,
        'reference' => '11111111-1111-1111-1111-111111111111',
    ]);
    \App\Models\RequestQuotation::factory()->draft()->create(['supplier_id' => $supplier->id]);

    $ordered = \App\Models\PurchasedOrder::factory()->ordered()->create([
        'supplier_id' => $supplier->id,
        'reference' => '22222222-2222-2222-2222-222222222222',
        'grand_total' => '30.00',
    ]);

    $posted = \App\Models\PurchasedOrder::factory()
        ->received()
        ->postedToAccountsPayable()
        ->create([
            'supplier_id' => $supplier->id,
            'reference' => '33333333-3333-3333-3333-333333333333',
            'grand_total' => '80.00',
        ]);

    $settled = \App\Models\PurchasedOrder::factory()
        ->received()
        ->postedToAccountsPayable()
        ->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '10.00',
        ]);
    \App\Models\PurchasedOrderPayment::factory()->create([
        'purchased_order_id' => $settled->id,
        'amount' => '10.00',
    ]);

    $low = \App\Models\Product::factory()->available()->create([
        'name' => 'Bolt Pack',
        'quantity' => 1,
        'low_stock_threshold' => 4,
    ]);
    \App\Models\Product::factory()->available()->create([
        'name' => 'Plenty',
        'quantity' => 50,
        'low_stock_threshold' => 4,
    ]);

    $this->actingAs($admin)
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('attention', 4)
            ->where('attention.0.type', 'pending_rfq')
            ->where('attention.0.title', $rfq->reference)
            ->where('attention.0.reason', 'Approve quotation')
            ->where('attention.0.href', route('request-quotations.index', absolute: false))
            ->where('attention.1.type', 'ordered_po')
            ->where('attention.1.title', $ordered->reference)
            ->where('attention.1.reason', 'Mark received')
            ->where('attention.1.href', route('purchased-orders.index', absolute: false))
            ->where('attention.2.type', 'ap_balance')
            ->where('attention.2.title', $posted->reference)
            ->where('attention.2.reason', 'Settle payment')
            ->where(
                'attention.2.href',
                route('accounts-payable.show', [$supplier, $posted], absolute: false)
            )
            ->where('attention.3.type', 'low_stock')
            ->where('attention.3.title', 'Bolt Pack')
            ->where('attention.3.reason', 'Review stock')
            ->where('attention.3.href', route('inventory.index', absolute: false))
        );
}
```

Use relative hrefs consistently (`absolute: false`) so assertions match whatever the controller generates via `route(..., absolute: false)`. If the project’s Inertia/route helpers always emit absolute URLs, assert with `route(...)` without `absolute: false` on both sides.

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=DashboardTest::test_attention_list_includes_actionable_rows_and_excludes_noise`

Expected: FAIL (`attention` empty or wrong).

- [ ] **Step 3: Implement attention composition**

In `DashboardController`, after KPIs, build `$attention` approximately:

```php
$attention = [];

foreach (
    RequestQuotation::query()
        ->where('status', RequestQuotationStatus::Pending)
        ->orderByDesc('created_at')
        ->orderByDesc('id')
        ->limit(3)
        ->get(['id', 'reference']) as $quotation
) {
    $attention[] = [
        'type' => 'pending_rfq',
        'title' => $quotation->reference,
        'reason' => 'Approve quotation',
        'href' => route('request-quotations.index', absolute: false),
    ];
}

foreach (
    PurchasedOrder::query()
        ->where('status', PurchasedOrderStatus::Ordered)
        ->orderByDesc('created_at')
        ->orderByDesc('id')
        ->limit(3)
        ->get(['id', 'reference']) as $order
) {
    $attention[] = [
        'type' => 'ordered_po',
        'title' => $order->reference,
        'reason' => 'Mark received',
        'href' => route('purchased-orders.index', absolute: false),
    ];
}

$postedWithBalance = PurchasedOrder::query()
    ->postedToAccountsPayable()
    ->with(['payments', 'supplier:id,name'])
    ->orderByDesc('created_at')
    ->orderByDesc('id')
    ->limit(20)
    ->get()
    ->filter(fn (PurchasedOrder $order) => (float) $order->balanceDue() > 0)
    ->take(3);

foreach ($postedWithBalance as $order) {
    $attention[] = [
        'type' => 'ap_balance',
        'title' => $order->reference,
        'reason' => 'Settle payment',
        'href' => route('accounts-payable.show', [$order->supplier_id, $order], absolute: false),
    ];
}

foreach (
    Product::query()
        ->whereNotNull('low_stock_threshold')
        ->whereColumn('quantity', '<=', 'low_stock_threshold')
        ->orderByDesc('created_at')
        ->orderByDesc('id')
        ->limit(3)
        ->get(['id', 'name']) as $product
) {
    $attention[] = [
        'type' => 'low_stock',
        'title' => $product->name,
        'reason' => 'Review stock',
        'href' => route('inventory.index', absolute: false),
    ];
}

$attention = array_values(array_slice($attention, 0, 12));
```

Pass `$attention` into Inertia props. Prefer extracting a private method `attentionItems(): array` if `index()` grows unwieldy — keep it on the same controller (no new service class for v1).

- [ ] **Step 4: Run tests**

Run: `php artisan test --filter=DashboardTest`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/DashboardController.php tests/Feature/DashboardTest.php
git commit -m "$(cat <<'EOF'
feat: add dashboard needs-attention list

EOF
)"
```

---

### Task 4: Dashboard UI + sidebar Dashboard nav

**Files:**
- Modify: `resources/js/pages/dashboard/index.jsx` (full UI)
- Modify: `resources/js/components/nav-icons.jsx` (add `DashboardNavIcon`)
- Modify: `resources/js/layouts/app-layout.jsx` (nav item + exact `/` active)
- Regenerate: Wayfinder (`php artisan wayfinder:generate` or project’s usual Vite/Wayfinder hook) so `home` points at `DashboardController` if needed — do not hand-edit generated files

**Interfaces:**
- Consumes: props `kpis`, `attention` from Task 2–3; `usePage().props.settings` for brand; `formatMoney` from `@/lib/format-money`; Wayfinder `home`, module index routes
- Produces: usable dashboard page + Dashboard first in sidebar

- [ ] **Step 1: Add `DashboardNavIcon`**

In `resources/js/components/nav-icons.jsx`, add a Heroicons-style outline “home” or “squares-2x2” icon matching existing stroke/size patterns, e.g.:

```jsx
export function DashboardNavIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className={iconClassName}
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
        </svg>
    );
}
```

- [ ] **Step 2: Wire sidebar + fix `/` active matching**

In `app-layout.jsx`:

1. Import `DashboardNavIcon` and `home` from `@/routes` (or whatever Wayfinder exports for `home`).
2. Prepend nav item: `{ label: 'Dashboard', route: home, icon: DashboardNavIcon }`.
3. Update `isActive` so `href === '/'` (or empty path) only matches exact current path `/` — **do not** use `startsWith('/')` for home, or every page would mark Dashboard active:

```js
function isActive(url, href) {
    const path = href.replace(/\/$/, '') || '/';
    const current = url.split('?')[0].replace(/\/$/, '') || '/';

    if (path === '/') {
        return current === '/';
    }

    return current === path || current.startsWith(`${path}/`);
}
```

- [ ] **Step 3: Build dashboard page UI**

Replace stub `resources/js/pages/dashboard/index.jsx` with a full page:

- `AppLayout title="Dashboard"`
- Header: `h2` Dashboard; subtitle `{brand} — Procurement snapshot` using `settings?.brand_name || 'JMC Pundasyon'`
- KPI grid: `grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5` with five `Link` cards:
  - Pending RFQs → `requestQuotations.url()` / `kpis.pending_rfqs`
  - Draft POs → purchased orders / `kpis.draft_pos`
  - Ordered POs → purchased orders / `kpis.ordered_pos`
  - AP balance due → accounts payable / `formatMoney(kpis.ap_balance_due)`
  - Low stock → inventory / `kpis.low_stock`
- Card styling: `min-h-24` (or similar), border `border-line`, `bg-white/80`, teal hover/focus ring consistent with app; large number + small label
- Attention section: heading “Needs attention”; if `attention.length === 0`, show “Nothing needs attention.”; else list/table of `Link` rows showing type badge, title, reason
- Type badge labels: Pending RFQ / Ordered PO / Accounts Payable / Low stock
- Keep JSX; no TypeScript

Import routes from `@/routes/...` the same way other pages do (see `app-layout.jsx`).

- [ ] **Step 4: Regenerate Wayfinder if needed**

Run the project’s Wayfinder generate command (commonly `php artisan wayfinder:generate`). Confirm `home` still resolves to `/` and points at `DashboardController`. Commit only regenerated outputs if they change — never hand-edit them.

- [ ] **Step 5: Manual smoke (tablet)**

Run: `composer run dev` (or existing serve + Vite). Log in → land on `/`. Confirm five KPI cards, empty or populated attention list, Dashboard nav active only on `/`, Products still works.

- [ ] **Step 6: Run PHPUnit suite subset**

Run: `php artisan test --filter='DashboardTest|ExampleTest'`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add resources/js/pages/dashboard/index.jsx \
  resources/js/components/nav-icons.jsx \
  resources/js/layouts/app-layout.jsx \
  resources/js/routes resources/js/actions
git commit -m "$(cat <<'EOF'
feat: add dashboard UI and sidebar nav entry

EOF
)"
```

(Only stage Wayfinder paths if they actually changed.)

---

### Task 5: PRD / docs alignment

**Files:**
- Modify: `.cursor/rules/PRD.mdc` (App shell + Nav modules)

**Interfaces:**
- Consumes: shipped dashboard behavior from Tasks 1–4
- Produces: PRD matches product (home = dashboard; guests still login-only)

- [ ] **Step 1: Update PRD shell wording**

In `.cursor/rules/PRD.mdc`:

- Change `Auth: session login/logout; `/` redirects to `/products`` to: authenticated `/` is the ops dashboard; login lands on `/`; Products remains `/products`.
- Add to Nav modules table (top row):

| Dashboard | `/` | Shipped — procurement KPIs + needs-attention list |

- Keep Guest: login only (no public marketing).

- [ ] **Step 2: Commit**

```bash
git add .cursor/rules/PRD.mdc
git commit -m "$(cat <<'EOF'
docs: note ops dashboard as authenticated home

EOF
)"
```

---

## Self-Review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Auth home at `/`, named `home` | 1 |
| Login + redirectUsersTo → home | 1 |
| Dashboard first in sidebar + exact active | 4 |
| Five KPI definitions + zeros still shown | 2, 4 |
| Attention 3/type, cap 12, reasons, hrefs | 3, 4 |
| Soft-delete / settled / non-low-stock exclusions | 2, 3 tests |
| No public landing | Global + Task 5 |
| PHPUnit coverage | 1–3 |
| PRD touch | 5 |
| JSX / no hand-edited Wayfinder | Global + Task 4 |

No TBD placeholders. Prop keys (`pending_rfqs`, `draft_pos`, `ordered_pos`, `ap_balance_due`, `low_stock`; attention `type`/`title`/`reason`/`href`) are consistent across tasks.

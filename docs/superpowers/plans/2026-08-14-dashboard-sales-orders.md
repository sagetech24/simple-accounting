# Dashboard Sales Orders & Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sales KPIs, unpaid/partial Needs Attention rows, and the daily sales chart to the authenticated ops dashboard, sharing one daily-sales builder with Sales Orders.

**Architecture:** Extract `App\Services\DailySalesSeries` from `SalesOrderController`. `DashboardController@index` still composes one Inertia payload: existing procurement KPIs + three sales KPI keys + `dailySales` + attention (new `sales_balance` type). The dashboard page reuses `SalesDailySalesChart` in the right column and drops the recommended-data placeholder.

**Tech Stack:** Laravel 13, Inertia.js v3, React 19 JSX, Wayfinder `@/routes`, PHPUnit, Tailwind v4 (existing paper/teal tokens), ApexCharts via existing `SalesDailySalesChart`.

**Spec:** `docs/superpowers/specs/2026-08-14-dashboard-sales-orders-design.md`

## Global Constraints

- Dashboard stays read-only: no mutations, no new toasts, no new routes.
- Soft-deleted / voided sales orders are excluded from sales KPIs, `dailySales`, and `sales_balance` attention.
- Today’s sales = last bucket of the 90-day `grand_total` series (order totals, not cash collected).
- Unpaid/partial count and AR due use `SalesOrder::balanceDue()` (`> 0`); paid remainder is 0.
- Attention: up to 3 newest per type, order pending RFQ → ordered PO → AP balance → **sales due** → low stock, then slice to 12.
- JSX only; do not hand-edit Wayfinder files (no route changes, so no regenerate).
- Tablet+: two KPI rows and both charts usable; range `<select>` ≥ ~44px; no horizontal page scroll.
- Do not change Sales Orders create/void/payment flows or switch the chart to cash collected.

## File Structure

| File | Responsibility |
|------|----------------|
| `app/Services/DailySalesSeries.php` | Shared 90-day zero-filled `grand_total` series |
| `app/Http/Controllers/SalesOrderController.php` | Call `DailySalesSeries` instead of private `dailySalesSeries()` |
| `app/Http/Controllers/DashboardController.php` | Sales KPI keys, `dailySales` prop, `sales_balance` attention rows |
| `resources/js/components/sales-daily-sales-chart.jsx` | Optional `className` on root (default keeps `border-b`) |
| `resources/js/pages/dashboard/index.jsx` | Sales + procurement KPI rows; chart beside Product Trend |
| `resources/js/pages/sales-orders/index.jsx` | Unchanged call site (default `className` includes `border-b`) |
| `tests/Feature/DailySalesSeriesTest.php` | Builder: 90 days, zeros, voided excluded |
| `tests/Feature/DashboardTest.php` | Empty + sales KPIs + attention `sales_balance` |
| `tests/Feature/SalesOrderTest.php` | Existing daily-sales coverage must still pass (no logic change) |
| `.cursor/rules/PRD.mdc` | Dashboard row: sales + procurement |
| `README.md` | Dashboard module blurb |
| `docs/superpowers/specs/2026-08-10-sales-orders-daily-sales-chart-design.md` | Note dashboard reuse is covered by the new spec |

Do not add a second chart component. Do not nest a `DashboardService`.

---

### Task 1: Extract `DailySalesSeries`

**Files:**
- Create: `app/Services/DailySalesSeries.php`
- Create: `tests/Feature/DailySalesSeriesTest.php`
- Modify: `app/Http/Controllers/SalesOrderController.php` (replace `dailySalesSeries()` call; delete the private method; drop unused `Carbon` import)

**Interfaces:**
- Consumes: `SalesOrder` query (non-trashed by default); `config('app.timezone')`
- Produces: `DailySalesSeries::build(): array{labels: list<string>, totals: list<float>}` — 90 calendar days through today inclusive, oldest → newest, missing days `0.0`, voided excluded, sums `grand_total`

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/DailySalesSeriesTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\SalesOrder;
use App\Services\DailySalesSeries;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DailySalesSeriesTest extends TestCase
{
    use RefreshDatabase;

    public function test_build_returns_90_zero_filled_days_excluding_voided(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-10 12:00:00', config('app.timezone')));

        try {
            SalesOrder::factory()->create([
                'grand_total' => '100.00',
                'created_at' => Carbon::parse('2026-08-10 09:00:00'),
                'updated_at' => Carbon::parse('2026-08-10 09:00:00'),
            ]);
            SalesOrder::factory()->create([
                'grand_total' => '50.00',
                'created_at' => Carbon::parse('2026-08-10 15:00:00'),
                'updated_at' => Carbon::parse('2026-08-10 15:00:00'),
            ]);
            SalesOrder::factory()->create([
                'grand_total' => '25.00',
                'created_at' => Carbon::parse('2026-08-08 10:00:00'),
                'updated_at' => Carbon::parse('2026-08-08 10:00:00'),
            ]);
            $voided = SalesOrder::factory()->create([
                'grand_total' => '999.00',
                'created_at' => Carbon::parse('2026-08-10 11:00:00'),
                'updated_at' => Carbon::parse('2026-08-10 11:00:00'),
            ]);
            $voided->delete();

            $series = (new DailySalesSeries)->build();

            $this->assertCount(90, $series['labels']);
            $this->assertCount(90, $series['totals']);
            $this->assertSame('2026-05-13', $series['labels'][0]);
            $this->assertSame('2026-08-10', $series['labels'][89]);
            $this->assertSame(150.0, $series['totals'][89]);
            $this->assertSame(25.0, $series['totals'][87]);
            $this->assertSame(0.0, $series['totals'][88]);
        } finally {
            Carbon::setTestNow();
        }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=DailySalesSeriesTest`

Expected: FAIL — class `App\Services\DailySalesSeries` not found.

- [ ] **Step 3: Implement `DailySalesSeries`**

Create `app/Services/DailySalesSeries.php` (move the private method body from `SalesOrderController` unchanged):

```php
<?php

namespace App\Services;

use App\Models\SalesOrder;
use Illuminate\Support\Carbon;

class DailySalesSeries
{
    /**
     * Zero-filled daily grand_total sums for the last 90 calendar days (active orders only).
     *
     * @return array{labels: list<string>, totals: list<float>}
     */
    public function build(): array
    {
        $timezone = config('app.timezone');
        $end = now($timezone)->startOfDay();
        $start = $end->copy()->subDays(89);

        $days = collect(range(0, 89))
            ->map(fn (int $offset) => $start->copy()->addDays($offset));

        $buckets = $days->mapWithKeys(
            fn ($day) => [$day->toDateString() => 0.0],
        );

        $rows = SalesOrder::query()
            ->where('created_at', '>=', $start)
            ->selectRaw('DATE(created_at) as sale_date, SUM(grand_total) as total')
            ->groupBy('sale_date')
            ->get();

        foreach ($rows as $row) {
            $key = Carbon::parse((string) $row->sale_date)->toDateString();

            if ($buckets->has($key)) {
                $buckets->put($key, round((float) $row->total, 2));
            }
        }

        return [
            'labels' => $buckets->keys()->values()->all(),
            'totals' => $buckets->values()->map(fn ($total) => (float) $total)->all(),
        ];
    }
}
```

- [ ] **Step 4: Point `SalesOrderController` at the builder**

In `app/Http/Controllers/SalesOrderController.php`:

1. Add `use App\Services\DailySalesSeries;`
2. Replace `'dailySales' => $this->dailySalesSeries(),` with `'dailySales' => (new DailySalesSeries)->build(),`
3. Delete the entire private `dailySalesSeries()` method
4. Remove `use Illuminate\Support\Carbon;` (it is only used in that method)

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
php artisan test --filter=DailySalesSeriesTest
php artisan test --filter=test_index_includes_daily_sales_series_excluding_voided_and_filling_zeros
```

Expected: PASS (both). Sales Orders Inertia `dailySales` shape is unchanged.

- [ ] **Step 6: Commit**

```bash
git add app/Services/DailySalesSeries.php tests/Feature/DailySalesSeriesTest.php app/Http/Controllers/SalesOrderController.php
git commit -m "refactor: extract shared daily sales series builder"
```

---

### Task 2: Dashboard sales KPI props

**Files:**
- Modify: `tests/Feature/DashboardTest.php`
- Modify: `app/Http/Controllers/DashboardController.php`

**Interfaces:**
- Consumes: `DailySalesSeries::build()`; `SalesOrder::balanceDue()` with `payments` eager-loaded
- Produces: `kpis.todays_sales` (decimal string from last series total), `kpis.unpaid_partial_sales` (int), `kpis.sales_ar_balance_due` (decimal string), `dailySales` (same shape as Sales Orders)

- [ ] **Step 1: Write the failing tests**

In `tests/Feature/DashboardTest.php`:

Add imports:

```php
use App\Models\Customer;
use App\Models\SalesOrder;
use App\Models\SalesOrderPayment;
use Illuminate\Support\Carbon;
```

Update `test_authenticated_users_see_zero_kpis_when_empty` to also assert sales keys and the 90-day series:

```php
public function test_authenticated_users_see_zero_kpis_when_empty(): void
{
    $this->actingAs(User::factory()->create())
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/index')
            ->where('kpis.pending_rfqs', 0)
            ->where('kpis.draft_pos', 0)
            ->where('kpis.ordered_pos', 0)
            ->where('kpis.ap_balance_due', '0.00')
            ->where('kpis.low_stock', 0)
            ->where('kpis.todays_sales', '0.00')
            ->where('kpis.unpaid_partial_sales', 0)
            ->where('kpis.sales_ar_balance_due', '0.00')
            ->has('dailySales.labels', 90)
            ->has('dailySales.totals', 90)
            ->where('attention', [])
        );
}
```

Add a new test after `test_kpis_reflect_procurement_snapshot`:

```php
public function test_kpis_reflect_sales_snapshot(): void
{
    $admin = User::factory()->create();
    $customer = Customer::factory()->active()->create();

    Carbon::setTestNow(Carbon::parse('2026-08-14 12:00:00', config('app.timezone')));

    try {
        SalesOrder::factory()->create([
            'grand_total' => '100.00',
            'customer_id' => null,
            'created_at' => Carbon::parse('2026-08-14 09:00:00'),
            'updated_at' => Carbon::parse('2026-08-14 09:00:00'),
        ]);

        $partial = SalesOrder::factory()->create([
            'grand_total' => '80.00',
            'customer_id' => $customer->id,
            'created_at' => Carbon::parse('2026-08-14 10:00:00'),
            'updated_at' => Carbon::parse('2026-08-14 10:00:00'),
        ]);
        SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $partial->id,
            'amount' => '30.00',
        ]);

        $paid = SalesOrder::factory()->create([
            'grand_total' => '40.00',
            'created_at' => Carbon::parse('2026-08-14 11:00:00'),
            'updated_at' => Carbon::parse('2026-08-14 11:00:00'),
        ]);
        SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $paid->id,
            'amount' => '40.00',
        ]);

        $voided = SalesOrder::factory()->create([
            'grand_total' => '999.00',
            'created_at' => Carbon::parse('2026-08-14 08:00:00'),
            'updated_at' => Carbon::parse('2026-08-14 08:00:00'),
        ]);
        $voided->delete();

        $this->actingAs($admin)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('kpis.todays_sales', '220.00')
                ->where('kpis.unpaid_partial_sales', 2)
                ->where('kpis.sales_ar_balance_due', '150.00')
                ->where('dailySales.labels.89', '2026-08-14')
                ->where('dailySales.totals.89', 220)
            );
    } finally {
        Carbon::setTestNow();
    }
}
```

Today’s sales is `100 + 80 + 40 = 220` (active `grand_total`, including paid). Voided `999` is excluded. Unpaid/partial count is 2 (`100` unpaid + `50` remaining). AR due is `100 + 50 = 150`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `php artisan test --filter=DashboardTest`

Expected: FAIL — `kpis.todays_sales` (and related keys / `dailySales`) missing from Inertia props.

- [ ] **Step 3: Implement sales KPIs on `DashboardController`**

Add imports:

```php
use App\Models\SalesOrder;
use App\Services\DailySalesSeries;
```

At the start of `index()`, after the existing procurement queries (or before `return`), compute:

```php
$dailySales = (new DailySalesSeries)->build();
$todaysSales = number_format(
    (float) ($dailySales['totals'][count($dailySales['totals']) - 1] ?? 0),
    2,
    '.',
    '',
);

$unpaidPartialSales = SalesOrder::query()
    ->with('payments')
    ->get()
    ->filter(fn (SalesOrder $order) => (float) $order->balanceDue() > 0);

return Inertia::render('dashboard/index', [
    'kpis' => [
        'pending_rfqs' => $pendingRfqs,
        'draft_pos' => $draftPos,
        'ordered_pos' => $orderedPos,
        'ap_balance_due' => number_format($apBalanceDue, 2, '.', ''),
        'low_stock' => $lowStock,
        'todays_sales' => $todaysSales,
        'unpaid_partial_sales' => $unpaidPartialSales->count(),
        'sales_ar_balance_due' => number_format(
            $unpaidPartialSales->sum(fn (SalesOrder $order) => (float) $order->balanceDue()),
            2,
            '.',
            '',
        ),
    ],
    'attention' => $this->attentionItems(),
    'productTrend' => $this->productTrend(),
    'dailySales' => $dailySales,
]);
```

Do not add a second “today” query. Keep existing procurement queries unchanged.

- [ ] **Step 4: Run tests to verify they pass**

Run: `php artisan test --filter=DashboardTest`

Expected: PASS. Procurement assertions still green. `test_kpis_reflect_sales_snapshot` passes.

- [ ] **Step 5: Commit**

```bash
git add tests/Feature/DashboardTest.php app/Http/Controllers/DashboardController.php
git commit -m "feat: add sales KPIs and daily sales series to dashboard"
```

---

### Task 3: Needs Attention `sales_balance` rows

**Files:**
- Modify: `tests/Feature/DashboardTest.php` (`test_attention_list_includes_actionable_rows_and_excludes_noise`)
- Modify: `app/Http/Controllers/DashboardController.php` (`attentionItems()`)

**Interfaces:**
- Consumes: `SalesOrder` with `customer` + `payments`; `balanceDue()`, `paymentStatus()`; `route('sales-orders.index', absolute: false)`
- Produces: attention items with `type: 'sales_balance'`, `title` = reference, `subtitle` = `{Walk-in|customer} · Balance ₱x.xx · {Unpaid|Partial}`, `reason` = `Collect payment`, `href` = `/sales-orders`, inserted after `ap_balance` and before `low_stock`

- [ ] **Step 1: Write the failing assertions**

In `test_attention_list_includes_actionable_rows_and_excludes_noise`, after the settled PO block and before the low-stock products, add:

```php
$unpaidSale = SalesOrder::factory()->create([
    'reference' => '44444444-4444-4444-4444-444444444444',
    'customer_id' => null,
    'grand_total' => '80.00',
]);

$paidSale = SalesOrder::factory()->create([
    'grand_total' => '10.00',
]);
SalesOrderPayment::factory()->cash()->create([
    'sales_order_id' => $paidSale->id,
    'amount' => '10.00',
]);

SalesOrder::factory()->create([
    'grand_total' => '99.00',
])->delete();
```

Change `->has('attention', 4)` to `->has('attention', 5)`.

Keep assertions for indices 0–2 (RFQ, ordered PO, AP) unchanged.

Insert sales due as index 3 and shift low stock to index 4:

```php
->where('attention.3.type', 'sales_balance')
->where('attention.3.title', $unpaidSale->reference)
->where('attention.3.subtitle', 'Walk-in · Balance ₱80.00 · Unpaid')
->where('attention.3.reason', 'Collect payment')
->where('attention.3.href', route('sales-orders.index', absolute: false))
->where('attention.4.type', 'low_stock')
->where('attention.4.title', 'Bolt Pack')
->where('attention.4.subtitle', '1 on hand · threshold 4')
->where('attention.4.reason', 'Review stock')
->where('attention.4.href', route('inventory.index', absolute: false))
```

Remove the old `attention.3` low-stock assertions (they move to `attention.4`).

`Customer`, `SalesOrder`, and `SalesOrderPayment` imports are already added in Task 2.

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=test_attention_list_includes_actionable_rows_and_excludes_noise`

Expected: FAIL — `attention` still has 4 rows; no `sales_balance`.

- [ ] **Step 3: Append sales due rows in `attentionItems()`**

Insert this block **after** the posted-PO `foreach` and **before** the low-stock `foreach`:

```php
$salesDue = SalesOrder::query()
    ->with(['payments', 'customer:id,name'])
    ->orderByDesc('created_at')
    ->orderByDesc('id')
    ->limit(20)
    ->get()
    ->filter(fn (SalesOrder $order) => (float) $order->balanceDue() > 0)
    ->take(3);

foreach ($salesDue as $order) {
    $paymentStatus = $order->paymentStatus();

    $attention[] = [
        'type' => 'sales_balance',
        'title' => $order->reference,
        'subtitle' => $this->joinAttentionSegments([
            $order->customer?->name ?? 'Walk-in',
            'Balance '.$this->formatAttentionMoney((float) $order->balanceDue()),
            $paymentStatus === 'partial' ? 'Partial' : 'Unpaid',
        ]),
        'reason' => 'Collect payment',
        'href' => route('sales-orders.index', absolute: false),
    ];
}
```

Always emit Walk-in when `customer` is null (do not omit the name segment). Paid and voided never enter `$salesDue` because `balanceDue() > 0` and the default query excludes trash.

- [ ] **Step 4: Run tests to verify they pass**

Run: `php artisan test --filter=DashboardTest`

Expected: PASS. Attention order is RFQ → PO → AP → sales due → low stock.

- [ ] **Step 5: Commit**

```bash
git add tests/Feature/DashboardTest.php app/Http/Controllers/DashboardController.php
git commit -m "feat: show unpaid sales in dashboard needs attention"
```

---

### Task 4: Dashboard UI + chart `className`

**Files:**
- Modify: `resources/js/components/sales-daily-sales-chart.jsx`
- Modify: `resources/js/pages/dashboard/index.jsx`
- Test: `tests/Feature/DashboardTest.php` (already green; re-run to confirm props still match the page)

**Interfaces:**
- Consumes: `kpis.todays_sales`, `kpis.unpaid_partial_sales`, `kpis.sales_ar_balance_due`, `dailySales.{labels,totals}`, attention `type: 'sales_balance'`
- Produces: two labeled KPI rows; `SalesDailySalesChart` in the right column with `className` omitting `border-b`; Product Trend left; equal `xl:grid-cols-2`; no recommended-data list

- [ ] **Step 1: Add optional `className` to `SalesDailySalesChart`**

Change the component signature and root `div` in `resources/js/components/sales-daily-sales-chart.jsx`.

Replace:

```jsx
export default function SalesDailySalesChart({ labels = [], totals = [] }) {
```

with:

```jsx
export default function SalesDailySalesChart({
    labels = [],
    totals = [],
    className = 'space-y-3 border-b border-line px-4 py-4',
}) {
```

Replace the root:

```jsx
<div className="space-y-3 border-b border-line px-4 py-4">
```

with:

```jsx
<div className={className}>
```

Leave the Sales Orders call site unchanged so it keeps `border-b` via the default.

- [ ] **Step 2: Update `resources/js/pages/dashboard/index.jsx`**

Replace the file with:

```jsx
import { Link, usePage } from '@inertiajs/react';
import ProductTrendChart from '@/components/product-trend-chart';
import SalesDailySalesChart from '@/components/sales-daily-sales-chart';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { index as accountsPayable } from '@/routes/accounts-payable';
import { index as inventory } from '@/routes/inventory';
import { index as purchasedOrders } from '@/routes/purchased-orders';
import { index as requestQuotations } from '@/routes/request-quotations';
import { index as salesOrders } from '@/routes/sales-orders';

const attentionTypes = {
    pending_rfq: {
        label: 'Pending RFQ',
        className: 'border-amber-600/30 bg-amber-400/5 text-amber-800',
    },
    ordered_po: {
        label: 'Ordered PO',
        className: 'border-sky-600/30 bg-sky-400/5 text-sky-800',
    },
    ap_balance: {
        label: 'Accounts Payable',
        className: 'border-teal-600/30 bg-mist text-teal-800',
    },
    sales_balance: {
        label: 'Sales due',
        className: 'border-teal-700/30 bg-teal-700/5 text-teal-800',
    },
    low_stock: {
        label: 'Low stock',
        className: 'border-red-600/30 bg-red-400/5 text-red-700',
    },
};

function MetricLegend({ colorClass, label, value }) {
    return (
        <div className="rounded-md border border-line bg-soft px-3 py-2">
            <p className="text-xs text-muted">{label}</p>
            <p className={`text-lg font-semibold tracking-tight ${colorClass}`}>
                {value}
            </p>
        </div>
    );
}

function KpiCard({ label, value, href }) {
    return (
        <Link
            href={href}
            className="flex min-h-24 cursor-pointer flex-col justify-between rounded-md border border-line bg-white p-4 transition duration-200 hover:border-teal-600 hover:bg-mist focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
        >
            <span className="text-sm font-medium text-muted">{label}</span>
            <span className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                {value}
            </span>
        </Link>
    );
}

export default function Dashboard({ kpis, attention, productTrend, dailySales }) {
    const { settings } = usePage().props;
    const brand = settings?.brand_name || 'JMC Pundasyon';
    const salesCards = [
        {
            label: "Today's sales",
            value: formatMoney(kpis.todays_sales),
            href: salesOrders.url(),
        },
        {
            label: 'Unpaid / partial',
            value: kpis.unpaid_partial_sales,
            href: salesOrders.url(),
        },
        {
            label: 'AR balance due',
            value: formatMoney(kpis.sales_ar_balance_due),
            href: salesOrders.url(),
        },
    ];
    const procurementCards = [
        {
            label: 'Pending Requests',
            value: kpis.pending_rfqs,
            href: requestQuotations.url(),
        },
        {
            label: 'Pending POs',
            value: kpis.draft_pos,
            href: purchasedOrders.url(),
        },
        {
            label: 'Purchase Orders',
            value: kpis.ordered_pos,
            href: purchasedOrders.url(),
        },
        {
            label: 'Accounts Payable Due',
            value: formatMoney(kpis.ap_balance_due),
            href: accountsPayable.url(),
        },
        {
            label: 'Low stock',
            value: kpis.low_stock,
            href: inventory.url(),
        },
    ];
    const labels = productTrend?.labels ?? [];
    const receivedSeries = productTrend?.series?.received_units ?? [];
    const adjustmentSeries = productTrend?.series?.adjustment_net ?? [];

    return (
        <AppLayout title="Dashboard">
            <div className="space-y-6 p-4">
                <header>
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                        Dashboard
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        {brand} — Ops snapshot
                    </p>
                </header>

                <section aria-label="Sales key performance indicators">
                    <h3 className="mb-2 text-sm font-medium text-muted">
                        Sales
                    </h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {salesCards.map((card) => (
                            <KpiCard
                                key={card.label}
                                label={card.label}
                                value={card.value}
                                href={card.href}
                            />
                        ))}
                    </div>
                </section>

                <section aria-label="Procurement key performance indicators">
                    <h3 className="mb-2 text-sm font-medium text-muted">
                        Procurement
                    </h3>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                        {procurementCards.map((card) => (
                            <KpiCard
                                key={card.label}
                                label={card.label}
                                value={card.value}
                                href={card.href}
                            />
                        ))}
                    </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <article className="overflow-hidden rounded-md border border-line bg-white">
                        <div className="border-b border-line px-4 py-3">
                            <h3 className="text-lg font-semibold text-ink">
                                Product Trend (Last 6 Months)
                            </h3>
                            <p className="text-xs text-muted">
                                Received units and stock adjustments by month
                            </p>
                        </div>
                        <div className="space-y-4 p-4">
                            <ProductTrendChart
                                labels={labels}
                                receivedUnits={receivedSeries}
                                adjustmentNet={adjustmentSeries}
                            />

                            <div className="grid gap-2 md:grid-cols-2">
                                <MetricLegend
                                    label="Total Received Units"
                                    value={
                                        productTrend?.totals?.received_units ??
                                        0
                                    }
                                    colorClass="text-sky-700"
                                />
                                <MetricLegend
                                    label="Net Adjustments"
                                    value={
                                        productTrend?.totals?.adjustment_net ??
                                        0
                                    }
                                    colorClass="text-amber-700"
                                />
                            </div>
                        </div>
                    </article>

                    <article className="overflow-hidden rounded-md border border-line bg-white">
                        <SalesDailySalesChart
                            labels={dailySales?.labels ?? []}
                            totals={dailySales?.totals ?? []}
                            className="space-y-3 px-4 py-4"
                        />
                    </article>
                </section>

                <section
                    aria-labelledby="attention-heading"
                    className="overflow-hidden rounded-md border border-line bg-white"
                >
                    <div className="border-b border-line px-4 py-3">
                        <h3
                            id="attention-heading"
                            className="text-lg font-semibold text-ink"
                        >
                            Needs Attention
                        </h3>
                    </div>

                    {attention.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-muted">
                            Nothing needs attention.
                        </p>
                    ) : (
                        <div className="divide-y divide-line">
                            {attention.map((item, index) => {
                                const type =
                                    attentionTypes[item.type] ??
                                    attentionTypes.low_stock;

                                return (
                                    <Link
                                        key={`${item.type}-${item.title}-${index}`}
                                        href={item.href}
                                        className="grid min-h-16 cursor-pointer gap-2 px-4 py-3 transition duration-200 hover:bg-mist focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset sm:grid-cols-[minmax(9rem,auto)_minmax(0,1fr)_minmax(8rem,auto)] sm:items-center sm:gap-4"
                                    >
                                        <span
                                            className={`w-fit rounded-full border px-2.5 py-1 text-md font-bold ${type.className}`}
                                        >
                                            {type.label}
                                        </span>
                                        <span className="min-w-0">
                                            {item.subtitle ? (
                                                <span className="mt-0.5 block text-md font-medium wrap-break-word text-ink">
                                                    {item.subtitle}
                                                </span>
                                            ) : null}
                                            <span className="block text-[13px] wrap-break-word text-muted">
                                                Reference No.: {item.title}
                                            </span>
                                        </span>
                                        <span className="text-sm text-muted sm:text-right">
                                            {item.reason}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
```

Do not add a second “Daily sales” heading. Do not keep `recommendedData`.

- [ ] **Step 3: Run feature tests**

Run:

```bash
php artisan test --filter=DashboardTest
php artisan test --filter=SalesOrderTest
```

Expected: PASS. No Wayfinder regenerate (no new routes).

- [ ] **Step 4: Commit**

```bash
git add resources/js/components/sales-daily-sales-chart.jsx resources/js/pages/dashboard/index.jsx
git commit -m "feat: show sales KPIs and daily sales chart on dashboard"
```

---

### Task 5: PRD and README

**Files:**
- Modify: `.cursor/rules/PRD.mdc` (Dashboard nav row)
- Modify: `README.md` (Dashboard module row)
- Modify: `docs/superpowers/specs/2026-08-10-sales-orders-daily-sales-chart-design.md` (out-of-scope dashboard line)

**Interfaces:**
- Consumes: shipped dashboard behavior from Tasks 2–4
- Produces: docs that describe sales + procurement KPIs, daily sales chart, and collect-payment attention

- [ ] **Step 1: Update PRD Dashboard row**

In `.cursor/rules/PRD.mdc`, replace:

```
| Dashboard | `/dashboard` | Shipped — procurement KPIs + needs-attention list |
```

with:

```
| Dashboard | `/dashboard` | Shipped — sales + procurement KPIs, daily sales chart, needs-attention (including collect payment) |
```

- [ ] **Step 2: Update README module row**

In `README.md`, replace:

```
| Dashboard | `/dashboard` | Procurement KPIs + needs-attention list |
```

with:

```
| Dashboard | `/dashboard` | Sales + procurement KPIs, daily sales chart, needs-attention |
```

- [ ] **Step 3: Point the daily-sales chart spec at this work**

In `docs/superpowers/specs/2026-08-10-sales-orders-daily-sales-chart-design.md`, replace the out-of-scope line:

```
- Dashboard reuse of this chart (can share later if needed)
```

with:

```
- Dashboard reuse of this chart (see `2026-08-14-dashboard-sales-orders-design.md`)
```

Do not change Sales Orders chart behavior in that spec’s Decisions table.

- [ ] **Step 4: Commit**

```bash
git add .cursor/rules/PRD.mdc README.md docs/superpowers/specs/2026-08-10-sales-orders-daily-sales-chart-design.md
git commit -m "docs: note sales KPIs on the ops dashboard"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Three sales KPI cards + two labeled rows | 2 (props), 4 (UI) |
| Today’s sales = last 90-day bucket, not cash collected | 2 |
| Unpaid/partial count + `sales_ar_balance_due` via `balanceDue()` | 2 |
| Voided excluded | 1, 2, 3 |
| `sales_balance` attention after AP, before low stock | 3 |
| Subtitle Walk-in/customer · Balance · Unpaid/Partial | 3 |
| Shared `DailySalesSeries`; Sales Orders still uses it | 1 |
| Reuse `SalesDailySalesChart`; drop recommended list; `xl:grid-cols-2` | 4 |
| Optional `className`; Sales Orders keeps `border-b` | 4 |
| Empty + fixture DashboardTest; existing SO daily-sales test | 1, 2, 3 |
| PRD / README / chart-spec note | 5 |
| No AR module, no deferred widgets, no new routes | all (omitted) |

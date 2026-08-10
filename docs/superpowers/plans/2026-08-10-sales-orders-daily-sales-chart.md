# Sales Orders Daily Sales Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a daily total-sales area/line chart on Sales Orders (under the card header, above tabs) with a client-side range dropdown (7 / 30 / month / 90 days).

**Architecture:** `SalesOrderController@index` builds one zero-filled 90-day `dailySales` series (active orders only). A new `SalesDailySalesChart` React component lazy-loads ApexCharts, defaults to the last 30 days, and slices the shared series when the range changes—no refetch.

**Tech Stack:** Laravel 13, Inertia.js v3, React 19 JSX, ApexCharts / `react-apexcharts` (already installed), PHPUnit, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-08-10-sales-orders-daily-sales-chart-design.md`

## Global Constraints

- Chart placement: after card header, before list/create tabs (visible on both tabs).
- Default range: Last 30 days; options: Last 7 days, Last 30 days, Current calendar month, Last 90 days.
- Zero-sales days included in every range.
- Voided (soft-deleted) sales orders excluded from totals.
- One server series for last 90 calendar days; range switching is client-only (no query param).
- JSX only (`.jsx`); reuse existing teal/paper tokens; tablet+ usable.
- Do not hand-edit Wayfinder files (no new routes for this feature).

## File Structure

| File | Responsibility |
|------|----------------|
| `app/Http/Controllers/SalesOrderController.php` | Build `dailySales` in `index`; private `dailySalesSeries()` helper |
| `resources/js/components/sales-daily-sales-chart.jsx` | Range select + ApexCharts area/line; client slicing |
| `resources/js/pages/sales-orders/index.jsx` | Pass `dailySales` into chart between header and tabs |
| `tests/Feature/SalesOrderTest.php` | Assert `dailySales` shape, zeros, void exclusion |

No new routes, migrations, or Wayfinder regeneration.

---

### Task 1: Backend `dailySales` prop + feature tests

**Files:**
- Modify: `app/Http/Controllers/SalesOrderController.php`
- Modify: `tests/Feature/SalesOrderTest.php`

**Interfaces:**
- Consumes: `SalesOrder` model (`grand_total`, `created_at`, SoftDeletes)
- Produces: Inertia prop `dailySales: { labels: list<string /* Y-m-d */>, totals: list<float> }` length 90, oldest → newest

- [ ] **Step 1: Write the failing tests**

Add to `tests/Feature/SalesOrderTest.php` (keep existing imports; add `Carbon\Carbon` if needed):

```php
public function test_index_includes_daily_sales_series_excluding_voided_and_filling_zeros(): void
{
    $admin = User::factory()->create();

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

        $this->actingAs($admin)
            ->get(route('sales-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('dailySales.labels', 90)
                ->has('dailySales.totals', 90)
                ->where('dailySales.labels.0', '2026-05-13')
                ->where('dailySales.labels.89', '2026-08-10')
                ->where('dailySales.totals.89', 150)
                ->where('dailySales.totals.87', 25)
                ->where('dailySales.totals.88', 0)
            );
    } finally {
        Carbon::setTestNow();
    }
}
```

Also extend `test_authenticated_users_can_view_sales_order_index` with:

```php
->has('dailySales')
->has('dailySales.labels', 90)
->has('dailySales.totals', 90)
```

Date math note: from `2026-08-10` back 89 days is `2026-05-13` (90 inclusive days). Index 87 = `2026-08-08`, 88 = `2026-08-09`, 89 = `2026-08-10`. Confirm with `Carbon::parse('2026-08-10')->subDays(89)->toDateString()` before asserting if the fixture timezone differs; adjust expected first label if needed.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
php artisan test --filter=test_index_includes_daily_sales_series_excluding_voided_and_filling_zeros
php artisan test --filter=test_authenticated_users_can_view_sales_order_index
```

Expected: FAIL — missing `dailySales` prop (or wrong length).

- [ ] **Step 3: Implement `dailySalesSeries()` and pass it from `index`**

In `SalesOrderController.php`, add the prop to the existing `Inertia::render` array:

```php
'dailySales' => $this->dailySalesSeries(),
```

Add private method:

```php
/**
 * Zero-filled daily grand_total sums for the last 90 calendar days (active orders only).
 *
 * @return array{labels: list<string>, totals: list<float>}
 */
private function dailySalesSeries(): array
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
        $key = (string) $row->sale_date;

        if ($buckets->has($key)) {
            $buckets->put($key, round((float) $row->total, 2));
        }
    }

    return [
        'labels' => $buckets->keys()->values()->all(),
        'totals' => $buckets->values()->map(fn ($total) => (float) $total)->all(),
    ];
}
```

Notes:
- SoftDeletes on `SalesOrder` already excludes voided rows from the default query.
- If SQLite tests return `sale_date` as a different string format, normalize with `Carbon::parse($row->sale_date)->toDateString()` before the bucket lookup.
- Prefer `whereDate` / Carbon casting over raw `DATE()` only if the raw group-by fails under SQLite in CI.

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
php artisan test --filter=SalesOrderTest
```

Expected: PASS (all SalesOrder tests).

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/SalesOrderController.php tests/Feature/SalesOrderTest.php
git commit -m "$(cat <<'EOF'
feat: expose daily sales series on sales orders index

EOF
)"
```

---

### Task 2: `SalesDailySalesChart` component + page wiring

**Files:**
- Create: `resources/js/components/sales-daily-sales-chart.jsx`
- Modify: `resources/js/pages/sales-orders/index.jsx`

**Interfaces:**
- Consumes: `dailySales: { labels: string[], totals: number[] }` from Task 1; `formatMoney` from `@/lib/format-money`
- Produces: UI between card header and tabs; default range `30`

- [ ] **Step 1: Create the chart component**

Create `resources/js/components/sales-daily-sales-chart.jsx`:

```jsx
import { useEffect, useMemo, useState } from 'react';
import { formatMoney } from '@/lib/format-money';

const TEAL = '#0f766e';

const RANGE_OPTIONS = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: 'month', label: 'Current month' },
    { value: '90', label: 'Last 90 days' },
];

function sliceDailySales(labels = [], totals = [], range = '30') {
    const safeLabels = Array.isArray(labels) ? labels : [];
    const safeTotals = Array.isArray(totals) ? totals : [];
    const length = Math.min(safeLabels.length, safeTotals.length);

    if (length === 0) {
        return { labels: [], totals: [] };
    }

    if (range === 'month') {
        const endLabel = safeLabels[length - 1];
        const monthPrefix = endLabel.slice(0, 7); // YYYY-MM
        const startIndex = safeLabels.findIndex(
            (label, index) => index < length && label.startsWith(monthPrefix),
        );

        return {
            labels: safeLabels.slice(startIndex, length),
            totals: safeTotals.slice(startIndex, length),
        };
    }

    const days = range === '7' ? 7 : range === '90' ? 90 : 30;
    const startIndex = Math.max(0, length - days);

    return {
        labels: safeLabels.slice(startIndex, length),
        totals: safeTotals.slice(startIndex, length),
    };
}

function formatAxisDate(value) {
    const parsed = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
        }).format(parsed);
    } catch {
        return value;
    }
}

export default function SalesDailySalesChart({
    labels = [],
    totals = [],
}) {
    const [Chart, setChart] = useState(null);
    const [reduceMotion, setReduceMotion] = useState(false);
    const [range, setRange] = useState('30');

    useEffect(() => {
        let cancelled = false;

        setReduceMotion(
            window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        );

        import('react-apexcharts').then((module) => {
            if (!cancelled) {
                setChart(() => module.default);
            }
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const sliced = useMemo(
        () => sliceDailySales(labels, totals, range),
        [labels, totals, range],
    );

    const displayLabels = sliced.labels.map(formatAxisDate);

    const options = {
        chart: {
            id: 'sales-daily-sales',
            type: 'area',
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'Instrument Sans, ui-sans-serif, system-ui, sans-serif',
            animations: {
                enabled: !reduceMotion,
                speed: 500,
            },
        },
        colors: [TEAL],
        stroke: {
            curve: 'smooth',
            width: 3,
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.35,
                opacityTo: 0.05,
                stops: [0, 100],
            },
        },
        dataLabels: { enabled: false },
        markers: {
            size: 0,
            hover: { size: 5 },
        },
        grid: {
            borderColor: '#e4e4e7',
            strokeDashArray: 4,
            padding: { left: 8, right: 8 },
        },
        legend: { show: false },
        tooltip: {
            y: {
                formatter: (value) => formatMoney(value ?? 0),
            },
        },
        xaxis: {
            categories: displayLabels,
            labels: {
                style: {
                    colors: '#71717a',
                    fontSize: '12px',
                },
                rotate: 0,
                hideOverlappingLabels: true,
            },
            axisBorder: { color: '#e4e4e7' },
            axisTicks: { color: '#e4e4e7' },
        },
        yaxis: {
            labels: {
                style: { colors: '#71717a', fontSize: '11px' },
                formatter: (value) => formatMoney(value ?? 0),
            },
        },
    };

    const series = [
        {
            name: 'Sales',
            data: sliced.totals,
        },
    ];

    return (
        <div className="space-y-3 border-b border-line px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-ink">
                        Daily sales
                    </h2>
                    <p className="text-xs text-muted">
                        Active orders only · zero-sales days included
                    </p>
                </div>
                <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
                    <span className="text-muted">Range</span>
                    <select
                        value={range}
                        onChange={(event) => setRange(event.target.value)}
                        className="min-h-11 min-w-44 rounded-md border border-line bg-white px-3 text-sm text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                        {RANGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {!Chart ? (
                <div
                    className="flex h-64 items-center justify-center rounded-md border border-line bg-soft text-sm text-muted"
                    aria-hidden="true"
                >
                    Loading chart…
                </div>
            ) : (
                <div className="rounded-md border border-line bg-soft p-2 md:p-3">
                    <Chart
                        options={options}
                        series={series}
                        type="area"
                        height={256}
                        width="100%"
                    />
                </div>
            )}
        </div>
    );
}
```

If the repo’s React Compiler guidance prefers avoiding `useMemo`, drop `useMemo` and call `sliceDailySales` inline each render instead.

- [ ] **Step 2: Wire the chart into the sales orders page**

In `resources/js/pages/sales-orders/index.jsx`:

1. Import:

```jsx
import SalesDailySalesChart from '@/components/sales-daily-sales-chart';
```

2. Accept prop on the page component (alongside existing props):

```jsx
export default function SalesOrdersIndex({
    orders,
    summary,
    filters,
    customers,
    products,
    dailySales,
}) {
```

3. Insert **after** the card header block (the `border-b` header with title + Create button) and **before** the tablist `div`:

```jsx
<SalesDailySalesChart
    labels={dailySales?.labels ?? []}
    totals={dailySales?.totals ?? []}
/>
```

Do not place it inside either tab panel.

- [ ] **Step 3: Manual UI check**

Run the app (`composer run dev` or existing Vite + `php artisan serve`), open `/sales-orders` as admin:

- Chart appears under header, above tabs.
- Default shows ~30 days.
- Switching to 7 / Current month / 90 updates the chart without a full navigation flicker.
- Create and list tabs both keep the chart visible.
- Tooltip amounts use currency formatting.

- [ ] **Step 4: Re-run backend tests (sanity)**

Run:

```bash
php artisan test --filter=SalesOrderTest
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add resources/js/components/sales-daily-sales-chart.jsx resources/js/pages/sales-orders/index.jsx
git commit -m "$(cat <<'EOF'
feat: add daily sales chart to sales orders page

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Placement under header / above tabs | Task 2 |
| Area/line ApexCharts | Task 2 |
| Default last 30 days | Task 2 |
| Ranges 7 / 30 / month / 90 | Task 2 |
| Zero-fill missing days | Task 1 |
| Exclude voided | Task 1 |
| Single 90-day series + client slice | Task 1 + 2 |
| Feature test for zeros + void exclusion | Task 1 |
| Refresh via normal index reload | Existing mutations (no change) |

## Out of scope (do not implement)

- URL/localStorage persistence for range
- Order-count series or export
- Dashboard reuse of this chart
- PRD nav/status changes (Sales Orders already shipped)

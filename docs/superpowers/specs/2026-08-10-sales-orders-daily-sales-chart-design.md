# Sales Orders — Daily Sales Chart — 2026-08-10

## Goal

Add a daily total-sales chart on the Sales Orders index, placed under the card header and above the list/create tabs, so admins can glance at recent revenue without leaving the page.

## Decisions (confirmed)

| Topic | Choice |
|-------|--------|
| Placement | After card header, before tabs (visible on list and create) |
| Chart style | Area/line via ApexCharts (same stack as dashboard) |
| Default range | Last 30 days |
| Range options | Last 7 days, Last 30 days, Current calendar month, Last 90 days |
| Zero days | Included (fill missing dates with 0) |
| Voided orders | Excluded (active `sales_orders` only) |
| Range switching | Client-side slice of one 90-day series (no refetch / no URL param) |
| Data approach | Server sends last 90 calendar days once on `index` |

### Rejected alternatives

- Query-param range with Inertia refetch on each change
- Precomputing four separate series payloads on the server
- Including voided orders or tying chart totals to the list trash filter
- Bar-only chart (area/line chosen for dashboard consistency)
- URL-synced range, order-count series, or chart export

## Data

### Inertia prop

```php
'dailySales' => [
    'labels' => list<string>, // Y-m-d, length 90, oldest → newest
    'totals' => list<float>,  // grand_total sum per day, zero-filled
]
```

### Aggregation rules

- Window: last 90 calendar days through today (app timezone), inclusive.
- Source: non-deleted `sales_orders`; group by `DATE(created_at)`; sum `grand_total`.
- Missing days in the window appear with total `0`.
- Controller helper (private method or small dedicated builder) keeps `index` thin.

### Client range slicing

| Option value | Slice |
|--------------|--------|
| `7` | Last 7 points |
| `30` | Last 30 points (default) |
| `month` | From 1st of current month through today (derive from labels) |
| `90` | Full series |

## UI

- New component (e.g. `resources/js/components/sales-daily-sales-chart.jsx`).
- Header row: “Daily sales” + native `<select>` for range.
- Lazy-load `react-apexcharts` (same pattern as `ProductTrendChart`).
- Teal accent to match Sales Orders UI; money-formatted tooltips; honor `prefers-reduced-motion`.
- Loading placeholder while chart chunk loads; all-zero series still renders axes.

Wired from `resources/js/pages/sales-orders/index.jsx` between the card header and the tablist.

## Mutations

Create, void, and restore already redirect/reload Sales Orders `index`; the chart refreshes with the new `dailySales` prop. No extra endpoints.

## Testing

Feature coverage on `SalesOrderController@index` (or dedicated assertion in `SalesOrderTest`):

- Seed active orders on known dates inside the 90-day window.
- Include at least one day with no sales (expect `0`).
- Include a voided order on a day that also has an active sale (voided amount excluded).
- Assert `dailySales.labels` length is 90, chronological, and totals match expected sums.

## Out of scope

- Sales payments / AR
- Multi-series (order count vs revenue)
- Persist selected range in query string or localStorage
- Dashboard reuse of this chart (see `2026-08-14-dashboard-sales-orders-design.md`)

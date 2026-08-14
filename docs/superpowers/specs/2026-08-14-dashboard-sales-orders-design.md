# Dashboard Sales Orders & Payments — 2026-08-14

## Goal

Fold **sales orders and collections** into the authenticated ops dashboard: three sales KPI cards, unpaid/partial rows in Needs Attention, and the existing daily sales chart in the slot that currently holds “Recommended Data to Add.” Procurement KPIs stay. No separate Accounts Receivable module.

## Decisions (confirmed)

| Topic | Choice |
|-------|--------|
| Scope | Dashboard only (plus a shared daily-sales builder). Sales Orders CRUD/payments unchanged |
| Sales KPIs | Today’s sales, unpaid/partial count, AR balance due — all link to `/sales-orders` |
| Chart | Reuse `SalesDailySalesChart` beside Product Trend; drop the recommended-data placeholder |
| Chart data | Same 90-day `grand_total` series as Sales Orders (active orders, zero-filled). Not cash collected |
| Architecture | One `DashboardController` request; extract shared daily-sales builder |
| Attention | New type `sales_balance` (unpaid + partial), after AP and before low stock |

### Rejected alternatives

- Copy-pasting `dailySalesSeries()` into the dashboard (drift)
- Deferred/split Inertia widgets
- Cash-collected vs order-total dual series
- Replacing procurement cards or mixing all eight KPIs into one unlabeled row
- Full-width sales chart or stacked full-width charts
- A dedicated AR module or recent-payments list on the dashboard

## Approach

**Extend `DashboardController@index` in place.** Server still composes aggregates, attention, product trend, and daily sales in one request. Extract the 90-day series currently private on `SalesOrderController` into a small shared builder so both pages use one query and one Inertia shape.

## KPIs

Page subtitle: ops snapshot (sales + procurement), not “Procurement snapshot.”

Two labeled rows. Zero values still render (`0` or formatted money). Soft-deleted / voided sales orders are excluded from all sales metrics.

### Sales (new)

| KPI | Prop | Definition | Destination |
|-----|------|------------|-------------|
| Today’s sales | `kpis.todays_sales` | Sum of `grand_total` for active sales orders created **today** (app timezone). Same meaning as the daily chart’s last bucket — **order totals, not cash collected**. Decimal string `0.00` | `/sales-orders` |
| Unpaid / partial | `kpis.unpaid_partial_sales` | Count of active sales orders with `balanceDue() > 0` (unpaid and partial) | `/sales-orders` |
| AR balance due | `kpis.sales_ar_balance_due` | Sum of remaining `balanceDue()` on those active orders. Decimal string | `/sales-orders` |

`todays_sales` is taken from the last point of the shared 90-day series (today), formatted with `number_format(..., 2, '.', '')`. Do not run a second “today” query.

Reuse `SalesOrder::balanceDue()` for unpaid/partial count and AR sum (eager-load `payments`; collection over non-trashed orders is acceptable at v1 scale, same pattern as AP). Paid orders contribute `0` to the AR sum.

### Procurement (unchanged)

Existing five cards and keys: `pending_rfqs`, `draft_pos`, `ordered_pos`, `ap_balance_due`, `low_stock`. Destinations unchanged.

### Layout

- **Sales** heading + 3-card grid (`grid-cols-1` on narrow tablet if needed; `md:grid-cols-3`).
- **Procurement** heading + existing 2 / 3 / 5 column grid.
- Cards keep current tap size (~min-h-24), teal hover, `formatMoney` for money values.

## Needs attention

Existing rules stay: up to **3** newest per type, concatenate in type order, hard cap **12**. Soft-deleted records excluded.

New type **`sales_balance`**, inserted after AP and before low stock:

1. Pending RFQ
2. Ordered PO
3. AP balance
4. **Sales due (`sales_balance`)**
5. Low stock

| Field | Value |
|-------|--------|
| Who | Active sales orders with `balanceDue() > 0` (unpaid and partial). Paid and voided excluded |
| `title` | Sales order `reference` |
| `subtitle` | Join with ` · `: customer name or **Walk-in**; `Balance ₱` + `balanceDue()` (2 dp, comma thousands); `Unpaid` or `Partial` from `paymentStatus()` |
| `reason` | `Collect payment` |
| `href` | `/sales-orders` (index-only module) |

Badge label: **Sales due**. Query pattern: load a modest newest set with `customer` + `payments`, filter `balanceDue() > 0`, take 3 (same idea as posted POs with balance).

## Chart

- Extract a small invokable/class e.g. `App\Services\DailySalesSeries` that returns `{ labels: list<Y-m-d>, totals: list<float> }` for the last 90 calendar days through today (app timezone), inclusive.
- Rules unchanged from the Sales Orders daily chart spec: non-deleted `sales_orders`; `DATE(created_at)` + `SUM(grand_total)`; missing days `0`; voided excluded.
- `SalesOrderController@index` and `DashboardController@index` both call this builder. Do not duplicate the aggregation.
- Dashboard passes `dailySales` to the page. Reuse `resources/js/components/sales-daily-sales-chart.jsx` (range 7 / 30 / month / 90, default 30, client-side slice, teal area, money tooltips, `prefers-reduced-motion`).
- Place it in the **right column** of the two-column block; **remove** the “Recommended Data to Add” list. Left column stays Product Trend.
- Use **equal columns** on `xl` (`xl:grid-cols-2`) now that both sides are charts.
- Wrap the chart in the same article chrome as Product Trend (border, white background). Do **not** add a second “Daily sales” heading — the component already has title + range. Add an optional `className` on `SalesDailySalesChart`’s root: Sales Orders keeps today’s `border-b`; the dashboard omits it so the chart is not a fake list header. Do not fork a second chart component.
- ApexCharts `id` stays page-local (dashboard and sales-orders never mount together).

## Backend shape

`DashboardController@index` Inertia props:

```php
[
  'kpis' => [
    'pending_rfqs' => int,
    'draft_pos' => int,
    'ordered_pos' => int,
    'ap_balance_due' => string,
    'low_stock' => int,
    'todays_sales' => string,           // decimal
    'unpaid_partial_sales' => int,
    'sales_ar_balance_due' => string,   // decimal; distinct from AP
  ],
  'dailySales' => [
    'labels' => list<string>, // Y-m-d, length 90, oldest → newest
    'totals' => list<float>,
  ],
  'attention' => [
    // existing types plus:
    // type: 'sales_balance'
  ],
  'productTrend' => /* unchanged */,
]
```

No new routes. No mutations. Query failures use normal Laravel/Inertia handling. Guests still cannot hit `/dashboard`.

## UI

- Page: `resources/js/pages/dashboard/index.jsx` inside `AppLayout`.
- Attention badge map: add `sales_balance` (distinct from `ap_balance` — e.g. amber or teal-700 so AP vs sales due are distinguishable).
- Tablet+: two KPI rows and both charts remain fully usable; no horizontal page scroll; chart range `<select>` stays ≥ ~44px.

## Tests

Extend `tests/Feature/DashboardTest.php`. Keep existing procurement assertions.

- Empty dashboard: `todays_sales` `0.00`, `unpaid_partial_sales` `0`, `sales_ar_balance_due` `0.00`, `dailySales.labels` length 90, `attention` empty.
- Today’s sales matches an active order created today; a voided order on the same day is excluded.
- Unpaid + partial count and AR due match fixtures; paid and voided excluded from count and from the AR sum (paid remainder is 0).
- Attention includes a `sales_balance` row: title = reference, subtitle includes Walk-in or customer + balance + Unpaid/Partial, reason `Collect payment`, href sales-orders index. Paid and voided orders do not appear.
- Existing RFQ / PO / AP / low-stock attention rows still appear in the same relative order, with sales due between AP and low stock when all types are present.

After extracting `DailySalesSeries`, existing Sales Orders daily-sales feature coverage must still pass (same 90-day shape and voided-exclusion rules).

## PRD / docs

- PRD Dashboard row: procurement **and** sales KPIs, daily sales chart, needs-attention (including collect-payment).
- Daily sales chart spec “dashboard reuse” is now in scope via this document; do not change Sales Orders chart behavior.

## Errors

Read-only. No new toasts. Unauthenticated `/dashboard` → login (unchanged).

## Out of scope

- Cash-collected series, dual-axis charts, or changing the Sales Orders chart to payments
- Accounts Receivable module, payment recording from the dashboard, recent-payments list
- URL-synced chart range, deferred widgets, customizable KPI layout
- Changing Sales Orders create/void/payment flows
- Month-to-date sales KPI (not in the three-card set)

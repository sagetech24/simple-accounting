# Ops Dashboard Design — 2026-07-31

## Goal

Replace the authenticated `/` → Products redirect with an **ops snapshot dashboard**: KPI counts for the procurement workflow plus a capped “needs attention” list. No public marketing landing page.

## Decisions (confirmed)

| Topic | Choice |
|-------|--------|
| Scope | Authenticated home only (not public SaaS marketing) |
| Emphasis | Ops snapshot KPIs + deep links |
| Metrics | Procurement focus |
| Below KPIs | Needs attention list only (no module shortcut tiles) |
| Navigation | Dashboard at `/` + **Dashboard** first in sidebar; login lands on `/` |

## Approach

**Single `DashboardController` + one Inertia page.** Server composes all aggregates and attention rows in one request. Avoid deferred widgets and client-side aggregation for v1.

## Routing & shell

- Replace `Route::redirect('/', '/products')` with `GET /` → `DashboardController@index`, named **`home`**.
- Middleware: `auth` (guests → login).
- After successful login → `/` (`route('home')`).
- Sidebar (`AppLayout`): add **Dashboard** as the first nav item with a new nav icon; keep existing module order after it. Active state: exact `/` (do not treat `/products` as Dashboard).
- Products browse remains at `/products`.
- Brand/home links that already use the `home` route continue to work.
- No guest-facing marketing route.

## KPIs

Five clickable cards:

| KPI | Definition | Destination |
|-----|------------|-------------|
| Pending RFQs | Non-trashed `request_quotations` with `status = pending` | `/request-quotations` |
| Draft POs | Non-trashed `purchased_orders` with `status = draft` | `/purchased-orders` |
| Ordered POs | Non-trashed `purchased_orders` with `status = ordered` | `/purchased-orders` |
| AP balance due | Sum of remaining balance for non-trashed POs with `posted_to_ap_at` set and balance > 0 (same meaning as `PurchasedOrder::balanceDue()`) | `/accounts-payable` |
| Low stock | Non-trashed products where `low_stock_threshold` is not null and `quantity <= low_stock_threshold` (same as `Product::isLowStock()`) | `/inventory` |

- Zero values still render (`0` or formatted money for AP).
- Money formatting uses existing settings/`formatMoney` helpers.
- Soft-deleted records are excluded from all counts.

## Needs attention list

- Single mixed list, hard cap **12** rows.
- Build order: for each type below, take up to **3** newest matching rows (`created_at` desc, or equivalent), concatenate in this type order, then slice to 12:

  1. **Pending RFQ** — title: RFQ reference; reason: “Approve quotation”; `href`: `/request-quotations` (index-only module; no show route).
  2. **Ordered PO** — title: PO reference; reason: “Mark received”; `href`: `/purchased-orders`.
  3. **Posted PO with balance due** — title: PO reference (+ supplier name if cheap); reason: “Settle payment”; `href`: `/accounts-payable/{supplier}/{reference}`.
  4. **Low-stock product** — title: product name; reason: “Review stock”; `href`: `/inventory`.

- Each row: type badge, title, short reason, whole-row `Link` (min ~44px tap height on tablet).
- Empty copy: **“Nothing needs attention.”**
- Exclude trashed records, settled posted POs (balance due ≤ 0), products that are not low stock, and non-pending RFQs / non-ordered POs for those respective types.

## UI

- Page: `resources/js/pages/dashboard/index.jsx` inside existing `AppLayout`.
- Header: title **Dashboard**; subtitle uses brand from settings plus a short line (e.g. “Procurement snapshot”).
- KPI row: responsive grid (2 columns from tablet; up to 5 on wide desktop). Large tap targets; existing teal/paper visual language — no new marketing theme.
- Attention section: heading + table/list consistent with RFQ/PO index patterns.
- Tablet+ usable: no horizontal page scroll; list scrolls inside the main panel if needed.
- Out of scope: charts, date filters, customizable widgets, public landing, module shortcut tiles, inventory valuation estimates.

## Backend shape

`DashboardController@index` returns Inertia props roughly:

```php
[
  'kpis' => [
    'pending_rfqs' => int,
    'draft_pos' => int,
    'ordered_pos' => int,
    'ap_balance_due' => string, // decimal string
    'low_stock' => int,
  ],
  'attention' => [
    [
      'type' => 'pending_rfq' | 'ordered_po' | 'ap_balance' | 'low_stock',
      'title' => string,
      'reason' => string,
      'href' => string,
    ],
    // ...
  ],
]
```

Keep queries efficient (counts + limited selects). Prefer reusing model helpers (`balanceDue`, `isLowStock`, status enums) rather than duplicating business rules in SQL when clarity wins; for AP sum, a single query or collection sum over posted unpaid orders is acceptable at v1 scale.

## Errors & auth

- Read-only page; no mutations; no success toasts.
- Query failures use normal Laravel/Inertia error handling.
- Unauthenticated access to `/` redirects to login.

## Tests (PHPUnit)

- Guest cannot access dashboard (`/` → login).
- Authenticated `/` renders dashboard (does not redirect to `/products`).
- Login success redirects to `/`.
- KPI counts match fixtures: pending RFQ, draft PO, ordered PO, posted PO with balance, low-stock product.
- Attention list includes expected types and excludes trashed / settled / non-matching statuses / non-low-stock products.

## PRD / docs touch

- Update app-shell / home wording: authenticated `/` is the ops dashboard; guests still only see login (no public catalog or marketing site).
- Nav modules table: add Dashboard as home entry; Products remains `/products`.

## Non-goals

- Public landing / pricing / SaaS marketing
- Multi-user roles or admin console beyond current single admin
- Deferred/partial Inertia loading for widgets
- Changing existing module CRUD behavior

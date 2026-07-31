# Dashboard Needs Attention Details — 2026-07-31

## Goal

Enrich the dashboard **Needs attention** list so each row shows a compact secondary line of transaction/product context—not only a reference (or product name) plus an action reason.

## Decisions (confirmed)

| Topic | Choice |
|-------|--------|
| Detail level | Compact secondary line under the primary title |
| Prop shape | Server-built `subtitle` string (not structured `meta`) |
| Primary title | Unchanged: RFQ/PO reference or product name |
| Scope | Attention rows only; KPIs, caps, types, and hrefs unchanged |

## Approach

**Server composes `subtitle` in `DashboardController::attentionItems`.** The React page renders badge · (title + subtitle stacked) · reason. No client-side field assembly.

## Attention row shape

Each attention item:

```php
[
  'type' => 'pending_rfq' | 'ordered_po' | 'ap_balance' | 'low_stock',
  'title' => string,
  'subtitle' => string, // compact secondary line; may be empty only if no segments
  'reason' => string,
  'href' => string,
]
```

Existing list rules remain: up to 3 newest per type, concatenate in type order, hard cap 12; soft-deleted and non-matching statuses excluded.

## Per-type subtitle content

Join non-empty segments with ` · ` (space-middot-space).

| Type | `title` | `subtitle` segments |
|------|---------|---------------------|
| `pending_rfq` | RFQ `reference` | supplier name; `₱` + grand total (2 dp); `{n} item(s)` via `withCount('items')` |
| `ordered_po` | PO `reference` | supplier name; `₱` + grand total (2 dp); `{n} item(s)` via `withCount('items')` |
| `ap_balance` | PO `reference` | supplier name; `Balance ₱` + `balanceDue()` (2 dp) |
| `low_stock` | product `name` | `{quantity} on hand`; `threshold {low_stock_threshold}` |

Rules:

- Omit missing/blank supplier name (do not invent “Unknown”).
- Pluralize items: `1 item` / `N items`.
- Money in subtitles: `₱` prefix + `number_format($amount, 2, '.', ',')` (aligned with peso display elsewhere).
- Prefer a small private helper to join segments so formatting stays consistent.

## Queries

- Pending RFQ / ordered PO: eager-load `supplier:id,name`, `withCount('items')`, select fields needed for reference, totals, and subtitle.
- AP balance: keep `payments` + `supplier:id,name`; include balance in subtitle.
- Low stock: select `id`, `name`, `quantity`, `low_stock_threshold`.

## UI

- Page: `resources/js/pages/dashboard/index.jsx`.
- Row (tablet+): `[badge] [title + subtitle stacked] [reason]`.
- Title: medium weight, ink.
- Subtitle: `text-sm text-muted` under title; wrap allowed.
- Reason: short action copy, right-aligned on `sm+`.
- Empty copy unchanged: “Nothing needs attention.”
- Whole row remains a `Link` with ≥ ~44px tap height.

## Tests

Update `tests/Feature/DashboardTest.php` attention assertions:

- Still assert `type`, `title`, `reason`, `href`.
- Assert `subtitle` includes expected type-specific pieces (supplier, formatted money / balance, item count or stock numbers).

## Out of scope

- KPI card changes
- New attention types or different caps
- Structured `meta` props / client-side subtitle assembly
- Deep links into create/edit tabs
- Changing module index routes used as `href`

## Files likely touched

| File | Change |
|------|--------|
| `app/Http/Controllers/DashboardController.php` | Eager-load + build `subtitle` |
| `resources/js/pages/dashboard/index.jsx` | Render subtitle under title |
| `tests/Feature/DashboardTest.php` | Assert subtitles |
| `docs/superpowers/specs/2026-07-31-ops-dashboard-design.md` | Optional note that attention rows now include `subtitle` (implementer may leave as historical) |

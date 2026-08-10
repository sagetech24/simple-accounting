# Sales Orders (Slim Outbound) — 2026-08-10

## Goal

Add an auth-gated Sales Orders module for recording multi-line outbound sales that immediately decrement on-hand stock via reserved `sale` stock movements. Mistakes are corrected by void (soft-delete) which restores stock, not by editing lines.

## Decisions (confirmed)

| Topic | Choice |
|-------|--------|
| Scope | **Slim outbound** — save = final; no draft/confirm/fulfill |
| Customer | **Optional** (`null` = Walk-in); must be active when set |
| Document shape | **Multi-line** header + items (like a mini PO) |
| After save | **Void / soft-delete restores stock**; no line edits |
| Pricing | Default to product `selling_price`; **overridable** per line |
| Approach | Durable `sales_orders` + `sales_order_items`; stock via `StockService` |
| Payments / AR | **Out of scope** for v1 |
| Status column | **None** — non-deleted sales are completed |

### Rejected alternatives

- Full PO mirror (draft → confirmed → fulfilled + AR)
- Fulfillment-first without payments but with multi-status workflow
- Stock-form only (no durable sale document)
- Soft-delete without stock restore
- Immutable sales with no delete (returns later)
- Locked selling price / fully manual price entry

## Data model

### `sales_orders`

| Field | Rules |
|-------|--------|
| `reference` | UUID, unique; auto-generated |
| `customer_id` | Nullable FK → customers (`restrictOnDelete`); `null` = walk-in |
| `grand_total` | Decimal(14,2); **server-calculated** from lines |
| `notes` | Nullable text |
| Soft delete | `deleted_at` |

### `sales_order_items`

| Field | Rules |
|-------|--------|
| `sales_order_id` | FK, cascade on delete |
| `product_id` | FK, restrict; unique per order |
| `selling_price` | Decimal(12,2); defaults from product, overridable |
| `quantity` | Unsigned int ≥ 1 |
| `subtotal` | Decimal(14,2); server-calculated |

**Relations:** `SalesOrder` → optional `customer` (`withTrashed`), `items`; item → `product` (`withTrashed`). Morph alias `sales_order` for stock movement references.

## Workflow & stock

```
Create → persist SO + lines → Sale movements (negative delta) → listed
Void   → soft-delete → Sale movements (positive delta, void notes)
Restore → restore model → re-post outbound Sale movements (fail if insufficient stock)
```

- `unit_cost` on sale movements is `null` (price lives on order lines; not COGS).
- Create / void / restore run in DB transactions; insufficient stock aborts the whole operation.
- No `update` route for header/lines after save.

## Routes & UI

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/sales-orders` | Index (list + create tabs) |
| `POST` | `/sales-orders` | Store (final + stock out) |
| `DELETE` | `/sales-orders/{sales_order}` | Void (soft-delete + stock restore) |
| `POST` | `/sales-orders/{sales_order}/restore` | Restore + re-decrement stock |

**Nav:** Sales Orders after Customers (before Request Quotations).

**Page:** Index-only Inertia — list + create tabs; detail modal; trash filter; void/restore confirms. No edit tab.

## Validation

- Distinct product lines; quantity ≥ 1; selling_price ≥ 0
- Customer active and not deleted when `customer_id` present
- Sufficient on-hand per line before create or restore commit
- Grand total / subtotals never trusted from the client

## Out of scope

Draft/confirm/fulfill, payments, Accounts Receivable, partial fulfill, returns/RMA as separate docs, post-save line edits, COGS/margin reporting, dashboard sales KPIs, guest checkout.

## Testing

Feature coverage: create with customer and walk-in; stock decrement + `sale` movements; reject oversell; void restores stock; restore re-decrements; restore fails when stock too low; server-calculated totals.

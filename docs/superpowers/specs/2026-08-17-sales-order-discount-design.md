# Sales Order Discount (Order-level) — 2026-08-17

## Goal

Let an admin apply **one discount on the whole sales order** (percent or peso amount) at create time. Line prices stay list/unit prices. `grand_total` remains the net amount due (payments, void, dashboard KPIs unchanged).

## Decisions

| Topic | Choice |
|-------|--------|
| Scope | Header discount only — not per line, coupons, or customer default % |
| Timing | Create only (orders stay immutable after save) |
| Line math | Unchanged: `selling_price × qty` |
| Net due | `grand_total = subtotal − discount_amount` |
| Rounding | One round to 2 d.p. on the header subtotal |
| Client totals | Ignored; server recalculates |
| Full discount | `grand_total` 0 → already Paid; Void still allowed until a payment exists |

## Data model (`sales_orders`)

| Field | Rules |
|-------|--------|
| `subtotal` | Decimal(14,2); server sum of line subtotals |
| `discount_type` | `none` \| `percent` \| `amount` |
| `discount_value` | Decimal(14,2); typed 10 for 10% or ₱10.00; 0 when none |
| `discount_amount` | Decimal(14,2); server-calculated pesos off |
| `grand_total` | Decimal(14,2); net after discount |

Existing rows: `subtotal = grand_total`, discount none.

## Validation

- `discount_type` nullable enum; blank → `none`
- `discount_value` nullable numeric ≥ 0, 2 d.p.; blank/0 → none
- Percent: 0–100 inclusive
- Amount: must not exceed header subtotal
- Never trust client `discount_amount` / `grand_total` / `subtotal`

## UI

- Create footer: Subtotal, ₱/% toggle + value, live discount, Grand total
- Detail: same split
- List Total column stays net `grand_total`; show a muted discount hint when `discount_amount > 0`

## Out of scope

Line discounts, stacking, tax, coupons, standing customer rates, editing discount after save.

# Sales Order Payments — 2026-08-14

## Goal

Let admins record (and void) payments against a saved sales order from the list 3-dot menu, without a separate Accounts Receivable module. Walk-in sales are cash only. Customer sales support Cash, PDC, Bank Transfer, and Online Payment. Partial payments are allowed until the remaining balance is zero. Voiding the sales order stays available only while the order is unpaid.

## Decisions (confirmed)

| Topic | Choice |
|-------|--------|
| Storage | Dedicated `sales_order_payments` table (mirror PO payments, inbound) |
| Completeness | Partial payments allowed; multiple rows until `balance_due` is 0 |
| Walk-in (`customer_id` null) | Method locked to Cash |
| Customer set | Cash, PDC, Bank Transfer, Online Payment |
| Method extra fields | Mirror PO: Online (platform + optional ref), Bank Transfer (bank name + ref), PDC (company bank account + check number + due date) |
| PDC | Creates a company `bank_checks` row (same form as PO) |
| Void sales order | Only while unpaid (zero payment rows). Hide Void once any payment exists |
| Void payment | Allowed on any recorded payment (delete the row). If the order is unpaid again, Void sale returns |
| PDC void | Delete the payment and set `bank_checks.voided_at` (do not delete the check) |
| Amount | `> 0` and ≤ remaining balance; modal defaults to remaining balance |
| Chart | Daily sales chart stays `grand_total` of active orders (not cash collected) |

### Rejected alternatives

- Polymorphic payments shared with purchased orders
- Payment columns on `sales_orders` (cannot support multiple partials)
- Full settlement only / single payment per order
- Incoming-check-only PDC fields (no `bank_checks` row)
- Allow voiding a sales order that already has payments
- Permanent payments with no void-payment escape
- Separate AR module in this slice

## Data model

### `sales_order_payments`

| Field | Rules |
|-------|--------|
| `sales_order_id` | FK → `sales_orders`, cascade on delete |
| `method` | `cash` \| `online_payment` \| `bank_transfer` \| `post_dated_check` |
| `amount` | Decimal(14,2), `> 0` |
| `notes` | Nullable text |
| `platform` | Online Payment required; otherwise null |
| `reference_number` | Bank Transfer required; Online Payment optional; otherwise null |
| `bank_name` | Bank Transfer required; otherwise null |
| `bank_check_id` | PDC only; unique nullable FK → `bank_checks` (`nullOnDelete`) |
| `recorded_by` | Current user name |
| `paid_at` | Server `now()` |
| timestamps | Yes |
| Soft delete | **No** — voiding a payment deletes the row |

Enum: `SalesOrderPaymentMethod` with labels Cash, Online Payment, Bank Transfer, Post Dated Check. Do **not** reuse `PurchasedOrderPaymentMethod` (`bank_deposit` vs `bank_transfer`).

### Derived on `SalesOrder` (not stored)

```
amount_paid  = SUM(payments.amount)
balance_due  = grand_total - amount_paid   (floored at 0.00)
payment_status = unpaid | partial | paid
  unpaid  → no payment rows
  partial → amount_paid > 0 and balance_due > 0
  paid    → balance_due == 0 (and at least one payment, or grand_total is 0)
```

Zero-total orders: chip shows Paid and Add Payment is hidden; Void remains available until a payment row exists.

### Flags

- `can_add_payment`: not deleted **and** `balance_due > 0`
- `can_void`: not deleted **and** no payment rows
- `can_restore`: unchanged (deleted)

### PDC / bank checks

Creating a PDC payment (same transaction as PO):

1. Create `bank_checks` (active company `bank_account_id`, check number, amount, due date ≥ today, `issued_by` = user name)
2. Create `sales_order_payments` with `bank_check_id`

`BankCheck::isLinked()` is true if a **purchased-order payment or a sales-order payment** exists. Bank-account UI already blocks voiding a linked check; extend that message to cover sales payments.

Voiding a PDC sales payment (same transaction):

1. Delete the `sales_order_payments` row
2. Set `bank_checks.voided_at` if the check is not already voided
3. Write bank-account audit rows (`check.created` / `payment.recorded` on create; `check.voided` on void). Extend `BankAccountAuditor` subject types to include `sales_order_payment`.

## Routes & backend

Auth-gated, on `SalesOrderController` (thin; Form Request for store):

| Method | Route | Name |
|--------|--------|------|
| POST | `/sales-orders/{sales_order}/payments` | `sales-orders.payments.store` |
| DELETE | `/sales-orders/{sales_order}/payments/{payment}` | `sales-orders.payments.destroy` |

Existing `index` / `store` / `destroy` / `restore` stay. `destroy` (void sale) **rejects** when any payment exists (server-side, not UI-only). Restore is unchanged; a voided sale cannot have payments under these rules. Regenerate Wayfinder after the new routes exist.

`index` also passes `paymentMethods` (enum options) and `bankAccounts` (active, not deleted) like purchased orders. Eager-load `payments.bankCheck.bankAccount`.

### Store payment

- Form Request: method enum, amount `gt:0` not exceeding `balanceDue()`, method-specific required fields (mirror `StorePurchasedOrderPaymentRequest`, with `bank_transfer` instead of `bank_deposit`)
- Walk-in: reject any method other than `cash`
- Reject if `! can_add_payment` (voided or already paid)
- Transaction: optional bank check + payment row + auditor
- Toast: success / error; redirect sales-orders index

### Void payment

- Payment must belong to the sales order
- Transaction: delete payment; if PDC, void the linked check + auditor
- Toast success; redirect index

## UI

Index-only page (`resources/js/pages/sales-orders/index.jsx`). Reuse PO prepayment modal patterns in a sales-specific modal (do not overload the PO component with walk-in locking).

**3-dot menu** (active orders), order:

1. Add Payment — if `can_add_payment`
2. Void — if `can_void`

Voided rows: Restore only. Fully paid: neither Add Payment nor Void.

**Add Payment modal:** slide-down; customer or Walk-in; grand total / amount paid / balance due; amount defaults to remaining balance; optional notes. Walk-in: method select disabled on Cash. Customer: all four methods with PO-equivalent extra fields.

**List:** payment chip Unpaid / Partial / Paid on active rows (replace the generic “Completed” chip). Voided rows keep Voided. Desktop table: add a Payment column after Total.

**Detail modal:** paid / balance summary; payments list with method details; Void payment per row (confirm); Add Payment when balance remains; Void sale only when unpaid.

Tablet+ layouts stay fully usable (touch-sized menu and modal actions).

## Errors

| Case | Behavior |
|------|----------|
| Amount > balance | Validation error on `amount` |
| Walk-in + non-cash | Validation error on `method` |
| Add payment on paid/voided | Toast error; no write |
| Void sale with payments | Toast error; no void / no stock restore |
| Void payment mismatch / missing | 404 |
| PDC missing bank/check/due | Validation errors on those fields |
| Inactive/deleted bank account | Validation error on `bank_account_id` |

Stock is unchanged by payment store/void. Only voiding/restoring the **sales order** moves stock.

## Testing

Feature coverage in `SalesOrderTest` (and bank-check linkage where needed):

- Walk-in: cash payment succeeds; non-cash rejected
- Customer: each of the four methods succeeds (PDC creates `bank_checks`)
- Partial then second payment; amount exceeding balance rejected
- Fully paid: `can_add_payment` false; further store rejected
- After any payment: `can_void` false; `destroy` rejected
- Void payment restores unpaid + `can_void`; PDC voids the check
- Index payload includes `amount_paid`, `balance_due`, `payment_status`, `can_add_payment`
- Daily sales series still sums `grand_total`, not payments

## Out of scope

Accounts Receivable module, payment edit, refunds, allocating one payment across orders, cash-collected chart, auto-recording cash at create time, guest checkout.

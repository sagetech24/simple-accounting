# Customer Profile — 2026-08-17

## Goal

Give admins a dedicated profile at `/customers/{customer}` for one saved customer: contact details, a standing KPI strip, sales-order history, and payment history. Edit the customer from the profile. Do not collect or void payments here.

## Decisions (confirmed)

| Topic | Choice |
|-------|--------|
| Page type | **Dedicated show page** — `GET /customers/{id}`, same pattern as bank-account profiles |
| Interactivity | **View + edit customer** — history is read-only |
| History layout | **Two tabs** — Orders (default) and Payments via `?tab=` |
| Voided orders | **Filterable** — default active; `trashed=only` or `trashed=with` like Customers / Sales Orders |
| Header | **KPI strip** — order count, lifetime sales, outstanding balance, last order date (non-voided only) |
| Order drill-in | **Read-only `SalesOrderDetailModal`** — omit Add Payment / Void / Restore callbacks |
| Walk-in / typed name | **Excluded** — only orders with `customer_id` on this customer. Guest labels stay on Sales Orders |
| Approach | Thin `CustomerController@show` + existing models; no new tables |

### Rejected alternatives

- Slide-over or expand-row on the customers index (not bookmarkable; cramped for KPIs + tabs).
- Full ops hub (add/void payments or create sales orders from the profile).
- Hide voided orders entirely, or a Walk-in / typed-name hub.
- Auto-match typed `customer_name` to a customer record.

## Route & entry

- `GET /customers/{customer}` → `CustomerController@show` → Inertia `customers/show`
- Auth-gated. Register show with `withTrashed()` (same as `bank-accounts.show`); keep the resource `except` for `create` / `edit` (and keep a dedicated show route rather than enabling resource `show` without `withTrashed`).
- Soft-deleted customers: show loads; header is deleted-state; **Restore** instead of **Edit**; history still listed.
- Unknown id: 404. Guests: redirect to login.
- Index: customer **name** links to show; row menu adds **View** (before Edit / Delete). Create, edit, delete, restore on the list stay as they are.

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/customers/{customer}` | Profile |
| `PUT/PATCH` | `/customers/{customer}` | Existing update; `return_to=show` redirects back to the profile |
| `POST` | `/customers/{customer}/restore` | Existing restore; from profile, redirect back to show |

Destroy stays index-only. Do not add Delete on the profile header.

## Page layout

Dense ops style consistent with bank-account profile (AppLayout, existing teal/ink tokens — no new font or theme).

1. **Breadcrumb** — Customers / {name}
2. **Header** — name, contact name, email, phone, address, notes, status badge; **Edit** (existing customer modal) when not deleted; **Restore** when deleted
3. **KPI strip** (non-voided orders only — see Data)
4. **Tabs** via `?tab=` (`orders` default, or `payments`)

Tablet+: tables `overflow-x-auto`; actions and tabs min ~44px; no horizontal page scroll.

### KPI strip

Computed from **non-voided** sales orders where `customer_id` = this customer:

| KPI | Definition |
|-----|------------|
| Order count | Count of those orders |
| Lifetime sales | `SUM(grand_total)` |
| Outstanding | `max(0, lifetime_sales − SUM(payments.amount) on those orders)` |
| Last order | Latest `created_at`, or "—" if none |

Voided orders never contribute. Walk-in / typed-name orders never contribute.

### Orders tab

- Query: `sales_orders.customer_id` = this customer; trash filter `trashed` empty (default, exclude voided) \| `only` \| `with`.
- Newest `created_at` then `id` desc. Paginate 8 with query string (`tab`, `trashed`).
- Columns: date, reference, item count, grand total, amount paid, balance due, payment status (Unpaid / Partial / Paid). Voided rows: strikethrough + Voided badge.
- Click reference → `SalesOrderDetailModal` with that row’s `toArrayPayload()` (items + payments loaded).
- No search. No New Sales Order CTA. Empty copy: “No sales orders for this customer.” / trash-specific when `trashed=only`.

### Payments tab

- Query: `sales_order_payments` whose parent order has `customer_id` = this customer. Voided orders have no payments, so this list is active-only.
- Newest `paid_at` then `id` desc. Paginate 8 with query string (`tab`).
- Columns: paid at, amount, method, details (platform / bank / check / reference number), sales-order reference, recorded by.
- Each row includes a nested `sales_order` (`toArrayPayload()` with items + payments) so click on the order reference opens the same read-only detail modal without another request.
- Empty copy: “No payments recorded for this customer.”

### Read-only detail modal

Reuse `resources/js/components/sales-order-detail-modal.jsx`. Do not pass `onAddPayment`, `onVoid`, `onVoidPayment`, or `onRestore` — those buttons already hide when callbacks are missing. Line items and that order’s payments still show. Collecting or voiding stays on Sales Orders.

## Edit from profile

- Reuse `CustomerModal` + `CustomerForm` + `UpdateCustomerRequest`.
- Profile passes `returnTo="show"` (same pattern as `BankAccountModal`).
- `CustomerController@update`: if `$request->input('return_to') === 'show'`, redirect to `customers.show`; otherwise `customers.index`.
- `return_to` is not a customer attribute; do not put it in `customerAttributes()`.
- Restore from the profile posts `{ return_to: 'show' }` and `CustomerController@restore` redirects to `customers.show`. Index restore omits it and still redirects to the list.

Index create/edit is unchanged (no `return_to` → list).

## Data model

No migrations. Existing tables only.

### `Customer`

Add:

```php
public function salesOrders(): HasMany
{
    return $this->hasMany(SalesOrder::class);
}
```

`toArrayPayload()` stays as today (no KPIs on the index payload).

### Show Inertia props

```php
[
    'customer' => $customer->toArrayPayload(),
    'kpis' => [
        'order_count' => int,
        'lifetime_sales' => string,      // decimal 2
        'outstanding' => string,         // decimal 2
        'last_order_at' => ?string,      // ISO 8601 or null
    ],
    'orders' => LengthAwarePaginator,    // through toArrayPayload()
    'payments' => LengthAwarePaginator,  // payment payload + sales_order + sales_order_reference
    'statuses' => [...],                 // existing status options for the edit modal
    'filters' => [
        'tab' => 'orders' | 'payments',
        'trashed' => '' | 'only' | 'with',
    ],
]
```

Load orders with `items.product` and `payments.bankCheck.bankAccount` so the detail modal matches Sales Orders. Load each payment’s `salesOrder` the same way for the nested `sales_order`.

KPI aggregates must not load every historical order into memory: `count` / `sum` / `max` on the non-voided `sales_orders` query, plus `SUM(amount)` on payments whose orders are non-voided for this customer.

## Frontend pieces

| Piece | Role |
|-------|------|
| `resources/js/pages/customers/show.jsx` | Profile page |
| `resources/js/pages/customers/index.jsx` | Name link + View action |
| `resources/js/components/customer-modal.jsx` | Optional `returnTo` prop |
| `SalesOrderDetailModal` | Unchanged; omit mutation callbacks |
| Wayfinder | Regenerate after routes — do not hand-edit generated files |

## PRD

Update `.cursor/rules/PRD.mdc` Customer UX: keep index create/edit in the modal; **add** a show profile at `/customers/{id}` for details, KPIs, order history, and payment history. Walk-in / typed-name sales remain Sales Orders only.

## Testing

Feature tests in `tests/Feature/CustomerTest.php` (or a dedicated `CustomerProfileTest.php` if the file grows unwieldy):

- Guests cannot access show; auth can; missing id is 404; soft-deleted customer still loads.
- Props include `customer`, `kpis`, `orders`, `payments`, `filters`, `statuses`.
- KPIs ignore voided orders.
- An order with `customer_id` null (Walk-in or typed `customer_name`, even if the string equals this customer’s name) does **not** appear in orders or payments and does **not** affect KPIs.
- Another customer’s orders/payments do not leak onto this profile.
- Orders trash filter: default excludes voided; `only` / `with` work.
- Payments list this customer’s payments with `sales_order_reference`.
- Update with `return_to=show` redirects to show; update without it still redirects to index.
- Restore with `return_to=show` redirects to show; restore without it still redirects to index.

## Out of scope

- Accounts Receivable as a module
- Walk-in hub or grouping by typed `customer_name`
- Auto-attach guest names to customers / “promote to customer”
- Add Payment, Void sale, Void payment, or New Sales Order from the profile
- Search on orders or payments
- Phone-only layout polish beyond tablet+ requirements
- Destroy from the profile

## Acceptance criteria

- [ ] `/customers/{id}` shows breadcrumb, header, KPIs, tabs Orders | Payments
- [ ] Index name and View open the profile
- [ ] Edit from profile stays on show; index edit still returns to the list
- [ ] Soft-deleted customer can be viewed and restored from the profile
- [ ] Orders tab lists only this customer’s `customer_id` sales; trash filter works
- [ ] Payments tab lists this customer’s payments; click opens read-only order detail
- [ ] Detail modal has no Add Payment / Void / Restore
- [ ] Walk-in and typed-name orders never appear
- [ ] Feature tests cover show, KPIs, isolation, trash filter, and `return_to`
- [ ] Tablet+ layout usable (tables scroll, actions tappable)

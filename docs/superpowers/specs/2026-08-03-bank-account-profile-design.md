# Bank Account Profile — 2026-08-03

## Goal

Give admins a full ops hub at `/bank-accounts/{bank_account}` for one bank account: issued checks (with upcoming/overdue filters), linked PO payments, account edit, check issue (PO-linked or standalone), and an audit log of all mutations tied to that account.

## Decisions (confirmed)

| Topic | Choice |
|-------|--------|
| Page type | **Full ops hub** — view + edit account + issue checks from the profile |
| Check issuance | **Both** — against an open PO (creates check + payment) and standalone (check only) |
| Checks UI | **One Checks tab** with filter chips (All / Upcoming / Overdue), not separate tabs |
| Void linked checks | **Blocked** — only standalone (unlinked) checks can be voided here |
| Audit scope | **Everything tied to this account** — account edits, check create/update/void, and payments that use this bank’s checks |
| Audit storage | **Lightweight `bank_account_audit_logs`** — no Spatie package for v1 |
| Approach | Profile hub + append-only audit table written from the same controllers that mutate data |

### Rejected alternatives

- **Read-only profile** — conflicts with full ops hub choice.
- **Spatie Activitylog** — solid, but extra dependency; filtering “all activity for this bank” for payments via `bank_check` is more awkward than a scoped table.
- **Separate Upcoming / Overdue tabs** — user preferred merged Checks tab with filters.
- **Void linked checks with warning** — user chose blocked for safety (PO payment must be handled elsewhere).

## Route & entry

- `GET /bank-accounts/{bank_account}` → `BankAccountController@show` → Inertia `bank-accounts/show`
- Soft-deleted accounts: allow show with `withTrashed` (read-only actions except Restore if already supported from index); prefer matching existing trash patterns.
- Index: bank **name** links to show; row actions include **View**.
- Enable `show` on the bank-accounts resource (currently excepted).

Nested mutations (auth-gated):

| Method | Route | Purpose |
|--------|-------|---------|
| `PATCH` | `/bank-accounts/{bank_account}` | Existing update (redirect back to show when from profile) |
| `POST` | `/bank-accounts/{bank_account}/checks` | Create standalone check |
| `PATCH` | `/bank-accounts/{bank_account}/checks/{bank_check}` | Update check fields |
| `POST` | `/bank-accounts/{bank_account}/checks/{bank_check}/void` | Void standalone check only |
| `POST` | Existing PO/AP payment store | Issue check against PO (bank account locked to current profile) |

Account update/destroy/restore remain as today; when the request came from the profile, redirect/flash back to `bank-accounts.show`.

## Page layout

Dense ops style consistent with Accounts Payable show / inventory (AppLayout, existing teal/ink tokens — do not introduce a new font or purple theme).

1. **Breadcrumb** — Bank Accounts / {Bank name}
2. **Header** — name, account name, account number, status badge, notes; actions: **Edit**, **Issue check** (split: Against PO | Standalone)
3. **KPI strip** (all four use non-voided checks only):
   - Open checks total (sum of amounts)
   - Overdue count + amount (`due_date` before today)
   - Upcoming count + amount (`due_date` today or later)
   - Issued count (number of non-voided checks)
4. **Tabs** via `?tab=` (`checks` default | `payments` | `audit`)

### Checks tab

- Filter chips: **All** | **Upcoming** (`due_date >= today`) | **Overdue** (`due_date < today`); voided rows: show in All with a Voided badge, **excluded** from Upcoming/Overdue.
- Optional secondary filters: search (check #, issued by, linked PO ref), Linked | Standalone | All linkage.
- Table: Check #, Amount, Due date, Status (Upcoming / Due today / Overdue / Voided), Issued by, Linked PO (or “Standalone”), Actions.
- Row actions: Edit; Void (standalone only — disabled/hidden with tooltip when linked); Open linked PO/AP when present.
- Empty state: short copy + Issue check CTA.

### Payments tab

- Read-only list of `purchased_order_payments` whose `bank_check` belongs to this account.
- Columns: paid at, amount, method, PO reference (link), check #, recorded by.
- Recording new linked payments: Issue check → Against PO (or existing PO/AP UI); both write audit for this bank.

### Audit tab

- Newest-first timeline for `bank_account_audit_logs` where `bank_account_id` = this account.
- Row: datetime, actor name, action, summary; expandable before → after field diffs.
- v1: unfiltered list + simple search on summary/action; no pagination beyond a sensible page size (e.g. 50) if volume grows.

## Check & payment behavior

### Standalone check

- Fields: check number, amount, due date, issued by (default auth user name), notes.
- Creates `BankCheck` with `bank_account_id` set; no `PurchasedOrderPayment`.
- Audit: `check.created`.

### Against PO

- Modal: select an eligible open purchased order (same eligibility as existing prepayment/settlement rules), then amount + check fields; **bank account is fixed** to the profile account.
- Creates `BankCheck` + `PurchasedOrderPayment` (method check) in one transaction.
- Prefer reusing existing payment Form Request / controller logic with `bank_account_id` forced; if reuse is awkward, thin wrapper that calls the same domain service/path.
- Audit: `check.created` + `payment.recorded` (both scoped to this `bank_account_id`).

### Edit check

- Allowed fields: check_number, amount, due_date, issued_by, notes.
- Linked or standalone: both editable for those fields in v1.
- Audit: `check.updated` with before/after JSON of changed attributes only.

### Void check

- Only if **no** related `PurchasedOrderPayment` (`payment` relation absent).
- Sets `voided_at` (timestamp); does not delete the row.
- If linked: return validation error / disable UI (“Void is blocked while this check is linked to a purchase order payment.”).
- Audit: `check.voided`.

### Account edit

- Reuse existing bank account modal/form and update endpoint.
- Audit: `account.updated` with before/after of changed attributes.

### Payments created elsewhere

- When a check payment is recorded from PO or AP flows for a check on this bank, also append `payment.recorded` (and `check.created` if the check is created in that flow) to this bank’s audit log so the profile stays complete.

## Data model

### `bank_checks` (existing +)

| Column | Change |
|--------|--------|
| `voided_at` | Nullable timestamp; null = active |

No separate status enum for v1; derived UI status from `voided_at` + `due_date` vs today.

### `bank_account_audit_logs` (new)

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | PK |
| `bank_account_id` | FK → bank_accounts | indexed; cascade or restrict on delete — **restrict** (account soft-deletes) |
| `actor_user_id` | FK → users, nullable | who performed the action |
| `action` | string | e.g. `account.updated`, `check.created`, `check.updated`, `check.voided`, `payment.recorded` |
| `subject_type` | string | morph class or short key (`bank_account`, `bank_check`, `purchased_order_payment`) |
| `subject_id` | unsigned bigint nullable | |
| `summary` | string | human-readable one-liner for the list |
| `before` | json nullable | previous attributes |
| `after` | json nullable | new attributes |
| `created_at` | timestamp | no `updated_at` (append-only) |

Helper service e.g. `BankAccountAuditor::record(...)` used by controllers — keep writes in one place.

## Frontend pieces

| Piece | Role |
|-------|------|
| `resources/js/pages/bank-accounts/show.jsx` | Profile page |
| `resources/js/pages/bank-accounts/index.jsx` | Link to show + View action |
| Check issue modal(s) | Standalone form; Against PO (PO picker + check fields, bank locked) |
| Check edit modal | Edit fields |
| Existing `BankAccountModal` | Edit from profile |
| Wayfinder | Regenerate after routes |

Match existing modal patterns (portal, Escape, min 44px targets, horizontal scroll for tables on tablet).

## Testing

- Feature: guests cannot access show; auth can view profile props (account, checks, KPIs, payments, audit).
- Standalone create / update / void; void blocked when payment linked.
- Against-PO path creates check + payment and audit rows.
- Account update writes audit.
- PO/AP check payment writes audit for the bank account.
- Filters: upcoming/overdue exclude voided; voided appear in All.

## Out of scope (v1)

- Cleared / deposited check status at the bank
- Deleting or reversing PO payments from this page
- Spatie Activitylog / global app-wide audit UI
- Multi-user roles / policies beyond authenticated admin
- Standalone check → later link to PO from this page (can be a follow-up)
- Phone-only layout polish beyond tablet+ requirements

## Acceptance criteria

- [ ] `/bank-accounts/{id}` shows header, KPIs, tabs Checks | Payments | Audit
- [ ] Checks tab filters All / Upcoming / Overdue; search and linkage filters work
- [ ] Issue standalone check and issue check against PO from the profile
- [ ] Edit check fields; void only when unlinked; linked void blocked in UI and server
- [ ] Edit account from profile; soft-deleted handling consistent with index
- [ ] Audit log lists account, check, and payment events for this bank with before/after where applicable
- [ ] Index links into the profile
- [ ] Feature tests cover show, mutations, void guard, and audit writes
- [ ] Tablet+ layout usable (tables scroll, actions tappable)

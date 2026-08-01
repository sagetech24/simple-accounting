# Request Quotation — Print to File — 2026-08-01

## Goal

Let an admin print (or Save as PDF via the browser print dialog) a clean, well-formatted ops sheet of the selected request quotation from the detail modal.

## Decisions (confirmed)

| Topic | Choice |
|-------|--------|
| Output method | **Browser print dialog** (`window.print`) — admin can choose Save as PDF / Print to File |
| Page design | **Clean ops sheet** with a light brand header (not a formal letterhead) |
| Brand header | `settings.brand_name`, fallback **JM Pundasyon** |
| Implementation | **Print window + dedicated print HTML** (no new backend routes) |
| Availability | Print button always shown when the detail modal is open (including soft-deleted records) |
| Scope | RFQ detail modal only; no PO / AP / inventory print in this change |

### Rejected alternatives

- **CSS `@media print` on the modal** — modal chrome, backdrop, and overlay make a messy printed page.
- **Server-rendered print route / PDF download** — extra route and controller for data already in the modal; overkill for v1.
- **Formal letterhead document** — user chose a clean ops sheet; brand name only, no logo art.

## Behavior

1. Detail modal footer gains a **Print to File** button (alongside Edit / Delete / Close).
2. On click, open a blank print window, write self-contained HTML for the ops sheet, then call `window.print()`.
3. Close the print window after print or cancel when the browser fires `afterprint` (best-effort; some browsers differ).
4. If the popup is blocked, surface a short error (toast or `alert`) so the admin knows to allow popups.
5. No mutations, no new Inertia visits, no flash success toast on print.

## Print layout

Ink-friendly black/gray document. No modal chrome, buttons, or colored status badges.

1. **Brand header** — `settings.brand_name` (fallback: JM Pundasyon)
2. **Title** — “Request Quotation”
3. **Reference** — monospace / plain reference string
4. **Meta row** — Created date · Status label (plain text) · “Deleted” note when `deleted_at` is set
5. **Supplier** — name
6. **Notes** — only if present
7. **Line items table** — Product (with unit via existing label helper) | Purchase price | Qty | Subtotal
8. **Grand total** — right-aligned under the table
9. **Footer** — “Printed {datetime}”

Empty line items still print with a “No line items.” row.

## Technical structure

| Piece | Role |
|-------|------|
| `resources/js/components/request-quotation-detail-modal.jsx` | Add Print to File button; read brand from `usePage().props.settings`; call print helper |
| `resources/js/lib/print-request-quotation.js` | Build print HTML, open window, `print()`, `afterprint` close; escape user text |
| Print HTML | Self-contained markup + inline CSS (popup cannot rely on app Tailwind) |
| Money / labels | Reuse `formatMoney` and `formatProductLabel` when building rows |

### Data

Uses the `quotation` object already passed into the detail modal (reference, status/status_label, created_at, deleted_at, supplier_name, notes, items, grand_total). No extra fetch.

### Security / safety

- Escape all dynamic strings when writing HTML into the print window (XSS-safe).
- Do not invent fields; omit optional sections when empty.

## Out of scope

- Server-generated PDF
- New print routes or controllers
- Print for purchased orders, AP, inventory, or other modules
- Logos, letterhead art, or multi-page headers/footers beyond the printed datetime line

## Acceptance criteria

- [ ] Print to File appears in the RFQ detail modal footer
- [ ] Clicking it opens the browser print dialog with a clean ops sheet (brand, title, reference, meta, supplier, notes, lines, grand total, printed footer)
- [ ] Soft-deleted quotations remain printable
- [ ] Popup-blocked case shows a clear error
- [ ] No new backend routes or PDF libraries

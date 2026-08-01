# Request Quotation Print to File Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Print to File button on the RFQ detail modal that opens the browser print dialog with a clean ops sheet (brand header + quotation details).

**Architecture:** A pure JS helper builds escaped, self-contained print HTML and opens a blank window to call `window.print()`. The detail modal reads `settings.brand_name` and invokes the helper. No backend routes or PDF libraries.

**Tech Stack:** React 19 JSX, Inertia `usePage`, Sonner toast, Node built-in test runner (`node:test`) for the pure HTML builder

## Global Constraints

- Browser print dialog via `window.print()` (Save as PDF is the user’s choice in the dialog)
- Clean ops sheet with brand header: `settings.brand_name`, fallback **JM Pundasyon**
- Print window + dedicated HTML; no new backend routes
- Print always available when the detail modal is open (including soft-deleted)
- RFQ detail modal only; escape all dynamic strings in print HTML
- No success toast on print; popup-blocked shows an error toast
- Reuse `formatMoney` and `formatProductLabel`

## File map

| File | Responsibility |
|------|----------------|
| `resources/js/lib/print-request-quotation.js` | `escapeHtml`, `buildRequestQuotationPrintHtml`, `printRequestQuotation` |
| `resources/js/lib/print-request-quotation.test.mjs` | Node tests for escape + HTML builder |
| `resources/js/components/request-quotation-detail-modal.jsx` | Print to File button + brand + call helper |

---

### Task 1: Print HTML builder (tested)

**Files:**
- Create: `resources/js/lib/print-request-quotation.js`
- Create: `resources/js/lib/print-request-quotation.test.mjs`
- Test: `resources/js/lib/print-request-quotation.test.mjs`

**Interfaces:**
- Consumes: `formatMoney` from `./format-money.js`, `formatProductLabel` from `./format-product-label.js`
- Produces:
  - `escapeHtml(value: unknown): string`
  - `buildRequestQuotationPrintHtml(quotation: object, options?: { brandName?: string, printedAt?: Date }): string`
  - `printRequestQuotation(quotation: object, options?: { brandName?: string }): { ok: true } | { ok: false, reason: 'popup_blocked' }` (implemented in Task 2; stub or omit until Task 2)

- [ ] **Step 1: Write the failing Node tests**

Create `resources/js/lib/print-request-quotation.test.mjs`:

```js
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    escapeHtml,
    buildRequestQuotationPrintHtml,
} from './print-request-quotation.js';

describe('escapeHtml', () => {
    it('escapes angle brackets and ampersands', () => {
        assert.equal(escapeHtml('<b>&</b>'), '&lt;b&gt;&amp;&lt;/b&gt;');
    });

    it('returns empty string for nullish', () => {
        assert.equal(escapeHtml(null), '');
        assert.equal(escapeHtml(undefined), '');
    });
});

describe('buildRequestQuotationPrintHtml', () => {
    const quotation = {
        reference: 'abc-123',
        status_label: 'Pending',
        created_at: '2026-08-01T08:00:00.000Z',
        deleted_at: null,
        supplier_name: 'Acme <Holdings>',
        notes: 'Rush order & fragile',
        grand_total: '250.50',
        items: [
            {
                id: 1,
                product_name: 'Bolt',
                product_unit: 'box',
                buying_price: '10.00',
                quantity: 5,
                subtotal: '50.00',
            },
        ],
    };

    it('includes brand, title, reference, supplier, notes, lines, and footer', () => {
        const html = buildRequestQuotationPrintHtml(quotation, {
            brandName: 'JM Pundasyon',
            printedAt: new Date('2026-08-01T10:00:00.000Z'),
        });

        assert.match(html, /JM Pundasyon/);
        assert.match(html, /Request Quotation/);
        assert.match(html, /abc-123/);
        assert.match(html, /Acme &lt;Holdings&gt;/);
        assert.match(html, /Rush order &amp; fragile/);
        assert.match(html, /Bolt \(box\)/);
        assert.match(html, /Grand total/i);
        assert.match(html, /Printed /);
    });

    it('shows Deleted when soft-deleted and omits notes when empty', () => {
        const html = buildRequestQuotationPrintHtml(
            {
                ...quotation,
                deleted_at: '2026-08-01T09:00:00.000Z',
                notes: null,
                items: [],
            },
            { brandName: 'JM Pundasyon' },
        );

        assert.match(html, /Deleted/);
        assert.doesNotMatch(html, />Notes</);
        assert.match(html, /No line items/);
    });

    it('falls back to JM Pundasyon when brandName is blank', () => {
        const html = buildRequestQuotationPrintHtml(quotation, {
            brandName: '  ',
        });
        assert.match(html, /JM Pundasyon/);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test resources/js/lib/print-request-quotation.test.mjs`

Expected: FAIL (module not found / exports missing)

- [ ] **Step 3: Implement escapeHtml + buildRequestQuotationPrintHtml**

Create `resources/js/lib/print-request-quotation.js`:

```js
import { formatMoney } from './format-money.js';
import { formatProductLabel } from './format-product-label.js';

const DEFAULT_BRAND = 'JM Pundasyon';

export function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatDate(value) {
    if (!value) {
        return '—';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(value));
    } catch {
        return String(value);
    }
}

/**
 * Build a self-contained HTML document for printing an RFQ ops sheet.
 *
 * @param {object} quotation
 * @param {{ brandName?: string, printedAt?: Date }} [options]
 * @returns {string}
 */
export function buildRequestQuotationPrintHtml(quotation, options = {}) {
    const brand =
        typeof options.brandName === 'string' && options.brandName.trim()
            ? options.brandName.trim()
            : DEFAULT_BRAND;
    const printedAt = options.printedAt instanceof Date ? options.printedAt : new Date();
    const items = quotation?.items ?? [];
    const isDeleted = Boolean(quotation?.deleted_at);

    const rows =
        items.length === 0
            ? `<tr><td colspan="4" class="empty">No line items.</td></tr>`
            : items
                  .map((item) => {
                      const label = formatProductLabel(
                          item.product_name,
                          item.product_unit,
                      );
                      return `<tr>
                        <td>${escapeHtml(label)}</td>
                        <td>${escapeHtml(formatMoney(item.buying_price))}</td>
                        <td>${escapeHtml(item.quantity)}</td>
                        <td class="num">${escapeHtml(formatMoney(item.subtotal))}</td>
                      </tr>`;
                  })
                  .join('');

    const notesBlock = quotation?.notes
        ? `<section class="block">
            <h2>Notes</h2>
            <p class="notes">${escapeHtml(quotation.notes)}</p>
          </section>`
        : '';

    const deletedNote = isDeleted
        ? `<span class="deleted"> · Deleted</span>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(brand)} — Request Quotation</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 24px;
    color: #111;
    font: 12pt/1.45 system-ui, -apple-system, Segoe UI, sans-serif;
  }
  h1.brand {
    margin: 0 0 4px;
    font-size: 14pt;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  h1.title {
    margin: 12px 0 4px;
    font-size: 16pt;
    font-weight: 700;
  }
  .ref {
    margin: 0 0 16px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10pt;
    color: #333;
  }
  .meta {
    margin: 0 0 16px;
    color: #333;
    font-size: 10pt;
  }
  .deleted { color: #666; }
  .block { margin: 0 0 16px; }
  .block h2 {
    margin: 0 0 4px;
    font-size: 9pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #555;
  }
  .supplier {
    margin: 0;
    font-size: 13pt;
    font-weight: 600;
  }
  .notes {
    margin: 0;
    white-space: pre-wrap;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 0;
  }
  th, td {
    border-bottom: 1px solid #ccc;
    padding: 8px 6px;
    text-align: left;
    vertical-align: top;
  }
  th {
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #555;
    border-bottom: 1px solid #999;
  }
  td.num, th.num { text-align: right; }
  td.empty { text-align: center; color: #666; padding: 16px 6px; }
  tfoot td {
    border-bottom: none;
    border-top: 1px solid #999;
    font-weight: 700;
    font-size: 12pt;
    padding-top: 12px;
  }
  footer {
    margin-top: 24px;
    font-size: 9pt;
    color: #666;
  }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <h1 class="brand">${escapeHtml(brand)}</h1>
  <h1 class="title">Request Quotation</h1>
  <p class="ref">Reference No.: ${escapeHtml(quotation?.reference)}</p>
  <p class="meta">
    Created ${escapeHtml(formatDate(quotation?.created_at))}
    · ${escapeHtml(quotation?.status_label || quotation?.status || '—')}
    ${deletedNote}
  </p>
  <section class="block">
    <h2>Supplier</h2>
    <p class="supplier">${escapeHtml(quotation?.supplier_name || '—')}</p>
  </section>
  ${notesBlock}
  <section class="block">
    <h2>Line items</h2>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Purchase price</th>
          <th>Qty</th>
          <th class="num">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3">Grand total</td>
          <td class="num">${escapeHtml(formatMoney(quotation?.grand_total))}</td>
        </tr>
      </tfoot>
    </table>
  </section>
  <footer>Printed ${escapeHtml(formatDate(printedAt.toISOString()))}</footer>
</body>
</html>`;
}
```

Do **not** add `printRequestQuotation` yet (Task 2).

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test resources/js/lib/print-request-quotation.test.mjs`

Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add resources/js/lib/print-request-quotation.js resources/js/lib/print-request-quotation.test.mjs
git commit -m "$(cat <<'EOF'
feat: add RFQ print HTML builder

EOF
)"
```

---

### Task 2: Print window opener + modal button

**Files:**
- Modify: `resources/js/lib/print-request-quotation.js`
- Modify: `resources/js/components/request-quotation-detail-modal.jsx`
- Test: manual (browser) + re-run Node tests from Task 1

**Interfaces:**
- Consumes: `buildRequestQuotationPrintHtml` from Task 1; Inertia `usePage().props.settings.brand_name`; Sonner `toast`
- Produces: `printRequestQuotation(quotation, options?)` returns `{ ok: true }` or `{ ok: false, reason: 'popup_blocked' }`

- [ ] **Step 1: Add printRequestQuotation to the helper**

Append to `resources/js/lib/print-request-quotation.js`:

```js
/**
 * Open a print window with the RFQ ops sheet and trigger the browser print dialog.
 *
 * @param {object} quotation
 * @param {{ brandName?: string }} [options]
 * @returns {{ ok: true } | { ok: false, reason: 'popup_blocked' }}
 */
export function printRequestQuotation(quotation, options = {}) {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');

    if (!printWindow) {
        return { ok: false, reason: 'popup_blocked' };
    }

    const html = buildRequestQuotationPrintHtml(quotation, {
        brandName: options.brandName,
    });

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    const triggerPrint = () => {
        printWindow.focus();
        printWindow.print();
    };

    printWindow.addEventListener('afterprint', () => {
        printWindow.close();
    });

    // Images/fonts are inline/system; short defer lets the document settle.
    if (printWindow.document.readyState === 'complete') {
        setTimeout(triggerPrint, 50);
    } else {
        printWindow.addEventListener('load', () => setTimeout(triggerPrint, 50));
    }

    return { ok: true };
}
```

- [ ] **Step 2: Wire Print to File in the detail modal**

In `resources/js/components/request-quotation-detail-modal.jsx`:

1. Add imports:

```js
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { printRequestQuotation } from '@/lib/print-request-quotation';
```

2. Inside the component (before the early return is fine for hooks — keep hooks above `if (!open || !quotation)`):

```js
const { settings } = usePage().props;
const brandName = settings?.brand_name || 'JM Pundasyon';

function handlePrint() {
    if (!quotation) {
        return;
    }

    const result = printRequestQuotation(quotation, { brandName });

    if (!result.ok && result.reason === 'popup_blocked') {
        toast.error('Allow popups to print this quotation.');
    }
}
```

**Hook placement note:** `usePage()` must be called unconditionally at the top of the component (before any early `return null`), same as existing `useEffect`.

3. In the footer action row, add the Print to File button **before** Close (always visible when the modal is open):

```jsx
<button
    type="button"
    onClick={handlePrint}
    className="min-h-11 rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink"
>
    Print to File
</button>
```

Order: Edit (if any) → Delete (if any) → **Print to File** → Close.

- [ ] **Step 3: Re-run Node tests + lint**

Run:

```bash
node --test resources/js/lib/print-request-quotation.test.mjs
npm run lint -- --max-warnings=0 resources/js/lib/print-request-quotation.js resources/js/components/request-quotation-detail-modal.jsx
```

Expected: tests PASS; lint clean (or only pre-existing unrelated warnings — fix any new issues in these files).

- [ ] **Step 4: Manual browser check**

With `composer run dev` (or existing Vite + PHP servers):

1. Open `/request-quotations`, open any RFQ detail modal
2. Click **Print to File** → print dialog shows clean sheet with brand, reference, supplier, lines, grand total, Printed footer
3. Soft-deleted RFQ (trash filter) still shows Print to File and prints with Deleted note
4. Optional: temporarily block popups and confirm error toast

- [ ] **Step 5: Commit**

```bash
git add resources/js/lib/print-request-quotation.js resources/js/components/request-quotation-detail-modal.jsx
git commit -m "$(cat <<'EOF'
feat: print RFQ detail ops sheet from modal

EOF
)"
```

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Browser print dialog / Save as PDF | Task 2 (`window.print`) |
| Clean ops sheet layout | Task 1 HTML + CSS |
| Brand header (`settings.brand_name` / JM Pundasyon) | Task 1 fallback + Task 2 `usePage` |
| Print window + dedicated HTML | Tasks 1–2 |
| Always available incl. soft-deleted | Task 2 button always rendered |
| Escape dynamic strings | Task 1 `escapeHtml` + tests |
| Popup blocked error | Task 2 toast |
| No new backend routes | File map (JS only) |
| Reuse formatMoney / formatProductLabel | Task 1 imports |

No placeholders remaining. Interfaces consistent: `buildRequestQuotationPrintHtml` / `printRequestQuotation` / `escapeHtml`.

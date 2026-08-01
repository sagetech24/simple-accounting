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
    const printedAt =
        options.printedAt instanceof Date ? options.printedAt : new Date();
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

/**
 * Open a print window with the RFQ ops sheet and trigger the browser print dialog.
 *
 * @param {object} quotation
 * @param {{ brandName?: string }} [options]
 * @returns {{ ok: true } | { ok: false, reason: 'popup_blocked' }}
 */
export function printRequestQuotation(quotation, options = {}) {
    const printWindow = window.open(
        '',
        '_blank',
        'noopener,noreferrer,width=900,height=700',
    );

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

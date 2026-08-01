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

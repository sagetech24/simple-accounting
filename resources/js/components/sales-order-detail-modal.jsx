import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatMoney } from '@/lib/format-money';
import { formatProductLabel } from '@/lib/format-product-label';

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
        return value;
    }
}

export default function SalesOrderDetailModal({
    open,
    order,
    onClose,
    onVoid,
    onRestore,
}) {
    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onClose]);

    if (!open || !order) {
        return null;
    }

    const isDeleted = Boolean(order.deleted_at);
    const items = order.items ?? [];

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-10 sm:px-6">
            <button
                type="button"
                aria-label="Close dialog"
                className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="sales-order-detail-title"
                className="relative z-10 w-full max-w-3xl origin-top rounded-md border border-line bg-white p-6 opacity-0 motion-safe:animate-[supplier-modal-slide-down_0.35s_ease-out_forwards] motion-reduce:opacity-100"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2
                            id="sales-order-detail-title"
                            className="text-xl font-semibold tracking-tight text-ink"
                        >
                            Sales Order
                        </h2>
                        <p className="mt-1 font-mono text-xs break-all text-ink-soft">
                            Reference #: {order.reference}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-11 shrink-0 cursor-pointer rounded-md border border-line px-4 text-sm text-ink-soft transition hover:border-ink/30 hover:text-ink"
                    >
                        Close
                    </button>
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-xs font-medium tracking-wide text-muted uppercase">
                            Customer
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-ink">
                            {order.customer_name || 'Walk-in'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium tracking-wide text-muted uppercase">
                            Created
                        </dt>
                        <dd className="mt-1 text-sm text-ink">
                            {formatDate(order.created_at)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium tracking-wide text-muted uppercase">
                            Status
                        </dt>
                        <dd className="mt-1 text-sm text-ink">
                            {isDeleted ? 'Voided' : 'Completed'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium tracking-wide text-muted uppercase">
                            Grand total
                        </dt>
                        <dd className="mt-1 text-sm font-semibold tabular-nums text-ink">
                            {formatMoney(order.grand_total)}
                        </dd>
                    </div>
                </dl>

                {order.notes ? (
                    <div className="mt-4">
                        <p className="text-xs font-medium tracking-wide text-muted uppercase">
                            Notes
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">
                            {order.notes}
                        </p>
                    </div>
                ) : null}

                <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                        <thead className="bg-mist">
                            <tr className="border-b border-line text-xs tracking-wide uppercase">
                                <th className="px-3 py-2 font-medium text-muted">
                                    Product
                                </th>
                                <th className="px-3 py-2 font-medium text-muted">
                                    Price
                                </th>
                                <th className="px-3 py-2 font-medium text-muted">
                                    Qty
                                </th>
                                <th className="px-3 py-2 font-medium text-muted">
                                    Subtotal
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr
                                    key={item.id ?? item.product_id}
                                    className="border-b border-line"
                                >
                                    <td className="px-3 py-2.5 font-medium text-ink">
                                        {formatProductLabel(
                                            item.product_name,
                                            item.product_unit,
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5 tabular-nums text-ink-soft">
                                        {formatMoney(item.selling_price)}
                                    </td>
                                    <td className="px-3 py-2.5 tabular-nums text-ink-soft">
                                        {item.quantity}
                                    </td>
                                    <td className="px-3 py-2.5 font-medium tabular-nums text-ink">
                                        {formatMoney(item.subtotal)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
                    {order.can_void && onVoid ? (
                        <button
                            type="button"
                            onClick={() => onVoid(order)}
                            className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-red-600/40 bg-white px-5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                        >
                            Void sale
                        </button>
                    ) : null}
                    {order.can_restore && onRestore ? (
                        <button
                            type="button"
                            onClick={() => onRestore(order)}
                            className="inline-flex min-h-11 cursor-pointer items-center rounded-md bg-teal-700 px-5 text-sm font-medium text-paper transition hover:bg-teal-800"
                        >
                            Restore sale
                        </button>
                    ) : null}
                </div>
            </div>
        </div>,
        document.body,
    );
}

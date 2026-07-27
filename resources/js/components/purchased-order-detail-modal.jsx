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

function statusBadgeClass(status) {
    return (
        {
            ordered: 'border-amber-600/30 bg-amber-400/10 text-amber-800',
            received: 'border-green-600/30 bg-green-400/10 text-green-700',
            draft: 'border-slate-500/30 bg-slate-400/10 text-slate-700',
        }[status] ?? 'border-line bg-mist text-ink-soft'
    );
}

export default function PurchasedOrderDetailModal({
    open,
    order,
    onClose,
    onEdit,
    onDelete,
    onViewSourceQuotation,
    onAddPrepayment,
    onPostToAccountsPayable,
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
    const canEdit = Boolean(order.can_edit);
    const canDelete = !isDeleted;
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
                aria-labelledby="purchased-order-detail-title"
                className="relative z-10 w-full max-w-3xl origin-top rounded-lg border border-line bg-white p-6 opacity-0 shadow-xl motion-safe:animate-[supplier-modal-slide-down_0.35s_ease-out_forwards] motion-reduce:opacity-100"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2
                            id="purchased-order-detail-title"
                            className="text-xl font-semibold tracking-tight text-ink"
                        >
                            Purchase order
                        </h2>
                        <p className="mt-1 font-mono text-sm break-all text-ink-soft">
                            {order.reference}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-mist hover:text-ink"
                        aria-label="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="size-5"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18 18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Supplier
                        </p>
                        <p className="mt-1 text-sm font-medium text-ink">
                            {order.supplier_name || '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Status
                        </p>
                        <p className="mt-1">
                            <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusBadgeClass(order.status)}`}
                            >
                                {order.status_label}
                            </span>
                            {isDeleted && (
                                <span className="ml-2 text-xs text-warn">
                                    Deleted
                                </span>
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Source quotation
                        </p>
                        <p className="mt-1 font-mono text-sm break-all text-ink-soft">
                            {order.request_quotation_id &&
                            order.request_quotation_reference ? (
                                onViewSourceQuotation ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onViewSourceQuotation(order)
                                        }
                                        className="cursor-pointer text-left text-teal-800 underline-offset-2 transition hover:underline focus:underline focus:outline-none"
                                    >
                                        {order.request_quotation_reference}
                                    </button>
                                ) : (
                                    order.request_quotation_reference
                                )
                            ) : (
                                '—'
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Created
                        </p>
                        <p className="mt-1 text-sm text-ink-soft">
                            {formatDate(order.created_at)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Grand total
                        </p>
                        <p className="mt-1 text-lg font-semibold text-ink">
                            {formatMoney(order.grand_total)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Amount paid
                        </p>
                        <p className="mt-1 text-sm font-medium text-ink">
                            {formatMoney(order.amount_paid ?? 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Balance due
                        </p>
                        <p className="mt-1 text-sm font-medium text-ink">
                            {formatMoney(order.balance_due ?? order.grand_total)}
                        </p>
                    </div>
                </div>

                {order.notes && (
                    <div className="mt-4">
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Notes
                        </p>
                        <p className="mt-1 text-sm whitespace-pre-wrap text-ink-soft">
                            {order.notes}
                        </p>
                    </div>
                )}

                {order.meta &&
                    (order.meta.invoice_number ||
                        order.meta.delivery_number ||
                        order.meta.delivery_person ||
                        order.meta.delivery_date ||
                        order.meta.received_by) && (
                        <div className="mt-6">
                            <p className="mb-2 text-xs tracking-wide text-muted uppercase">
                                Receipt details
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {order.meta.invoice_number && (
                                    <div>
                                        <p className="text-xs tracking-wide text-muted uppercase">
                                            Invoice number
                                        </p>
                                        <p className="mt-1 text-sm text-ink-soft">
                                            {order.meta.invoice_number}
                                        </p>
                                    </div>
                                )}
                                {order.meta.delivery_number && (
                                    <div>
                                        <p className="text-xs tracking-wide text-muted uppercase">
                                            Delivery number
                                        </p>
                                        <p className="mt-1 text-sm text-ink-soft">
                                            {order.meta.delivery_number}
                                        </p>
                                    </div>
                                )}
                                {order.meta.delivery_person && (
                                    <div>
                                        <p className="text-xs tracking-wide text-muted uppercase">
                                            Delivery person
                                        </p>
                                        <p className="mt-1 text-sm text-ink-soft">
                                            {order.meta.delivery_person}
                                        </p>
                                    </div>
                                )}
                                {order.meta.delivery_date && (
                                    <div>
                                        <p className="text-xs tracking-wide text-muted uppercase">
                                            Delivery date
                                        </p>
                                        <p className="mt-1 text-sm text-ink-soft">
                                            {order.meta.delivery_date}
                                        </p>
                                    </div>
                                )}
                                {order.meta.received_by && (
                                    <div>
                                        <p className="text-xs tracking-wide text-muted uppercase">
                                            Received by
                                        </p>
                                        <p className="mt-1 text-sm text-ink-soft">
                                            {order.meta.received_by}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                <div className="mt-6">
                    <p className="mb-2 text-xs tracking-wide text-muted uppercase">
                        Line items ({items.length})
                    </p>
                    <div className="rounded-md border border-line">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="bg-teal-500/10">
                                <tr className="border-b border-line text-xs tracking-wide uppercase">
                                    <th className="px-3 py-2.5 font-medium text-muted">
                                        Product
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-muted">
                                        Purchase price
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-muted">
                                        Qty
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-muted">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-3 py-6 text-center text-muted"
                                        >
                                            No line items.
                                        </td>
                                    </tr>
                                )}
                                {items.map((item) => (
                                    <tr
                                        key={item.id ?? item.product_id}
                                        className="border-b border-line/80 last:border-b-0"
                                    >
                                        <td className="px-3 py-3 font-medium text-ink">
                                            {formatProductLabel(
                                                item.product_name,
                                                item.product_unit,
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-ink-soft">
                                            {formatMoney(item.buying_price)} {item.product_unit ? ` / ${item.product_unit}` : ''}
                                        </td>
                                        <td className="px-3 py-3 text-ink-soft">
                                            {item.quantity}
                                        </td>
                                        <td className="px-3 py-3 font-medium text-ink">
                                            {formatMoney(item.subtotal)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {(order.payments ?? []).length > 0 && (
                    <div className="mt-6">
                        <p className="mb-2 text-xs tracking-wide text-muted uppercase">
                            Pre-payments ({order.payments.length})
                        </p>
                        <div className="rounded-md border border-line">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead className="bg-teal-500/10">
                                    <tr className="border-b border-line text-xs tracking-wide uppercase">
                                        <th className="px-3 py-2.5 font-medium text-muted">
                                            Method
                                        </th>
                                        <th className="px-3 py-2.5 font-medium text-muted">
                                            Details
                                        </th>
                                        <th className="px-3 py-2.5 font-medium text-muted">
                                            Amount
                                        </th>
                                        <th className="px-3 py-2.5 font-medium text-muted">
                                            Recorded
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.payments.map((payment) => {
                                        const details = [];

                                        if (payment.platform) {
                                            details.push(payment.platform);
                                        }
                                        if (payment.bank_name) {
                                            details.push(payment.bank_name);
                                        }
                                        if (payment.reference_number) {
                                            details.push(
                                                `Ref ${payment.reference_number}`,
                                            );
                                        }
                                        if (payment.bank_check) {
                                            details.push(
                                                payment.bank_check
                                                    .bank_account_name ||
                                                    'Bank',
                                            );
                                            details.push(
                                                `#${payment.bank_check.check_number}`,
                                            );
                                            if (payment.bank_check.due_date) {
                                                details.push(
                                                    `Due ${payment.bank_check.due_date}`,
                                                );
                                            }
                                        }

                                        const detailLines = [
                                            ...details,
                                            payment.notes,
                                        ].filter(Boolean);
                                        const isPdc =
                                            payment.method ===
                                            'post_dated_check';

                                        return (
                                            <tr
                                                key={payment.id}
                                                className="border-b border-line/80 last:border-b-0"
                                            >
                                                <td className="px-3 py-3 font-medium text-ink items-start flex">
                                                    {isPdc ? 'PDC' : payment.method_label}
                                                </td>
                                                <td className="px-3 py-3 text-ink-soft">
                                                    {detailLines.length ===
                                                    0 ? (
                                                        '—'
                                                    ) : isPdc ? (
                                                            <div className="space-y-0.5">
                                                                <p className="whitespace-nowrap text-xs">
                                                                    Banks: {detailLines[0]}
                                                                </p>
                                                                <p className="whitespace-nowrap text-xs">
                                                                    Check #: {detailLines[1]}
                                                                </p>
                                                                <p className="whitespace-nowrap text-xs">
                                                                    Due Date: {formatDate(detailLines[2])}
                                                                </p>
                                                        </div>
                                                    ) : (
                                                        <span className="whitespace-nowrap text-xs">
                                                            {detailLines.join(
                                                                ' · ',
                                                            )}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 font-medium text-ink flex items-start">
                                                    {formatMoney(payment.amount)}
                                                </td>
                                                <td className="px-3 py-3 text-ink-soft text-xs">
                                                    <p>
                                                        {formatDate(
                                                            payment.paid_at,
                                                        )}
                                                    </p>
                                                    {payment.recorded_by && (
                                                        <p className="mt-1 text-xs text-muted">
                                                            Created by: {payment.recorded_by}
                                                        </p>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                    {canEdit && onEdit && (
                        <button
                            type="button"
                            onClick={() => onEdit(order)}
                            className="min-h-11 rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition hover:bg-teal-800"
                        >
                            Edit
                        </button>
                    )}
                    {order.can_add_prepayment && onAddPrepayment && (
                        <button
                            type="button"
                            onClick={() => onAddPrepayment(order)}
                            className="min-h-11 rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition hover:bg-teal-800"
                        >
                            Add Pre-payment
                        </button>
                    )}
                    {order.can_post_to_ap && onPostToAccountsPayable && (
                        <button
                            type="button"
                            onClick={() => onPostToAccountsPayable(order)}
                            className="min-h-11 rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition hover:bg-teal-800"
                        >
                            Post to Accounts Payable
                        </button>
                    )}
                    {canDelete && onDelete && (
                        <button
                            type="button"
                            onClick={() => onDelete(order)}
                            className="min-h-11 rounded-md border border-line bg-white px-5 text-sm font-medium text-warn transition hover:border-warn/40"
                        >
                            Delete
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-11 rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

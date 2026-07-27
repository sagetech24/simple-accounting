import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { markReceivedWithAdjustment } from '@/actions/App/Http/Controllers/PurchasedOrderController';
import { formatDecimal, formatMoney } from '@/lib/format-money';
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

function lineSubtotal(buyingPrice, quantity) {
    const price = Number(buyingPrice);
    const qty = Number(quantity);

    if (Number.isNaN(price) || Number.isNaN(qty)) {
        return 0;
    }

    return price * qty;
}

function initialItems(order) {
    return (order?.items ?? []).map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_unit: item.product_unit ?? null,
        buying_price: formatDecimal(item.buying_price),
        quantity: item.quantity,
    }));
}

export default function PurchasedOrderReceiveAdjustmentModal({
    open,
    order,
    onClose,
}) {
    const { auth } = usePage().props;
    const receivedBy = auth?.user?.name ?? '';

    const form = useForm({
        items: initialItems(order),
        invoice_number: order?.meta?.invoice_number ?? '',
        delivery_number: order?.meta?.delivery_number ?? '',
        delivery_person: order?.meta?.delivery_person ?? '',
        delivery_date: order?.meta?.delivery_date ?? '',
        received_by: receivedBy,
    });

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function handleKeyDown(event) {
            if (event.key === 'Escape' && !form.processing) {
                onClose();
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onClose, form.processing]);

    const grandTotal = useMemo(
        () =>
            form.data.items.reduce(
                (sum, item) =>
                    sum + lineSubtotal(item.buying_price, item.quantity),
                0,
            ),
        [form.data.items],
    );

    if (!open || !order) {
        return null;
    }

    function updateItem(index, field, value) {
        form.setData(
            'items',
            form.data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item,
            ),
        );
    }

    function removeItem(index) {
        form.setData(
            'items',
            form.data.items.filter((_, itemIndex) => itemIndex !== index),
        );
        form.clearErrors('items');
    }

    function submit(event) {
        event.preventDefault();

        form.post(markReceivedWithAdjustment.url(order.id), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-10 sm:px-6">
            <button
                type="button"
                aria-label="Close dialog"
                className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => {
                    if (!form.processing) {
                        onClose();
                    }
                }}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="purchased-order-receive-adjustment-title"
                className="relative z-10 w-full max-w-3xl origin-top rounded-lg border border-line bg-white p-6 opacity-0 shadow-xl motion-safe:animate-[supplier-modal-slide-down_0.35s_ease-out_forwards] motion-reduce:opacity-100"
            >
                <form onSubmit={submit}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h2
                                id="purchased-order-receive-adjustment-title"
                                className="text-xl font-semibold tracking-tight text-ink"
                            >
                                Receive with adjustment
                            </h2>
                            <p className="mt-1 font-mono text-sm break-all text-ink-soft">
                                {order.reference}
                            </p>
                            <p className="mt-2 text-sm text-muted">
                                Update quantity or purchase price, remove
                                unavailable items, and optionally record
                                delivery details.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={form.processing}
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-mist hover:text-ink disabled:opacity-50"
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
                                <span className="inline-flex rounded-full border border-amber-600/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-800">
                                    {order.status_label}
                                </span>
                            </p>
                        </div>
                        <div>
                            <p className="text-xs tracking-wide text-muted uppercase">
                                Source quotation
                            </p>
                            <p className="mt-1 font-mono text-sm break-all text-ink-soft">
                                {order.request_quotation_reference || '—'}
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
                                Adjusted grand total
                            </p>
                            <p className="mt-1 text-lg font-semibold text-ink">
                                {formatMoney(grandTotal)}
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

                    <div className="mt-6">
                        <p className="mb-2 text-xs tracking-wide text-muted uppercase">
                            Receipt details (optional)
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="receive-invoice-number"
                                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                                >
                                    Invoice number
                                </label>
                                <input
                                    id="receive-invoice-number"
                                    type="text"
                                    value={form.data.invoice_number}
                                    onChange={(event) =>
                                        form.setData(
                                            'invoice_number',
                                            event.target.value,
                                        )
                                    }
                                    className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                />
                                {form.errors.invoice_number && (
                                    <p
                                        className="mt-1 text-xs text-warn"
                                        role="alert"
                                    >
                                        {form.errors.invoice_number}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="receive-delivery-number"
                                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                                >
                                    Delivery number
                                </label>
                                <input
                                    id="receive-delivery-number"
                                    type="text"
                                    value={form.data.delivery_number}
                                    onChange={(event) =>
                                        form.setData(
                                            'delivery_number',
                                            event.target.value,
                                        )
                                    }
                                    className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                />
                                {form.errors.delivery_number && (
                                    <p
                                        className="mt-1 text-xs text-warn"
                                        role="alert"
                                    >
                                        {form.errors.delivery_number}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="receive-delivery-person"
                                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                                >
                                    Delivery person
                                </label>
                                <input
                                    id="receive-delivery-person"
                                    type="text"
                                    value={form.data.delivery_person}
                                    onChange={(event) =>
                                        form.setData(
                                            'delivery_person',
                                            event.target.value,
                                        )
                                    }
                                    className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                />
                                {form.errors.delivery_person && (
                                    <p
                                        className="mt-1 text-xs text-warn"
                                        role="alert"
                                    >
                                        {form.errors.delivery_person}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="receive-delivery-date"
                                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                                >
                                    Delivery date
                                </label>
                                <input
                                    id="receive-delivery-date"
                                    type="date"
                                    value={form.data.delivery_date}
                                    onChange={(event) =>
                                        form.setData(
                                            'delivery_date',
                                            event.target.value,
                                        )
                                    }
                                    className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                />
                                {form.errors.delivery_date && (
                                    <p
                                        className="mt-1 text-xs text-warn"
                                        role="alert"
                                    >
                                        {form.errors.delivery_date}
                                    </p>
                                )}
                            </div>
                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="receive-received-by"
                                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                                >
                                    Received by
                                </label>
                                <input
                                    id="receive-received-by"
                                    type="text"
                                    value={form.data.received_by}
                                    readOnly
                                    className="min-h-11 w-full border border-line bg-mist px-3 text-ink-soft"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <p className="mb-2 text-xs tracking-wide text-muted uppercase">
                            Line items ({form.data.items.length})
                        </p>
                        {form.errors.items && (
                            <p className="mb-2 text-sm text-warn" role="alert">
                                {form.errors.items}
                            </p>
                        )}
                        <div className="overflow-x-auto rounded-md border border-line">
                            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
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
                                        <th className="w-14 px-3 py-2.5 text-right">
                                            <span className="sr-only">
                                                Remove
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.data.items.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-3 py-6 text-center text-muted"
                                            >
                                                No line items. Keep at least one
                                                product to receive.
                                            </td>
                                        </tr>
                                    )}
                                    {form.data.items.map((item, index) => (
                                        <tr
                                            key={item.product_id}
                                            className="border-b border-line/80 last:border-b-0"
                                        >
                                            <td className="px-3 py-3 font-medium text-ink">
                                                {formatProductLabel(
                                                    item.product_name,
                                                    item.product_unit,
                                                )}
                                                {form.errors[
                                                    `items.${index}.product_id`
                                                ] && (
                                                    <p
                                                        className="mt-1 text-xs font-normal text-warn"
                                                        role="alert"
                                                    >
                                                        {
                                                            form.errors[
                                                                `items.${index}.product_id`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.buying_price}
                                                    onChange={(event) =>
                                                        updateItem(
                                                            index,
                                                            'buying_price',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="min-h-11 w-full min-w-28 border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                                    aria-label={`Purchase price for ${formatProductLabel(item.product_name, item.product_unit)}`}
                                                />
                                                {form.errors[
                                                    `items.${index}.buying_price`
                                                ] && (
                                                    <p
                                                        className="mt-1 text-xs text-warn"
                                                        role="alert"
                                                    >
                                                        {
                                                            form.errors[
                                                                `items.${index}.buying_price`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                                {item.product_unit && (
                                                    <span className="mt-1 ml-1 text-sm text-muted">
                                                        /{item.product_unit}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={item.quantity}
                                                    onChange={(event) =>
                                                        updateItem(
                                                            index,
                                                            'quantity',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="min-h-11 w-full min-w-20 border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                                    aria-label={`Quantity for ${formatProductLabel(item.product_name, item.product_unit)}`}
                                                />
                                                {form.errors[
                                                    `items.${index}.quantity`
                                                ] && (
                                                    <p
                                                        className="mt-1 text-xs text-warn"
                                                        role="alert"
                                                    >
                                                        {
                                                            form.errors[
                                                                `items.${index}.quantity`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 font-medium text-ink">
                                                {formatMoney(
                                                    lineSubtotal(
                                                        item.buying_price,
                                                        item.quantity,
                                                    ),
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <button
                                                    type="button"
                                                    disabled={form.processing}
                                                    onClick={() =>
                                                        removeItem(index)
                                                    }
                                                    className="inline-flex size-11 items-center justify-center rounded-md text-warn transition hover:bg-mist disabled:opacity-50"
                                                    aria-label={`Remove ${formatProductLabel(item.product_name, item.product_unit)}`}
                                                    title="Remove item"
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
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                        <button
                            type="submit"
                            disabled={
                                form.processing || form.data.items.length === 0
                            }
                            className="min-h-11 rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition hover:bg-teal-800 disabled:opacity-50"
                        >
                            {form.processing
                                ? 'Saving…'
                                : 'Confirm Received With Adjustment'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={form.processing}
                            className="min-h-11 rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}

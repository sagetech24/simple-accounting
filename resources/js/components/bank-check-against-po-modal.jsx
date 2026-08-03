import { useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { storePayment } from '@/actions/App/Http/Controllers/PurchasedOrderController';
import { formatMoney } from '@/lib/format-money';

const FIELD_CLASS =
    'min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';

function todayIsoDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export default function BankCheckAgainstPoModal({
    open,
    bankAccount,
    eligibleOrders = [],
    onClose,
}) {
    const { auth } = usePage().props;
    const form = useForm({
        purchased_order_id: '',
        method: 'post_dated_check',
        amount: '',
        bank_account_id: bankAccount?.id ?? '',
        check_number: '',
        due_date: todayIsoDate(),
        notes: '',
        return_bank_account_id: bankAccount?.id ?? '',
    });

    useEffect(() => {
        if (!open || !bankAccount) {
            return undefined;
        }

        form.setData({
            purchased_order_id: eligibleOrders[0]?.id?.toString() ?? '',
            method: 'post_dated_check',
            amount: '',
            bank_account_id: bankAccount.id,
            check_number: '',
            due_date: todayIsoDate(),
            notes: '',
            return_bank_account_id: bankAccount.id,
        });
        form.clearErrors();

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, bankAccount?.id]);

    if (!open || !bankAccount) {
        return null;
    }

    const selectedOrder = eligibleOrders.find(
        (order) => String(order.id) === String(form.data.purchased_order_id),
    );

    function submit(event) {
        event.preventDefault();

        if (!form.data.purchased_order_id) {
            return;
        }

        form.post(storePayment.url(form.data.purchased_order_id), {
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
                onClick={() => !form.processing && onClose()}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="against-po-check-title"
                className="relative z-10 w-full max-w-lg origin-top rounded-md border border-line bg-white p-6 opacity-0 motion-safe:animate-[supplier-modal-slide-down_0.35s_ease-out_forwards] motion-reduce:opacity-100"
            >
                <h2
                    id="against-po-check-title"
                    className="text-xl font-semibold tracking-tight text-ink"
                >
                    Issue check against PO
                </h2>
                <p className="mt-1 text-sm text-muted">
                    Bank locked to {bankAccount.name}. Issued by{' '}
                    {auth?.user?.name ?? 'you'}.
                </p>

                {eligibleOrders.length === 0 ? (
                    <div className="mt-6 space-y-4">
                        <p className="text-sm text-ink-soft">
                            No purchase orders with a remaining balance are
                            available for a check payment.
                        </p>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="min-h-11 cursor-pointer border border-line bg-white px-4 text-sm text-ink-soft transition hover:border-ink/30"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <div>
                            <label
                                htmlFor="against_po_order"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Purchase order
                            </label>
                            <select
                                id="against_po_order"
                                value={form.data.purchased_order_id}
                                onChange={(event) =>
                                    form.setData(
                                        'purchased_order_id',
                                        event.target.value,
                                    )
                                }
                                className={FIELD_CLASS}
                            >
                                {eligibleOrders.map((order) => (
                                    <option key={order.id} value={order.id}>
                                        {order.reference}
                                        {order.supplier_name
                                            ? ` — ${order.supplier_name}`
                                            : ''}{' '}
                                        (due {formatMoney(order.balance_due)})
                                    </option>
                                ))}
                            </select>
                            {selectedOrder && (
                                <p className="mt-1.5 text-xs text-muted">
                                    Balance due:{' '}
                                    {formatMoney(selectedOrder.balance_due)}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="against_po_check_number"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Check number
                            </label>
                            <input
                                id="against_po_check_number"
                                type="text"
                                value={form.data.check_number}
                                onChange={(event) =>
                                    form.setData(
                                        'check_number',
                                        event.target.value,
                                    )
                                }
                                className={FIELD_CLASS}
                            />
                            {form.errors.check_number && (
                                <p className="mt-1.5 text-sm text-warn">
                                    {form.errors.check_number}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="against_po_amount"
                                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                                >
                                    Amount
                                </label>
                                <input
                                    id="against_po_amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.data.amount}
                                    onChange={(event) =>
                                        form.setData(
                                            'amount',
                                            event.target.value,
                                        )
                                    }
                                    className={FIELD_CLASS}
                                />
                                {form.errors.amount && (
                                    <p className="mt-1.5 text-sm text-warn">
                                        {form.errors.amount}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="against_po_due_date"
                                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                                >
                                    Due date
                                </label>
                                <input
                                    id="against_po_due_date"
                                    type="date"
                                    value={form.data.due_date}
                                    onChange={(event) =>
                                        form.setData(
                                            'due_date',
                                            event.target.value,
                                        )
                                    }
                                    className={FIELD_CLASS}
                                />
                                {form.errors.due_date && (
                                    <p className="mt-1.5 text-sm text-warn">
                                        {form.errors.due_date}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="against_po_notes"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Notes
                            </label>
                            <textarea
                                id="against_po_notes"
                                rows={3}
                                value={form.data.notes ?? ''}
                                onChange={(event) =>
                                    form.setData('notes', event.target.value)
                                }
                                className={`${FIELD_CLASS} py-2`}
                            />
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={form.processing}
                                className="min-h-11 cursor-pointer border border-line bg-white px-4 text-sm text-ink-soft transition hover:border-ink/30"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="min-h-11 cursor-pointer rounded-md bg-teal-700 px-4 text-sm font-medium text-paper transition hover:bg-teal-800 disabled:opacity-60"
                            >
                                {form.processing
                                    ? 'Saving…'
                                    : 'Record check payment'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body,
    );
}

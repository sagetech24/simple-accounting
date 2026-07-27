import { useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { storePayment } from '@/actions/App/Http/Controllers/PurchasedOrderController';
import { formatMoney } from '@/lib/format-money';

const FIELD_CLASS =
    'min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';

function todayIsoDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function emptyFields() {
    return {
        platform: '',
        reference_number: '',
        bank_name: '',
        bank_account_id: '',
        check_number: '',
        due_date: todayIsoDate(),
    };
}

export default function PurchasedOrderPrepaymentModal({
    open,
    order,
    paymentMethods = [],
    bankAccounts = [],
    onClose,
    submitUrl,
    title = 'Add pre-payment',
    submitLabel = 'Record pre-payment',
}) {
    const { auth } = usePage().props;
    const recordedBy = auth?.user?.name ?? '';

    const form = useForm({
        method: paymentMethods[0]?.value ?? 'cash',
        amount: '',
        notes: '',
        ...emptyFields(),
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

    if (!open || !order) {
        return null;
    }

    function changeMethod(nextMethod) {
        form.setData({
            ...form.data,
            method: nextMethod,
            ...emptyFields(),
            amount: form.data.amount,
            notes: form.data.notes,
        });
        form.clearErrors();
    }

    function submit(event) {
        event.preventDefault();

        form.transform((data) => {
            const payload = {
                method: data.method,
                amount: data.amount,
                notes: data.notes || null,
            };

            if (data.method === 'online_payment') {
                payload.platform = data.platform;
                payload.reference_number = data.reference_number || null;
            }

            if (data.method === 'bank_deposit') {
                payload.bank_name = data.bank_name;
                payload.reference_number = data.reference_number;
            }

            if (data.method === 'post_dated_check') {
                payload.bank_account_id = data.bank_account_id
                    ? Number(data.bank_account_id)
                    : null;
                payload.check_number = data.check_number;
                payload.due_date = data.due_date;
            }

            return payload;
        });

        form.post(submitUrl ?? storePayment.url(order.id), {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onFinish: () => {
                form.transform((data) => data);
            },
        });
    }

    const method = form.data.method;

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
                aria-labelledby="purchased-order-prepayment-title"
                className="relative z-10 w-full max-w-2xl origin-top rounded-lg border border-line bg-white p-6 opacity-0 shadow-xl motion-safe:animate-[supplier-modal-slide-down_0.35s_ease-out_forwards] motion-reduce:opacity-100"
            >
                <form onSubmit={submit}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h2
                                id="purchased-order-prepayment-title"
                                className="text-xl font-semibold tracking-tight text-ink"
                            >
                                {title}
                            </h2>
                            <p className="mt-1 font-mono text-sm break-all text-ink-soft">
                                {order.reference}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (!form.processing) {
                                    onClose();
                                }
                            }}
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
                                Grand total
                            </p>
                            <p className="mt-1 text-sm font-medium text-ink">
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
                            <p className="mt-1 text-sm font-semibold text-ink">
                                {formatMoney(order.balance_due ?? order.grand_total)}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-5">
                        <div>
                            <label
                                htmlFor="prepayment-method"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Payment method
                            </label>
                            <select
                                id="prepayment-method"
                                value={form.data.method}
                                onChange={(event) =>
                                    changeMethod(event.target.value)
                                }
                                className={FIELD_CLASS}
                            >
                                {paymentMethods.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {form.errors.method && (
                                <p className="mt-1.5 text-sm text-warn">
                                    {form.errors.method}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="prepayment-amount"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Amount
                            </label>
                            <input
                                id="prepayment-amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.data.amount}
                                onChange={(event) =>
                                    form.setData('amount', event.target.value)
                                }
                                className={FIELD_CLASS}
                            />
                            {form.errors.amount && (
                                <p className="mt-1.5 text-sm text-warn">
                                    {form.errors.amount}
                                </p>
                            )}
                        </div>

                        {method === 'online_payment' && (
                            <>
                                <div>
                                    <label
                                        htmlFor="prepayment-platform"
                                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                                    >
                                        Platform
                                    </label>
                                    <input
                                        id="prepayment-platform"
                                        type="text"
                                        placeholder="GCash, PayMaya, GoTyme, …"
                                        value={form.data.platform}
                                        onChange={(event) =>
                                            form.setData(
                                                'platform',
                                                event.target.value,
                                            )
                                        }
                                        className={FIELD_CLASS}
                                    />
                                    {form.errors.platform && (
                                        <p className="mt-1.5 text-sm text-warn">
                                            {form.errors.platform}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor="prepayment-reference"
                                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                                    >
                                        Reference number
                                    </label>
                                    <input
                                        id="prepayment-reference"
                                        type="text"
                                        value={form.data.reference_number}
                                        onChange={(event) =>
                                            form.setData(
                                                'reference_number',
                                                event.target.value,
                                            )
                                        }
                                        className={FIELD_CLASS}
                                    />
                                    {form.errors.reference_number && (
                                        <p className="mt-1.5 text-sm text-warn">
                                            {form.errors.reference_number}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {method === 'bank_deposit' && (
                            <>
                                <div>
                                    <label
                                        htmlFor="prepayment-bank-name"
                                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                                    >
                                        Bank name
                                    </label>
                                    <input
                                        id="prepayment-bank-name"
                                        type="text"
                                        value={form.data.bank_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'bank_name',
                                                event.target.value,
                                            )
                                        }
                                        className={FIELD_CLASS}
                                    />
                                    {form.errors.bank_name && (
                                        <p className="mt-1.5 text-sm text-warn">
                                            {form.errors.bank_name}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor="prepayment-deposit-ref"
                                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                                    >
                                        Reference number
                                    </label>
                                    <input
                                        id="prepayment-deposit-ref"
                                        type="text"
                                        value={form.data.reference_number}
                                        onChange={(event) =>
                                            form.setData(
                                                'reference_number',
                                                event.target.value,
                                            )
                                        }
                                        className={FIELD_CLASS}
                                    />
                                    {form.errors.reference_number && (
                                        <p className="mt-1.5 text-sm text-warn">
                                            {form.errors.reference_number}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {method === 'post_dated_check' && (
                            <>
                                <div>
                                    <label
                                        htmlFor="prepayment-bank-account"
                                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                                    >
                                        Bank account
                                    </label>
                                    <select
                                        id="prepayment-bank-account"
                                        value={form.data.bank_account_id}
                                        onChange={(event) =>
                                            form.setData(
                                                'bank_account_id',
                                                event.target.value,
                                            )
                                        }
                                        className={FIELD_CLASS}
                                    >
                                        <option value="">Select bank…</option>
                                        {bankAccounts.map((account) => (
                                            <option
                                                key={account.id}
                                                value={account.id}
                                            >
                                                {account.name}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.bank_account_id && (
                                        <p className="mt-1.5 text-sm text-warn">
                                            {form.errors.bank_account_id}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor="prepayment-check-number"
                                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                                    >
                                        Check number
                                    </label>
                                    <input
                                        id="prepayment-check-number"
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
                                <div>
                                    <label
                                        htmlFor="prepayment-due-date"
                                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                                    >
                                        Due date
                                    </label>
                                    <input
                                        id="prepayment-due-date"
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
                                <div>
                                    <label
                                        htmlFor="prepayment-issued-by"
                                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                                    >
                                        Issued by
                                    </label>
                                    <input
                                        id="prepayment-issued-by"
                                        type="text"
                                        value={recordedBy}
                                        readOnly
                                        className={`${FIELD_CLASS} bg-mist/60 text-ink-soft`}
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label
                                htmlFor="prepayment-notes"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Notes
                            </label>
                            <textarea
                                id="prepayment-notes"
                                rows={3}
                                value={form.data.notes}
                                onChange={(event) =>
                                    form.setData('notes', event.target.value)
                                }
                                className="w-full border border-line bg-white/80 px-3 py-2.5 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            />
                            {form.errors.notes && (
                                <p className="mt-1.5 text-sm text-warn">
                                    {form.errors.notes}
                                </p>
                            )}
                        </div>

                        {method === 'cash' && (
                                <p
                                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                                >
                                    Recorded by : {recordedBy}
                                </p>
                        )}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="min-h-11 rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition hover:bg-teal-800 disabled:opacity-60"
                        >
                            {form.processing ? 'Saving…' : submitLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={form.processing}
                            className="min-h-11 rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink disabled:opacity-60"
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

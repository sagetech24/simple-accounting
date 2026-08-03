import { useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { store } from '@/actions/App/Http/Controllers/BankCheckController';

const FIELD_CLASS =
    'min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';

function todayIsoDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export default function BankCheckStandaloneModal({
    open,
    bankAccount,
    onClose,
}) {
    const { auth } = usePage().props;
    const form = useForm({
        check_number: '',
        amount: '',
        due_date: todayIsoDate(),
        issued_by: auth?.user?.name ?? '',
        notes: '',
    });

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        form.setData({
            check_number: '',
            amount: '',
            due_date: todayIsoDate(),
            issued_by: auth?.user?.name ?? '',
            notes: '',
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opened
    }, [open]);

    if (!open || !bankAccount) {
        return null;
    }

    function submit(event) {
        event.preventDefault();
        form.post(store.url(bankAccount.id), {
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
                aria-labelledby="standalone-check-title"
                className="relative z-10 w-full max-w-lg origin-top rounded-md border border-line bg-white p-6 opacity-0 motion-safe:animate-[supplier-modal-slide-down_0.35s_ease-out_forwards] motion-reduce:opacity-100"
            >
                <h2
                    id="standalone-check-title"
                    className="text-xl font-semibold tracking-tight text-ink"
                >
                    Issue standalone check
                </h2>
                <p className="mt-1 text-sm text-muted">
                    Creates a check on {bankAccount.name} without linking a
                    purchase order.
                </p>

                <form onSubmit={submit} className="mt-6 space-y-4">
                    <div>
                        <label
                            htmlFor="standalone_check_number"
                            className="mb-1.5 block text-sm font-medium text-ink-soft"
                        >
                            Check number
                        </label>
                        <input
                            id="standalone_check_number"
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
                                htmlFor="standalone_amount"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Amount
                            </label>
                            <input
                                id="standalone_amount"
                                type="number"
                                step="0.01"
                                min="0"
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
                        <div>
                            <label
                                htmlFor="standalone_due_date"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Due date
                            </label>
                            <input
                                id="standalone_due_date"
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
                            htmlFor="standalone_issued_by"
                            className="mb-1.5 block text-sm font-medium text-ink-soft"
                        >
                            Issued by
                        </label>
                        <input
                            id="standalone_issued_by"
                            type="text"
                            value={form.data.issued_by}
                            onChange={(event) =>
                                form.setData('issued_by', event.target.value)
                            }
                            className={FIELD_CLASS}
                        />
                        {form.errors.issued_by && (
                            <p className="mt-1.5 text-sm text-warn">
                                {form.errors.issued_by}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="standalone_notes"
                            className="mb-1.5 block text-sm font-medium text-ink-soft"
                        >
                            Notes
                        </label>
                        <textarea
                            id="standalone_notes"
                            rows={3}
                            value={form.data.notes ?? ''}
                            onChange={(event) =>
                                form.setData('notes', event.target.value)
                            }
                            className={`${FIELD_CLASS} py-2`}
                        />
                        {form.errors.notes && (
                            <p className="mt-1.5 text-sm text-warn">
                                {form.errors.notes}
                            </p>
                        )}
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
                            {form.processing ? 'Saving…' : 'Issue check'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}

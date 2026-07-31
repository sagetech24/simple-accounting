import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adjust } from '@/actions/App/Http/Controllers/InventoryController';
import { formatProductLabel } from '@/lib/format-product-label';

export default function InventoryAdjustModal({ open, product, onClose }) {
    const form = useForm({
        quantity: product?.quantity ?? 0,
        notes: '',
    });

    useEffect(() => {
        if (!open || !product) {
            return undefined;
        }

        form.setData({
            quantity: product.quantity ?? 0,
            notes: '',
        });
        form.clearErrors();

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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when modal opens / product changes
    }, [open, product?.id]);

    if (!open || !product) {
        return null;
    }

    const label = formatProductLabel(product.name, product.unit);

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
                aria-labelledby="inventory-adjust-modal-title"
                className="relative z-10 w-full max-w-md origin-top rounded-md border border-line bg-white p-6 opacity-0 motion-safe:animate-[product-modal-slide-down_0.35s_ease-out_forwards] motion-reduce:opacity-100"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2
                            id="inventory-adjust-modal-title"
                            className="text-xl font-semibold tracking-tight text-ink"
                        >
                            Adjust stock
                        </h2>
                        <p className="mt-1 text-sm text-muted">{label}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex size-9 items-center justify-center rounded-md text-muted transition hover:bg-mist hover:text-ink"
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

                <form
                    className="mt-6 space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(adjust.url(product.id), {
                            preserveScroll: true,
                            onSuccess: () => onClose(),
                        });
                    }}
                >
                    <div>
                        <label
                            htmlFor="adjust-quantity"
                            className="mb-1.5 block text-sm font-medium text-ink-soft"
                        >
                            On-hand quantity
                        </label>
                        <input
                            id="adjust-quantity"
                            type="number"
                            min="0"
                            step="1"
                            value={form.data.quantity}
                            onChange={(event) =>
                                form.setData(
                                    'quantity',
                                    event.target.value === ''
                                        ? ''
                                        : Number(event.target.value),
                                )
                            }
                            className="min-h-11 w-full border border-line bg-white px-3 text-ink tabular-nums transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            required
                        />
                        {form.errors.quantity && (
                            <p className="mt-1.5 text-sm text-warn">
                                {form.errors.quantity}
                            </p>
                        )}
                        <p className="mt-1.5 text-xs text-muted">
                            Current: {product.quantity}
                            {product.unit ? ` ${product.unit}` : ''}
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="adjust-notes"
                            className="mb-1.5 block text-sm font-medium text-ink-soft"
                        >
                            Notes{' '}
                            <span className="font-normal text-muted">
                                (optional)
                            </span>
                        </label>
                        <textarea
                            id="adjust-notes"
                            rows={3}
                            value={form.data.notes}
                            onChange={(event) =>
                                form.setData('notes', event.target.value)
                            }
                            className="w-full border border-line bg-white px-3 py-2 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
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
                            className="min-h-11 border border-line bg-white px-4 text-sm text-ink-soft transition hover:border-ink/30"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-medium tracking-wider text-paper transition hover:bg-teal-800 disabled:opacity-60"
                        >
                            {form.processing ? 'Saving…' : 'Save adjustment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}

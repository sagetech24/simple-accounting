import { useForm } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { updateSettings } from '@/actions/App/Http/Controllers/InventoryController';
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

export default function InventorySettingsModal({ open, product, onClose }) {
    const defaultThreshold =
        product?.low_stock_threshold ?? product?.suggested_low_stock_threshold ?? 4;

    const form = useForm({
        low_stock_threshold: defaultThreshold,
        selling_price: product?.selling_price ?? '',
        price_change_note: '',
    });

    const sellingPriceChanged = useMemo(() => {
        if (!product) {
            return false;
        }

        const next = Number(form.data.selling_price);
        const current = Number(product.selling_price);

        if (Number.isNaN(next) || Number.isNaN(current)) {
            return String(form.data.selling_price) !== String(product.selling_price);
        }

        return next.toFixed(2) !== current.toFixed(2);
    }, [form.data.selling_price, product]);

    useEffect(() => {
        if (!open || !product) {
            return undefined;
        }

        form.setData({
            low_stock_threshold:
                product.low_stock_threshold ??
                product.suggested_low_stock_threshold ??
                4,
            selling_price: product.selling_price ?? '',
            price_change_note: '',
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
    const histories = product.selling_price_histories ?? [];

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
                aria-labelledby="inventory-settings-modal-title"
                className="relative z-10 w-full max-w-lg origin-top rounded-md border border-line bg-white p-6 opacity-0 motion-safe:animate-[product-modal-slide-down_0.35s_ease-out_forwards] motion-reduce:opacity-100"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2
                            id="inventory-settings-modal-title"
                            className="text-xl font-semibold tracking-tight text-ink"
                        >
                            Inventory Settings
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
                        form.post(updateSettings.url(product.id), {
                            preserveScroll: true,
                            onSuccess: () => onClose(),
                        });
                    }}
                >
                    <div>
                        <label
                            htmlFor="settings-threshold"
                            className="mb-1.5 block text-sm font-medium text-ink-soft"
                        >
                            Threshold Quantity
                        </label>
                        <input
                            id="settings-threshold"
                            type="number"
                            min="0"
                            step="1"
                            value={form.data.low_stock_threshold}
                            onChange={(event) =>
                                form.setData(
                                    'low_stock_threshold',
                                    event.target.value === ''
                                        ? ''
                                        : Number(event.target.value),
                                )
                            }
                            className="min-h-11 w-full border border-line bg-white px-3 text-ink tabular-nums transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            required
                        />
                        {form.errors.low_stock_threshold && (
                            <p className="mt-1.5 text-sm text-warn">
                                {form.errors.low_stock_threshold}
                            </p>
                        )}
                        <p className="mt-1.5 text-xs text-muted">
                            Quantity to prompt reorder when quantity is below this level.<br />
                            Suggestion: On-hand stock ({product.quantity}) + 4 = {product.suggested_low_stock_threshold ?? product.quantity + 4}.
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="settings-selling-price"
                            className="mb-1.5 block text-sm font-medium text-ink-soft"
                        >
                            Selling price
                        </label>
                        <input
                            id="settings-selling-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.data.selling_price}
                            onChange={(event) =>
                                form.setData('selling_price', event.target.value)
                            }
                            className="min-h-11 w-full border border-line bg-white px-3 text-ink tabular-nums transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            required
                        />
                        {form.errors.selling_price && (
                            <p className="mt-1.5 text-sm text-warn">
                                {form.errors.selling_price}
                            </p>
                        )}
                        <p className="mt-1.5 text-xs text-muted">
                            Current: {formatMoney(product.selling_price)}
                        </p>
                    </div>

                    {sellingPriceChanged && (
                        <div>
                            <label
                                htmlFor="settings-price-note"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Price change note{' '}
                                <span className="font-normal text-muted">
                                    (optional)
                                </span>
                            </label>
                            <textarea
                                id="settings-price-note"
                                rows={2}
                                value={form.data.price_change_note}
                                onChange={(event) =>
                                    form.setData(
                                        'price_change_note',
                                        event.target.value,
                                    )
                                }
                                placeholder="Reason for changing the selling price"
                                className="w-full border border-line bg-white px-3 py-2 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            />
                            {form.errors.price_change_note && (
                                <p className="mt-1.5 text-sm text-warn">
                                    {form.errors.price_change_note}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
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
                            {form.processing ? 'Saving…' : 'Save settings'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 border-t border-line pt-4">
                    <h3 className="text-sm font-semibold text-ink">
                        Selling Price History
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                        Previous prices are kept when you change the selling
                        price above.
                    </p>

                    {histories.length === 0 ? (
                        <p className="mt-4 text-sm text-muted">
                            No price changes recorded yet.
                        </p>
                    ) : (
                        <ul className="mt-4 max-h-48 space-y-3 overflow-y-auto">
                            {histories.map((entry) => (
                                <li
                                    key={entry.id}
                                    className="flex justify-between rounded-md border border-line/80 bg-mist/40 px-3 py-2.5 text-sm"
                                >
                                    <div className="">
                                        <p className="font-medium text-ink tabular-nums">
                                            {formatMoney(entry.previous_price)}{' '}
                                            → {formatMoney(entry.new_price)}
                                        </p>
                                        {entry.note && (
                                            <p className="text-xs text-ink-soft">
                                                Reason: <i>{entry.note}</i>
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-xs text-muted">
                                            {formatDate(entry.created_at)}
                                        </p>
                                        {entry.created_by && (
                                            <p className="text-[11px] italic text-muted">
                                                By {entry.created_by}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}

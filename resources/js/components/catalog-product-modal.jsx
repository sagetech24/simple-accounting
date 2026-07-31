import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatMoney } from '@/lib/format-money';

function availabilityBadgeClass(availability) {
    switch (availability) {
        case 'in_stock':
            return 'border-green-600/30 bg-green-400/5 text-green-700';
        case 'out_of_stock':
            return 'border-amber-600/30 bg-amber-400/5 text-amber-800';
        default:
            return 'border-line bg-mist text-muted';
    }
}

export default function CatalogProductModal({ open, product, onClose }) {
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

    if (!open || !product) {
        return null;
    }

    const unit = product.unit?.trim();

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-10 sm:px-6">
            <button
                type="button"
                aria-label="Close dialog"
                className="fixed inset-0 bg-ink/40 transition-opacity duration-200"
                onClick={onClose}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="catalog-product-modal-title"
                className="relative z-10 w-full max-w-lg origin-top rounded-md border border-line bg-white p-6 opacity-0 motion-safe:animate-[catalog-product-modal-slide-down_0.35s_ease-out_forwards] motion-reduce:opacity-100"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2
                            id="catalog-product-modal-title"
                            className="text-xl font-semibold tracking-tight text-ink"
                        >
                            {product.name}
                        </h2>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex rounded-md border px-3 py-1 text-xs ${availabilityBadgeClass(product.availability)}`}
                            >
                                {product.availability_label}
                            </span>
                            <p className="text-lg font-medium text-price tabular-nums">
                                {formatMoney(product.selling_price)}
                                {unit ? (
                                    <span className="ml-1 text-sm font-normal text-muted">
                                        / {unit}
                                    </span>
                                ) : null}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition hover:bg-mist hover:text-ink"
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

                {product.description ? (
                    <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">
                        {product.description}
                    </p>
                ) : (
                    <p className="mt-4 text-sm text-muted">No description.</p>
                )}

                {product.categories?.length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                        {product.categories.map((item) => (
                            <span
                                key={item.id}
                                className="rounded-md border border-line bg-mist/60 px-2 py-0.5 text-xs text-ink-soft"
                            >
                                {item.name}
                            </span>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>,
        document.body,
    );
}

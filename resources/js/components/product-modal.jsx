import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    store,
    update,
} from '@/actions/App/Http/Controllers/Admin/ProductController';
import ProductForm from '@/components/product-form';

export default function ProductModal({
    open,
    mode,
    product,
    categories,
    statuses,
    onClose,
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

    if (!open) {
        return null;
    }

    const isEdit = mode === 'edit';

    if (isEdit && !product) {
        return null;
    }

    const title = isEdit ? 'Edit product' : 'New product';
    const submitLabel = isEdit ? 'Save changes' : 'Create product';

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
                aria-labelledby="product-modal-title"
                className="relative z-10 w-full max-w-2xl origin-top rounded-lg border border-line bg-white p-6 shadow-xl opacity-0 motion-safe:animate-[product-modal-slide-down_0.35s_ease-out_forwards] motion-reduce:opacity-100"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2
                            id="product-modal-title"
                            className="text-xl font-semibold tracking-tight text-ink"
                        >
                            {title}
                        </h2>
                        {isEdit && (
                            <p className="mt-1 text-sm text-muted">
                                {product.name}
                            </p>
                        )}
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

                <div className="mt-6">
                    <ProductForm
                        key={isEdit ? `edit-${product.id}` : 'create'}
                        categories={categories}
                        statuses={statuses}
                        initialValues={isEdit ? product : null}
                        submitLabel={submitLabel}
                        onCancel={onClose}
                        onSubmit={(form) => {
                            form.transform((data) => ({
                                ...data,
                                return_to: 'products',
                            }));

                            const options = {
                                preserveScroll: true,
                                onSuccess: () => onClose(),
                            };

                            if (isEdit) {
                                form.put(update.url(product.id), options);
                            } else {
                                form.post(store.url(), options);
                            }
                        }}
                    />
                </div>
            </div>
        </div>,
        document.body,
    );
}

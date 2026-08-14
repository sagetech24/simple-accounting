import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import SalesOrderForm from '@/components/sales-order-form';

export default function SalesOrderCreateModal({
    open,
    customers,
    products,
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
                aria-labelledby="sales-order-create-title"
                className="relative z-10 w-full max-w-4xl origin-top rounded-md border border-line bg-white p-6 opacity-0 motion-safe:animate-[supplier-modal-slide-down_0.35s_ease-out_forwards] motion-reduce:opacity-100"
            >
                <div className="flex items-start justify-between gap-4">
                    <h2
                        id="sales-order-create-title"
                        className="text-xl font-semibold tracking-tight text-ink"
                    >
                        Create sales order
                    </h2>
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

                <div className="mt-6">
                    <SalesOrderForm
                        customers={customers}
                        products={products}
                        onCancel={onClose}
                        onSuccess={onClose}
                    />
                </div>
            </div>
        </div>,
        document.body,
    );
}

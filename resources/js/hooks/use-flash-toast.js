import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

const toastMethods = {
    success: toast.success,
    error: toast.error,
    info: toast.info,
    warning: toast.warning,
};

/**
 * Listen for Inertia flash payloads and show sonner toasts.
 * Expects server flash shaped as: { toast: { type, message } }
 */
export function useFlashToast() {
    useEffect(() => {
        return router.on('flash', (event) => {
            const data = event.detail?.flash?.toast;

            if (!data?.message) {
                return;
            }

            const show = toastMethods[data.type] ?? toast;
            show(data.message);
        });
    }, []);
}

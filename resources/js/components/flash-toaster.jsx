import { Toaster } from 'sonner';
import { useFlashToast } from '@/hooks/use-flash-toast';

/**
 * App-wide toast host. Mount once via createInertiaApp `withApp`.
 */
export default function FlashToaster() {
    useFlashToast();

    return (
        <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
                classNames: {
                    toast: 'font-sans',
                },
            }}
        />
    );
}

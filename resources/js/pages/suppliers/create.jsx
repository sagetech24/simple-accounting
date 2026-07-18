import { Link } from '@inertiajs/react';
import { store } from '@/actions/App/Http/Controllers/SupplierController';
import SupplierForm from '@/components/supplier-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/suppliers';

export default function CreateSupplier({ statuses }) {
    return (
        <AppLayout title="New supplier">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                    New supplier
                </h2>
                <Link
                    href={index.url()}
                    className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink"
                >
                    Back to list
                </Link>
            </div>

            <div className="mt-8 max-w-2xl">
                <SupplierForm
                    statuses={statuses}
                    submitLabel="Create supplier"
                    onSubmit={(form) => form.post(store.url())}
                />
            </div>
        </AppLayout>
    );
}

import { Link } from '@inertiajs/react';
import { update } from '@/actions/App/Http/Controllers/SupplierController';
import SupplierForm from '@/components/supplier-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/suppliers';

export default function EditSupplier({ supplier, statuses }) {
    return (
        <AppLayout title={`Edit ${supplier.name}`}>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                    Edit supplier
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
                    initialValues={supplier}
                    submitLabel="Save changes"
                    onSubmit={(form) =>
                        form.put(update.url(supplier.id))
                    }
                />
            </div>
        </AppLayout>
    );
}

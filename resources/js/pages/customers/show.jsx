import AppLayout from '@/layouts/app-layout';

export default function CustomerShow({ customer }) {
    return (
        <AppLayout title={customer.name}>
            <div className="p-4">
                <h2 className="text-2xl font-semibold text-ink">{customer.name}</h2>
            </div>
        </AppLayout>
    );
}

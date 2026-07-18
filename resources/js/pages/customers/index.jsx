import EmptyPanel from '@/components/empty-panel';
import AppLayout from '@/layouts/app-layout';

export default function CustomersIndex() {
    return (
        <AppLayout title="Customers">
            <EmptyPanel
                title="Customers"
                description="Nothing here yet. Customer records will show up here."
            />
        </AppLayout>
    );
}

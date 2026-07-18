import EmptyPanel from '@/components/empty-panel';
import AppLayout from '@/layouts/app-layout';

export default function SuppliersIndex() {
    return (
        <AppLayout title="Suppliers">
            <EmptyPanel
                title="Suppliers"
                description="Nothing here yet. Supplier records will show up here."
            />
        </AppLayout>
    );
}

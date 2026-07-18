import EmptyPanel from '@/components/empty-panel';
import AppLayout from '@/layouts/app-layout';

export default function PurchasedOrdersIndex() {
    return (
        <AppLayout title="Purchased Orders">
            <EmptyPanel
                title="Purchased Orders"
                description="Nothing here yet. Purchased orders will show up here."
            />
        </AppLayout>
    );
}

import EmptyPanel from '@/components/empty-panel';
import AppLayout from '@/layouts/app-layout';

export default function ReceivedOrdersIndex() {
    return (
        <AppLayout title="Received Orders">
            <EmptyPanel
                title="Received Orders"
                description="Nothing here yet. Received orders will show up here."
            />
        </AppLayout>
    );
}

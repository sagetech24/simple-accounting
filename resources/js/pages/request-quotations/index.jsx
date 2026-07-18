import EmptyPanel from '@/components/empty-panel';
import AppLayout from '@/layouts/app-layout';

export default function RequestQuotationsIndex() {
    return (
        <AppLayout title="Request Quotations">
            <EmptyPanel
                title="Request Quotations"
                description="Nothing here yet. Quotation requests will show up here."
            />
        </AppLayout>
    );
}

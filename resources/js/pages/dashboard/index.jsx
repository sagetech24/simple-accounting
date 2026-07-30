import AppLayout from '@/layouts/app-layout';

export default function Dashboard({ kpis, attention }) {
    return (
        <AppLayout title="Dashboard">
            <div className="p-4">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                    Dashboard
                </h2>
            </div>
        </AppLayout>
    );
}

import AppLayout from '@/layouts/app-layout';

export default function BankAccountShow({ bankAccount }) {
    return (
        <AppLayout title={bankAccount?.name ?? 'Bank account'}>
            <div className="p-4 text-ink">{bankAccount?.name}</div>
        </AppLayout>
    );
}

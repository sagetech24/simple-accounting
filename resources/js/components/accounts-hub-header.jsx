import RouteNavTabs from '@/components/route-nav-tabs';
import { accountsDomainTabs } from '@/config/accounts-domain-tabs';

export default function AccountsHubHeader({ activeKey }) {
    return (
        <>
            <div className="p-4 pb-0">
                <header>
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                        Accounts
                    </h2>
                </header>
            </div>
            <div className="mt-4">
                <RouteNavTabs
                    tabs={accountsDomainTabs}
                    activeKey={activeKey}
                    ariaLabel="Accounts domain"
                />
            </div>
        </>
    );
}

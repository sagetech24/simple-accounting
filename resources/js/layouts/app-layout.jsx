import { Head, Link, usePage } from '@inertiajs/react';
import {
    AccountsNavIcon,
    CustomersNavIcon,
    DashboardNavIcon,
    InventoryNavIcon,
    ProductsNavIcon,
    PurchasedOrdersNavIcon,
    RequestQuotationsNavIcon,
    SuppliersNavIcon,
} from '@/components/nav-icons';
import SiteHeader from '@/components/site-header';
import { configureMoneyFormat } from '@/lib/format-money';
import { home, products } from '@/routes';
import { index as accountsPayable } from '@/routes/accounts-payable';
import { index as customers } from '@/routes/customers';
import { index as inventory } from '@/routes/inventory';
import { index as purchasedOrders } from '@/routes/purchased-orders';
import { index as requestQuotations } from '@/routes/request-quotations';
import { index as suppliers } from '@/routes/suppliers';

const navItems = [
    { label: 'Dashboard', route: home, icon: DashboardNavIcon },
    { label: 'Products', route: products, icon: ProductsNavIcon },
    { label: 'Suppliers', route: suppliers, icon: SuppliersNavIcon },
    { label: 'Customers', route: customers, icon: CustomersNavIcon },
    {
        label: 'Request Quotations',
        route: requestQuotations,
        icon: RequestQuotationsNavIcon,
    },
    {
        label: 'Purchased Orders',
        route: purchasedOrders,
        icon: PurchasedOrdersNavIcon,
    },
    { label: 'Inventory', route: inventory, icon: InventoryNavIcon },
    { label: 'Accounts', route: accountsPayable, icon: AccountsNavIcon },
];

function isActive(url, href) {
    const path = href.replace(/\/$/, '') || '/';
    const current = url.split('?')[0].replace(/\/$/, '') || '/';

    if (path === '/') {
        return current === '/';
    }

    return current === path || current.startsWith(`${path}/`);
}

export default function AppLayout({ title, children }) {
    const { url, props } = usePage();

    if (props.settings) {
        configureMoneyFormat(props.settings);
    }

    return (
        <>
            <Head title={title} />
            <div className="relative min-h-screen bg-paper text-ink">
                <SiteHeader />

                <main className="relative z-10 mx-auto w-full px-4 py-5">
                    <div className="flex gap-2 p-0 sm:gap-4">
                        <aside className="xl:w-min-40 min-w-28">
                            <nav
                                aria-label="Main"
                                className="grid auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-1 lg:grid-cols-1"
                            >
                                {navItems.map((item) => {
                                    const href = item.route.url();
                                    const active = isActive(url, href);
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.label}
                                            href={href}
                                            className={`flex h-24 flex-col items-center justify-center gap-2 rounded-md border-2 px-3 py-2 text-center text-sm font-semibold transition duration-150 ${
                                                active
                                                    ? 'cursor-default border-teal-800 bg-teal-800 text-zinc-100'
                                                    : 'cursor-pointer border-teal-700 bg-teal-600 text-zinc-100 hover:border-teal-800 hover:bg-teal-700'
                                            }`}
                                            aria-current={
                                                active ? 'page' : undefined
                                            }
                                        >
                                            <Icon />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </aside>

                        <div className="min-h-[800px] w-full flex-1 rounded-md border border-line bg-white px-0">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

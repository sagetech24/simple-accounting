import { Head, Link, usePage } from '@inertiajs/react';
import {
    AccountsNavIcon,
    CustomersNavIcon,
    InventoryNavIcon,
    ProductsNavIcon,
    PurchasedOrdersNavIcon,
    RequestQuotationsNavIcon,
    SuppliersNavIcon,
} from '@/components/nav-icons';
import SiteHeader from '@/components/site-header';
import { configureMoneyFormat } from '@/lib/format-money';
import { products } from '@/routes';
import { index as accountsPayable } from '@/routes/accounts-payable';
import { index as customers } from '@/routes/customers';
import { index as inventory } from '@/routes/inventory';
import { index as purchasedOrders } from '@/routes/purchased-orders';
import { index as requestQuotations } from '@/routes/request-quotations';
import { index as suppliers } from '@/routes/suppliers';

const navItems = [
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
            <div className="relative min-h-screen overflow-hidden bg-paper text-ink">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,122,110,0.14),_transparent_55%),linear-gradient(180deg,#f4f8f6_0%,#eef4f1_45%,#e6efe9_100%)]"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(16,36,31,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,36,31,0.05)_1px,transparent_1px)] [background-size:48px_48px] opacity-[0.35]"
                />

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
                                            className={`flex h-24 flex-col items-center justify-center gap-2 rounded-md border-2 px-3 py-2 text-center text-sm font-semibold transition duration-300 ${
                                                active
                                                    ? 'cursor-default border-teal-800 bg-teal-700 text-zinc-100'
                                                    : 'cursor-pointer border-teal-700 bg-teal-600 text-zinc-100 hover:bg-teal-600/80'
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

                        <div className="min-h-[800px] w-full flex-1 rounded-md border border-line bg-white/80 px-0">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

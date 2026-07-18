import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/components/site-header';
import {
    customers,
    products,
    purchasedOrders,
    receivedOrders,
    requestQuotations,
    suppliers,
} from '@/routes';

const navItems = [
    { label: 'Products', route: products },
    { label: 'Suppliers', route: suppliers },
    { label: 'Customers', route: customers },
    { label: 'Request Quotations', route: requestQuotations },
    { label: 'Purchased Orders', route: purchasedOrders },
    { label: 'Received Orders', route: receivedOrders },
];

function isActive(url, href) {
    const path = href.replace(/\/$/, '') || '/';
    const current = url.split('?')[0].replace(/\/$/, '') || '/';

    return current === path || current.startsWith(`${path}/`);
}

export default function AppLayout({ title, children }) {
    const { url } = usePage();

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

                <main className="relative z-10 mx-auto w-full px-5 py-5 sm:px-8 lg:px-8">
                    <div className="flex gap-4">
                        <aside className="w-full sm:w-40">
                            <nav
                                aria-label="Main"
                                className="grid auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-1 lg:grid-cols-1"
                            >
                                {navItems.map((item) => {
                                    const href = item.route.url();
                                    const active = isActive(url, href);

                                    return (
                                        <Link
                                            key={item.label}
                                            href={href}
                                            className={`flex h-24 items-center justify-center rounded-md border-2 px-4 py-2 text-center text-sm font-semibold transition duration-300 ${
                                                active
                                                    ? 'cursor-default border-teal-800 bg-teal-700 text-zinc-100'
                                                    : 'cursor-pointer border-teal-700 bg-teal-600 text-zinc-100 hover:bg-teal-600/80'
                                            }`}
                                            aria-current={
                                                active ? 'page' : undefined
                                            }
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </aside>

                        <div className="min-h-[800px] w-full flex-1 rounded-md border border-line bg-white/80 p-6">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

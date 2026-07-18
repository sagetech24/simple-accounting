import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import SiteHeader from '@/components/site-header';
import { home } from '@/routes';

function formatMoney(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(Number(value));
}

function availabilityLabel(product) {
    if (product.status === 'discontinued') {
        return 'Discontinued';
    }

    if (product.status === 'unavailable' || product.quantity <= 0) {
        return 'Out of stock';
    }

    if (product.quantity <= 5) {
        return `Low stock · ${product.quantity}`;
    }

    return `In stock · ${product.quantity}`;
}

function statusTone(product) {
    if (product.status === 'discontinued') {
        return 'text-muted';
    }

    if (product.status === 'unavailable' || product.quantity <= 0) {
        return 'text-warn';
    }

    return 'text-price';
}

export default function Home({ products, categories, filters }) {
    const { name } = usePage().props;
    const brand = name || 'PriceWatch';
    const [q, setQ] = useState(filters.q ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [selectedId, setSelectedId] = useState(products.data[0]?.id ?? null);

    useEffect(() => {
        setQ(filters.q ?? '');
        setCategory(filters.category ?? '');
    }, [filters.q, filters.category]);

    useEffect(() => {
        if (!products.data.some((product) => product.id === selectedId)) {
            setSelectedId(products.data[0]?.id ?? null);
        }
    }, [products.data, selectedId]);

    const selected =
        products.data.find((product) => product.id === selectedId) ?? null;

    function submitSearch(event) {
        event.preventDefault();
        router.get(
            home.url(),
            {
                q: q || undefined,
                category: category || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    }

    function clearFilters() {
        setQ('');
        setCategory('');
        router.get(home.url(), {}, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Catalog" />
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
                        <aside className="">
                            <div className="grid auto-rows-fr 2xl:grid-cols-1 xl:grid-cols-1 sm:grid-cols-1 gap-2">
                                <button className="h-24 rounded-md border-2 cursor-pointer border-teal-700 bg-teal-600 px-4 py-2 text-sm text-zinc-100 font-semibold transition hover:bg-teal-600/80 duration-300">
                                    Products
                                </button>
                                <button className="h-24 rounded-md border-2 cursor-pointer border-teal-700 bg-teal-600 px-4 py-2 text-sm text-zinc-100 font-semibold transition hover:bg-teal-600/80 duration-300">
                                    Suppliers
                                </button>
                                <button className="h-24 rounded-md border-2 cursor-pointer border-teal-700 bg-teal-600 px-4 py-2 text-sm text-zinc-100 font-semibold transition hover:bg-teal-600/80 duration-300">
                                    Customers
                                </button>
                                <button className="h-24 rounded-md border-2 cursor-pointer border-teal-700 bg-teal-600 px-4 py-2 text-sm text-zinc-100 font-semibold transition hover:bg-teal-600/80 duration-300">
                                    Request Quotations
                                </button>
                                <button className="h-24 rounded-md border-2 cursor-pointer border-teal-700 bg-teal-600 px-4 py-2 text-sm text-zinc-100 font-semibold transition hover:bg-teal-600/80 duration-300">
                                    Purchased Orders
                                </button>
                                <button className="h-24 rounded-md border-2 cursor-pointer border-teal-700 bg-teal-600 px-4 py-2 text-sm text-zinc-100 font-semibold transition hover:bg-teal-600/80 duration-300">
                                    Received Orders
                                </button>
                            </div>
                        </aside>
                        <div className="flex-1 w-full min-h-[800px] border border-line bg-white/80 p-6 rounded-md">
                            <h2 className="text-2xl font-semibold tracking-tight text-ink">
                                Products
                            </h2>
                            <p className="mt-1 text-sm text-muted">
                                {products.total}{' '}
                                {products.total === 1 ? 'product' : 'products'}
                            </p>
                            <ul className="divide-y divide-line/70 border-y border-line/70">
                                {products.data.map((product) => (
                                    <li key={product.id}>
                                        <p className="truncate font-medium text-ink">
                                            {product.name}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </main>
            </div>

            <style>{`
                @keyframes fade-up {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
}

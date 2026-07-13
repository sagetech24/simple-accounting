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

                <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 lg:px-12">
                    <section className="flex min-h-[calc(100vh-5.5rem)] flex-col justify-center py-10 sm:py-14">
                        <p
                            className="mb-4 font-sans text-xs font-medium tracking-[0.22em] text-accent uppercase opacity-0 motion-safe:animate-[fade-up_0.7s_ease_forwards]"
                            style={{ animationDelay: '40ms' }}
                        >
                            Product price monitoring
                        </p>
                        <h1
                            className="max-w-3xl font-sans text-5xl leading-[0.95] font-semibold tracking-tight text-ink opacity-0 motion-safe:animate-[fade-up_0.8s_ease_forwards] sm:text-6xl lg:text-7xl"
                            style={{ animationDelay: '120ms' }}
                        >
                            {brand}
                        </h1>
                        <p
                            className="mt-5 max-w-xl text-base leading-relaxed text-muted opacity-0 motion-safe:animate-[fade-up_0.8s_ease_forwards] sm:text-lg"
                            style={{ animationDelay: '220ms' }}
                        >
                            Search the catalog for live selling prices, stock,
                            and availability.
                        </p>

                        <form
                            onSubmit={submitSearch}
                            className="mt-10 flex w-full max-w-3xl flex-col gap-3 opacity-0 motion-safe:animate-[fade-up_0.85s_ease_forwards] sm:flex-row sm:items-stretch"
                            style={{ animationDelay: '320ms' }}
                        >
                            <label className="sr-only" htmlFor="catalog-search">
                                Search products
                            </label>
                            <input
                                id="catalog-search"
                                type="search"
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Search by name or description"
                                className="min-h-12 flex-1 border border-line bg-white/80 px-4 text-base text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            />
                            <label
                                className="sr-only"
                                htmlFor="catalog-category"
                            >
                                Category
                            </label>
                            <select
                                id="catalog-category"
                                value={category}
                                onChange={(event) =>
                                    setCategory(event.target.value)
                                }
                                className="min-h-12 border border-line bg-white/80 px-3 text-sm text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 sm:w-48"
                            >
                                <option value="">All categories</option>
                                {categories.map((item) => (
                                    <option key={item.id} value={item.slug}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                className="min-h-12 bg-ink px-6 text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft"
                            >
                                Search
                            </button>
                        </form>

                        {(filters.q || filters.category) && (
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
                                <span>
                                    Showing results
                                    {filters.q ? <> for “{filters.q}”</> : null}
                                    {filters.category ? (
                                        <>
                                            {' '}
                                            in{' '}
                                            {categories.find(
                                                (item) =>
                                                    item.slug ===
                                                    filters.category,
                                            )?.name ?? filters.category}
                                        </>
                                    ) : null}
                                </span>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="underline decoration-line underline-offset-4 hover:text-ink"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </section>

                    <section
                        id="results"
                        className="border-t border-line/80 pt-10"
                    >
                        <div className="mb-6 flex items-end justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                                    Catalog
                                </h2>
                                <p className="mt-1 text-sm text-muted">
                                    {products.total}{' '}
                                    {products.total === 1
                                        ? 'product'
                                        : 'products'}
                                </p>
                            </div>
                        </div>

                        {products.data.length === 0 ? (
                            <div className="py-16 text-center">
                                <p className="text-lg font-medium text-ink">
                                    No products found
                                </p>
                                <p className="mt-2 text-sm text-muted">
                                    Try a different search term or category.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
                                <ul className="divide-y divide-line/70 border-y border-line/70">
                                    {products.data.map((product, index) => {
                                        const isActive =
                                            product.id === selectedId;

                                        return (
                                            <li key={product.id}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedId(
                                                            product.id,
                                                        )
                                                    }
                                                    className={`flex w-full items-start justify-between gap-4 px-1 py-4 text-left transition ${
                                                        isActive
                                                            ? 'bg-mist/60'
                                                            : 'hover:bg-white/50'
                                                    }`}
                                                    style={{
                                                        animationDelay: `${index * 40}ms`,
                                                    }}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-ink">
                                                            {product.name}
                                                        </p>
                                                        <p
                                                            className={`mt-1 text-sm ${statusTone(product)}`}
                                                        >
                                                            {availabilityLabel(
                                                                product,
                                                            )}
                                                        </p>
                                                        {product.categories
                                                            .length > 0 && (
                                                            <p className="mt-1 truncate text-xs text-muted">
                                                                {product.categories
                                                                    .map(
                                                                        (c) =>
                                                                            c.name,
                                                                    )
                                                                    .join(
                                                                        ' · ',
                                                                    )}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <p className="shrink-0 font-semibold text-price tabular-nums">
                                                        {formatMoney(
                                                            product.selling_price,
                                                        )}
                                                    </p>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>

                                <aside className="border border-line/80 bg-white/70 p-6 backdrop-blur-sm lg:sticky lg:top-6 lg:self-start">
                                    {selected ? (
                                        <div className="space-y-4">
                                            <p className="text-xs font-medium tracking-[0.18em] text-accent uppercase">
                                                Detail
                                            </p>
                                            <h3 className="text-2xl font-semibold tracking-tight text-ink">
                                                {selected.name}
                                            </h3>
                                            <p className="text-3xl font-semibold text-price tabular-nums">
                                                {formatMoney(
                                                    selected.selling_price,
                                                )}
                                            </p>
                                            <p
                                                className={`text-sm font-medium ${statusTone(selected)}`}
                                            >
                                                {availabilityLabel(selected)}
                                                <span className="text-muted">
                                                    {' '}
                                                    · {selected.status_label}
                                                </span>
                                            </p>
                                            {selected.description && (
                                                <p className="text-sm leading-relaxed text-muted">
                                                    {selected.description}
                                                </p>
                                            )}
                                            {selected.categories.length > 0 && (
                                                <div>
                                                    <p className="text-xs tracking-wide text-muted uppercase">
                                                        Categories
                                                    </p>
                                                    <p className="mt-1 text-sm text-ink-soft">
                                                        {selected.categories
                                                            .map((c) => c.name)
                                                            .join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted">
                                            Select a product to view details.
                                        </p>
                                    )}
                                </aside>
                            </div>
                        )}

                        {products.last_page > 1 && (
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                                {products.links.map((link, index) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={`${link.label}-${index}`}
                                                className="px-3 py-1.5 text-sm text-muted/60"
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        );
                                    }

                                    return (
                                        <Link
                                            key={`${link.label}-${index}`}
                                            href={link.url}
                                            preserveState
                                            className={`px-3 py-1.5 text-sm transition ${
                                                link.active
                                                    ? 'bg-ink text-paper'
                                                    : 'text-ink-soft hover:bg-mist'
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </section>
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

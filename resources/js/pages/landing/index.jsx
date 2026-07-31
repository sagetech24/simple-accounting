import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import CatalogProductModal from '@/components/catalog-product-modal';
import PublicLayout from '@/layouts/public-layout';
import { formatMoney } from '@/lib/format-money';
import { home } from '@/routes';

function availabilityBadgeClass(availability) {
    switch (availability) {
        case 'in_stock':
            return 'border-green-600/30 bg-green-400/5 text-green-700';
        case 'out_of_stock':
            return 'border-amber-600/30 bg-amber-400/5 text-amber-800';
        default:
            return 'border-line bg-mist text-muted';
    }
}

export default function LandingIndex({
    products,
    categories,
    filters,
    hasSearched,
}) {
    const [q, setQ] = useState(filters.q ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [selected, setSelected] = useState(null);

    function visit(params) {
        router.get(home.url(), params, {
            preserveState: true,
            replace: true,
        });
    }

    function currentParams(overrides = {}) {
        const nextQ = overrides.q !== undefined ? overrides.q : q;
        const nextCategory =
            overrides.category !== undefined ? overrides.category : category;

        return {
            q: nextQ || undefined,
            category: nextCategory || undefined,
        };
    }

    function submitSearch(event) {
        event.preventDefault();
        visit(currentParams());
    }

    function selectCategory(slug) {
        const next = category === slug ? '' : slug;
        setCategory(next);
        visit(currentParams({ category: next }));
    }

    function clearFilters() {
        setQ('');
        setCategory('');
        visit({});
    }

    const catalogEmpty = categories.length === 0;

    return (
        <PublicLayout
            title="Catalog"
            description="Search products for price and availability."
        >
            <section className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-medium tracking-[0.2em] text-muted uppercase">
                    Product catalog
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                    Find a product
                </h1>
                <p className="mt-3 text-base text-ink-soft">
                    Check selling price and availability — no account needed.
                </p>

                <form
                    onSubmit={submitSearch}
                    className="mt-8 flex flex-col gap-3 md:flex-row md:items-stretch"
                >
                    <label htmlFor="catalog-q" className="sr-only">
                        Search products
                    </label>
                    <input
                        id="catalog-q"
                        type="search"
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                        placeholder="Search name or description"
                        className="min-h-14 w-full flex-1 rounded-md border border-line bg-white px-4 text-base text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    <button
                        type="submit"
                        className="min-h-14 cursor-pointer rounded-md bg-teal-700 px-6 text-sm font-medium tracking-wide text-paper transition hover:bg-teal-800"
                    >
                        Search
                    </button>
                </form>
                <p className="mt-2 text-left text-sm text-muted md:text-center">
                    Search by product name or description
                </p>
            </section>

            {catalogEmpty && !hasSearched ? (
                <p className="mx-auto mt-12 max-w-3xl text-center text-sm text-muted">
                    The catalog is being set up.
                </p>
            ) : null}

            {categories.length > 0 ? (
                <section className="mt-12" aria-label="Categories">
                    <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
                        Browse by category
                    </h2>
                    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
                        {categories.map((item) => {
                            const pressed = category === item.slug;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    aria-pressed={pressed}
                                    onClick={() => selectCategory(item.slug)}
                                    className={`min-h-11 cursor-pointer rounded-md border px-3 py-3 text-sm font-medium transition ${
                                        pressed
                                            ? 'border-teal-800 bg-teal-700 text-paper'
                                            : 'border-line bg-white text-ink-soft hover:border-ink/30 hover:bg-mist'
                                    }`}
                                >
                                    {item.name}
                                </button>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            {hasSearched ? (
                <section className="mt-12" aria-label="Search results">
                    <div
                        className="flex flex-wrap items-center justify-between gap-3"
                        aria-live="polite"
                    >
                        <p className="text-sm text-muted">
                            {products.total}{' '}
                            {products.total === 1 ? 'result' : 'results'}
                            {filters.q ? ` for “${filters.q}”` : ''}
                            {filters.category
                                ? ` in ${categories.find((item) => item.slug === filters.category)?.name ?? filters.category}`
                                : ''}
                        </p>
                        {(filters.q || filters.category) && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="min-h-11 cursor-pointer rounded-md border border-line bg-white px-4 text-sm text-ink-soft transition hover:border-ink/30 hover:bg-mist"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {products.data.length === 0 ? (
                        <div className="mt-8 rounded-md border border-line bg-white px-6 py-10 text-center">
                            <p className="text-sm text-muted">
                                No products match this search.
                            </p>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-4 min-h-11 cursor-pointer rounded-md border border-line bg-white px-4 text-sm text-ink-soft transition hover:border-ink/30 hover:bg-mist"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {products.data.map((product) => {
                                const unit = product.unit?.trim();

                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => setSelected(product)}
                                        className="cursor-pointer rounded-md border border-line bg-white p-4 text-left transition hover:border-ink/30 hover:bg-mist/40"
                                    >
                                        <p className="font-medium text-ink">
                                            {product.name}
                                        </p>
                                        {product.description ? (
                                            <p className="mt-1 line-clamp-2 text-xs text-muted">
                                                {product.description}
                                            </p>
                                        ) : null}
                                        <p className="mt-3 text-base font-medium text-price tabular-nums">
                                            {formatMoney(product.selling_price)}
                                            {unit ? (
                                                <span className="ml-1 text-sm font-normal text-muted">
                                                    / {unit}
                                                </span>
                                            ) : null}
                                        </p>
                                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                            <span
                                                className={`inline-flex rounded-md border px-2.5 py-1 text-xs ${availabilityBadgeClass(product.availability)}`}
                                            >
                                                {product.availability_label}
                                            </span>
                                            {product.categories.map((item) => (
                                                <span
                                                    key={item.id}
                                                    className="rounded-md border border-line bg-mist/60 px-2 py-0.5 text-xs text-ink-soft"
                                                >
                                                    {item.name}
                                                </span>
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {products.last_page > 1 ? (
                        <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
                            {products.links.map((link, i) => {
                                if (!link.url) {
                                    return (
                                        <span
                                            key={`${link.label}-${i}`}
                                            className="px-2 py-1 text-muted"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    );
                                }

                                return (
                                    <Link
                                        key={`${link.label}-${i}`}
                                        href={link.url}
                                        className={
                                            link.active
                                                ? 'bg-ink px-3 py-1.5 text-paper'
                                                : 'border border-line bg-white px-3 py-1.5 text-ink-soft hover:border-ink/30'
                                        }
                                        preserveState
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    ) : null}
                </section>
            ) : null}

            <CatalogProductModal
                open={selected !== null}
                product={selected}
                onClose={() => setSelected(null)}
            />
        </PublicLayout>
    );
}

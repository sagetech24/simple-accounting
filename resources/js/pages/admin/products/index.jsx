import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    destroy,
    restore,
} from '@/actions/App/Http/Controllers/Admin/ProductController';
import SiteHeader from '@/components/site-header';
import { create, edit, index } from '@/routes/admin/products';

function formatMoney(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(Number(value));
}

export default function AdminProductsIndex({ products, filters }) {
    const { flash } = usePage().props;
    const [q, setQ] = useState(filters.q ?? '');
    const [trashed, setTrashed] = useState(filters.trashed ?? '');

    function submitSearch(event) {
        event.preventDefault();
        router.get(
            index.url(),
            {
                q: q || undefined,
                trashed: trashed || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    }

    function clearFilters() {
        setQ('');
        setTrashed('');
        router.get(index.url(), {}, { preserveState: true, replace: true });
    }

    function deleteProduct(product) {
        if (!window.confirm(`Delete “${product.name}”?`)) {
            return;
        }

        router.delete(destroy.url(product.id));
    }

    function restoreProduct(product) {
        router.post(restore.url(product.id));
    }

    return (
        <>
            <Head title="Manage products" />
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
                    <div className="flex flex-wrap items-end justify-between gap-4 opacity-0 motion-safe:animate-[fade-up_0.7s_ease_forwards]">
                        <div>
                            <p className="mb-3 text-xs font-medium tracking-[0.22em] text-accent uppercase">
                                Admin
                            </p>
                            <h1 className="font-sans text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                                Products
                            </h1>
                            <p className="mt-2 max-w-lg text-sm text-muted">
                                Create, update, soft-delete, and restore catalog
                                items. Purchase prices stay admin-only.
                            </p>
                        </div>
                        <Link
                            href={create.url()}
                            className="min-h-11 bg-ink px-4 text-sm leading-[2.75rem] font-medium tracking-wide text-paper transition hover:bg-ink-soft"
                        >
                            New product
                        </Link>
                    </div>

                    {flash?.success && (
                        <p
                            className="mt-6 border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-ink-soft opacity-0 motion-safe:animate-[fade-up_0.6s_ease_forwards]"
                            role="status"
                        >
                            {flash.success}
                        </p>
                    )}

                    <form
                        onSubmit={submitSearch}
                        className="mt-8 flex flex-col gap-3 opacity-0 motion-safe:animate-[fade-up_0.8s_ease_forwards] sm:flex-row sm:items-end"
                        style={{ animationDelay: '80ms' }}
                    >
                        <div className="flex-1">
                            <label
                                htmlFor="q"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Search
                            </label>
                            <input
                                id="q"
                                type="search"
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Name or description"
                                className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            />
                        </div>
                        <div className="sm:w-48">
                            <label
                                htmlFor="trashed"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Trash
                            </label>
                            <select
                                id="trashed"
                                value={trashed}
                                onChange={(event) =>
                                    setTrashed(event.target.value)
                                }
                                className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            >
                                <option value="">Active only</option>
                                <option value="with">Include deleted</option>
                                <option value="only">Deleted only</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="min-h-11 bg-ink px-4 text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft"
                            >
                                Filter
                            </button>
                            {(filters.q || filters.trashed) && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="min-h-11 border border-line bg-white/70 px-4 text-sm text-ink-soft transition hover:border-ink/30"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </form>

                    <div
                        className="mt-8 overflow-x-auto opacity-0 motion-safe:animate-[fade-up_0.8s_ease_forwards]"
                        style={{ animationDelay: '140ms' }}
                    >
                        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
                                    <th className="py-3 pr-4 font-medium">
                                        Product
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Status
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Qty
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Purchase
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Selling
                                    </th>
                                    <th className="py-3 font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-10 text-muted"
                                        >
                                            No products match these filters.
                                        </td>
                                    </tr>
                                )}
                                {products.data.map((product) => {
                                    const isDeleted = Boolean(
                                        product.deleted_at,
                                    );

                                    return (
                                        <tr
                                            key={product.id}
                                            className="border-b border-line/80 align-top"
                                        >
                                            <td className="py-4 pr-4">
                                                <p
                                                    className={
                                                        isDeleted
                                                            ? 'font-medium text-muted line-through'
                                                            : 'font-medium text-ink'
                                                    }
                                                >
                                                    {product.name}
                                                </p>
                                                <p className="mt-1 text-xs text-muted">
                                                    {product.categories
                                                        .map((c) => c.name)
                                                        .join(' · ') ||
                                                        'Uncategorized'}
                                                </p>
                                            </td>
                                            <td className="py-4 pr-4 text-ink-soft">
                                                {product.status_label}
                                            </td>
                                            <td className="py-4 pr-4 text-ink-soft">
                                                {product.quantity}
                                            </td>
                                            <td className="py-4 pr-4 text-ink-soft">
                                                {formatMoney(
                                                    product.purchase_price,
                                                )}
                                            </td>
                                            <td className="py-4 pr-4 font-medium text-price">
                                                {formatMoney(
                                                    product.selling_price,
                                                )}
                                            </td>
                                            <td className="py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {!isDeleted && (
                                                        <>
                                                            <Link
                                                                href={edit.url(
                                                                    product.id,
                                                                )}
                                                                className="text-sm text-accent underline decoration-line underline-offset-4 hover:text-ink"
                                                            >
                                                                Edit
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    deleteProduct(
                                                                        product,
                                                                    )
                                                                }
                                                                className="text-sm text-warn underline decoration-line underline-offset-4"
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                    {isDeleted && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                restoreProduct(
                                                                    product,
                                                                )
                                                            }
                                                            className="text-sm text-accent underline decoration-line underline-offset-4 hover:text-ink"
                                                        >
                                                            Restore
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {products.last_page > 1 && (
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
                                                : 'border border-line bg-white/70 px-3 py-1.5 text-ink-soft hover:border-ink/30'
                                        }
                                        preserveState
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}
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

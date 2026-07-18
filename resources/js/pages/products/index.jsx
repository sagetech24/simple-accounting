import { Link, router } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import { destroy } from '@/actions/App/Http/Controllers/Admin/ProductController';
import ProductModal from '@/components/product-modal';
import AppLayout from '@/layouts/app-layout';
import { products as productsRoute } from '@/routes';

function formatPrice(value) {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return '—';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

function availabilityBadgeClass(availability) {
    switch (availability) {
        case 'in_stock':
            return 'border-green-600/30 bg-green-400/5 text-green-700';
        case 'out_of_stock':
            return 'border-amber-600/30 bg-amber-400/5 text-amber-800';
        case 'unavailable':
            return 'border-red-600/30 bg-red-400/5 text-red-700';
        case 'discontinued':
            return 'border-line bg-mist text-muted';
        default:
            return 'border-line bg-mist text-muted';
    }
}

function RowActionsMenu({ product, open, onToggle, onClose, onEdit, onDelete }) {
    const menuId = useId();
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function handlePointerDown(event) {
            if (!rootRef.current?.contains(event.target)) {
                onClose();
            }
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onClose]);

    return (
        <div ref={rootRef} className="relative flex justify-end">
            <button
                type="button"
                onClick={onToggle}
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-ink-soft transition duration-300 hover:scale-105 hover:bg-gray-100"
                aria-label={`Actions for ${product.name}`}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-5"
                    aria-hidden="true"
                >
                    <path d="M12 6.75a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM12 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM12 20.25a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
                </svg>
            </button>

            {open && (
                <div
                    id={menuId}
                    role="menu"
                    className="absolute top-0 right-6 z-20 min-w-28 rounded-md border border-line bg-white py-1 shadow-md"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            onClose();
                            onEdit(product);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            onClose();
                            onDelete(product);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-warn transition hover:bg-mist"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}

export default function ProductsIndex({
    products,
    categories,
    statuses,
    filters,
}) {
    const [q, setQ] = useState(filters.q ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [modal, setModal] = useState({
        open: false,
        mode: 'create',
        product: null,
    });

    function visitIndex(params) {
        router.get(productsRoute.url(), params, {
            preserveState: true,
            replace: true,
        });
    }

    function currentParams(overrides = {}) {
        return {
            q: q || undefined,
            category: category || undefined,
            ...overrides,
        };
    }

    function submitSearch(event) {
        event.preventDefault();
        visitIndex(currentParams());
    }

    function clearFilters() {
        setQ('');
        setCategory('');
        visitIndex({});
    }

    function openCreateModal() {
        setOpenMenuId(null);
        setModal({ open: true, mode: 'create', product: null });
    }

    function openEditModal(product) {
        setOpenMenuId(null);
        setModal({ open: true, mode: 'edit', product });
    }

    function closeModal() {
        setModal({ open: false, mode: 'create', product: null });
    }

    function deleteProduct(product) {
        if (!window.confirm(`Delete “${product.name}”?`)) {
            return;
        }

        router.delete(destroy.url(product.id), {
            data: { return_to: 'products' },
        });
    }

    return (
        <AppLayout title="Products">
            <div className="flex items-start justify-between gap-4 p-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                        Products
                    </h2>
                    <p className="text-sm text-muted">
                        Browse catalog pricing and stock. Purchase cost stays in
                        admin edit only.
                    </p>
                    <p className="mt-1 text-sm font-medium text-muted">
                        Total: {products.total}{' '}
                        {products.total === 1 ? 'product' : 'products'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="flex size-14 items-center justify-center gap-1 rounded-full bg-teal-700 text-paper shadow-lg transition hover:bg-teal-800"
                    aria-label="New product"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                        />
                    </svg>
                </button>
            </div>

            <form
                onSubmit={submitSearch}
                className="mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
            >
                <div className="min-w-0 flex-1 sm:max-w-xs">
                    <label htmlFor="q" className="sr-only">
                        Search products
                    </label>
                    <input
                        id="q"
                        type="search"
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                        placeholder="Search name or description"
                        className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                </div>
                <div className="sm:w-56">
                    <label htmlFor="category" className="sr-only">
                        Category
                    </label>
                    <select
                        id="category"
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    >
                        <option value="">All categories</option>
                        {categories.map((item) => (
                            <option key={item.id} value={item.slug}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="min-h-11 rounded-md bg-teal-600 px-4 text-sm font-medium tracking-wider text-paper transition hover:bg-teal-800"
                    >
                        Filter
                    </button>
                    {(filters.q || filters.category) && (
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

            <div className="mt-6 overflow-x-auto px-4">
                <table className="w-full min-w-[780px] border-collapse text-left text-sm">
                    <thead className="sticky top-0 bg-teal-500/10">
                        <tr className="border-b border-line text-xs tracking-wide uppercase">
                            <th className="px-4 py-3 font-medium text-muted">
                                Product
                            </th>
                            <th className="px-4 py-3 font-medium text-muted">
                                Price
                            </th>
                            <th className="px-4 py-3 font-medium text-muted">
                                Qty
                            </th>
                            <th className="px-4 py-3 font-medium text-muted">
                                Availability
                            </th>
                            <th className="px-4 py-3 font-medium text-muted">
                                Categories
                            </th>
                            <th className="w-12 px-4 py-3 text-right">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="py-10 text-center text-muted"
                                >
                                    No products match these filters.
                                </td>
                            </tr>
                        )}
                        {products.data.map((product) => (
                            <tr
                                key={product.id}
                                className="border-b border-line/80 align-top"
                            >
                                <td className="px-4 py-4">
                                    <p className="font-medium text-ink">
                                        {product.name}
                                    </p>
                                    {product.description && (
                                        <p className="mt-1 line-clamp-2 text-xs text-muted">
                                            {product.description}
                                        </p>
                                    )}
                                </td>
                                <td className="px-4 py-4 font-medium text-price tabular-nums">
                                    {formatPrice(product.selling_price)}
                                </td>
                                <td className="px-4 py-4 text-ink-soft tabular-nums">
                                    {product.quantity}
                                </td>
                                <td className="px-4 py-4">
                                    <span
                                        className={`inline-flex rounded-full border px-3 py-1 text-xs ${availabilityBadgeClass(product.availability)}`}
                                    >
                                        {product.availability_label}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-ink-soft">
                                    {product.categories.length === 0 ? (
                                        <span className="text-muted">—</span>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {product.categories.map((item) => (
                                                <span
                                                    key={item.id}
                                                    className="rounded-md border border-line bg-mist/60 px-2 py-0.5 text-xs text-ink-soft"
                                                >
                                                    {item.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <RowActionsMenu
                                        product={product}
                                        open={openMenuId === product.id}
                                        onToggle={() =>
                                            setOpenMenuId((current) =>
                                                current === product.id
                                                    ? null
                                                    : product.id,
                                            )
                                        }
                                        onClose={() => setOpenMenuId(null)}
                                        onEdit={openEditModal}
                                        onDelete={deleteProduct}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {products.last_page > 1 && (
                <div className="mt-8 flex flex-wrap items-center gap-2 px-4 pb-4 text-sm">
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

            <ProductModal
                open={modal.open}
                mode={modal.mode}
                product={modal.product}
                categories={categories}
                statuses={statuses}
                onClose={closeModal}
            />
        </AppLayout>
    );
}

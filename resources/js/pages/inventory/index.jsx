import { Link, router } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import InventoryAdjustModal from '@/components/inventory-adjust-modal';
import InventorySettingsModal from '@/components/inventory-settings-modal';
import PurchasedOrderDetailModal from '@/components/purchased-order-detail-modal';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { formatProductLabel } from '@/lib/format-product-label';
import { index as inventoryIndex } from '@/routes/inventory';

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

function formatDate(value) {
    if (!value) {
        return '—';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(value));
    } catch {
        return value;
    }
}

function SortIcon({ active, direction }) {
    if (!active) {
        return (
            <span
                className="ml-1 inline-block text-lg text-muted/50"
                aria-hidden="true"
            >
                ↕
            </span>
        );
    }

    return (
        <span
            className="ml-1 inline-block text-lg text-teal-700"
            aria-hidden="true"
        >
            {direction === 'asc' ? '↑' : '↓'}
        </span>
    );
}

function SortableHeader({ column, label, sort, direction, onSort }) {
    const active = sort === column;
    const nextDirection = active && direction === 'asc' ? 'desc' : 'asc';

    return (
        <th className="px-4 py-3 pr-4 font-medium">
            <button
                type="button"
                onClick={() => onSort(column, nextDirection)}
                className={`inline-flex items-center uppercase transition hover:text-ink ${
                    active ? 'text-ink' : 'text-muted'
                }`}
                aria-sort={
                    active
                        ? direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                        : 'none'
                }
            >
                {label}
                <SortIcon active={active} direction={direction} />
            </button>
        </th>
    );
}

function RowActionsMenu({ product, open, onToggle, onClose, onAdjust, onSettings }) {
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
                className="inline-flex size-11 cursor-pointer items-center justify-center rounded-md text-ink-soft transition duration-300 hover:scale-105 hover:bg-gray-100"
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
                    className="absolute top-0 right-6 z-20 min-w-44 rounded-md border border-line bg-white py-1"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            onClose();
                            onSettings(product);
                        }}
                        className="block w-full px-3 py-2.5 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                    >
                        Inventory settings
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            onClose();
                            onAdjust(product);
                        }}
                        className="block w-full px-3 py-2.5 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                    >
                        Adjust stock
                    </button>
                </div>
            )}
        </div>
    );
}

export default function InventoryIndex({
    tab = 'on-hand',
    products,
    movements,
    categories = [],
    movementTypes = [],
    filters,
}) {
    const [q, setQ] = useState(filters?.q ?? '');
    const [category, setCategory] = useState(filters?.category ?? '');
    const [type, setType] = useState(filters?.type ?? '');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [adjustProduct, setAdjustProduct] = useState(null);
    const [settingsProduct, setSettingsProduct] = useState(null);
    const [detailOrder, setDetailOrder] = useState(null);

    const sort = filters?.sort ?? (tab === 'movements' ? 'created_at' : 'name');
    const direction =
        filters?.direction ?? (tab === 'movements' ? 'desc' : 'asc');

    function visitIndex(params) {
        router.get(inventoryIndex.url(), params, {
            preserveState: true,
            replace: true,
        });
    }

    function currentParams(overrides = {}) {
        return {
            tab,
            q: q || undefined,
            category: tab === 'on-hand' && category ? category : undefined,
            type: tab === 'movements' && type ? type : undefined,
            sort: sort || undefined,
            direction: direction || undefined,
            ...overrides,
        };
    }

    function switchTab(nextTab) {
        setOpenMenuId(null);
        setQ('');
        setCategory('');
        setType('');
        visitIndex({
            tab: nextTab,
            sort: nextTab === 'movements' ? 'created_at' : 'name',
            direction: nextTab === 'movements' ? 'desc' : 'asc',
        });
    }

    function submitSearch(event) {
        event.preventDefault();
        visitIndex(currentParams());
    }

    function clearFilters() {
        setQ('');
        setCategory('');
        setType('');
        visitIndex({
            tab,
            sort,
            direction,
        });
    }

    function sortBy(column, nextDirection) {
        visitIndex(
            currentParams({
                sort: column,
                direction: nextDirection,
            }),
        );
    }

    function openPurchaseOrderDetail(order) {
        if (!order) {
            return;
        }

        setDetailOrder(order);
    }

    function closePurchaseOrderDetail() {
        setDetailOrder(null);
    }

    function formatPurchaseOrderReference(reference) {
        if (!reference?.label) {
            return reference?.id ? `PO ${reference.id}` : 'PO';
        }

        return `PO ${String(reference.label).slice(0, 8)}`;
    }

    const hasFilters =
        Boolean(filters?.q) ||
        Boolean(filters?.category) ||
        Boolean(filters?.type);

    return (
        <AppLayout title="Inventory">
            <div className="flex items-start justify-between gap-4 p-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                        Inventory
                    </h2>
                    <p className="text-sm text-muted">
                        On-hand stock and movement history. Receiving stays on
                        Purchased Orders.
                    </p>
                </div>
            </div>

            <div className="border-b border-line px-4">
                <div
                    role="tablist"
                    aria-label="Inventory views"
                    className="flex gap-2"
                >
                    <button
                        type="button"
                        role="tab"
                        id="tab-on-hand"
                        aria-selected={tab === 'on-hand'}
                        aria-controls="panel-on-hand"
                        onClick={() => switchTab('on-hand')}
                        className={`min-h-11 border-b-2 px-4 text-sm font-medium transition ${
                            tab === 'on-hand'
                                ? 'border-teal-700 text-teal-800'
                                : 'border-transparent text-muted hover:text-ink'
                        }`}
                    >
                        On hand
                    </button>
                    <button
                        type="button"
                        role="tab"
                        id="tab-movements"
                        aria-selected={tab === 'movements'}
                        aria-controls="panel-movements"
                        onClick={() => switchTab('movements')}
                        className={`min-h-11 border-b-2 px-4 text-sm font-medium transition ${
                            tab === 'movements'
                                ? 'border-teal-700 text-teal-800'
                                : 'border-transparent text-muted hover:text-ink'
                        }`}
                    >
                        Movements
                    </button>
                </div>
            </div>

            {tab === 'on-hand' && products && (
                <div
                    role="tabpanel"
                    id="panel-on-hand"
                    aria-labelledby="tab-on-hand"
                    className="p-4"
                >
                    <p className="mb-4 text-sm font-medium text-muted">
                        Total: {products.total}{' '}
                        {products.total === 1 ? 'product' : 'products'}
                    </p>

                    <form
                        onSubmit={submitSearch}
                        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                    >
                        <div className="min-w-0 flex-1 sm:max-w-xs">
                            <label htmlFor="inventory-q" className="sr-only">
                                Search products
                            </label>
                            <input
                                id="inventory-q"
                                type="search"
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Search by name or description"
                                className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            />
                        </div>
                        <div className="sm:w-48">
                            <label
                                htmlFor="inventory-category"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Category
                            </label>
                            <select
                                id="inventory-category"
                                value={category}
                                onChange={(event) =>
                                    setCategory(event.target.value)
                                }
                                className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
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
                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="min-h-11 border border-line bg-white px-4 text-sm text-ink-soft transition hover:border-ink/30"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                            <thead className="sticky top-0 bg-teal-500/10">
                                <tr className="border-b border-line text-xs tracking-wide">
                                    <SortableHeader
                                        column="name"
                                        label="Product"
                                        sort={sort}
                                        direction={direction}
                                        onSort={sortBy}
                                    />
                                    <th className="px-4 py-3 font-medium text-muted uppercase">
                                        Unit
                                    </th>
                                    <SortableHeader
                                        column="quantity"
                                        label="On hand"
                                        sort={sort}
                                        direction={direction}
                                        onSort={sortBy}
                                    />
                                    <th className="px-4 py-3 font-medium text-muted uppercase">
                                        Selling price
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted uppercase">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted uppercase">
                                        Availability
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
                                            colSpan={7}
                                            className="py-10 text-center text-muted"
                                        >
                                            No products match these filters.
                                        </td>
                                    </tr>
                                )}
                                {products.data.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="border-b border-line/80 align-middle"
                                    >
                                        <td className="px-4 py-4">
                                            <p className="font-medium text-ink">
                                                {formatProductLabel(
                                                    product.name,
                                                    product.unit,
                                                )}
                                            </p>
                                            {product.is_low_stock && (
                                                <p className="mt-1 text-xs font-medium text-amber-800">
                                                    Low stock — reorder soon
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-ink-soft">
                                            {product.unit?.trim() || '—'}
                                        </td>
                                        <td
                                            className={`px-4 py-4 tabular-nums ${
                                                product.quantity === 0 ||
                                                product.is_low_stock
                                                    ? 'font-semibold text-amber-800'
                                                    : 'text-ink-soft'
                                            }`}
                                        >
                                            {product.quantity}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-price tabular-nums">
                                            {formatMoney(product.selling_price)}
                                        </td>
                                        <td className="px-4 py-4 text-ink-soft">
                                            {product.status_label}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs ${availabilityBadgeClass(product.availability)}`}
                                            >
                                                {product.availability_label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <RowActionsMenu
                                                product={product}
                                                open={openMenuId === product.id}
                                                onToggle={() =>
                                                    setOpenMenuId(
                                                        openMenuId ===
                                                            product.id
                                                            ? null
                                                            : product.id,
                                                    )
                                                }
                                                onClose={() =>
                                                    setOpenMenuId(null)
                                                }
                                                onAdjust={setAdjustProduct}
                                                onSettings={setSettingsProduct}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {products.last_page > 1 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {products.links.map((link, index) => (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url || '#'}
                                    preserveState
                                    preserveScroll
                                    className={`min-h-11 min-w-11 rounded-md border px-3 text-sm ${
                                        link.active
                                            ? 'border-teal-700 bg-teal-700 text-paper'
                                            : link.url
                                              ? 'border-line bg-white text-ink-soft hover:border-ink/30'
                                              : 'pointer-events-none border-line/50 text-muted'
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === 'movements' && movements && (
                <div
                    role="tabpanel"
                    id="panel-movements"
                    aria-labelledby="tab-movements"
                    className="p-4"
                >
                    <p className="mb-4 text-sm font-medium text-muted">
                        Total: {movements.total}{' '}
                        {movements.total === 1 ? 'movement' : 'movements'}
                    </p>

                    <form
                        onSubmit={submitSearch}
                        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                    >
                        <div className="min-w-0 flex-1 sm:max-w-xs">
                            <label
                                htmlFor="movements-q"
                                className="sr-only"
                            >
                                Search movements
                            </label>
                            <input
                                id="movements-q"
                                type="search"
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Search product, notes, or user"
                                className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            />
                        </div>
                        <div className="sm:w-48">
                            <label
                                htmlFor="movements-type"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Type
                            </label>
                            <select
                                id="movements-type"
                                value={type}
                                onChange={(event) =>
                                    setType(event.target.value)
                                }
                                className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            >
                                <option value="">All types</option>
                                {movementTypes.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
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
                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="min-h-11 border border-line bg-white px-4 text-sm text-ink-soft transition hover:border-ink/30"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                            <thead className="sticky top-0 bg-teal-500/10">
                                <tr className="border-b border-line text-xs tracking-wide">
                                    <SortableHeader
                                        column="created_at"
                                        label="Date"
                                        sort={sort}
                                        direction={direction}
                                        onSort={sortBy}
                                    />
                                    <th className="px-4 py-3 font-medium text-muted uppercase">
                                        Product
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted uppercase">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted uppercase">
                                        Delta
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted uppercase">
                                        After
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted uppercase">
                                        Unit cost
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted uppercase">
                                        Reference
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted uppercase">
                                        By
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="py-10 text-center text-muted"
                                        >
                                            No movements match these filters.
                                        </td>
                                    </tr>
                                )}
                                {movements.data.map((movement) => (
                                    <tr
                                        key={movement.id}
                                        className="border-b border-line/80 align-top"
                                    >
                                        <td className="px-4 py-4 whitespace-nowrap text-ink-soft">
                                            {formatDate(movement.created_at)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="font-medium text-ink">
                                                {movement.product_name ?? '—'}
                                            </p>
                                            {movement.notes && (
                                                <p className="mt-1 text-xs text-muted">
                                                    {movement.notes}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-ink-soft">
                                            {movement.type_label}
                                        </td>
                                        <td
                                            className={`px-4 py-4 tabular-nums ${
                                                movement.quantity_delta > 0
                                                    ? 'text-green-700'
                                                    : 'text-amber-800'
                                            }`}
                                        >
                                            {movement.quantity_delta > 0
                                                ? `+${movement.quantity_delta}`
                                                : movement.quantity_delta}
                                        </td>
                                        <td className="px-4 py-4 text-ink-soft tabular-nums">
                                            {movement.quantity_after}
                                        </td>
                                        <td className="px-4 py-4 text-ink-soft tabular-nums">
                                            {movement.unit_cost != null
                                                ? formatMoney(movement.unit_cost)
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-4 text-ink-soft">
                                            {movement.reference?.type ===
                                                'purchased_order' &&
                                            movement.reference
                                                .purchased_order ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openPurchaseOrderDetail(
                                                            movement.reference
                                                                .purchased_order,
                                                        )
                                                    }
                                                    className="cursor-pointer text-left text-teal-800 underline-offset-2 transition hover:underline focus:underline focus:outline-none"
                                                >
                                                    {formatPurchaseOrderReference(
                                                        movement.reference,
                                                    )}
                                                </button>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-ink-soft">
                                            {movement.created_by ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {movements.last_page > 1 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {movements.links.map((link, index) => (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url || '#'}
                                    preserveState
                                    preserveScroll
                                    className={`min-h-11 min-w-11 rounded-md border px-3 text-sm ${
                                        link.active
                                            ? 'border-teal-700 bg-teal-700 text-paper'
                                            : link.url
                                              ? 'border-line bg-white text-ink-soft hover:border-ink/30'
                                              : 'pointer-events-none border-line/50 text-muted'
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <InventoryAdjustModal
                open={Boolean(adjustProduct)}
                product={adjustProduct}
                onClose={() => setAdjustProduct(null)}
            />

            <InventorySettingsModal
                open={Boolean(settingsProduct)}
                product={settingsProduct}
                onClose={() => setSettingsProduct(null)}
            />

            <PurchasedOrderDetailModal
                open={Boolean(detailOrder)}
                order={detailOrder}
                onClose={closePurchaseOrderDetail}
            />
        </AppLayout>
    );
}

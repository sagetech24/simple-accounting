import { Link, router } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import InventoryAdjustModal from '@/components/inventory-adjust-modal';
import InventorySettingsModal from '@/components/inventory-settings-modal';
import PurchasedOrderDetailModal from '@/components/purchased-order-detail-modal';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { formatQuantityWithUnit } from '@/lib/format-product-label';
import { index as purchasedOrdersIndex } from '@/routes/purchased-orders';
import { index as inventoryIndex } from '@/routes/inventory';

const focusRing =
    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none';

function availabilityBadgeClass(availability) {
    switch (availability) {
        case 'in_stock':
            return 'border-green-600/30 bg-green-400/10 text-green-700';
        case 'out_of_stock':
            return 'border-amber-600/30 bg-amber-400/10 text-amber-800';
        case 'unavailable':
            return 'border-red-600/30 bg-red-400/10 text-red-700';
        case 'discontinued':
            return 'border-line bg-mist text-muted';
        default:
            return 'border-line bg-mist text-muted';
    }
}

function movementTypeBadgeClass(type) {
    switch (type) {
        case 'receipt':
            return 'border-green-600/30 bg-green-400/10 text-green-700';
        case 'adjustment':
            return 'border-amber-600/30 bg-amber-400/10 text-amber-800';
        case 'sale':
            return 'border-teal-600/30 bg-teal-400/10 text-teal-800';
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

function Badge({ className, children }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}
        >
            {children}
        </span>
    );
}

function SortIcon({ active, direction }) {
    if (!active) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="ml-1 size-3.5 shrink-0 text-muted/50"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                />
            </svg>
        );
    }

    return direction === 'asc' ? (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="ml-1 size-3.5 shrink-0 text-teal-700"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 15.75 7.5-7.5 7.5 7.5"
            />
        </svg>
    ) : (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="ml-1 size-3.5 shrink-0 text-teal-700"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
        </svg>
    );
}

function SortableHeader({ column, label, align = 'left', sort, direction, onSort }) {
    const active = sort === column;
    const nextDirection = active && direction === 'asc' ? 'desc' : 'asc';
    const isRight = align === 'right';

    return (
        <th
            scope="col"
            className={`px-4 py-2.5 font-medium ${isRight ? 'text-right' : 'text-left'}`}
        >
            <button
                type="button"
                onClick={() => onSort(column, nextDirection)}
                className={`inline-flex min-h-11 cursor-pointer items-center uppercase transition duration-150 hover:text-ink ${focusRing} ${
                    isRight ? 'justify-end' : ''
                } ${active ? 'text-ink' : 'text-muted'}`}
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

function SummaryCard({ label, value, hint, tone = 'text-ink', emphasis, onClick, pressed }) {
    const interactive = typeof onClick === 'function';
    const className = `flex min-h-24 w-full flex-col justify-between rounded-md border p-4 text-left transition duration-150 ${
        emphasis || pressed
            ? 'border-teal-700 bg-mist'
            : 'border-line bg-white'
    } ${
        interactive
            ? `cursor-pointer hover:border-teal-600 hover:bg-mist/70 ${focusRing}`
            : ''
    }`;

    const body = (
        <>
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
                {label}
            </p>
            <p
                className={`mt-3 text-xl font-semibold tracking-tight tabular-nums ${tone}`}
            >
                {value}
            </p>
            {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </>
    );

    if (interactive) {
        return (
            <button
                type="button"
                onClick={onClick}
                aria-pressed={pressed}
                className={className}
            >
                {body}
            </button>
        );
    }

    return <div className={className}>{body}</div>;
}

function EmptyState({ title, description, action }) {
    return (
        <div className="rounded-md border border-line bg-white px-4 py-10 text-center">
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                {description}
            </p>
            {action ? <div className="mt-4">{action}</div> : null}
        </div>
    );
}

function Pagination({ paginator }) {
    if (!paginator || paginator.last_page <= 1) {
        return null;
    }

    return (
        <nav
            aria-label="Pagination"
            className="flex flex-wrap gap-2"
        >
            {paginator.links.map((link, index) => (
                <Link
                    key={`${link.label}-${index}`}
                    href={link.url || '#'}
                    preserveState
                    preserveScroll
                    className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border px-3 text-sm transition duration-150 ${focusRing} ${
                        link.active
                            ? 'border-teal-700 bg-teal-700 text-paper'
                            : link.url
                              ? 'border-line bg-white text-ink-soft hover:border-ink/30 hover:text-ink'
                              : 'pointer-events-none border-line/50 text-muted'
                    }`}
                    dangerouslySetInnerHTML={{
                        __html: link.label,
                    }}
                />
            ))}
        </nav>
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
            if (
                rootRef.current?.contains(event.target) ||
                event.target.closest?.('[role="menu"]')
            ) {
                return;
            }

            onClose();
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
                className={`inline-flex size-11 cursor-pointer items-center justify-center rounded-md text-ink-soft transition duration-150 hover:bg-mist hover:text-ink ${focusRing}`}
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
                        className={`block w-full cursor-pointer px-3 py-2.5 text-left text-sm text-ink-soft transition duration-150 hover:bg-mist hover:text-ink ${focusRing}`}
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
                        className={`block w-full cursor-pointer px-3 py-2.5 text-left text-sm text-ink-soft transition duration-150 hover:bg-mist hover:text-ink ${focusRing}`}
                    >
                        Adjust stock
                    </button>
                </div>
            )}
        </div>
    );
}

function ProductCard({
    product,
    openMenu,
    onToggleMenu,
    onCloseMenu,
    onAdjust,
    onSettings,
}) {
    const qtyTone =
        product.quantity === 0 || product.is_low_stock
            ? 'text-warn'
            : 'text-ink';
    const menuOpen =
        openMenu?.id === product.id && openMenu?.surface === 'card';

    return (
        <article className="flex flex-col gap-3 rounded-md border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium wrap-break-word text-ink">
                        {product.name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge
                            className={availabilityBadgeClass(
                                product.availability,
                            )}
                        >
                            {product.availability_label}
                        </Badge>
                        {product.is_low_stock ? (
                            <Badge className="border-amber-600/30 bg-amber-400/10 text-amber-800">
                                Low stock
                            </Badge>
                        ) : null}
                    </div>
                </div>
                <RowActionsMenu
                    product={product}
                    open={menuOpen}
                    onToggle={() => onToggleMenu(product.id, 'card')}
                    onClose={onCloseMenu}
                    onAdjust={onAdjust}
                    onSettings={onSettings}
                />
            </div>
            <dl className="grid grid-cols-2 gap-3 border-t border-line pt-3 sm:grid-cols-3">
                <div>
                    <dt className="text-xs tracking-wide text-muted uppercase">
                        On hand
                    </dt>
                    <dd
                        className={`mt-0.5 text-sm font-semibold tabular-nums ${qtyTone}`}
                    >
                        {formatQuantityWithUnit(
                            product.quantity,
                            product.unit,
                        )}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs tracking-wide text-muted uppercase">
                        Selling price
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium text-price tabular-nums">
                        {formatMoney(product.selling_price)}
                    </dd>
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <dt className="text-xs tracking-wide text-muted uppercase">
                        Threshold
                    </dt>
                    <dd className="mt-0.5 text-sm text-ink-soft tabular-nums">
                        {product.low_stock_threshold != null
                            ? product.low_stock_threshold
                            : '—'}
                    </dd>
                </div>
            </dl>
        </article>
    );
}

function MovementCard({ movement, onOpenPurchaseOrder }) {
    const deltaPositive = movement.quantity_delta > 0;
    const purchaseOrderReference =
        movement.reference?.type === 'purchased_order' &&
        movement.reference.purchased_order
            ? movement.reference
            : null;
    const salesOrderReference =
        movement.reference?.type === 'sales_order' &&
        movement.reference.sales_order
            ? movement.reference
            : null;

    return (
        <article className="flex flex-col gap-3 rounded-md border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium wrap-break-word text-ink">
                        {movement.product_name ?? '—'}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                        {formatDate(movement.created_at)}
                    </p>
                </div>
                <Badge className={movementTypeBadgeClass(movement.type)}>
                    {movement.type_label}
                </Badge>
            </div>
            {movement.notes ? (
                <p className="text-sm text-muted">{movement.notes}</p>
            ) : null}
            <dl className="grid grid-cols-2 gap-3 border-t border-line pt-3 sm:grid-cols-4">
                <div>
                    <dt className="text-xs tracking-wide text-muted uppercase">
                        Delta
                    </dt>
                    <dd
                        className={`mt-0.5 text-sm font-semibold tabular-nums ${
                            deltaPositive ? 'text-green-700' : 'text-warn'
                        }`}
                    >
                        {deltaPositive
                            ? `+${movement.quantity_delta}`
                            : movement.quantity_delta}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs tracking-wide text-muted uppercase">
                        After
                    </dt>
                    <dd className="mt-0.5 text-sm text-ink-soft tabular-nums">
                        {formatQuantityWithUnit(
                            movement.quantity_after,
                            movement.product_unit,
                        )}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs tracking-wide text-muted uppercase">
                        Unit cost
                    </dt>
                    <dd className="mt-0.5 text-sm text-ink-soft tabular-nums">
                        {movement.unit_cost != null
                            ? formatMoney(movement.unit_cost)
                            : '—'}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs tracking-wide text-muted uppercase">
                        By
                    </dt>
                    <dd className="mt-0.5 truncate text-sm text-ink-soft">
                        {movement.created_by ?? '—'}
                    </dd>
                </div>
            </dl>
            {purchaseOrderReference ? (
                <button
                    type="button"
                    onClick={() =>
                        onOpenPurchaseOrder(
                            purchaseOrderReference.purchased_order,
                        )
                    }
                    className={`self-start cursor-pointer text-sm font-medium text-teal-800 underline-offset-2 transition duration-150 hover:underline ${focusRing}`}
                >
                    {formatPurchaseOrderReference(purchaseOrderReference)}
                </button>
            ) : null}
            {salesOrderReference ? (
                <p className="self-start text-sm font-medium text-teal-800">
                    {formatSalesOrderReference(salesOrderReference)}
                </p>
            ) : null}
        </article>
    );
}

function formatPurchaseOrderReference(reference) {
    if (!reference?.label) {
        return reference?.id ? `PO ${reference.id}` : 'PO';
    }

    return `PO ${String(reference.label).slice(0, 8)}`;
}

function formatSalesOrderReference(reference) {
    if (!reference?.label) {
        return reference?.id ? `SO ${reference.id}` : 'SO';
    }

    return `SO ${String(reference.label).slice(0, 8)}`;
}

export default function InventoryIndex({
    tab = 'on-hand',
    products,
    movements,
    summary = null,
    categories = [],
    movementTypes = [],
    filters,
}) {
    const [q, setQ] = useState(filters?.q ?? '');
    const [category, setCategory] = useState(filters?.category ?? '');
    const [type, setType] = useState(filters?.type ?? '');
    // Track surface so card + table menus (both mounted via CSS) never open together.
    const [openMenu, setOpenMenu] = useState(null);
    const [adjustProduct, setAdjustProduct] = useState(null);
    const [settingsProduct, setSettingsProduct] = useState(null);
    const [detailOrder, setDetailOrder] = useState(null);

    function toggleMenu(productId, surface) {
        setOpenMenu((current) =>
            current?.id === productId && current?.surface === surface
                ? null
                : { id: productId, surface },
        );
    }

    function closeMenu() {
        setOpenMenu(null);
    }

    const sort = filters?.sort ?? (tab === 'movements' ? 'created_at' : 'stock');
    const direction =
        filters?.direction ?? (tab === 'movements' ? 'desc' : 'asc');
    const stockHealth = filters?.stock_health ?? '';

    function visitIndex(params) {
        router.get(inventoryIndex.url(), params, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    }

    function currentParams(overrides = {}) {
        return {
            tab,
            q: q || undefined,
            category: tab === 'on-hand' && category ? category : undefined,
            stock_health:
                tab === 'on-hand' && stockHealth ? stockHealth : undefined,
            type: tab === 'movements' && type ? type : undefined,
            sort: sort || undefined,
            direction: direction || undefined,
            ...overrides,
        };
    }

    function switchTab(nextTab) {
        closeMenu();
        setQ('');
        setCategory('');
        setType('');
        visitIndex({
            tab: nextTab,
            sort: nextTab === 'movements' ? 'created_at' : 'stock',
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

    function toggleStockHealth(value) {
        visitIndex(
            currentParams({
                stock_health: stockHealth === value ? undefined : value,
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

    const hasFilters =
        Boolean(filters?.q) ||
        Boolean(filters?.category) ||
        Boolean(filters?.type) ||
        Boolean(filters?.stock_health);

    const productCount = summary?.product_count ?? products?.total ?? 0;
    const lowStockCount = summary?.low_stock_count ?? 0;
    const outOfStockCount = summary?.out_of_stock_count ?? 0;
    const onHandUnits = summary?.on_hand_units ?? 0;
    const stockValue = summary?.stock_value ?? '0.00';

    return (
        <AppLayout title="Inventory">
            <div className="p-4 pb-0">
                <header>
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                        Inventory
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        On-hand stock and movement history. Receiving stays on
                        Purchased Orders.
                    </p>
                </header>
            </div>

            <div className="mt-4 border-b border-line px-4">
                <div
                    role="tablist"
                    aria-label="Inventory views"
                    className="flex gap-2 overflow-x-auto"
                >
                    <button
                        type="button"
                        role="tab"
                        id="tab-on-hand"
                        aria-selected={tab === 'on-hand'}
                        aria-controls="panel-on-hand"
                        onClick={() => switchTab('on-hand')}
                        className={`min-h-11 shrink-0 cursor-pointer border-b-2 px-4 text-sm font-medium transition duration-150 ${focusRing} ${
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
                        className={`min-h-11 shrink-0 cursor-pointer border-b-2 px-4 text-sm font-medium transition duration-150 ${focusRing} ${
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
                    className="space-y-5 p-4"
                >
                    <section
                        aria-label="Inventory rollup"
                        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
                    >
                        <SummaryCard
                            label="Products"
                            value={productCount}
                            hint={
                                hasFilters && !stockHealth
                                    ? 'Matching filters'
                                    : `${onHandUnits.toLocaleString()} units on hand`
                            }
                        />
                        <SummaryCard
                            label="Low stock"
                            value={lowStockCount}
                            hint={
                                lowStockCount > 0
                                    ? 'At or below threshold'
                                    : 'All above threshold'
                            }
                            tone={
                                lowStockCount > 0 ? 'text-warn' : 'text-ink'
                            }
                            pressed={stockHealth === 'low'}
                            onClick={() => toggleStockHealth('low')}
                        />
                        <SummaryCard
                            label="Out of stock"
                            value={outOfStockCount}
                            hint={
                                outOfStockCount > 0
                                    ? 'Available products at zero'
                                    : 'None at zero'
                            }
                            tone={
                                outOfStockCount > 0 ? 'text-warn' : 'text-ink'
                            }
                            pressed={stockHealth === 'out'}
                            onClick={() => toggleStockHealth('out')}
                        />
                        <SummaryCard
                            label="Stock value"
                            value={formatMoney(stockValue)}
                            hint="At purchase cost"
                            tone="text-teal-700"
                            emphasis
                        />
                    </section>

                    <form
                        onSubmit={submitSearch}
                        className="flex flex-col gap-3 lg:flex-row lg:items-end"
                    >
                        <div className="min-w-0 flex-1 lg:max-w-md">
                            <label
                                htmlFor="inventory-q"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Search products
                            </label>
                            <input
                                id="inventory-q"
                                type="search"
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Name or description…"
                                className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            />
                        </div>
                        <div className="lg:w-52">
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
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="submit"
                                className={`min-h-11 cursor-pointer rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition duration-150 hover:bg-teal-800 ${focusRing}`}
                            >
                                Search
                            </button>
                            {hasFilters ? (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className={`min-h-11 cursor-pointer rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition duration-150 hover:border-ink/30 hover:text-ink ${focusRing}`}
                                >
                                    Clear
                                </button>
                            ) : null}
                        </div>
                    </form>

                    {stockHealth ? (
                        <p className="text-sm text-muted" aria-live="polite">
                            Showing{' '}
                            <span className="font-medium text-ink">
                                {stockHealth === 'low'
                                    ? 'low stock'
                                    : 'out of stock'}
                            </span>{' '}
                            products
                            {products.total > 0
                                ? ` · ${products.total} ${products.total === 1 ? 'match' : 'matches'}`
                                : null}
                        </p>
                    ) : null}

                    <section
                        aria-labelledby="inventory-on-hand-heading"
                        className="space-y-3"
                    >
                        <h3
                            id="inventory-on-hand-heading"
                            className="text-lg font-semibold text-ink"
                        >
                            On-hand stock
                        </h3>

                        {products.data.length === 0 ? (
                            <EmptyState
                                title={
                                    hasFilters
                                        ? 'No matching products'
                                        : 'No products yet'
                                }
                                description={
                                    hasFilters
                                        ? 'Try a different search, category, or stock-health filter.'
                                        : 'Add products in Admin, then receive purchase orders to build on-hand stock.'
                                }
                                action={
                                    hasFilters ? (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className={`inline-flex min-h-11 cursor-pointer items-center rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition duration-150 hover:border-ink/30 hover:text-ink ${focusRing}`}
                                        >
                                            Clear filters
                                        </button>
                                    ) : (
                                        <Link
                                            href={purchasedOrdersIndex.url()}
                                            className={`inline-flex min-h-11 cursor-pointer items-center rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition duration-150 hover:bg-teal-800 ${focusRing}`}
                                        >
                                            Go to Purchased Orders
                                        </Link>
                                    )
                                }
                            />
                        ) : (
                            <>
                                <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                                    {products.data.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            openMenu={openMenu}
                                            onToggleMenu={toggleMenu}
                                            onCloseMenu={closeMenu}
                                            onAdjust={setAdjustProduct}
                                            onSettings={setSettingsProduct}
                                        />
                                    ))}
                                </div>

                                <div className="hidden rounded-md border border-line lg:block">
                                    <table className="w-full min-w-170 border-collapse text-left text-sm">
                                        <caption className="sr-only">
                                            On-hand inventory by product
                                        </caption>
                                        <thead className="bg-mist">
                                            <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
                                                <SortableHeader
                                                    column="name"
                                                    label="Product"
                                                    sort={sort}
                                                    direction={direction}
                                                    onSort={sortBy}
                                                />
                                                <SortableHeader
                                                    column="quantity"
                                                    label="On hand"
                                                    align="right"
                                                    sort={sort}
                                                    direction={direction}
                                                    onSort={sortBy}
                                                />
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 text-right font-medium"
                                                >
                                                    Selling price
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 font-medium"
                                                >
                                                    Availability
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="w-12 px-4 py-2.5 text-right"
                                                >
                                                    <span className="sr-only">
                                                        Actions
                                                    </span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.data.map((product) => {
                                                const qtyTone =
                                                    product.quantity === 0 ||
                                                    product.is_low_stock
                                                        ? 'font-semibold text-warn'
                                                        : 'text-ink-soft';

                                                return (
                                                    <tr
                                                        key={product.id}
                                                        className="border-b border-line/70 transition duration-150 last:border-0 hover:bg-mist/60"
                                                    >
                                                        <td className="px-4 py-2">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="font-medium text-ink">
                                                                    {
                                                                        product.name
                                                                    }
                                                                </p>
                                                                {product.is_low_stock ? (
                                                                    <Badge className="border-amber-600/30 bg-amber-400/10 text-amber-800">
                                                                        Low
                                                                        stock
                                                                    </Badge>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                        <td
                                                            className={`px-4 py-2 text-right tabular-nums ${qtyTone}`}
                                                        >
                                                            {formatQuantityWithUnit(
                                                                product.quantity,
                                                                product.unit,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-medium text-price tabular-nums">
                                                            {formatMoney(
                                                                product.selling_price,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <Badge
                                                                className={availabilityBadgeClass(
                                                                    product.availability,
                                                                )}
                                                            >
                                                                {
                                                                    product.availability_label
                                                                }
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <RowActionsMenu
                                                                product={
                                                                    product
                                                                }
                                                                open={
                                                                    openMenu?.id ===
                                                                        product.id &&
                                                                    openMenu?.surface ===
                                                                        'table'
                                                                }
                                                                onToggle={() =>
                                                                    toggleMenu(
                                                                        product.id,
                                                                        'table',
                                                                    )
                                                                }
                                                                onClose={
                                                                    closeMenu
                                                                }
                                                                onAdjust={
                                                                    setAdjustProduct
                                                                }
                                                                onSettings={
                                                                    setSettingsProduct
                                                                }
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <Pagination paginator={products} />
                            </>
                        )}
                    </section>
                </div>
            )}

            {tab === 'movements' && movements && (
                <div
                    role="tabpanel"
                    id="panel-movements"
                    aria-labelledby="tab-movements"
                    className="space-y-5 p-4"
                >
                    <form
                        onSubmit={submitSearch}
                        className="flex flex-col gap-3 lg:flex-row lg:items-end"
                    >
                        <div className="min-w-0 flex-1 lg:max-w-md">
                            <label
                                htmlFor="movements-q"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Search movements
                            </label>
                            <input
                                id="movements-q"
                                type="search"
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Product, notes, or user…"
                                className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            />
                        </div>
                        <div className="lg:w-52">
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
                                    <option
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="submit"
                                className={`min-h-11 cursor-pointer rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition duration-150 hover:bg-teal-800 ${focusRing}`}
                            >
                                Search
                            </button>
                            {hasFilters ? (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className={`min-h-11 cursor-pointer rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition duration-150 hover:border-ink/30 hover:text-ink ${focusRing}`}
                                >
                                    Clear
                                </button>
                            ) : null}
                        </div>
                    </form>

                    <section
                        aria-labelledby="inventory-movements-heading"
                        className="space-y-3"
                    >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h3
                                id="inventory-movements-heading"
                                className="text-lg font-semibold text-ink"
                            >
                                Stock movements
                            </h3>
                            <p className="text-sm text-muted">
                                {movements.total}{' '}
                                {movements.total === 1
                                    ? 'movement'
                                    : 'movements'}
                            </p>
                        </div>

                        {movements.data.length === 0 ? (
                            <EmptyState
                                title={
                                    hasFilters
                                        ? 'No matching movements'
                                        : 'No movements yet'
                                }
                                description={
                                    hasFilters
                                        ? 'Try a different search or movement type.'
                                        : 'Receipts appear when you receive a purchase order. Adjustments are logged from this page or Admin.'
                                }
                                action={
                                    hasFilters ? (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className={`inline-flex min-h-11 cursor-pointer items-center rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition duration-150 hover:border-ink/30 hover:text-ink ${focusRing}`}
                                        >
                                            Clear filters
                                        </button>
                                    ) : (
                                        <Link
                                            href={purchasedOrdersIndex.url()}
                                            className={`inline-flex min-h-11 cursor-pointer items-center rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition duration-150 hover:bg-teal-800 ${focusRing}`}
                                        >
                                            Go to Purchased Orders
                                        </Link>
                                    )
                                }
                            />
                        ) : (
                            <>
                                <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                                    {movements.data.map((movement) => (
                                        <MovementCard
                                            key={movement.id}
                                            movement={movement}
                                            onOpenPurchaseOrder={
                                                openPurchaseOrderDetail
                                            }
                                        />
                                    ))}
                                </div>

                                <div className="hidden overflow-x-auto rounded-md border border-line lg:block">
                                    <table className="w-full min-w-220 border-collapse text-left text-sm">
                                        <caption className="sr-only">
                                            Stock movement ledger
                                        </caption>
                                        <thead className="bg-mist">
                                            <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
                                                <SortableHeader
                                                    column="created_at"
                                                    label="Date"
                                                    sort={sort}
                                                    direction={direction}
                                                    onSort={sortBy}
                                                />
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 font-medium"
                                                >
                                                    Product
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 font-medium"
                                                >
                                                    Type
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 text-right font-medium"
                                                >
                                                    Delta
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 text-right font-medium"
                                                >
                                                    After
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 text-right font-medium"
                                                >
                                                    Unit cost
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 font-medium"
                                                >
                                                    Reference
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 font-medium"
                                                >
                                                    By
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movements.data.map((movement) => {
                                                const deltaPositive =
                                                    movement.quantity_delta > 0;
                                                const purchaseOrderReference =
                                                    movement.reference
                                                        ?.type ===
                                                        'purchased_order' &&
                                                    movement.reference
                                                        .purchased_order
                                                        ? movement.reference
                                                        : null;
                                                const salesOrderReference =
                                                    movement.reference
                                                        ?.type ===
                                                        'sales_order' &&
                                                    movement.reference
                                                        .sales_order
                                                        ? movement.reference
                                                        : null;

                                                return (
                                                    <tr
                                                        key={movement.id}
                                                        className="border-b border-line/70 align-top transition duration-150 last:border-0 hover:bg-mist/60"
                                                    >
                                                        <td className="px-4 py-2 whitespace-nowrap text-ink-soft">
                                                            {formatDate(
                                                                movement.created_at,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <p className="font-medium text-ink">
                                                                {movement.product_name ??
                                                                    '—'}
                                                            </p>
                                                            {movement.notes ? (
                                                                <p className="mt-1 text-xs text-muted">
                                                                    {
                                                                        movement.notes
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <Badge
                                                                className={movementTypeBadgeClass(
                                                                    movement.type,
                                                                )}
                                                            >
                                                                {
                                                                    movement.type_label
                                                                }
                                                            </Badge>
                                                        </td>
                                                        <td
                                                            className={`px-4 py-2 text-right font-semibold tabular-nums ${
                                                                deltaPositive
                                                                    ? 'text-green-700'
                                                                    : 'text-warn'
                                                            }`}
                                                        >
                                                            {deltaPositive
                                                                ? `+${movement.quantity_delta}`
                                                                : movement.quantity_delta}
                                                        </td>
                                                        <td className="px-4 py-2 text-right text-ink-soft tabular-nums">
                                                            {
                                                                movement.quantity_after
                                                            }
                                                        </td>
                                                        <td className="px-4 py-2 text-right text-ink-soft tabular-nums">
                                                            {movement.unit_cost !=
                                                            null
                                                                ? formatMoney(
                                                                      movement.unit_cost,
                                                                  )
                                                                : '—'}
                                                        </td>
                                                        <td className="px-4 py-2 text-ink-soft">
                                                            {purchaseOrderReference ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openPurchaseOrderDetail(
                                                                            purchaseOrderReference.purchased_order,
                                                                        )
                                                                    }
                                                                    className={`cursor-pointer text-left text-teal-800 underline-offset-2 transition duration-150 hover:underline ${focusRing}`}
                                                                >
                                                                    {formatPurchaseOrderReference(
                                                                        purchaseOrderReference,
                                                                    )}
                                                                </button>
                                                            ) : salesOrderReference ? (
                                                                <span className="text-teal-800">
                                                                    {formatSalesOrderReference(
                                                                        salesOrderReference,
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                '—'
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-ink-soft">
                                                            {movement.created_by ??
                                                                '—'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <Pagination paginator={movements} />
                            </>
                        )}
                    </section>
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

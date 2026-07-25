import { Link, router } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import {
    destroy,
    markOrdered,
    markReceived,
    restore,
} from '@/actions/App/Http/Controllers/PurchasedOrderController';
import PurchasedOrderDetailModal from '@/components/purchased-order-detail-modal';
import PurchasedOrderForm from '@/components/purchased-order-form';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { index } from '@/routes/purchased-orders';
import { index as requestQuotationsIndex } from '@/routes/request-quotations';

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

function statusBadgeClass(status) {
    return (
        {
            ordered: 'border-amber-600/30 bg-amber-400/10 text-amber-800',
            received: 'border-green-600/30 bg-green-400/10 text-green-700',
            draft: 'border-slate-500/30 bg-slate-400/10 text-slate-700',
        }[status] ?? 'border-line bg-mist text-ink-soft'
    );
}

function RowActionsMenu({
    order,
    open,
    onToggle,
    onClose,
    onEdit,
    onDelete,
    onRestore,
    onMarkOrdered,
    onMarkReceived,
}) {
    const menuId = useId();
    const rootRef = useRef(null);
    const isDeleted = Boolean(order.deleted_at);

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
                aria-label={`Actions for ${order.reference}`}
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
                    className="absolute top-0 right-12 z-20 min-w-40 rounded-md border border-line bg-white py-1 shadow-md"
                >
                    {!isDeleted && order.can_edit && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onEdit(order);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                        >
                            Edit
                        </button>
                    )}
                    {!isDeleted && order.next_action === 'mark_ordered' && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onMarkOrdered(order);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                        >
                            Mark as Ordered
                        </button>
                    )}
                    {!isDeleted && order.next_action === 'mark_received' && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onMarkReceived(order);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                        >
                            Mark as Received
                        </button>
                    )}
                    {!isDeleted && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onDelete(order);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-warn transition hover:bg-mist"
                        >
                            Delete
                        </button>
                    )}
                    {isDeleted && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onRestore(order);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                        >
                            Restore
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function PurchasedOrdersIndex({
    orders,
    suppliers,
    products,
    filters = { trashed: '' },
}) {
    const [activeTab, setActiveTab] = useState('list');
    const [formKey, setFormKey] = useState(0);
    const [editingOrder, setEditingOrder] = useState(null);
    const [detailOrder, setDetailOrder] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [trashed, setTrashed] = useState(filters.trashed ?? '');

    function openCreateTab() {
        setEditingOrder(null);
        setDetailOrder(null);
        setFormKey((current) => current + 1);
        setActiveTab('create');
        setOpenMenuId(null);
    }

    function openDetailModal(order) {
        setDetailOrder(order);
        setOpenMenuId(null);
    }

    function closeDetailModal() {
        setDetailOrder(null);
    }

    function openEditTab(order) {
        setDetailOrder(null);
        setEditingOrder(order);
        setFormKey((current) => current + 1);
        setActiveTab('create');
        setOpenMenuId(null);
    }

    function handleFormSuccess() {
        setEditingOrder(null);
        setActiveTab('list');
        setFormKey((current) => current + 1);
    }

    function cancelForm() {
        setEditingOrder(null);
        setActiveTab('list');
    }

    function visitIndex(params) {
        router.get(index.url(), params, {
            preserveState: true,
            replace: true,
        });
    }

    function applyTrashFilter(event) {
        event.preventDefault();
        visitIndex({
            trashed: trashed || undefined,
        });
    }

    function clearTrashFilter() {
        setTrashed('');
        visitIndex({});
    }

    function markOrderAsOrdered(order) {
        if (
            !window.confirm(
                `Mark purchase order “${order.reference}” as ordered?`,
            )
        ) {
            return;
        }

        router.post(markOrdered.url(order.id));
    }

    function markOrderAsReceived(order) {
        if (
            !window.confirm(
                `Mark purchase order “${order.reference}” as received?`,
            )
        ) {
            return;
        }

        router.post(markReceived.url(order.id));
    }

    function deleteOrder(order) {
        if (!window.confirm(`Delete purchase order “${order.reference}”?`)) {
            return;
        }

        setDetailOrder(null);
        router.delete(destroy.url(order.id));
    }

    function restoreOrder(order) {
        router.post(restore.url(order.id));
    }

    const formTabLabel = editingOrder
        ? 'Edit Purchase Order'
        : 'Create New Purchase Order';

    return (
        <AppLayout title="Purchased Orders">
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                        Purchased Orders
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Create purchase orders from approved quotations or
                        manually, then mark them ordered and received.
                    </p>
                    <p className="mt-1 text-sm font-medium text-muted">
                        Total: {orders.total}{' '}
                        {orders.total === 1 ? 'order' : 'orders'}
                    </p>
                </div>

                {activeTab === 'list' && (
                    <button
                        type="button"
                        onClick={openCreateTab}
                        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-teal-700 text-paper shadow-lg transition hover:bg-teal-800"
                        aria-label="Create new purchase order"
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
                )}
            </div>

            <div className="border-b border-line px-4">
                <div
                    role="tablist"
                    aria-label="Purchased order views"
                    className="flex gap-2"
                >
                    <button
                        type="button"
                        role="tab"
                        id="tab-list"
                        aria-selected={activeTab === 'list'}
                        aria-controls="panel-list"
                        onClick={() => {
                            setEditingOrder(null);
                            setActiveTab('list');
                        }}
                        className={`min-h-11 border-b-2 px-4 text-sm font-medium transition ${
                            activeTab === 'list'
                                ? 'border-teal-700 text-teal-800'
                                : 'border-transparent text-muted hover:text-ink'
                        }`}
                    >
                        Purchased Orders list
                    </button>
                    <button
                        type="button"
                        role="tab"
                        id="tab-create"
                        aria-selected={activeTab === 'create'}
                        aria-controls="panel-create"
                        onClick={openCreateTab}
                        className={`min-h-11 border-b-2 px-4 text-sm font-medium transition ${
                            activeTab === 'create'
                                ? 'border-teal-700 text-teal-800'
                                : 'border-transparent text-muted hover:text-ink'
                        }`}
                    >
                        {formTabLabel}
                    </button>
                </div>
            </div>

            {activeTab === 'list' && (
                <div
                    role="tabpanel"
                    id="panel-list"
                    aria-labelledby="tab-list"
                    className="p-4"
                >
                    <form
                        onSubmit={applyTrashFilter}
                        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                    >
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
                                className="min-h-11 rounded-md bg-teal-600 px-4 text-sm font-medium tracking-wider text-paper transition hover:bg-teal-800"
                            >
                                Filter
                            </button>
                            {filters.trashed && (
                                <button
                                    type="button"
                                    onClick={clearTrashFilter}
                                    className="min-h-11 border border-line bg-white/70 px-4 text-sm text-ink-soft transition hover:border-ink/30"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="mt-6 px-4">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="sticky top-0 bg-teal-500/10">
                                <tr className="border-b border-line text-xs tracking-wide uppercase">
                                    <th className="px-4 py-3 font-medium text-muted">
                                        Reference
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted">
                                        Supplier
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted">
                                        Source quotation
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted">
                                        Items
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted">
                                        Grand total
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted">
                                        Created
                                    </th>
                                    <th className="w-14 px-4 py-3 text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-10 text-center text-muted"
                                        >
                                            No purchase orders match these
                                            filters.
                                        </td>
                                    </tr>
                                )}
                                {orders.data.map((order) => {
                                    const isDeleted = Boolean(order.deleted_at);

                                    return (
                                        <tr
                                            key={order.id}
                                            className="border-b border-line/80 align-top"
                                        >
                                            <td className="max-w-48 px-4 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openDetailModal(order)
                                                    }
                                                    title={order.reference}
                                                    className={`block max-w-full truncate text-left font-mono text-xs break-all underline-offset-2 transition hover:underline focus:underline focus:outline-none ${
                                                        isDeleted
                                                            ? 'text-muted line-through'
                                                            : 'cursor-pointer text-teal-800'
                                                    }`}
                                                >
                                                    {order.reference}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-ink-soft">
                                                {order.supplier_name || '—'}
                                            </td>
                                            <td className="max-w-40 px-4 py-4 font-mono text-xs break-all text-ink-soft">
                                                {order.request_quotation_id &&
                                                order.request_quotation_reference ? (
                                                    <Link
                                                        href={requestQuotationsIndex.url()}
                                                        title={
                                                            order.request_quotation_reference
                                                        }
                                                        className="block max-w-full truncate text-teal-800 underline-offset-2 transition hover:underline focus:underline focus:outline-none"
                                                    >
                                                        {
                                                            order.request_quotation_reference
                                                        }
                                                    </Link>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-ink-soft">
                                                {order.item_count}
                                            </td>
                                            <td className="px-4 py-4 font-medium text-ink">
                                                {formatMoney(order.grand_total)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`rounded-full border px-3 py-1 text-xs ${statusBadgeClass(order.status)}`}
                                                >
                                                    {order.status_label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-ink-soft">
                                                {formatDate(order.created_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <RowActionsMenu
                                                    order={order}
                                                    open={
                                                        openMenuId === order.id
                                                    }
                                                    onToggle={() =>
                                                        setOpenMenuId(
                                                            (current) =>
                                                                current ===
                                                                order.id
                                                                    ? null
                                                                    : order.id,
                                                        )
                                                    }
                                                    onClose={() =>
                                                        setOpenMenuId(null)
                                                    }
                                                    onEdit={openEditTab}
                                                    onDelete={deleteOrder}
                                                    onRestore={restoreOrder}
                                                    onMarkOrdered={
                                                        markOrderAsOrdered
                                                    }
                                                    onMarkReceived={
                                                        markOrderAsReceived
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {orders.last_page > 1 && (
                        <div className="mt-8 flex flex-wrap items-center gap-2 px-4 pb-4 text-sm">
                            {orders.links.map((link, i) => {
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
                </div>
            )}

            {activeTab === 'create' && (
                <div
                    role="tabpanel"
                    id="panel-create"
                    aria-labelledby="tab-create"
                    className="p-4"
                >
                    <PurchasedOrderForm
                        key={formKey}
                        suppliers={suppliers}
                        products={products}
                        order={editingOrder}
                        onCancel={cancelForm}
                        onSuccess={handleFormSuccess}
                    />
                </div>
            )}

            <PurchasedOrderDetailModal
                open={Boolean(detailOrder)}
                order={detailOrder}
                onClose={closeDetailModal}
                onEdit={openEditTab}
                onDelete={deleteOrder}
            />
        </AppLayout>
    );
}

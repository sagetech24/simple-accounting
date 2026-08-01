import { Link, router } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import {
    destroy,
    markOrdered,
    postToAccountsPayable,
    restore,
} from '@/actions/App/Http/Controllers/PurchasedOrderController';
import PurchasedOrderDetailModal from '@/components/purchased-order-detail-modal';
import PurchasedOrderForm from '@/components/purchased-order-form';
import PurchasedOrderPrepaymentModal from '@/components/purchased-order-prepayment-modal';
import PurchasedOrderReceiveAdjustmentModal from '@/components/purchased-order-receive-adjustment-modal';
import RequestQuotationDetailModal from '@/components/request-quotation-detail-modal';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { show as accountsPayableShow } from '@/routes/accounts-payable';
import { index } from '@/routes/purchased-orders';

const trashViews = [
    { value: '', label: 'Active' },
    { value: 'with', label: 'Include deleted' },
    { value: 'only', label: 'Deleted only' },
];

const focusRing =
    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none';

function formatDateParts(value) {
    if (!value) {
        return { date: '—', time: null };
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return { date: value, time: null };
    }

    try {
        return {
            date: new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
            }).format(parsed),
            time: new Intl.DateTimeFormat(undefined, {
                timeStyle: 'short',
            }).format(parsed),
        };
    } catch {
        return { date: value, time: null };
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

function Badge({ className, children }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}
        >
            {children}
        </span>
    );
}

function SummaryCard({ label, value, hint, tone = 'text-ink', emphasis }) {
    return (
        <div
            className={`flex min-h-24 flex-col justify-between rounded-md border p-4 ${
                emphasis ? 'border-teal-700 bg-mist' : 'border-line bg-white'
            }`}
        >
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
                {label}
            </p>
            <p
                className={`mt-3 text-xl font-semibold tracking-tight tabular-nums ${tone}`}
            >
                {value}
            </p>
            {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </div>
    );
}

function PlusIcon({ className = 'size-5' }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
            />
        </svg>
    );
}

function OrderStatusBadges({ order }) {
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={statusBadgeClass(order.status)}>
                {order.status_label}
            </Badge>
            {order.is_posted_to_ap ? (
                <Link
                    href={accountsPayableShow.url({
                        supplier: order.supplier_id,
                        purchased_order: order.reference,
                    })}
                    className={`rounded-full border border-teal-700/30 bg-mist px-2.5 py-0.5 text-xs font-medium text-teal-800 underline-offset-2 transition hover:underline ${focusRing}`}
                    onClick={(event) => event.stopPropagation()}
                >
                    Posted to AP
                </Link>
            ) : null}
            {order.deleted_at ? (
                <Badge className="border-red-600/30 bg-red-400/10 text-red-700">
                    Deleted
                </Badge>
            ) : null}
        </div>
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
    onMarkReceivedWithAdjustment,
    onAddPrepayment,
    onPostToAccountsPayable,
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
                className={`inline-flex size-11 cursor-pointer items-center justify-center rounded-md text-ink-soft transition duration-150 hover:bg-mist hover:text-ink ${focusRing}`}
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
                    className="absolute top-0 right-12 z-20 min-w-44 rounded-md border border-line bg-white py-1"
                >
                    {!isDeleted && order.can_edit && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onEdit(order);
                            }}
                            className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
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
                            className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
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
                                onMarkReceivedWithAdjustment(order);
                            }}
                            className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                        >
                            Receive Orders
                        </button>
                    )}
                    {!isDeleted && order.can_add_prepayment && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onAddPrepayment(order);
                            }}
                            className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                        >
                            Add Pre-payment
                        </button>
                    )}
                    {!isDeleted && order.can_post_to_ap && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onPostToAccountsPayable(order);
                            }}
                            className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                        >
                            Post to AP
                        </button>
                    )}
                    {!isDeleted && order.is_posted_to_ap && (
                        <Link
                            role="menuitem"
                            href={accountsPayableShow.url({
                                supplier: order.supplier_id,
                                purchased_order: order.reference,
                            })}
                            className="block w-full px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                            onClick={onClose}
                        >
                            View in AP
                        </Link>
                    )}
                    {!isDeleted && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onDelete(order);
                            }}
                            className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-warn transition hover:bg-mist"
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
                            className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
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
    summary = {
        order_count: 0,
        draft_count: 0,
        ordered_count: 0,
        received_count: 0,
        posted_to_ap_count: 0,
    },
    suppliers,
    products,
    bankAccounts = [],
    paymentMethods = [],
    filters = { trashed: '' },
}) {
    const [activeTab, setActiveTab] = useState('list');
    const [formKey, setFormKey] = useState(0);
    const [editingOrder, setEditingOrder] = useState(null);
    const [detailOrder, setDetailOrder] = useState(null);
    const [detailQuotation, setDetailQuotation] = useState(null);
    const [adjustmentOrder, setAdjustmentOrder] = useState(null);
    const [prepaymentOrder, setPrepaymentOrder] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const trashed = filters.trashed ?? '';

    function openCreateTab() {
        setEditingOrder(null);
        setDetailOrder(null);
        setDetailQuotation(null);
        setAdjustmentOrder(null);
        setPrepaymentOrder(null);
        setFormKey((current) => current + 1);
        setActiveTab('create');
        setOpenMenuId(null);
    }

    function openDetailModal(order) {
        setDetailQuotation(null);
        setAdjustmentOrder(null);
        setPrepaymentOrder(null);
        setDetailOrder(order);
        setOpenMenuId(null);
    }

    function closeDetailModal() {
        setDetailOrder(null);
    }

    function openSourceQuotationDetail(order) {
        if (!order.request_quotation) {
            return;
        }

        setDetailOrder(null);
        setAdjustmentOrder(null);
        setPrepaymentOrder(null);
        setDetailQuotation(order.request_quotation);
        setOpenMenuId(null);
    }

    function closeSourceQuotationDetail() {
        setDetailQuotation(null);
    }

    function openReceiveAdjustmentModal(order) {
        setDetailOrder(null);
        setDetailQuotation(null);
        setPrepaymentOrder(null);
        setAdjustmentOrder(order);
        setOpenMenuId(null);
    }

    function closeReceiveAdjustmentModal() {
        setAdjustmentOrder(null);
    }

    function openPrepaymentModal(order) {
        setDetailOrder(null);
        setDetailQuotation(null);
        setAdjustmentOrder(null);
        setPrepaymentOrder(order);
        setOpenMenuId(null);
    }

    function closePrepaymentModal() {
        setPrepaymentOrder(null);
    }

    function openEditTab(order) {
        setDetailOrder(null);
        setDetailQuotation(null);
        setAdjustmentOrder(null);
        setPrepaymentOrder(null);
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
            preserveScroll: true,
        });
    }

    function applyTrashFilter(value) {
        visitIndex({
            trashed: value || undefined,
        });
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

    function postOrderToAccountsPayable(order) {
        if (
            !window.confirm(
                `Post purchase order “${order.reference}” to Accounts Payable for settlement?`,
            )
        ) {
            return;
        }

        router.post(postToAccountsPayable.url(order.id));
    }

    function deleteOrder(order) {
        if (!window.confirm(`Delete purchase order “${order.reference}”?`)) {
            return;
        }

        setDetailOrder(null);
        setAdjustmentOrder(null);
        router.delete(destroy.url(order.id));
    }

    function restoreOrder(order) {
        router.post(restore.url(order.id));
    }

    const formTabLabel = editingOrder
        ? 'Edit Purchase Order'
        : 'Create New Purchase Order';

    const orderedHint =
        summary.ordered_count > 0
            ? `${summary.ordered_count} awaiting receive`
            : 'None awaiting receive';

    function renderRowActions(order) {
        return (
            <RowActionsMenu
                order={order}
                open={openMenuId === order.id}
                onToggle={() =>
                    setOpenMenuId((current) =>
                        current === order.id ? null : order.id,
                    )
                }
                onClose={() => setOpenMenuId(null)}
                onEdit={openEditTab}
                onDelete={deleteOrder}
                onRestore={restoreOrder}
                onMarkOrdered={markOrderAsOrdered}
                onMarkReceivedWithAdjustment={openReceiveAdjustmentModal}
                onAddPrepayment={openPrepaymentModal}
                onPostToAccountsPayable={postOrderToAccountsPayable}
            />
        );
    }

    return (
        <AppLayout title="Purchased Orders">
            <div className="flex flex-wrap items-start justify-between gap-3 p-4 pb-0">
                <header>
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                        Purchased Orders
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Create purchase orders from approved quotations or
                        manually, then mark them ordered and received.
                    </p>
                </header>

                {activeTab === 'list' ? (
                    <button
                        type="button"
                        onClick={openCreateTab}
                        className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-medium tracking-wide text-paper transition duration-150 hover:bg-teal-800 ${focusRing}`}
                    >
                        <PlusIcon />
                        New order
                    </button>
                ) : null}
            </div>

            <div className="mt-4 border-b border-line px-4">
                <div
                    role="tablist"
                    aria-label="Purchased order views"
                    className="flex gap-2 overflow-x-auto"
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
                        className={`min-h-11 shrink-0 cursor-pointer border-b-2 px-4 text-sm font-medium transition ${
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
                        className={`min-h-11 shrink-0 cursor-pointer border-b-2 px-4 text-sm font-medium transition ${
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
                    className="space-y-5 p-4"
                >
                    <section
                        aria-label="Purchase order rollup"
                        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
                    >
                        <SummaryCard
                            label="Orders"
                            value={summary.order_count}
                            hint={`${summary.posted_to_ap_count} posted to AP`}
                        />
                        <SummaryCard
                            label="Draft"
                            value={summary.draft_count}
                            hint="Editable before ordering"
                        />
                        <SummaryCard
                            label="Ordered"
                            value={summary.ordered_count}
                            tone={
                                summary.ordered_count > 0
                                    ? 'text-warn'
                                    : 'text-ink'
                            }
                            hint={orderedHint}
                            emphasis={summary.ordered_count > 0}
                        />
                        <SummaryCard
                            label="Received"
                            value={summary.received_count}
                            tone={
                                summary.received_count > 0
                                    ? 'text-teal-700'
                                    : 'text-ink'
                            }
                            hint="Stock already received"
                        />
                    </section>

                    <div
                        role="group"
                        aria-label="Filter by trash state"
                        className="flex flex-wrap gap-2"
                    >
                        {trashViews.map((view) => {
                            const active = trashed === view.value;

                            return (
                                <button
                                    key={view.value || 'active'}
                                    type="button"
                                    onClick={() => applyTrashFilter(view.value)}
                                    aria-current={active ? 'true' : undefined}
                                    className={`inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-medium transition duration-150 ${focusRing} ${
                                        active
                                            ? 'cursor-default border-teal-700 bg-teal-700 text-paper'
                                            : 'cursor-pointer border-line bg-white text-ink-soft hover:border-teal-600 hover:text-ink'
                                    }`}
                                >
                                    {view.label}
                                </button>
                            );
                        })}
                    </div>

                    <section
                        aria-labelledby="po-orders-heading"
                        className="space-y-3"
                    >
                        <h3
                            id="po-orders-heading"
                            className="text-lg font-semibold text-ink"
                        >
                            Purchase orders
                        </h3>

                        {orders.data.length === 0 ? (
                            <div className="rounded-md border border-line bg-white px-4 py-10 text-center">
                                <p className="text-sm font-semibold text-ink">
                                    {trashed === 'only'
                                        ? 'No deleted orders'
                                        : 'No purchase orders yet'}
                                </p>
                                <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                                    {trashed === 'only'
                                        ? 'Nothing in the trash for this filter.'
                                        : 'Create a purchase order from an approved quotation or start one manually.'}
                                </p>
                                {trashed !== 'only' ? (
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            onClick={openCreateTab}
                                            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition duration-150 hover:bg-teal-800 ${focusRing}`}
                                        >
                                            <PlusIcon />
                                            New order
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            onClick={() => applyTrashFilter('')}
                                            className={`inline-flex min-h-11 cursor-pointer items-center rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition duration-150 hover:border-ink/30 hover:text-ink ${focusRing}`}
                                        >
                                            Show active orders
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                                    {orders.data.map((order) => {
                                        const created = formatDateParts(
                                            order.created_at,
                                        );
                                        const isDeleted = Boolean(
                                            order.deleted_at,
                                        );

                                        return (
                                            <div
                                                key={order.id}
                                                className="flex flex-col gap-3 rounded-md border border-line bg-white p-4"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDetailModal(
                                                                    order,
                                                                )
                                                            }
                                                            className={`text-left font-medium wrap-break-word underline-offset-2 transition hover:underline ${focusRing} ${
                                                                isDeleted
                                                                    ? 'text-muted line-through'
                                                                    : 'cursor-pointer text-teal-800'
                                                            }`}
                                                        >
                                                            {order.supplier_name ||
                                                                '—'}
                                                        </button>
                                                        <p
                                                            className="mt-1 max-w-full truncate font-mono text-xs text-muted"
                                                            title={
                                                                order.reference
                                                            }
                                                        >
                                                            {order.reference}
                                                        </p>
                                                    </div>
                                                    {renderRowActions(order)}
                                                </div>

                                                <OrderStatusBadges
                                                    order={order}
                                                />

                                                <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3">
                                                    <div>
                                                        <dt className="text-xs tracking-wide text-muted uppercase">
                                                            Items
                                                        </dt>
                                                        <dd className="mt-0.5 text-sm text-ink-soft tabular-nums">
                                                            {order.item_count}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-xs tracking-wide text-muted uppercase">
                                                            Total
                                                        </dt>
                                                        <dd className="mt-0.5 text-sm font-semibold text-ink tabular-nums">
                                                            {formatMoney(
                                                                order.grand_total,
                                                            )}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-xs tracking-wide text-muted uppercase">
                                                            Created
                                                        </dt>
                                                        <dd className="mt-0.5 text-xs text-ink-soft">
                                                            {created.date}
                                                        </dd>
                                                    </div>
                                                </dl>

                                                {order.request_quotation_id &&
                                                order.request_quotation_reference ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openSourceQuotationDetail(
                                                                order,
                                                            )
                                                        }
                                                        className={`self-start text-xs font-medium text-teal-800 underline-offset-2 transition hover:underline ${focusRing}`}
                                                    >
                                                        View source RFQ
                                                    </button>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="hidden overflow-x-auto rounded-md border border-line lg:block">
                                    <table className="w-full min-w-170 border-collapse text-left text-sm">
                                        <caption className="sr-only">
                                            Purchase orders ordered by workflow
                                            status
                                        </caption>
                                        <thead className="bg-mist">
                                            <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 font-medium"
                                                >
                                                    Supplier
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 font-medium"
                                                >
                                                    Source
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 text-right font-medium"
                                                >
                                                    Items
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 text-right font-medium"
                                                >
                                                    Grand total
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 font-medium"
                                                >
                                                    Status
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-2.5 font-medium"
                                                >
                                                    Created
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="w-14 px-4 py-2.5 text-right font-medium"
                                                >
                                                    <span className="sr-only">
                                                        Actions
                                                    </span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.data.map((order) => {
                                                const created = formatDateParts(
                                                    order.created_at,
                                                );
                                                const isDeleted = Boolean(
                                                    order.deleted_at,
                                                );

                                                return (
                                                    <tr
                                                        key={order.id}
                                                        className="border-b border-line/70 transition duration-150 last:border-0 hover:bg-mist/60"
                                                    >
                                                        <td className="px-4 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openDetailModal(
                                                                        order,
                                                                    )
                                                                }
                                                                className={`block max-w-56 truncate text-left font-medium underline-offset-2 transition hover:underline ${focusRing} ${
                                                                    isDeleted
                                                                        ? 'text-muted line-through'
                                                                        : 'cursor-pointer text-teal-800'
                                                                }`}
                                                                title={
                                                                    order.supplier_name ||
                                                                    undefined
                                                                }
                                                            >
                                                                {order.supplier_name ||
                                                                    '—'}
                                                            </button>
                                                            <p
                                                                className="mt-0.5 max-w-56 truncate font-mono text-xs text-muted"
                                                                title={
                                                                    order.reference
                                                                }
                                                            >
                                                                {
                                                                    order.reference
                                                                }
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {order.request_quotation_id &&
                                                            order.request_quotation_reference ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openSourceQuotationDetail(
                                                                            order,
                                                                        )
                                                                    }
                                                                    className={`text-sm font-medium text-teal-800 underline-offset-2 transition hover:underline ${focusRing}`}
                                                                >
                                                                    View RFQ
                                                                </button>
                                                            ) : (
                                                                <span className="text-muted">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-right text-ink-soft tabular-nums">
                                                            {order.item_count}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-semibold text-ink tabular-nums">
                                                            {formatMoney(
                                                                order.grand_total,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <OrderStatusBadges
                                                                order={order}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 text-xs text-ink-soft">
                                                            <span className="block">
                                                                {created.date}
                                                            </span>
                                                            {created.time ? (
                                                                <span className="block text-muted">
                                                                    {
                                                                        created.time
                                                                    }
                                                                </span>
                                                            ) : null}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {renderRowActions(
                                                                order,
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </section>

                    {orders.last_page > 1 ? (
                        <nav
                            aria-label="Purchase order pagination"
                            className="flex flex-wrap items-center gap-2"
                        >
                            {orders.links.map((link, i) => {
                                if (!link.url) {
                                    return (
                                        <span
                                            key={`${link.label}-${i}`}
                                            className="inline-flex min-h-11 items-center px-3 text-sm text-muted"
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
                                        preserveState
                                        preserveScroll
                                        className={`inline-flex min-h-11 cursor-pointer items-center px-3 text-sm transition duration-150 ${focusRing} ${
                                            link.active
                                                ? 'rounded-md bg-teal-700 text-paper'
                                                : 'rounded-md border border-line bg-white text-ink-soft hover:border-ink/30 hover:text-ink'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                );
                            })}
                        </nav>
                    ) : null}
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
                        onViewSourceQuotation={openSourceQuotationDetail}
                    />
                </div>
            )}

            <PurchasedOrderDetailModal
                open={Boolean(detailOrder)}
                order={detailOrder}
                onClose={closeDetailModal}
                onEdit={openEditTab}
                onDelete={deleteOrder}
                onViewSourceQuotation={openSourceQuotationDetail}
                onAddPrepayment={openPrepaymentModal}
                onPostToAccountsPayable={postOrderToAccountsPayable}
            />

            <PurchasedOrderReceiveAdjustmentModal
                key={adjustmentOrder?.id ?? 'receive-adjustment'}
                open={Boolean(adjustmentOrder)}
                order={adjustmentOrder}
                onClose={closeReceiveAdjustmentModal}
            />

            <PurchasedOrderPrepaymentModal
                key={prepaymentOrder?.id ?? 'prepayment'}
                open={Boolean(prepaymentOrder)}
                order={prepaymentOrder}
                paymentMethods={paymentMethods}
                bankAccounts={bankAccounts}
                onClose={closePrepaymentModal}
            />

            <RequestQuotationDetailModal
                open={Boolean(detailQuotation)}
                quotation={detailQuotation}
                onClose={closeSourceQuotationDetail}
            />
        </AppLayout>
    );
}

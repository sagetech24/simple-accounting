import { router } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import {
    destroy,
    destroyPayment,
    restore,
} from '@/actions/App/Http/Controllers/SalesOrderController';
import SalesDailySalesChart from '@/components/sales-daily-sales-chart';
import SalesOrderDetailModal from '@/components/sales-order-detail-modal';
import SalesOrderForm from '@/components/sales-order-form';
import SalesOrderPaymentModal from '@/components/sales-order-payment-modal';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { index } from '@/routes/sales-orders';

const trashViews = [
    { value: '', label: 'Active' },
    { value: 'with', label: 'Include Voided' },
    { value: 'only', label: 'Voided only' },
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

function Badge({ className, children }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}
        >
            {children}
        </span>
    );
}

function paymentStatusBadge(order) {
    if (order.deleted_at) {
        return (
            <Badge className="border-red-600/30 bg-red-400/10 text-red-700">
                Voided
            </Badge>
        );
    }

    const status = order.payment_status ?? 'unpaid';
    const styles = {
        unpaid: 'border-amber-600/30 bg-amber-400/10 text-amber-800',
        partial: 'border-teal-700/30 bg-teal-700/10 text-teal-800',
        paid: 'border-green-600/30 bg-green-400/10 text-green-700',
    };
    const labels = {
        unpaid: 'Unpaid',
        partial: 'Partial',
        paid: 'Paid',
    };

    return (
        <Badge className={styles[status] ?? styles.unpaid}>
            {labels[status] ?? 'Unpaid'}
        </Badge>
    );
}

function SummaryCard({ label, value, hint }) {
    return (
        <div className="flex min-h-24 flex-col justify-between rounded-md border border-line bg-white p-4">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
                {label}
            </p>
            <p className="mt-3 text-xl font-semibold tracking-tight tabular-nums text-ink">
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

function RowActionsMenu({
    order,
    open,
    onToggle,
    onClose,
    onAddPayment,
    onVoid,
    onRestore,
}) {
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

    const isDeleted = Boolean(order.deleted_at);

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={menuId}
                onClick={(event) => {
                    event.stopPropagation();
                    onToggle();
                }}
                className={`inline-flex size-11 cursor-pointer items-center justify-center rounded-md hover:scale-110 text-ink-soft transition hover:text-ink ${focusRing}`}
            >
                <span className="sr-only">Open actions</span>
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

            {open ? (
                <div
                    id={menuId}
                    role="menu"
                    className="absolute right-0 z-20 mt-1 min-w-40 rounded-md border border-line bg-white py-1 shadow-sm"
                >
                    {!isDeleted && order.can_add_payment ? (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={(event) => {
                                event.stopPropagation();
                                onClose();
                                onAddPayment(order);
                            }}
                            className="block w-full px-3 py-2.5 text-left text-sm text-ink transition hover:bg-mist"
                        >
                            Add Payment
                        </button>
                    ) : null}
                    {!isDeleted && order.can_void ? (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={(event) => {
                                event.stopPropagation();
                                onClose();
                                onVoid(order);
                            }}
                            className="block w-full px-3 py-2.5 text-left text-sm text-red-700 transition hover:bg-mist"
                        >
                            Void
                        </button>
                    ) : null}
                    {isDeleted && order.can_restore ? (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={(event) => {
                                event.stopPropagation();
                                onClose();
                                onRestore(order);
                            }}
                            className="block w-full px-3 py-2.5 text-left text-sm text-ink transition hover:bg-mist"
                        >
                            Restore
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

export default function SalesOrdersIndex({
    orders,
    summary,
    filters,
    customers,
    products,
    dailySales,
    paymentMethods = [],
    bankAccounts = [],
}) {
    const [activeTab, setActiveTab] = useState('list');
    const [formKey, setFormKey] = useState(0);
    const [detailOrder, setDetailOrder] = useState(null);
    const [paymentOrder, setPaymentOrder] = useState(null);
    const [actionsOrderId, setActionsOrderId] = useState(null);
    const trashed = filters?.trashed ?? '';

    function applyTrashFilter(value) {
        router.get(
            index.url({
                query: value ? { trashed: value } : {},
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    }

    function openCreateTab() {
        setFormKey((key) => key + 1);
        setActiveTab('create');
    }

    function openDetailModal(order) {
        setDetailOrder(order);
        setActionsOrderId(null);
    }

    function voidOrder(order) {
        if (
            !window.confirm(
                'Void this sales order? On-hand stock will be restored.',
            )
        ) {
            return;
        }

        router.delete(destroy.url(order.id), {
            preserveScroll: true,
            onSuccess: () => setDetailOrder(null),
        });
    }

    function restoreOrder(order) {
        if (
            !window.confirm(
                'Restore this sales order? Stock will be deducted again.',
            )
        ) {
            return;
        }

        router.post(restore.url(order.id), {}, {
            preserveScroll: true,
            onSuccess: () => setDetailOrder(null),
        });
    }

    function openPaymentModal(order) {
        setPaymentOrder(order);
        setActionsOrderId(null);
    }

    function voidPayment(order, payment) {
        if (!window.confirm('Void this payment?')) {
            return;
        }

        router.delete(
            destroyPayment.url({
                sales_order: order.id,
                sales_order_payment: payment.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDetailOrder(null);
                    setPaymentOrder(null);
                },
            },
        );
    }

    return (
        <AppLayout title="Sales Orders">
            <div className="rounded-md border border-line bg-white">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-4 py-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-ink">
                            Sales Orders
                        </h1>
                        <p className="mt-1 text-sm text-muted">
                            Record outbound sales and deduct stock in one step.
                        </p>
                    </div>
                    {activeTab === 'list' ? (
                        <button
                            type="button"
                            onClick={openCreateTab}
                            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition duration-150 hover:bg-teal-800 ${focusRing}`}
                        >
                            <PlusIcon />
                            Sales Order
                        </button>
                    ) : null}
                </div>

                <SalesDailySalesChart
                    labels={dailySales?.labels ?? []}
                    totals={dailySales?.totals ?? []}
                />

                <div className="border-b border-line px-4">
                    <div
                        role="tablist"
                        aria-label="Sales order views"
                        className="flex gap-2 overflow-x-auto"
                    >
                        <button
                            type="button"
                            role="tab"
                            id="tab-list"
                            aria-selected={activeTab === 'list'}
                            aria-controls="panel-list"
                            onClick={() => setActiveTab('list')}
                            className={`min-h-11 shrink-0 cursor-pointer border-b-2 px-4 text-sm font-medium transition ${
                                activeTab === 'list'
                                    ? 'border-teal-700 text-teal-800'
                                    : 'border-transparent text-muted hover:text-ink'
                            }`}
                        >
                            Sales Orders
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
                            Create Sales Order
                        </button>
                    </div>
                </div>

                {activeTab === 'list' ? (
                    <div
                        role="tabpanel"
                        id="panel-list"
                        aria-labelledby="tab-list"
                        className="space-y-5 p-4"
                    >
                        <section
                            aria-label="Sales order rollup"
                            className="grid grid-cols-2 gap-3"
                        >
                            <SummaryCard
                                label="Sales"
                                value={summary.order_count}
                                hint="Matching current filter"
                            />
                            <SummaryCard
                                label="Total value"
                                value={formatMoney(summary.grand_total_sum)}
                                hint="Sum of grand totals"
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
                                        onClick={() =>
                                            applyTrashFilter(view.value)
                                        }
                                        aria-current={
                                            active ? 'true' : undefined
                                        }
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
                            aria-labelledby="so-orders-heading"
                            className="space-y-3"
                        >
                            <h3
                                id="so-orders-heading"
                                className="text-lg font-semibold text-ink"
                            >
                                Sales orders
                            </h3>

                            {orders.data.length === 0 ? (
                                <div className="rounded-md border border-line bg-white px-4 py-10 text-center">
                                    <p className="text-sm font-semibold text-ink">
                                        {trashed === 'only'
                                            ? 'No voided sales'
                                            : 'No sales orders yet'}
                                    </p>
                                    <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                                        {trashed === 'only'
                                            ? 'Nothing in the trash for this filter.'
                                            : 'Record a sale to deduct stock and keep a sales history.'}
                                    </p>
                                    {trashed !== 'only' ? (
                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                onClick={openCreateTab}
                                                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition duration-150 hover:bg-teal-800 ${focusRing}`}
                                            >
                                                <PlusIcon />
                                                New Sales Order
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    applyTrashFilter('')
                                                }
                                                className={`inline-flex min-h-11 cursor-pointer items-center rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition duration-150 hover:border-ink/30 hover:text-ink ${focusRing}`}
                                            >
                                                Show active Sales Orders
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
                                                                {order.customer_name ||
                                                                    'Walk-in'}
                                                            </button>
                                                            <p
                                                                className="mt-1 max-w-full truncate font-mono text-xs text-muted"
                                                                title={
                                                                    order.reference
                                                                }
                                                            >
                                                                {
                                                                    order.reference
                                                                }
                                                            </p>
                                                        </div>
                                                        <RowActionsMenu
                                                            order={order}
                                                            open={
                                                                actionsOrderId ===
                                                                order.id
                                                            }
                                                            onToggle={() =>
                                                                setActionsOrderId(
                                                                    (current) =>
                                                                        current ===
                                                                        order.id
                                                                            ? null
                                                                            : order.id,
                                                                )
                                                            }
                                                            onClose={() =>
                                                                setActionsOrderId(
                                                                    null,
                                                                )
                                                            }
                                                            onAddPayment={
                                                                openPaymentModal
                                                            }
                                                            onVoid={voidOrder}
                                                            onRestore={
                                                                restoreOrder
                                                            }
                                                        />
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {paymentStatusBadge(
                                                            order,
                                                        )}
                                                        <span className="text-sm text-muted">
                                                            {order.item_count}{' '}
                                                            {order.item_count ===
                                                            1
                                                                ? 'item'
                                                                : 'items'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-end justify-between gap-2">
                                                        <p className="text-lg font-semibold tabular-nums text-ink">
                                                            {formatMoney(
                                                                order.grand_total,
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-muted">
                                                            {created.date}
                                                            {created.time
                                                                ? ` · ${created.time}`
                                                                : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="hidden overflow-x-auto rounded-md border border-line lg:block">
                                        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                                            <thead className="bg-mist">
                                                <tr className="border-b border-line text-xs tracking-wide uppercase">
                                                    <th className="px-4 py-3 font-medium text-muted">
                                                        Customer
                                                    </th>
                                                    <th className="px-4 py-3 font-medium text-muted">
                                                        Reference
                                                    </th>
                                                    <th className="px-4 py-3 font-medium text-muted">
                                                        Items
                                                    </th>
                                                    <th className="px-4 py-3 font-medium text-muted">
                                                        Total
                                                    </th>
                                                    <th className="px-4 py-3 font-medium text-muted">
                                                        Payment
                                                    </th>
                                                    <th className="px-4 py-3 font-medium text-muted">
                                                        Created
                                                    </th>
                                                    <th className="w-16 px-4 py-3 text-right">
                                                        <span className="sr-only">
                                                            Actions
                                                        </span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.data.map((order) => {
                                                    const created =
                                                        formatDateParts(
                                                            order.created_at,
                                                        );
                                                    const isDeleted = Boolean(
                                                        order.deleted_at,
                                                    );

                                                    return (
                                                        <tr
                                                            key={order.id}
                                                            className="border-b border-line hover:bg-mist/40"
                                                        >
                                                            <td className="px-4 py-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openDetailModal(
                                                                            order,
                                                                        )
                                                                    }
                                                                    className={`text-left font-medium underline-offset-2 transition hover:underline ${focusRing} ${
                                                                        isDeleted
                                                                            ? 'text-muted line-through'
                                                                            : 'cursor-pointer text-teal-800'
                                                                    }`}
                                                                >
                                                                    {order.customer_name ||
                                                                        'Walk-in'}
                                                                </button>
                                                                {isDeleted ? (
                                                                    <p className="mt-1">
                                                                        <Badge className="border-red-600/30 bg-red-400/10 text-red-700">
                                                                            Voided
                                                                        </Badge>
                                                                    </p>
                                                                ) : null}
                                                            </td>
                                                            <td className="px-4 py-3 font-mono text-xs text-muted">
                                                                {
                                                                    order.reference
                                                                }
                                                            </td>
                                                            <td className="px-4 py-3 tabular-nums text-ink-soft">
                                                                {
                                                                    order.item_count
                                                                }
                                                            </td>
                                                            <td className="px-4 py-3 font-medium tabular-nums text-ink">
                                                                {formatMoney(
                                                                    order.grand_total,
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {paymentStatusBadge(
                                                                    order,
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-ink-soft">
                                                                {created.date}
                                                                {created.time ? (
                                                                    <span className="mt-0.5 block text-xs text-muted">
                                                                        {
                                                                            created.time
                                                                        }
                                                                    </span>
                                                                ) : null}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <RowActionsMenu
                                                                    order={
                                                                        order
                                                                    }
                                                                    open={
                                                                        actionsOrderId ===
                                                                        order.id
                                                                    }
                                                                    onToggle={() =>
                                                                        setActionsOrderId(
                                                                            (
                                                                                current,
                                                                            ) =>
                                                                                current ===
                                                                                order.id
                                                                                    ? null
                                                                                    : order.id,
                                                                        )
                                                                    }
                                                                    onClose={() =>
                                                                        setActionsOrderId(
                                                                            null,
                                                                        )
                                                                    }
                                                                    onAddPayment={
                                                                        openPaymentModal
                                                                    }
                                                                    onVoid={
                                                                        voidOrder
                                                                    }
                                                                    onRestore={
                                                                        restoreOrder
                                                                    }
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {orders.links?.length > 3 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {orders.links.map((link, index) => (
                                                <button
                                                    key={`${link.label}-${index}`}
                                                    type="button"
                                                    disabled={!link.url}
                                                    onClick={() => {
                                                        if (link.url) {
                                                            router.get(
                                                                link.url,
                                                                {},
                                                                {
                                                                    preserveScroll: true,
                                                                    preserveState: true,
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                    className={`inline-flex min-h-11 items-center rounded-md border px-3 text-sm ${
                                                        link.active
                                                            ? 'border-teal-700 bg-teal-700 text-paper'
                                                            : 'border-line bg-white text-ink-soft'
                                                    } ${!link.url ? 'cursor-default opacity-50' : `cursor-pointer ${focusRing}`}`}
                                                />
                                            ))}
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </section>
                    </div>
                ) : (
                    <div
                        role="tabpanel"
                        id="panel-create"
                        aria-labelledby="tab-create"
                        className="p-4"
                    >
                        <SalesOrderForm
                            key={formKey}
                            customers={customers}
                            products={products}
                            onCancel={() => setActiveTab('list')}
                            onSuccess={() => setActiveTab('list')}
                        />
                    </div>
                )}
            </div>

            <SalesOrderDetailModal
                open={Boolean(detailOrder)}
                order={detailOrder}
                onClose={() => setDetailOrder(null)}
                onAddPayment={openPaymentModal}
                onVoidPayment={voidPayment}
                onVoid={voidOrder}
                onRestore={restoreOrder}
            />
            <SalesOrderPaymentModal
                open={Boolean(paymentOrder)}
                order={paymentOrder}
                paymentMethods={paymentMethods}
                bankAccounts={bankAccounts}
                onClose={() => setPaymentOrder(null)}
            />
        </AppLayout>
    );
}

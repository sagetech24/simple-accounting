import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { restore } from '@/actions/App/Http/Controllers/CustomerController';
import CustomerModal from '@/components/customer-modal';
import SalesOrderDetailModal from '@/components/sales-order-detail-modal';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { index as customersIndex, show } from '@/routes/customers';

const trashViews = [
    { value: '', label: 'Active' },
    { value: 'with', label: 'Include Voided' },
    { value: 'only', label: 'Voided only' },
];

const focusRing =
    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none';

function formatDate(value, withTime = false) {
    if (!value) {
        return '—';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            ...(withTime ? { timeStyle: 'short' } : {}),
        }).format(new Date(value));
    } catch {
        return value;
    }
}

function Badge({ className, children }) {
    return (
        <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs ${className}`}
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

function paymentDetails(payment) {
    const details = [];

    if (payment.platform) {
        details.push(payment.platform);
    }
    if (payment.bank_name) {
        details.push(payment.bank_name);
    }
    if (payment.reference_number) {
        details.push(`Ref ${payment.reference_number}`);
    }
    if (payment.bank_check) {
        details.push(payment.bank_check.bank_account_name || 'Bank');
        details.push(`#${payment.bank_check.check_number}`);
    }

    return details.join(' · ') || '—';
}

function Paginator({ paginator }) {
    if (!paginator?.last_page || paginator.last_page <= 1) {
        return null;
    }

    return (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {paginator.links.map((link, i) => {
                if (!link.url) {
                    return (
                        <span
                            key={`${link.label}-${i}`}
                            className="px-2 py-1 text-muted"
                            dangerouslySetInnerHTML={{ __html: link.label }}
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
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </div>
    );
}

export default function CustomerShow({
    customer,
    kpis,
    orders,
    payments,
    statuses,
    filters,
}) {
    const tab = filters.tab ?? 'orders';
    const trashed = filters.trashed ?? '';
    const isDeleted = Boolean(customer.deleted_at);
    const [editOpen, setEditOpen] = useState(false);
    const [detailOrder, setDetailOrder] = useState(null);

    function visit(overrides = {}) {
        router.get(
            show.url(customer.id),
            {
                tab,
                trashed: trashed || undefined,
                ...overrides,
            },
            { preserveState: true, replace: true },
        );
    }

    function setTab(nextTab) {
        visit({
            tab: nextTab,
            trashed: nextTab === 'orders' ? trashed || undefined : undefined,
            orders_page: undefined,
            payments_page: undefined,
        });
    }

    const contactBits = [
        customer.contact_name,
        customer.email,
        customer.phone,
    ].filter(Boolean);

    return (
        <AppLayout title={customer.name}>
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    <Link
                        href={customersIndex.url()}
                        className="cursor-pointer text-teal-800 underline-offset-2 transition hover:underline"
                    >
                        Customers
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-ink">{customer.name}</span>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-2xl font-semibold tracking-tight text-ink">
                                {customer.name}
                            </h2>
                            <Badge
                                className={
                                    customer.status === 'active'
                                        ? 'border-green-600/30 bg-green-400/10 text-green-700'
                                        : 'border-slate-500/30 bg-slate-400/10 text-slate-700'
                                }
                            >
                                {customer.status_label}
                            </Badge>
                            {isDeleted ? (
                                <Badge className="border-red-600/30 bg-red-400/10 text-red-700">
                                    Deleted
                                </Badge>
                            ) : null}
                        </div>
                        <p className="mt-1 text-sm text-ink-soft">
                            {contactBits.join(' · ') || 'No contact details'}
                        </p>
                        {customer.address ? (
                            <p className="mt-1 text-sm text-muted">
                                {customer.address}
                            </p>
                        ) : null}
                        {customer.notes ? (
                            <p className="mt-2 max-w-2xl text-sm whitespace-pre-wrap text-muted">
                                {customer.notes}
                            </p>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {!isDeleted ? (
                            <button
                                type="button"
                                onClick={() => setEditOpen(true)}
                                className={`inline-flex min-h-11 cursor-pointer items-center border border-line bg-white px-4 text-sm text-ink-soft transition hover:border-ink/30 ${focusRing}`}
                            >
                                Edit
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() =>
                                    router.post(restore.url(customer.id), {
                                        return_to: 'show',
                                    })
                                }
                                className={`inline-flex min-h-11 cursor-pointer items-center rounded-md bg-teal-700 px-4 text-sm font-medium text-paper transition hover:bg-teal-800 ${focusRing}`}
                            >
                                Restore
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-md border border-line bg-white px-4 py-3">
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Orders
                        </p>
                        <p className="mt-1 text-lg font-semibold text-ink tabular-nums">
                            {kpis.order_count}
                        </p>
                    </div>
                    <div className="rounded-md border border-line bg-white px-4 py-3">
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Lifetime sales
                        </p>
                        <p className="mt-1 text-lg font-semibold text-ink tabular-nums">
                            {formatMoney(kpis.lifetime_sales)}
                        </p>
                    </div>
                    <div className="rounded-md border border-line bg-white px-4 py-3">
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Outstanding
                        </p>
                        <p className="mt-1 text-lg font-semibold text-ink tabular-nums">
                            {formatMoney(kpis.outstanding)}
                        </p>
                    </div>
                    <div className="rounded-md border border-line bg-white px-4 py-3">
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Last order
                        </p>
                        <p className="mt-1 text-lg font-semibold text-ink">
                            {formatDate(kpis.last_order_at)}
                        </p>
                    </div>
                </div>

                <div
                    role="tablist"
                    aria-label="Customer history"
                    className="flex flex-wrap gap-2 border-b border-line pb-px"
                >
                    {[
                        { key: 'orders', label: 'Orders' },
                        { key: 'payments', label: 'Payments' },
                    ].map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            role="tab"
                            aria-selected={tab === item.key}
                            onClick={() => setTab(item.key)}
                            className={`min-h-11 cursor-pointer border-b-2 px-3 text-sm font-medium transition ${focusRing} ${
                                tab === item.key
                                    ? 'border-teal-700 text-teal-800'
                                    : 'border-transparent text-muted hover:text-ink'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {tab === 'orders' ? (
                    <div className="flex flex-col gap-4">
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
                                            visit({
                                                tab: 'orders',
                                                trashed:
                                                    view.value || undefined,
                                                orders_page: undefined,
                                            })
                                        }
                                        aria-current={
                                            active ? 'true' : undefined
                                        }
                                        className={`inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-medium transition ${focusRing} ${
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

                        {orders.data.length === 0 ? (
                            <p className="rounded-md border border-line bg-white px-4 py-10 text-center text-sm text-muted">
                                {trashed === 'only'
                                    ? 'No voided sales orders for this customer.'
                                    : 'No sales orders for this customer.'}
                            </p>
                        ) : (
                            <div className="overflow-x-auto rounded-md border border-line">
                                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                                    <thead className="bg-mist">
                                        <tr className="border-b border-line text-xs tracking-wide uppercase">
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Date
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Reference
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Items
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Total
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Paid
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Balance
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.data.map((order) => {
                                            const voided = Boolean(
                                                order.deleted_at,
                                            );

                                            return (
                                                <tr
                                                    key={order.id}
                                                    className="border-b border-line/80 last:border-b-0"
                                                >
                                                    <td className="px-3 py-3 text-ink-soft">
                                                        {formatDate(
                                                            order.created_at,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDetailOrder(
                                                                    order,
                                                                )
                                                            }
                                                            className={`text-left font-mono text-xs underline-offset-2 transition hover:underline ${focusRing} ${
                                                                voided
                                                                    ? 'text-muted line-through'
                                                                    : 'cursor-pointer text-teal-800'
                                                            }`}
                                                        >
                                                            {order.reference}
                                                        </button>
                                                    </td>
                                                    <td className="px-3 py-3 text-ink-soft tabular-nums">
                                                        {order.item_count}
                                                    </td>
                                                    <td className="px-3 py-3 font-medium text-ink tabular-nums">
                                                        {formatMoney(
                                                            order.grand_total,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-ink-soft tabular-nums">
                                                        {formatMoney(
                                                            order.amount_paid,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-ink tabular-nums">
                                                        {formatMoney(
                                                            order.balance_due,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {paymentStatusBadge(
                                                            order,
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <Paginator paginator={orders} />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {payments.data.length === 0 ? (
                            <p className="rounded-md border border-line bg-white px-4 py-10 text-center text-sm text-muted">
                                No payments recorded for this customer.
                            </p>
                        ) : (
                            <div className="overflow-x-auto rounded-md border border-line">
                                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                                    <thead className="bg-mist">
                                        <tr className="border-b border-line text-xs tracking-wide uppercase">
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Paid at
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Amount
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Method
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Details
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Sales order
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Recorded by
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.data.map((payment) => (
                                            <tr
                                                key={payment.id}
                                                className="border-b border-line/80 last:border-b-0"
                                            >
                                                <td className="px-3 py-3 text-ink-soft">
                                                    {formatDate(
                                                        payment.paid_at,
                                                        true,
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 font-medium text-ink tabular-nums">
                                                    {formatMoney(
                                                        payment.amount,
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-ink">
                                                    {payment.method ===
                                                    'post_dated_check'
                                                        ? 'PDC'
                                                        : payment.method_label}
                                                </td>
                                                <td className="px-3 py-3 text-xs text-ink-soft">
                                                    {paymentDetails(payment)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDetailOrder(
                                                                payment.sales_order,
                                                            )
                                                        }
                                                        className={`font-mono text-xs text-teal-800 underline-offset-2 transition hover:underline ${focusRing}`}
                                                    >
                                                        {
                                                            payment.sales_order_reference
                                                        }
                                                    </button>
                                                </td>
                                                <td className="px-3 py-3 text-sm text-ink-soft">
                                                    {payment.recorded_by || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <Paginator paginator={payments} />
                    </div>
                )}
            </div>

            <CustomerModal
                open={editOpen}
                mode="edit"
                customer={customer}
                statuses={statuses}
                returnTo="show"
                onClose={() => setEditOpen(false)}
            />

            <SalesOrderDetailModal
                open={Boolean(detailOrder)}
                order={detailOrder}
                onClose={() => setDetailOrder(null)}
            />
        </AppLayout>
    );
}

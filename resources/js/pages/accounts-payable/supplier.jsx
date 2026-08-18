import { Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { index as accounts } from '@/routes/accounts';
import {
    show as accountsPayableShow,
    supplier as supplierRoute,
} from '@/routes/accounts-payable';
import { index as purchasedOrdersIndex } from '@/routes/purchased-orders';

const settlementViews = [
    { value: '', label: 'All', countKey: 'order_count' },
    { value: 'open', label: 'Open', countKey: 'open_order_count' },
    { value: 'settled', label: 'Settled', countKey: 'settled_order_count' },
];

const statusBadgeClasses = {
    ordered: 'border-amber-600/30 bg-amber-400/10 text-amber-800',
    received: 'border-green-600/30 bg-green-400/10 text-green-700',
    draft: 'border-slate-500/30 bg-slate-400/10 text-slate-700',
};

const openBadgeClass = 'border-amber-600/30 bg-amber-400/10 text-amber-800';
const settledBadgeClass = 'border-green-600/30 bg-green-400/10 text-green-700';

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

function toNumber(value) {
    const amount = Number(value);

    return Number.isNaN(amount) ? 0 : amount;
}

function ChevronRightIcon({ className = 'size-4 shrink-0' }) {
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
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
        </svg>
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

function OrderBadges({ order, settled }) {
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <Badge
                className={
                    statusBadgeClasses[order.status] ??
                    'border-line bg-mist text-ink-soft'
                }
            >
                {order.status_label}
            </Badge>
            <Badge className={settled ? settledBadgeClass : openBadgeClass}>
                {settled ? 'Settled' : 'Open'}
            </Badge>
        </div>
    );
}

export default function AccountsPayableSupplier({
    supplier,
    orders = [],
    summary,
    filters,
}) {
    const settlement = filters?.settlement ?? '';
    const totalPayable = toNumber(summary?.total_payable);
    const totalPaid = toNumber(summary?.total_paid);
    const balanceDue = toNumber(summary?.balance_due);
    const orderCount = summary?.order_count ?? 0;
    const openCount = summary?.open_order_count ?? 0;
    const settledCount = summary?.settled_order_count ?? 0;
    const settledPercent =
        totalPayable > 0
            ? Math.min(100, Math.round((totalPaid / totalPayable) * 100))
            : 0;
    const fullySettled = orderCount > 0 && balanceDue <= 0;
    const isDeleted = Boolean(supplier.deleted_at);

    const visibleTotals = orders.reduce(
        (totals, order) => ({
            payable: totals.payable + toNumber(order.grand_total),
            paid: totals.paid + toNumber(order.amount_paid),
            balance: totals.balance + toNumber(order.balance_due),
        }),
        { payable: 0, paid: 0, balance: 0 },
    );

    const contactDetails = [
        { label: 'Contact', value: supplier.contact_name },
        {
            label: 'Email',
            value: supplier.email,
            href: supplier.email ? `mailto:${supplier.email}` : null,
        },
        {
            label: 'Phone',
            value: supplier.phone,
            href: supplier.phone ? `tel:${supplier.phone}` : null,
        },
    ].filter((detail) => Boolean(detail.value));

    return (
        <AppLayout title={`AP — ${supplier.name}`}>
            <div className="space-y-5 p-4">
                <header className="space-y-3">
                    <nav
                        aria-label="Breadcrumb"
                        className="flex flex-wrap items-center gap-2 text-sm text-muted"
                    >
                        <Link
                            href={accounts.url({
                                query: { tab: 'accounts-payable' },
                            })}
                            className={`rounded-md text-teal-800 underline-offset-2 transition hover:underline ${focusRing}`}
                        >
                            Accounts
                        </Link>
                        <span aria-hidden="true">/</span>
                        <span aria-current="page" className="text-ink">
                            {supplier.name}
                        </span>
                    </nav>

                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                                    {supplier.name}
                                </h2>
                                {isDeleted ? (
                                    <Badge className="border-red-600/30 bg-red-400/10 text-red-700">
                                        Deleted
                                    </Badge>
                                ) : supplier.status_label ? (
                                    <Badge
                                        className={
                                            supplier.status === 'active'
                                                ? 'border-teal-600/30 bg-mist text-teal-800'
                                                : 'border-line bg-mist text-ink-soft'
                                        }
                                    >
                                        {supplier.status_label}
                                    </Badge>
                                ) : null}
                            </div>
                            <p className="mt-1 text-sm text-muted">
                                Purchase orders posted for settlement with this
                                supplier.
                            </p>
                        </div>
                    </div>

                    {contactDetails.length > 0 ? (
                        <dl className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
                            {contactDetails.map((detail) => (
                                <div
                                    key={detail.label}
                                    className="flex items-baseline gap-2"
                                >
                                    <dt className="text-xs tracking-wide text-muted uppercase">
                                        {detail.label}
                                    </dt>
                                    <dd className="text-ink-soft">
                                        {detail.href ? (
                                            <a
                                                href={detail.href}
                                                className={`rounded-md text-teal-800 underline-offset-2 transition hover:underline ${focusRing}`}
                                            >
                                                {detail.value}
                                            </a>
                                        ) : (
                                            detail.value
                                        )}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    ) : null}
                </header>

                <section
                    aria-label="Accounts payable rollup"
                    className="space-y-3"
                >
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <SummaryCard
                            label="Posted orders"
                            value={orderCount}
                            hint={`${openCount} open · ${settledCount} settled`}
                        />
                        <SummaryCard
                            label="Total payable"
                            value={formatMoney(totalPayable)}
                        />
                        <SummaryCard
                            label="Paid"
                            value={formatMoney(totalPaid)}
                            hint={
                                totalPayable > 0
                                    ? `${settledPercent}% of payable`
                                    : undefined
                            }
                        />
                        <SummaryCard
                            label="Balance due"
                            value={formatMoney(balanceDue)}
                            tone={
                                orderCount === 0
                                    ? 'text-ink'
                                    : fullySettled
                                      ? 'text-teal-700'
                                      : 'text-warn'
                            }
                            hint={
                                orderCount === 0
                                    ? undefined
                                    : fullySettled
                                      ? 'Fully settled'
                                      : `${openCount} ${openCount === 1 ? 'order' : 'orders'} awaiting payment`
                            }
                            emphasis={orderCount > 0}
                        />
                    </div>

                    {orderCount > 0 ? (
                        <div className="rounded-md border border-line bg-white p-4">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="text-xs font-medium tracking-wide text-muted uppercase">
                                    Settlement progress
                                </p>
                                <p className="text-xs text-ink-soft tabular-nums">
                                    {formatMoney(totalPaid)} paid of{' '}
                                    {formatMoney(totalPayable)}
                                </p>
                            </div>
                            <div
                                role="progressbar"
                                aria-label="Share of payable amount already paid"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={settledPercent}
                                aria-valuetext={`${settledPercent}% settled`}
                                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-mist"
                            >
                                <div
                                    className="h-full rounded-full bg-teal-600 motion-safe:transition-[width] motion-safe:duration-300"
                                    style={{ width: `${settledPercent}%` }}
                                />
                            </div>
                            <p className="mt-2 text-xs text-muted">
                                {settledPercent}% settled ·{' '}
                                {formatMoney(balanceDue)} outstanding
                            </p>
                        </div>
                    ) : null}
                </section>

                <section
                    aria-labelledby="ap-orders-heading"
                    className="space-y-3"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3
                            id="ap-orders-heading"
                            className="text-lg font-semibold text-ink"
                        >
                            Posted purchase orders
                        </h3>
                        <div
                            role="group"
                            aria-label="Filter by settlement"
                            className="flex flex-wrap gap-2"
                        >
                            {settlementViews.map((view) => {
                                const active = settlement === view.value;

                                return (
                                    <Link
                                        key={view.value || 'all'}
                                        href={supplierRoute.url(supplier.id, {
                                            query: {
                                                settlement:
                                                    view.value || undefined,
                                            },
                                        })}
                                        preserveScroll
                                        aria-current={
                                            active ? 'true' : undefined
                                        }
                                        className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium transition duration-150 ${focusRing} ${
                                            active
                                                ? 'cursor-default border-teal-700 bg-teal-700 text-paper'
                                                : 'cursor-pointer border-line bg-white text-ink-soft hover:border-teal-600 hover:text-ink'
                                        }`}
                                    >
                                        {view.label}
                                        <span
                                            className={`text-xs tabular-nums ${
                                                active
                                                    ? 'text-paper/80'
                                                    : 'text-muted'
                                            }`}
                                        >
                                            {summary?.[view.countKey] ?? 0}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {orders.length === 0 ? (
                        <div className="rounded-md border border-line bg-white px-4 py-10 text-center">
                            <p className="text-sm font-semibold text-ink">
                                {settlement
                                    ? `No ${settlement} orders`
                                    : 'Nothing posted yet'}
                            </p>
                            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                                {settlement
                                    ? 'No posted purchase order matches this settlement filter.'
                                    : 'Post an ordered or received purchase order to start settling it here.'}
                            </p>
                            <div className="mt-4">
                                {settlement ? (
                                    <Link
                                        href={supplierRoute.url(supplier.id)}
                                        className={`inline-flex min-h-11 cursor-pointer items-center rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition duration-150 hover:border-ink/30 hover:text-ink ${focusRing}`}
                                    >
                                        Show all orders
                                    </Link>
                                ) : (
                                    <Link
                                        href={purchasedOrdersIndex.url()}
                                        className={`inline-flex min-h-11 cursor-pointer items-center rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition duration-150 hover:bg-teal-800 ${focusRing}`}
                                    >
                                        Go to Purchased Orders
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                                {orders.map((order) => {
                                    const settled = Boolean(order.is_settled);
                                    const posted = formatDateParts(
                                        order.posted_to_ap_at,
                                    );

                                    return (
                                        <Link
                                            key={order.id}
                                            href={accountsPayableShow.url({
                                                supplier: supplier.id,
                                                purchased_order:
                                                    order.reference,
                                            })}
                                            className={`flex cursor-pointer flex-col gap-3 rounded-md border border-line bg-white p-4 transition duration-150 hover:border-teal-600 hover:bg-mist ${focusRing}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="font-mono text-xs break-all text-teal-800">
                                                    {order.reference}
                                                </span>
                                                <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted" />
                                            </div>
                                            <OrderBadges
                                                order={order}
                                                settled={settled}
                                            />
                                            <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3">
                                                <div>
                                                    <dt className="text-xs tracking-wide text-muted uppercase">
                                                        Payable
                                                    </dt>
                                                    <dd className="mt-0.5 text-sm text-ink-soft tabular-nums">
                                                        {formatMoney(
                                                            order.grand_total,
                                                        )}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs tracking-wide text-muted uppercase">
                                                        Paid
                                                    </dt>
                                                    <dd className="mt-0.5 text-sm text-ink-soft tabular-nums">
                                                        {formatMoney(
                                                            order.amount_paid,
                                                        )}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs tracking-wide text-muted uppercase">
                                                        Balance
                                                    </dt>
                                                    <dd
                                                        className={`mt-0.5 text-sm font-semibold tabular-nums ${
                                                            settled
                                                                ? 'text-teal-700'
                                                                : 'text-warn'
                                                        }`}
                                                    >
                                                        {formatMoney(
                                                            order.balance_due,
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>
                                            <p className="text-xs text-muted">
                                                Posted {posted.date}
                                                {posted.time
                                                    ? ` · ${posted.time}`
                                                    : ''}
                                            </p>
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="hidden overflow-x-auto rounded-md border border-line lg:block">
                                <table className="w-full min-w-170 border-collapse text-left text-sm">
                                    <caption className="sr-only">
                                        Purchase orders posted to accounts
                                        payable for {supplier.name}
                                    </caption>
                                    <thead className="bg-mist">
                                        <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
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
                                                Status
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-2.5 text-right font-medium"
                                            >
                                                Payable
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-2.5 text-right font-medium"
                                            >
                                                Paid
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-2.5 text-right font-medium"
                                            >
                                                Balance
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-2.5 font-medium"
                                            >
                                                Posted
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => {
                                            const settled = Boolean(
                                                order.is_settled,
                                            );
                                            const posted = formatDateParts(
                                                order.posted_to_ap_at,
                                            );

                                            return (
                                                <tr
                                                    key={order.id}
                                                    className="border-b border-line/70 transition duration-150 last:border-0 hover:bg-mist/60"
                                                >
                                                    <td className="px-4 py-2">
                                                        <Link
                                                            href={accountsPayableShow.url(
                                                                {
                                                                    supplier:
                                                                        supplier.id,
                                                                    purchased_order:
                                                                        order.reference,
                                                                },
                                                            )}
                                                            aria-label={`Open settlement detail for ${order.reference}`}
                                                            className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md font-mono text-xs text-teal-800 underline-offset-2 transition hover:underline ${focusRing}`}
                                                        >
                                                            {order.reference}
                                                            <ChevronRightIcon />
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <OrderBadges
                                                            order={order}
                                                            settled={settled}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-ink-soft tabular-nums">
                                                        {formatMoney(
                                                            order.grand_total,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-ink-soft tabular-nums">
                                                        {formatMoney(
                                                            order.amount_paid,
                                                        )}
                                                    </td>
                                                    <td
                                                        className={`px-4 py-2 text-right font-semibold tabular-nums ${
                                                            settled
                                                                ? 'text-teal-700'
                                                                : 'text-warn'
                                                        }`}
                                                    >
                                                        {formatMoney(
                                                            order.balance_due,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-xs text-ink-soft">
                                                        <span className="block">
                                                            {posted.date}
                                                        </span>
                                                        {posted.time ? (
                                                            <span className="block text-muted">
                                                                {posted.time}
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-line bg-mist/60">
                                            <td
                                                colSpan={2}
                                                className="px-4 py-3 text-xs tracking-wide text-muted uppercase"
                                            >
                                                {orders.length} of {orderCount}{' '}
                                                shown
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                                                {formatMoney(
                                                    visibleTotals.payable,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                                                {formatMoney(
                                                    visibleTotals.paid,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                                                {formatMoney(
                                                    visibleTotals.balance,
                                                )}
                                            </td>
                                            <td className="px-4 py-3" />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}

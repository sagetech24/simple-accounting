import { Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { index as accounts } from '@/routes/accounts';
import { customer as customerRoute } from '@/routes/accounts-receivable';

const settlementViews = [
    { value: '', label: 'All', countKey: 'order_count' },
    { value: 'open', label: 'Open', countKey: 'open_order_count' },
    { value: 'settled', label: 'Settled', countKey: 'settled_order_count' },
];

const paymentBadgeClass = {
    unpaid: 'border-amber-600/30 bg-amber-400/10 text-amber-800',
    partial: 'border-sky-600/30 bg-sky-400/10 text-sky-800',
    paid: 'border-green-600/30 bg-green-400/10 text-green-700',
};

const paymentBadgeLabel = {
    unpaid: 'Unpaid',
    partial: 'Partial',
    paid: 'Paid',
};

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

function orderHref(order) {
    return `#${order.id}`;
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

function PaymentBadge({ status }) {
    const key = status ?? 'unpaid';

    return (
        <Badge
            className={
                paymentBadgeClass[key] ?? 'border-line bg-mist text-ink-soft'
            }
        >
            {paymentBadgeLabel[key] ?? 'Unpaid'}
        </Badge>
    );
}

function emptyCopy(settlement) {
    if (settlement === 'open') {
        return {
            title: 'No open sales orders.',
            body: 'No sales order for this customer currently has a remaining balance.',
        };
    }

    if (settlement === 'settled') {
        return {
            title: 'No settled sales orders.',
            body: 'No fully paid sales order for this customer.',
        };
    }

    return {
        title: 'No sales orders for this customer.',
        body: 'Saved-customer sales appear here for collection.',
    };
}

export default function AccountsReceivableCustomer({
    customer,
    orders = [],
    summary,
    filters,
}) {
    const settlement = filters?.settlement ?? '';
    const totalReceivable = toNumber(summary?.total_receivable);
    const totalPaid = toNumber(summary?.total_paid);
    const balanceDue = toNumber(summary?.balance_due);
    const orderCount = summary?.order_count ?? 0;
    const openCount = summary?.open_order_count ?? 0;
    const settledCount = summary?.settled_order_count ?? 0;
    const settledPercent =
        totalReceivable > 0
            ? Math.min(100, Math.round((totalPaid / totalReceivable) * 100))
            : 0;
    const fullySettled = orderCount > 0 && balanceDue <= 0;
    const isDeleted = Boolean(customer.deleted_at);
    const empty = emptyCopy(settlement);

    const contactDetails = [
        { label: 'Contact', value: customer.contact_name },
        {
            label: 'Email',
            value: customer.email,
            href: customer.email ? `mailto:${customer.email}` : null,
        },
        {
            label: 'Phone',
            value: customer.phone,
            href: customer.phone ? `tel:${customer.phone}` : null,
        },
    ].filter((detail) => Boolean(detail.value));

    return (
        <AppLayout title={`AR — ${customer.name}`}>
            <div className="space-y-5 p-4">
                <header className="space-y-3">
                    <nav
                        aria-label="Breadcrumb"
                        className="flex flex-wrap items-center gap-2 text-sm text-muted"
                    >
                        <Link
                            href={accounts.url({
                                query: { tab: 'accounts-receivable' },
                            })}
                            className={`rounded-md text-teal-800 underline-offset-2 transition hover:underline ${focusRing}`}
                        >
                            Accounts
                        </Link>
                        <span aria-hidden="true">/</span>
                        <span aria-current="page" className="text-ink">
                            {customer.name}
                        </span>
                    </nav>

                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                                    {customer.name}
                                </h2>
                                {isDeleted ? (
                                    <Badge className="border-red-600/30 bg-red-400/10 text-red-700">
                                        Deleted
                                    </Badge>
                                ) : customer.status_label ? (
                                    <Badge
                                        className={
                                            customer.status === 'active'
                                                ? 'border-teal-600/30 bg-mist text-teal-800'
                                                : 'border-line bg-mist text-ink-soft'
                                        }
                                    >
                                        {customer.status_label}
                                    </Badge>
                                ) : null}
                            </div>
                            <p className="mt-1 text-sm text-muted">
                                Sales orders for collection with this customer.
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
                    aria-label="Accounts receivable rollup"
                    className="space-y-3"
                >
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <SummaryCard
                            label="Orders"
                            value={orderCount}
                            hint={`${openCount} open · ${settledCount} settled`}
                        />
                        <SummaryCard
                            label="Total receivable"
                            value={formatMoney(totalReceivable)}
                        />
                        <SummaryCard
                            label="Paid"
                            value={formatMoney(totalPaid)}
                            hint={
                                totalReceivable > 0
                                    ? `${settledPercent}% of receivable`
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
                </section>

                <section
                    aria-labelledby="ar-orders-heading"
                    className="space-y-3"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3
                            id="ar-orders-heading"
                            className="text-lg font-semibold text-ink"
                        >
                            Sales orders
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
                                        href={customerRoute.url(customer.id, {
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
                                {empty.title}
                            </p>
                            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                                {empty.body}
                            </p>
                            {settlement ? (
                                <div className="mt-4">
                                    <Link
                                        href={customerRoute.url(customer.id)}
                                        className={`inline-flex min-h-11 cursor-pointer items-center rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition duration-150 hover:border-ink/30 hover:text-ink ${focusRing}`}
                                    >
                                        Show all orders
                                    </Link>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                                {orders.map((order) => {
                                    const created = formatDateParts(
                                        order.created_at,
                                    );
                                    const settled =
                                        toNumber(order.balance_due) <= 0;

                                    return (
                                        <Link
                                            key={order.id}
                                            href={orderHref(order)}
                                            className={`flex cursor-pointer flex-col gap-3 rounded-md border border-line bg-white p-4 transition duration-150 hover:border-teal-600 hover:bg-mist ${focusRing}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="font-mono text-xs break-all text-teal-800">
                                                    {order.reference}
                                                </span>
                                                <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted" />
                                            </div>
                                            <PaymentBadge
                                                status={order.payment_status}
                                            />
                                            <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3">
                                                <div>
                                                    <dt className="text-xs tracking-wide text-muted uppercase">
                                                        Total
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
                                                {created.date}
                                                {created.time
                                                    ? ` · ${created.time}`
                                                    : ''}
                                            </p>
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="hidden overflow-x-auto rounded-md border border-line lg:block">
                                <table className="w-full min-w-170 border-collapse text-left text-sm">
                                    <caption className="sr-only">
                                        Sales orders for collection for{' '}
                                        {customer.name}
                                    </caption>
                                    <thead className="bg-mist">
                                        <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
                                            <th
                                                scope="col"
                                                className="px-4 py-2.5 font-medium"
                                            >
                                                Date
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-2.5 font-medium"
                                            >
                                                Reference
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
                                                Total
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
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => {
                                            const created = formatDateParts(
                                                order.created_at,
                                            );
                                            const settled =
                                                toNumber(order.balance_due) <=
                                                0;

                                            return (
                                                <tr
                                                    key={order.id}
                                                    className="border-b border-line/70 transition duration-150 last:border-0 hover:bg-mist/60"
                                                >
                                                    <td className="px-4 py-2 text-ink-soft">
                                                        {created.date}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <Link
                                                            href={orderHref(
                                                                order,
                                                            )}
                                                            aria-label={`Open settlement detail for ${order.reference}`}
                                                            className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md font-mono text-xs text-teal-800 underline-offset-2 transition hover:underline ${focusRing}`}
                                                        >
                                                            {order.reference}
                                                            <ChevronRightIcon />
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-ink-soft tabular-nums">
                                                        {order.item_count}
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
                                                    <td className="px-4 py-2">
                                                        <PaymentBadge
                                                            status={
                                                                order.payment_status
                                                            }
                                                        />
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
            </div>
        </AppLayout>
    );
}

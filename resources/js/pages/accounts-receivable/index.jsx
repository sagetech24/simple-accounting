import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AccountsHubHeader from '@/components/accounts-hub-header';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { index as accounts } from '@/routes/accounts';
import { index as salesOrdersIndex } from '@/routes/sales-orders';

const sortableColumns = [
    { key: 'name', label: 'Customer', align: 'left' },
    { key: 'order_count', label: 'Orders', align: 'right' },
    { key: 'open_order_count', label: 'Open', align: 'right' },
    { key: 'total_receivable', label: 'Total receivable', align: 'right' },
    { key: 'total_paid', label: 'Paid', align: 'right' },
    { key: 'balance_due', label: 'Balance due', align: 'right' },
];

const focusRing =
    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none';

function toNumber(value) {
    const amount = Number(value);

    return Number.isNaN(amount) ? 0 : amount;
}

function customerHref(id) {
    return `#${id}`;
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

function SortableHeader({ column, label, align, sort, direction, onSort }) {
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

function Badge({ className, children }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}
        >
            {children}
        </span>
    );
}

function OpenBadge({ openCount }) {
    if (openCount <= 0) {
        return (
            <Badge className="border-green-600/30 bg-green-400/10 text-green-700">
                Settled
            </Badge>
        );
    }

    return (
        <Badge className="border-amber-600/30 bg-amber-400/10 text-amber-800">
            {openCount} open
        </Badge>
    );
}

export default function AccountsReceivableIndex({ customers = [], filters }) {
    const [q, setQ] = useState(filters?.q ?? '');
    const sort = filters?.sort ?? 'name';
    const direction = filters?.direction ?? 'asc';
    const hasSearch = Boolean(filters?.q);

    const rollup = customers.reduce(
        (totals, row) => ({
            customers: totals.customers + 1,
            orders: totals.orders + (Number(row.order_count) || 0),
            openOrders: totals.openOrders + (Number(row.open_order_count) || 0),
            customersWithBalance:
                totals.customersWithBalance +
                (toNumber(row.balance_due) > 0 ? 1 : 0),
            totalReceivable:
                totals.totalReceivable + toNumber(row.total_receivable),
            totalPaid: totals.totalPaid + toNumber(row.total_paid),
            balanceDue: totals.balanceDue + toNumber(row.balance_due),
        }),
        {
            customers: 0,
            orders: 0,
            openOrders: 0,
            customersWithBalance: 0,
            totalReceivable: 0,
            totalPaid: 0,
            balanceDue: 0,
        },
    );

    const fullySettled = rollup.customers > 0 && rollup.balanceDue <= 0;

    function visitIndex(params) {
        router.get(
            accounts.url(),
            { tab: 'accounts-receivable', ...params },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            },
        );
    }

    function currentParams(overrides = {}) {
        return {
            q: q || undefined,
            sort: sort || undefined,
            direction: direction || undefined,
            ...overrides,
        };
    }

    function submitSearch(event) {
        event.preventDefault();
        visitIndex(currentParams());
    }

    function clearFilters() {
        setQ('');
        visitIndex({
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

    return (
        <AppLayout title="Accounts">
            <AccountsHubHeader activeKey="accounts-receivable" />

            <div className="space-y-5 p-4">
                <header>
                    <h3 className="text-lg font-semibold tracking-tight text-ink">
                        Accounts Receivable
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                        Collect sales orders by customer.
                    </p>
                </header>
                <section
                    aria-label="Accounts receivable rollup"
                    className="grid grid-cols-2 gap-3 lg:grid-cols-4"
                >
                    <SummaryCard
                        label="Customers"
                        value={rollup.customers}
                        hint={
                            hasSearch
                                ? 'Matching search'
                                : `${rollup.orders} ${rollup.orders === 1 ? 'order' : 'orders'}`
                        }
                    />
                    <SummaryCard
                        label="Open orders"
                        value={rollup.openOrders}
                        hint={
                            rollup.customersWithBalance > 0
                                ? `${rollup.customersWithBalance} ${rollup.customersWithBalance === 1 ? 'customer' : 'customers'} with balance`
                                : rollup.customers > 0
                                  ? 'All customers settled'
                                  : undefined
                        }
                        tone={rollup.openOrders > 0 ? 'text-warn' : 'text-ink'}
                    />
                    <SummaryCard
                        label="Total receivable"
                        value={formatMoney(rollup.totalReceivable)}
                        hint={
                            rollup.totalReceivable > 0
                                ? `${formatMoney(rollup.totalPaid)} paid`
                                : undefined
                        }
                    />
                    <SummaryCard
                        label="Balance due"
                        value={formatMoney(rollup.balanceDue)}
                        tone={
                            rollup.customers === 0
                                ? 'text-ink'
                                : fullySettled
                                  ? 'text-teal-700'
                                  : 'text-warn'
                        }
                        hint={
                            rollup.customers === 0
                                ? undefined
                                : fullySettled
                                  ? 'Fully settled'
                                  : `${rollup.customersWithBalance} awaiting payment`
                        }
                        emphasis={rollup.customers > 0}
                    />
                </section>

                <form
                    onSubmit={submitSearch}
                    className="flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                    <div className="w-full sm:max-w-md sm:flex-1">
                        <label
                            htmlFor="ar-q"
                            className="mb-1.5 block text-sm font-medium text-ink-soft"
                        >
                            Search customers
                        </label>
                        <input
                            id="ar-q"
                            type="search"
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                            placeholder="Name, contact, email, phone…"
                            className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="submit"
                            className={`min-h-11 cursor-pointer rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition duration-150 hover:bg-teal-800 ${focusRing}`}
                        >
                            Search
                        </button>
                        {hasSearch ? (
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
                    aria-labelledby="ar-customers-heading"
                    className="space-y-3"
                >
                    <h3
                        id="ar-customers-heading"
                        className="text-lg font-semibold text-ink"
                    >
                        Customers with sales orders
                    </h3>

                    {customers.length === 0 ? (
                        <div className="rounded-md border border-line bg-white px-4 py-10 text-center">
                            <p className="text-sm font-semibold text-ink">
                                {hasSearch
                                    ? 'No matching customers'
                                    : 'No customer sales yet'}
                            </p>
                            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                                {hasSearch
                                    ? 'No customer with sales orders matches this search.'
                                    : 'Saved-customer sales orders appear here for collection.'}
                            </p>
                            <div className="mt-4">
                                {hasSearch ? (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className={`inline-flex min-h-11 cursor-pointer items-center rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition duration-150 hover:border-ink/30 hover:text-ink ${focusRing}`}
                                    >
                                        Clear search
                                    </button>
                                ) : (
                                    <Link
                                        href={salesOrdersIndex.url()}
                                        className={`inline-flex min-h-11 cursor-pointer items-center rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition duration-150 hover:bg-teal-800 ${focusRing}`}
                                    >
                                        Go to Sales Orders
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                                {customers.map((row) => {
                                    const isDeleted = Boolean(row.deleted_at);
                                    const openCount =
                                        Number(row.open_order_count) || 0;
                                    const balance = toNumber(row.balance_due);
                                    const hasBalance = balance > 0;

                                    return (
                                        <Link
                                            key={row.id}
                                            href={customerHref(row.id)}
                                            className={`flex cursor-pointer flex-col gap-3 rounded-md border border-line bg-white p-4 transition duration-150 hover:border-teal-600 hover:bg-mist ${focusRing}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p
                                                        className={`font-medium wrap-break-word ${
                                                            isDeleted
                                                                ? 'text-muted line-through'
                                                                : 'text-teal-800'
                                                        }`}
                                                    >
                                                        {row.name}
                                                    </p>
                                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                        <OpenBadge
                                                            openCount={
                                                                openCount
                                                            }
                                                        />
                                                        {isDeleted ? (
                                                            <Badge className="border-red-600/30 bg-red-400/10 text-red-700">
                                                                Deleted
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted" />
                                            </div>
                                            <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3">
                                                <div>
                                                    <dt className="text-xs tracking-wide text-muted uppercase">
                                                        Orders
                                                    </dt>
                                                    <dd className="mt-0.5 text-sm text-ink-soft tabular-nums">
                                                        {row.order_count}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs tracking-wide text-muted uppercase">
                                                        Paid
                                                    </dt>
                                                    <dd className="mt-0.5 text-sm text-ink-soft tabular-nums">
                                                        {formatMoney(
                                                            row.total_paid,
                                                        )}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs tracking-wide text-muted uppercase">
                                                        Balance
                                                    </dt>
                                                    <dd
                                                        className={`mt-0.5 text-sm font-semibold tabular-nums ${
                                                            hasBalance
                                                                ? 'text-warn'
                                                                : 'text-teal-700'
                                                        }`}
                                                    >
                                                        {formatMoney(
                                                            row.balance_due,
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="hidden overflow-x-auto rounded-md border border-line lg:block">
                                <table className="w-full min-w-170 border-collapse text-left text-sm">
                                    <caption className="sr-only">
                                        Customers with sales orders for
                                        collection
                                    </caption>
                                    <thead className="bg-mist">
                                        <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
                                            {sortableColumns.map((column) => (
                                                <SortableHeader
                                                    key={column.key}
                                                    column={column.key}
                                                    label={column.label}
                                                    align={column.align}
                                                    sort={sort}
                                                    direction={direction}
                                                    onSort={sortBy}
                                                />
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customers.map((row) => {
                                            const isDeleted = Boolean(
                                                row.deleted_at,
                                            );
                                            const openCount =
                                                Number(row.open_order_count) ||
                                                0;
                                            const balance = toNumber(
                                                row.balance_due,
                                            );
                                            const hasBalance = balance > 0;

                                            return (
                                                <tr
                                                    key={row.id}
                                                    className="border-b border-line/70 transition duration-150 last:border-0 hover:bg-mist/60"
                                                >
                                                    <td className="px-4 py-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <Link
                                                                href={customerHref(
                                                                    row.id,
                                                                )}
                                                                aria-label={`Open accounts receivable for ${row.name}`}
                                                                className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md font-medium underline-offset-2 transition hover:underline ${focusRing} ${
                                                                    isDeleted
                                                                        ? 'text-muted line-through'
                                                                        : 'text-teal-800'
                                                                }`}
                                                            >
                                                                {row.name}
                                                                <ChevronRightIcon />
                                                            </Link>
                                                            {isDeleted ? (
                                                                <Badge className="border-red-600/30 bg-red-400/10 text-red-700">
                                                                    Deleted
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-ink-soft tabular-nums">
                                                        {row.order_count}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <div className="flex justify-end">
                                                            <OpenBadge
                                                                openCount={
                                                                    openCount
                                                                }
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-ink-soft tabular-nums">
                                                        {formatMoney(
                                                            row.total_receivable,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-ink-soft tabular-nums">
                                                        {formatMoney(
                                                            row.total_paid,
                                                        )}
                                                    </td>
                                                    <td
                                                        className={`px-4 py-2 text-right font-semibold tabular-nums ${
                                                            hasBalance
                                                                ? 'text-warn'
                                                                : 'text-teal-700'
                                                        }`}
                                                    >
                                                        {formatMoney(
                                                            row.balance_due,
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-line bg-mist/60">
                                            <td className="px-4 py-3 text-xs tracking-wide text-muted uppercase">
                                                {rollup.customers}{' '}
                                                {rollup.customers === 1
                                                    ? 'customer'
                                                    : 'customers'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                                                {rollup.orders}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                                                {rollup.openOrders}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                                                {formatMoney(
                                                    rollup.totalReceivable,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                                                {formatMoney(rollup.totalPaid)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                                                {formatMoney(rollup.balanceDue)}
                                            </td>
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

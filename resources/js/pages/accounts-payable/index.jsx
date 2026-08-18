import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AccountsHubHeader from '@/components/accounts-hub-header';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { index as accounts } from '@/routes/accounts';
import { supplier as supplierRoute } from '@/routes/accounts-payable';
import { index as purchasedOrdersIndex } from '@/routes/purchased-orders';

const sortableColumns = [
    { key: 'name', label: 'Supplier', align: 'left' },
    { key: 'posted_order_count', label: 'Posted POs', align: 'right' },
    { key: 'open_order_count', label: 'Open', align: 'right' },
    { key: 'total_payable', label: 'Total payable', align: 'right' },
    { key: 'total_paid', label: 'Paid', align: 'right' },
    { key: 'balance_due', label: 'Balance due', align: 'right' },
];

const focusRing =
    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none';

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

function SupplierOpenBadge({ openCount }) {
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

export default function AccountsPayableIndex({ suppliers = [], filters }) {
    const [q, setQ] = useState(filters?.q ?? '');
    const sort = filters?.sort ?? 'name';
    const direction = filters?.direction ?? 'asc';
    const hasSearch = Boolean(filters?.q || q);

    const rollup = suppliers.reduce(
        (totals, row) => {
            const open = Number(row.open_order_count) || 0;
            const posted = Number(row.posted_order_count) || 0;

            return {
                suppliers: totals.suppliers + 1,
                postedOrders: totals.postedOrders + posted,
                openOrders: totals.openOrders + open,
                suppliersWithBalance:
                    totals.suppliersWithBalance +
                    (toNumber(row.balance_due) > 0 ? 1 : 0),
                totalPayable: totals.totalPayable + toNumber(row.total_payable),
                totalPaid: totals.totalPaid + toNumber(row.total_paid),
                balanceDue: totals.balanceDue + toNumber(row.balance_due),
            };
        },
        {
            suppliers: 0,
            postedOrders: 0,
            openOrders: 0,
            suppliersWithBalance: 0,
            totalPayable: 0,
            totalPaid: 0,
            balanceDue: 0,
        },
    );

    const fullySettled = rollup.suppliers > 0 && rollup.balanceDue <= 0;

    function visitIndex(params) {
        router.get(
            accounts.url(),
            { tab: 'accounts-payable', ...params },
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
            <AccountsHubHeader activeKey="accounts-payable" />

            <div className="space-y-5 p-4">
                <header>
                    <h3 className="text-lg font-semibold tracking-tight text-ink">
                        Accounts Payable
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                        Settle purchase orders posted from Purchased Orders by
                        supplier.
                    </p>
                </header>
                <section
                    aria-label="Accounts payable rollup"
                    className="grid grid-cols-2 gap-3 lg:grid-cols-4"
                >
                    <SummaryCard
                        label="Suppliers"
                        value={rollup.suppliers}
                        hint={
                            hasSearch
                                ? 'Matching search'
                                : `${rollup.postedOrders} posted ${rollup.postedOrders === 1 ? 'PO' : 'POs'}`
                        }
                    />
                    <SummaryCard
                        label="Open POs"
                        value={rollup.openOrders}
                        hint={
                            rollup.suppliersWithBalance > 0
                                ? `${rollup.suppliersWithBalance} ${rollup.suppliersWithBalance === 1 ? 'supplier' : 'suppliers'} with balance`
                                : rollup.suppliers > 0
                                  ? 'All suppliers settled'
                                  : undefined
                        }
                        tone={rollup.openOrders > 0 ? 'text-warn' : 'text-ink'}
                    />
                    <SummaryCard
                        label="Total payable"
                        value={formatMoney(rollup.totalPayable)}
                        hint={
                            rollup.totalPayable > 0
                                ? `${formatMoney(rollup.totalPaid)} paid`
                                : undefined
                        }
                    />
                    <SummaryCard
                        label="Balance due"
                        value={formatMoney(rollup.balanceDue)}
                        tone={
                            rollup.suppliers === 0
                                ? 'text-ink'
                                : fullySettled
                                  ? 'text-teal-700'
                                  : 'text-warn'
                        }
                        hint={
                            rollup.suppliers === 0
                                ? undefined
                                : fullySettled
                                  ? 'Fully settled'
                                  : `${rollup.suppliersWithBalance} awaiting payment`
                        }
                        emphasis={rollup.suppliers > 0}
                    />
                </section>

                <form
                    onSubmit={submitSearch}
                    className="flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                    <div className="w-full sm:max-w-md sm:flex-1">
                        <label
                            htmlFor="ap-q"
                            className="mb-1.5 block text-sm font-medium text-ink-soft"
                        >
                            Search suppliers
                        </label>
                        <input
                            id="ap-q"
                            type="search"
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                            placeholder="Name, contact, email, phone…"
                            className={`min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20`}
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
                    aria-labelledby="ap-suppliers-heading"
                    className="space-y-3"
                >
                    <h3
                        id="ap-suppliers-heading"
                        className="text-lg font-semibold text-ink"
                    >
                        Suppliers with posted orders
                    </h3>

                    {suppliers.length === 0 ? (
                        <div className="rounded-md border border-line bg-white px-4 py-10 text-center">
                            <p className="text-sm font-semibold text-ink">
                                {hasSearch
                                    ? 'No matching suppliers'
                                    : 'Nothing posted yet'}
                            </p>
                            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                                {hasSearch
                                    ? 'No supplier with posted purchase orders matches this search.'
                                    : 'Post an ordered or received purchase order to start settling by supplier.'}
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
                                {suppliers.map((row) => {
                                    const isDeleted = Boolean(row.deleted_at);
                                    const openCount =
                                        Number(row.open_order_count) || 0;
                                    const balance = toNumber(row.balance_due);
                                    const hasBalance = balance > 0;

                                    return (
                                        <Link
                                            key={row.id}
                                            href={supplierRoute.url(row.id)}
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
                                                        <SupplierOpenBadge
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
                                                        Posted
                                                    </dt>
                                                    <dd className="mt-0.5 text-sm text-ink-soft tabular-nums">
                                                        {row.posted_order_count}
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
                                        Suppliers with purchase orders posted to
                                        accounts payable
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
                                        {suppliers.map((row) => {
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
                                                                href={supplierRoute.url(
                                                                    row.id,
                                                                )}
                                                                aria-label={`Open accounts payable for ${row.name}`}
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
                                                        {row.posted_order_count}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <div className="flex justify-end">
                                                            <SupplierOpenBadge
                                                                openCount={
                                                                    openCount
                                                                }
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-ink-soft tabular-nums">
                                                        {formatMoney(
                                                            row.total_payable,
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
                                                {rollup.suppliers}{' '}
                                                {rollup.suppliers === 1
                                                    ? 'supplier'
                                                    : 'suppliers'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                                                {rollup.postedOrders}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                                                {rollup.openOrders}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                                                {formatMoney(
                                                    rollup.totalPayable,
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

import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import RouteNavTabs from '@/components/route-nav-tabs';
import AppLayout from '@/layouts/app-layout';
import { accountsDomainTabs } from '@/config/accounts-domain-tabs';
import { formatMoney } from '@/lib/format-money';
import { index, supplier as supplierRoute } from '@/routes/accounts-payable';

const sortableColumns = [
    { key: 'name', label: 'Supplier' },
    { key: 'posted_order_count', label: 'Posted POs' },
    { key: 'open_order_count', label: 'Open' },
    { key: 'total_payable', label: 'Total payable' },
    { key: 'total_paid', label: 'Paid' },
    { key: 'balance_due', label: 'Balance due' },
];

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

export default function AccountsPayableIndex({ suppliers = [], filters }) {
    const [q, setQ] = useState(filters?.q ?? '');
    const sort = filters?.sort ?? 'name';
    const direction = filters?.direction ?? 'asc';

    function visitIndex(params) {
        router.get(index.url(), params, {
            preserveState: true,
            replace: true,
        });
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
        <AppLayout title="Accounts Payable">
            <div className="flex items-start justify-between gap-4 p-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                        Accounts Payable
                    </h2>
                    <p className="text-sm text-muted">
                        Settle purchase orders posted from Purchased Orders by
                        supplier.
                    </p>
                    <p className="mt-1 text-sm font-medium text-muted">
                        Total: {suppliers.length}{' '}
                        {suppliers.length === 1 ? 'supplier' : 'suppliers'}
                    </p>
                </div>
            </div>

            <RouteNavTabs
                tabs={accountsDomainTabs}
                activeKey="accounts-payable"
                ariaLabel="Accounts domain"
            />

            <form
                onSubmit={submitSearch}
                className="mt-12 flex flex-col gap-3 p-4 sm:mt-4 sm:flex-row sm:items-end"
            >
                <div className="flex w-1/4">
                    <input
                        id="ap-q"
                        type="search"
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                        placeholder="Name, contact, email, phone…"
                        className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="min-h-11 rounded-md bg-teal-600 px-4 text-sm font-medium tracking-wider text-paper transition hover:bg-teal-800"
                    >
                        Filter
                    </button>
                    {(filters?.q || q) && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="min-h-11 border border-line bg-white/70 px-4 text-sm text-ink-soft transition hover:border-ink/30"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </form>

            <div className="mt-6 px-4">
                <table className="w-full border-collapse text-left text-sm">
                    <thead className="sticky top-0 bg-teal-500/10 px-2">
                        <tr className="border-b border-line text-xs tracking-wide uppercase">
                            {sortableColumns.map((column) => (
                                <SortableHeader
                                    key={column.key}
                                    column={column.key}
                                    label={column.label}
                                    sort={sort}
                                    direction={direction}
                                    onSort={sortBy}
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="py-10 text-center text-muted"
                                >
                                    No suppliers with posted purchase orders
                                    yet. Post an ordered or received PO from
                                    Purchased Orders.
                                </td>
                            </tr>
                        )}
                        {suppliers.map((row) => {
                            const isDeleted = Boolean(row.deleted_at);

                            return (
                                <tr
                                    key={row.id}
                                    className="border-b border-line/80 align-top"
                                >
                                    <td className="px-4 py-4 pr-4">
                                        <Link
                                            href={supplierRoute.url(row.id)}
                                            className={
                                                isDeleted
                                                    ? 'font-medium text-muted line-through underline-offset-2 transition hover:underline'
                                                    : 'font-medium text-teal-800 underline-offset-2 transition hover:underline'
                                            }
                                        >
                                            {row.name}
                                        </Link>
                                        {isDeleted && (
                                            <span className="ml-2 text-xs text-warn">
                                                Deleted
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 pr-4 text-ink-soft">
                                        {row.posted_order_count}
                                    </td>
                                    <td className="px-4 py-4 pr-4 text-ink-soft">
                                        {row.open_order_count}
                                    </td>
                                    <td className="px-4 py-4 pr-4 font-medium text-ink">
                                        {formatMoney(row.total_payable)}
                                    </td>
                                    <td className="px-4 py-4 pr-4 text-ink-soft">
                                        {formatMoney(row.total_paid)}
                                    </td>
                                    <td className="px-4 py-4 pr-4 font-medium text-ink">
                                        {formatMoney(row.balance_due)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}

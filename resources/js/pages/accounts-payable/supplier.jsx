import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import {
    index as accountsPayableIndex,
    show as accountsPayableShow,
    supplier as supplierRoute,
} from '@/routes/accounts-payable';

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

export default function AccountsPayableSupplier({
    supplier,
    orders = [],
    summary,
    filters,
}) {
    const [settlement, setSettlement] = useState(filters?.settlement ?? '');

    function applyFilter(event) {
        event.preventDefault();
        router.get(
            supplierRoute.url(supplier.id),
            { settlement: settlement || undefined },
            { preserveState: true, replace: true },
        );
    }

    function clearFilter() {
        setSettlement('');
        router.get(
            supplierRoute.url(supplier.id),
            {},
            { preserveState: true, replace: true },
        );
    }

    return (
        <AppLayout title={`AP — ${supplier.name}`}>
            <div className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    <Link
                        href={accountsPayableIndex.url()}
                        className="text-teal-800 underline-offset-2 transition hover:underline"
                    >
                        Accounts Payable
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-ink">{supplier.name}</span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                    {supplier.name}
                </h2>
                <p className="text-sm text-muted">
                    Purchase orders posted for settlement with this supplier.
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    <p className="font-medium text-muted">
                        Orders: {summary.order_count}
                    </p>
                    <p className="font-medium text-muted">
                        Payable: {formatMoney(summary.total_payable)}
                    </p>
                    <p className="font-medium text-muted">
                        Paid: {formatMoney(summary.total_paid)}
                    </p>
                    <p className="font-medium text-ink">
                        Balance: {formatMoney(summary.balance_due)}
                    </p>
                </div>
            </div>

            <div className="px-4 pb-4">
                <form
                    onSubmit={applyFilter}
                    className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                    <div className="sm:w-48">
                        <label
                            htmlFor="settlement"
                            className="mb-1.5 block text-sm font-medium text-ink-soft"
                        >
                            Settlement
                        </label>
                        <select
                            id="settlement"
                            value={settlement}
                            onChange={(event) =>
                                setSettlement(event.target.value)
                            }
                            className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                        >
                            <option value="">All</option>
                            <option value="open">Open</option>
                            <option value="settled">Settled</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="min-h-11 rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition hover:bg-teal-800"
                    >
                        Apply
                    </button>
                    {filters?.settlement && (
                        <button
                            type="button"
                            onClick={clearFilter}
                            className="min-h-11 rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink"
                        >
                            Clear
                        </button>
                    )}
                </form>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                                <th className="px-4 py-3 font-medium">
                                    Reference
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Status
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Settlement
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Grand total
                                </th>
                                <th className="px-4 py-3 font-medium">Paid</th>
                                <th className="px-4 py-3 font-medium">
                                    Balance
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Posted
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-10 text-center text-muted"
                                    >
                                        No posted purchase orders for this
                                        filter.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const settled = Boolean(order.is_settled);

                                    return (
                                        <tr
                                            key={order.id}
                                            className="border-b border-line/70 transition hover:bg-mist/50"
                                        >
                                            <td className="px-4 py-4">
                                                <Link
                                                    href={accountsPayableShow.url(
                                                        {
                                                            supplier:
                                                                supplier.id,
                                                            purchased_order:
                                                                order.reference,
                                                        },
                                                    )}
                                                    className="font-mono text-xs text-teal-800 underline-offset-2 transition hover:underline"
                                                >
                                                    {order.reference}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(order.status)}`}
                                                >
                                                    {order.status_label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                                        settled
                                                            ? 'border-green-600/30 bg-green-400/10 text-green-700'
                                                            : 'border-amber-600/30 bg-amber-400/10 text-amber-800'
                                                    }`}
                                                >
                                                    {settled
                                                        ? 'Settled'
                                                        : 'Open'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 font-medium text-ink">
                                                {formatMoney(order.grand_total)}
                                            </td>
                                            <td className="px-4 py-4 text-ink-soft">
                                                {formatMoney(order.amount_paid)}
                                            </td>
                                            <td className="px-4 py-4 font-medium text-ink">
                                                {formatMoney(order.balance_due)}
                                            </td>
                                            <td className="px-4 py-4 text-ink-soft">
                                                {formatDate(
                                                    order.posted_to_ap_at,
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}

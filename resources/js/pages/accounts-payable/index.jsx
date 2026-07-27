import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { index, supplier as supplierRoute } from '@/routes/accounts-payable';

export default function AccountsPayableIndex({ suppliers = [], filters }) {
    const [q, setQ] = useState(filters?.q ?? '');

    function submitSearch(event) {
        event.preventDefault();
        router.get(
            index.url(),
            { q: q || undefined },
            { preserveState: true, replace: true },
        );
    }

    function clearSearch() {
        setQ('');
        router.get(index.url(), {}, { preserveState: true, replace: true });
    }

    return (
        <AppLayout title="Accounts Payable">
            <div className="flex flex-col gap-2 p-4">
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

            <div className="px-4 pb-4">
                <form
                    onSubmit={submitSearch}
                    className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                    <div className="min-w-0 flex-1">
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
                            className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                        />
                    </div>
                    <button
                        type="submit"
                        className="min-h-11 rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition hover:bg-teal-800"
                    >
                        Search
                    </button>
                    {(filters?.q || q) && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="min-h-11 rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink"
                        >
                            Clear
                        </button>
                    )}
                </form>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                                <th className="px-4 py-3 font-medium">
                                    Supplier
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Posted POs
                                </th>
                                <th className="px-4 py-3 font-medium">Open</th>
                                <th className="px-4 py-3 font-medium">
                                    Total payable
                                </th>
                                <th className="px-4 py-3 font-medium">Paid</th>
                                <th className="px-4 py-3 font-medium">
                                    Balance due
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-muted"
                                    >
                                        No suppliers with posted purchase
                                        orders yet. Post an ordered or received
                                        PO from Purchased Orders.
                                    </td>
                                </tr>
                            ) : (
                                suppliers.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-line/70 transition hover:bg-mist/50"
                                    >
                                        <td className="px-4 py-4">
                                            <Link
                                                href={supplierRoute.url(row.id)}
                                                className="font-medium text-teal-800 underline-offset-2 transition hover:underline"
                                            >
                                                {row.name}
                                            </Link>
                                            {row.deleted_at && (
                                                <span className="ml-2 text-xs text-warn">
                                                    Deleted
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-ink-soft">
                                            {row.posted_order_count}
                                        </td>
                                        <td className="px-4 py-4 text-ink-soft">
                                            {row.open_order_count}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-ink">
                                            {formatMoney(row.total_payable)}
                                        </td>
                                        <td className="px-4 py-4 text-ink-soft">
                                            {formatMoney(row.total_paid)}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-ink">
                                            {formatMoney(row.balance_due)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}

import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    destroy,
    restore,
} from '@/actions/App/Http/Controllers/SupplierController';
import AppLayout from '@/layouts/app-layout';
import { create, edit, index } from '@/routes/suppliers';

export default function SuppliersIndex({ suppliers, filters }) {
    const [q, setQ] = useState(filters.q ?? '');
    const [trashed, setTrashed] = useState(filters.trashed ?? '');

    function submitSearch(event) {
        event.preventDefault();
        router.get(
            index.url(),
            {
                q: q || undefined,
                trashed: trashed || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    }

    function clearFilters() {
        setQ('');
        setTrashed('');
        router.get(index.url(), {}, { preserveState: true, replace: true });
    }

    function deleteSupplier(supplier) {
        if (!window.confirm(`Delete “${supplier.name}”?`)) {
            return;
        }

        router.delete(destroy.url(supplier.id));
    }

    function restoreSupplier(supplier) {
        router.post(restore.url(supplier.id));
    }

    return (
        <AppLayout title="Suppliers">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                        Suppliers
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        {suppliers.total}{' '}
                        {suppliers.total === 1 ? 'supplier' : 'suppliers'}
                    </p>
                </div>
                <Link
                    href={create.url()}
                    className="min-h-11 bg-teal-700 rounded-md px-4 text-sm leading-[2.75rem] font-medium tracking-wide text-paper transition hover:bg-teal-800"
                >
                    New supplier
                </Link>
            </div>

            <form
                onSubmit={submitSearch}
                className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-end"
            >
                <div className="flex-1">
                    {/* <label
                        htmlFor="q"
                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                    >
                        Search
                    </label> */}
                    <input
                        id="q"
                        type="search"
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                        placeholder="Name, contact, email, or phone"
                        className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                </div>
                <div className="sm:w-48">
                    {/* <label
                        htmlFor="trashed"
                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                    >
                        Trash
                    </label> */}
                    <select
                        id="trashed"
                        value={trashed}
                        onChange={(event) => setTrashed(event.target.value)}
                        className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    >
                        <option value="">Active only</option>
                        <option value="with">Include deleted</option>
                        <option value="only">Deleted only</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="min-h-11 bg-ink px-4 text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft"
                    >
                        Filter
                    </button>
                    {(filters.q || filters.trashed) && (
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

            <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead>
                        <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
                            <th className="py-3 pr-4 font-medium">Supplier</th>
                            <th className="py-3 pr-4 font-medium">Contact</th>
                            <th className="py-3 pr-4 font-medium">Status</th>
                            <th className="py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="py-10 text-muted"
                                >
                                    No suppliers match these filters.
                                </td>
                            </tr>
                        )}
                        {suppliers.data.map((supplier) => {
                            const isDeleted = Boolean(supplier.deleted_at);

                            return (
                                <tr
                                    key={supplier.id}
                                    className="border-b border-line/80 align-top"
                                >
                                    <td className="py-4 pr-4">
                                        <p
                                            className={
                                                isDeleted
                                                    ? 'font-medium text-muted line-through'
                                                    : 'font-medium text-ink'
                                            }
                                        >
                                            {supplier.name}
                                        </p>
                                        {supplier.email && (
                                            <p className="mt-1 text-xs text-muted">
                                                {supplier.email}
                                            </p>
                                        )}
                                    </td>
                                    <td className="py-4 pr-4 text-ink-soft">
                                        <p>
                                            {supplier.contact_name || '—'}
                                        </p>
                                        {supplier.phone && (
                                            <p className="mt-1 text-xs text-muted">
                                                {supplier.phone}
                                            </p>
                                        )}
                                    </td>
                                    <td className="py-4 pr-4 text-ink-soft">
                                        {supplier.status_label}
                                    </td>
                                    <td className="py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {!isDeleted && (
                                                <>
                                                    <Link
                                                        href={edit.url(
                                                            supplier.id,
                                                        )}
                                                        className="text-sm text-accent underline decoration-line underline-offset-4 hover:text-ink"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteSupplier(
                                                                supplier,
                                                            )
                                                        }
                                                        className="text-sm text-warn underline decoration-line underline-offset-4"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                            {isDeleted && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        restoreSupplier(
                                                            supplier,
                                                        )
                                                    }
                                                    className="text-sm text-accent underline decoration-line underline-offset-4 hover:text-ink"
                                                >
                                                    Restore
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {suppliers.last_page > 1 && (
                <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
                    {suppliers.links.map((link, i) => {
                        if (!link.url) {
                            return (
                                <span
                                    key={`${link.label}-${i}`}
                                    className="px-2 py-1 text-muted"
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
                                className={
                                    link.active
                                        ? 'bg-ink px-3 py-1.5 text-paper'
                                        : 'border border-line bg-white/70 px-3 py-1.5 text-ink-soft hover:border-ink/30'
                                }
                                preserveState
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        );
                    })}
                </div>
            )}
        </AppLayout>
    );
}

import { Link, router } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import {
    destroy,
    restore,
} from '@/actions/App/Http/Controllers/CustomerController';
import CustomerModal from '@/components/customer-modal';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/customers';

const sortableColumns = [
    { key: 'name', label: 'Customer' },
    { key: 'contact_name', label: 'Contact' },
    { key: 'status', label: 'Status' },
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
        <th className="py-3 pr-4 font-medium px-4">
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

function RowActionsMenu({
    customer,
    open,
    onToggle,
    onClose,
    onEdit,
    onDelete,
    onRestore,
}) {
    const menuId = useId();
    const rootRef = useRef(null);
    const isDeleted = Boolean(customer.deleted_at);

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

    return (
        <div ref={rootRef} className="relative flex justify-end">
            <button
                type="button"
                onClick={onToggle}
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-ink-soft transition duration-300 hover:scale-105 hover:bg-gray-100"
                aria-label={`Actions for ${customer.name}`}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
            >
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

            {open && (
                <div
                    id={menuId}
                    role="menu"
                    className="absolute top-0 right-6 z-20 min-w-28 rounded-md border border-line bg-white py-1 shadow-md"
                >
                    {!isDeleted && (
                        <>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    onClose();
                                    onEdit(customer);
                                }}
                                className="block w-full px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    onClose();
                                    onDelete(customer);
                                }}
                                className="block w-full px-3 py-2 text-left text-sm text-warn transition hover:bg-mist"
                            >
                                Delete
                            </button>
                        </>
                    )}
                    {isDeleted && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onRestore(customer);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                        >
                            Restore
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function CustomersIndex({ customers, filters, statuses }) {
    const [q, setQ] = useState(filters.q ?? '');
    const [trashed, setTrashed] = useState(filters.trashed ?? '');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [modal, setModal] = useState({ open: false, mode: 'create', customer: null });
    const sort = filters.sort ?? 'name';
    const direction = filters.direction ?? 'asc';

    function openCreateModal() {
        setOpenMenuId(null);
        setModal({ open: true, mode: 'create', customer: null });
    }

    function openEditModal(customer) {
        setOpenMenuId(null);
        setModal({ open: true, mode: 'edit', customer });
    }

    function closeModal() {
        setModal({ open: false, mode: 'create', customer: null });
    }

    function visitIndex(params) {
        router.get(index.url(), params, {
            preserveState: true,
            replace: true,
        });
    }

    function currentParams(overrides = {}) {
        return {
            q: q || undefined,
            trashed: trashed || undefined,
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
        setTrashed('');
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

    function deleteCustomer(customer) {
        if (!window.confirm(`Delete “${customer.name}”?`)) {
            return;
        }

        router.delete(destroy.url(customer.id));
    }

    function restoreCustomer(customer) {
        router.post(restore.url(customer.id));
    }

    return (
        <AppLayout title="Customers">
            <div className="flex items-start justify-between gap-4 p-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                        Customers
                    </h2>
                    <p className="text-sm text-muted">
                        Customers are the companies or people that buy products
                        or services from your business.
                    </p>
                    <p className="mt-1 text-sm font-medium text-muted">
                        Total: {customers.total}{' '}
                        {customers.total === 1 ? 'customer' : 'customers'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="flex size-14 items-center justify-center gap-1 rounded-full bg-teal-700 text-paper shadow-lg transition hover:bg-teal-800"
                    aria-label="New customer"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                        />
                    </svg>
                </button>
            </div>

            <form
                onSubmit={submitSearch}
                className="sm:mt-4 mt-12 flex flex-col gap-3 sm:flex-row sm:items-end p-4"
            >
                <div className="flex w-1/4">
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
                        className="min-h-11 rounded-md bg-teal-600 px-4 text-sm font-medium tracking-wider text-paper transition hover:bg-teal-800"
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

            <div className="mt-6 overflow-x-auto table-auto px-4">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
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
                            <th className="w-12 py-3 text-right">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="py-10 text-muted text-center"
                                >
                                    No customers match these filters.
                                </td>
                            </tr>
                        )}
                        {customers.data.map((customer) => {
                            const isDeleted = Boolean(customer.deleted_at);

                            return (
                                <tr
                                    key={customer.id}
                                    className="border-b border-line/80 align-top"
                                >
                                    <td className="py-4 pr-4 px-4">
                                        <p
                                            className={
                                                isDeleted
                                                    ? 'font-medium text-muted line-through'
                                                    : 'font-medium text-ink'
                                            }
                                        >
                                            {customer.name}
                                        </p>
                                        {customer.email && (
                                            <p className="mt-1 text-xs text-muted">
                                                {customer.email}
                                            </p>
                                        )}
                                    </td>
                                    <td className="py-4 pr-4 text-ink-soft px-4">
                                        <p>
                                            {customer.contact_name || '—'}
                                        </p>
                                        {customer.phone && (
                                            <p className="mt-1 text-xs text-muted">
                                                {customer.phone}
                                            </p>
                                        )}
                                    </td>
                                    <td className="py-4 pr-4 text-ink-soft px-4">
                                        <span
                                            className={`rounded-full border px-3 py-1 text-xs ${
                                                customer.status === 'active'
                                                    ? 'border-green-600/30 bg-green-400/5 text-green-700'
                                                    : 'border-red-600/30 bg-red-400/5 text-red-700'
                                            }`}
                                        >
                                            {customer.status_label}
                                        </span>
                                    </td>
                                    <td className="py-3 pl-2">
                                        <RowActionsMenu
                                            customer={customer}
                                            open={openMenuId === customer.id}
                                            onToggle={() =>
                                                setOpenMenuId((current) =>
                                                    current === customer.id
                                                        ? null
                                                        : customer.id,
                                                )
                                            }
                                            onClose={() => setOpenMenuId(null)}
                                            onEdit={openEditModal}
                                            onDelete={deleteCustomer}
                                            onRestore={restoreCustomer}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {customers.last_page > 1 && (
                <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
                    {customers.links.map((link, i) => {
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

            <CustomerModal
                open={modal.open}
                mode={modal.mode}
                customer={modal.customer}
                statuses={statuses}
                onClose={closeModal}
            />
        </AppLayout>
    );
}

import { Link, router } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import {
    approve,
    createPurchaseOrder,
    destroy,
    restore,
    submit,
} from '@/actions/App/Http/Controllers/RequestQuotationController';
import PurchasedOrderDetailModal from '@/components/purchased-order-detail-modal';
import RequestQuotationDetailModal from '@/components/request-quotation-detail-modal';
import RequestQuotationForm from '@/components/request-quotation-form';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { index } from '@/routes/request-quotations';

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
            pending: 'border-amber-600/30 bg-amber-400/10 text-amber-800',
            approved: 'border-green-600/30 bg-green-400/10 text-green-700',
            draft: 'border-slate-500/30 bg-slate-400/10 text-slate-700',
        }[status] ?? 'border-line bg-mist text-ink-soft'
    );
}

function RowActionsMenu({
    quotation,
    open,
    onToggle,
    onClose,
    onEdit,
    onDelete,
    onRestore,
    onSubmit,
    onApprove,
    onCreatePurchaseOrder,
    onViewPurchaseOrder,
}) {
    const menuId = useId();
    const rootRef = useRef(null);
    const isDeleted = Boolean(quotation.deleted_at);

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
                className="inline-flex size-11 cursor-pointer items-center justify-center rounded-md text-ink-soft transition duration-300 hover:scale-105 hover:bg-gray-100"
                aria-label={`Actions for ${quotation.reference}`}
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
                    className="absolute top-0 right-12 z-20 min-w-44 rounded-md border border-line bg-white py-1"
                >
                    {!isDeleted && quotation.can_edit && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onEdit(quotation);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                        >
                            Edit
                        </button>
                    )}
                    {!isDeleted && quotation.next_action === 'submit' && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onSubmit(quotation);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                        >
                            Submit
                        </button>
                    )}
                    {!isDeleted && quotation.next_action === 'approve' && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onApprove(quotation);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                        >
                            Approve
                        </button>
                    )}
                    {!isDeleted && quotation.can_create_purchase_order && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onCreatePurchaseOrder(quotation);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                        >
                            Create Purchase Order
                        </button>
                    )}
                    {!isDeleted && quotation.purchased_order_id && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onViewPurchaseOrder(quotation);
                            }}
                            title={
                                quotation.purchased_order_reference ??
                                'View purchase order'
                            }
                            className="block w-full px-3 py-2 text-left text-sm text-teal-800 transition hover:bg-mist hover:text-ink"
                        >
                            PO created
                        </button>
                    )}
                    {!isDeleted && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onDelete(quotation);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-warn transition hover:bg-mist"
                        >
                            Delete
                        </button>
                    )}
                    {isDeleted && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                onClose();
                                onRestore(quotation);
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

export default function RequestQuotationsIndex({
    quotations,
    suppliers,
    products,
    filters = { trashed: '' },
}) {
    const [activeTab, setActiveTab] = useState('list');
    const [formKey, setFormKey] = useState(0);
    const [editingQuotation, setEditingQuotation] = useState(null);
    const [detailQuotation, setDetailQuotation] = useState(null);
    const [detailPurchaseOrder, setDetailPurchaseOrder] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [trashed, setTrashed] = useState(filters.trashed ?? '');

    function openCreateTab() {
        setEditingQuotation(null);
        setDetailQuotation(null);
        setDetailPurchaseOrder(null);
        setFormKey((current) => current + 1);
        setActiveTab('create');
        setOpenMenuId(null);
    }

    function openDetailModal(quotation) {
        setDetailPurchaseOrder(null);
        setDetailQuotation(quotation);
        setOpenMenuId(null);
    }

    function closeDetailModal() {
        setDetailQuotation(null);
    }

    function openPurchaseOrderDetail(quotation) {
        if (!quotation.purchased_order) {
            return;
        }

        setDetailQuotation(null);
        setDetailPurchaseOrder(quotation.purchased_order);
        setOpenMenuId(null);
    }

    function closePurchaseOrderDetail() {
        setDetailPurchaseOrder(null);
    }

    function openEditTab(quotation) {
        setDetailQuotation(null);
        setDetailPurchaseOrder(null);
        setEditingQuotation(quotation);
        setFormKey((current) => current + 1);
        setActiveTab('create');
        setOpenMenuId(null);
    }

    function handleFormSuccess() {
        setEditingQuotation(null);
        setActiveTab('list');
        setFormKey((current) => current + 1);
    }

    function cancelForm() {
        setEditingQuotation(null);
        setActiveTab('list');
    }

    function visitIndex(params) {
        router.get(index.url(), params, {
            preserveState: true,
            replace: true,
        });
    }

    function applyTrashFilter(event) {
        event.preventDefault();
        visitIndex({
            trashed: trashed || undefined,
        });
    }

    function clearTrashFilter() {
        setTrashed('');
        visitIndex({});
    }

    function submitQuotation(quotation) {
        if (
            !window.confirm(
                `Submit draft “${quotation.reference}” for approval?`,
            )
        ) {
            return;
        }

        router.post(submit.url(quotation.id));
    }

    function approveQuotation(quotation) {
        if (!window.confirm(`Approve quotation “${quotation.reference}”?`)) {
            return;
        }

        router.post(approve.url(quotation.id));
    }

    function deleteQuotation(quotation) {
        if (!window.confirm(`Delete quotation “${quotation.reference}”?`)) {
            return;
        }

        setDetailQuotation(null);
        router.delete(destroy.url(quotation.id));
    }

    function restoreQuotation(quotation) {
        router.post(restore.url(quotation.id));
    }

    function createPurchaseOrderFromQuotation(quotation) {
        if (
            !window.confirm(
                `Create a purchase order from quotation “${quotation.reference}”?`,
            )
        ) {
            return;
        }

        router.post(createPurchaseOrder.url(quotation.id));
    }

    const formTabLabel = editingQuotation
        ? 'Edit Quotation'
        : 'Create New Quotation';

    return (
        <AppLayout title="Request Quotations">
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                        Request Quotations
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Draft supplier quotations, then submit and approve them
                        before purchasing.
                    </p>
                    <p className="mt-1 text-sm font-medium text-muted">
                        Total: {quotations.total}{' '}
                        {quotations.total === 1 ? 'quotation' : 'quotations'}
                    </p>
                </div>

                {activeTab === 'list' && (
                    <button
                        type="button"
                        onClick={openCreateTab}
                        className="flex size-14 shrink-0 items-center justify-center rounded-md bg-teal-700 text-paper transition hover:bg-teal-800"
                        aria-label="Create new quotation"
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
                )}
            </div>

            <div className="border-b border-line px-4">
                <div
                    role="tablist"
                    aria-label="Request quotation views"
                    className="flex gap-2"
                >
                    <button
                        type="button"
                        role="tab"
                        id="tab-list"
                        aria-selected={activeTab === 'list'}
                        aria-controls="panel-list"
                        onClick={() => {
                            setEditingQuotation(null);
                            setActiveTab('list');
                        }}
                        className={`min-h-11 border-b-2 px-4 text-sm font-medium transition ${
                            activeTab === 'list'
                                ? 'border-teal-700 text-teal-800'
                                : 'border-transparent text-muted hover:text-ink'
                        }`}
                    >
                        Request Quotations list
                    </button>
                    <button
                        type="button"
                        role="tab"
                        id="tab-create"
                        aria-selected={activeTab === 'create'}
                        aria-controls="panel-create"
                        onClick={openCreateTab}
                        className={`min-h-11 border-b-2 px-4 text-sm font-medium transition ${
                            activeTab === 'create'
                                ? 'border-teal-700 text-teal-800'
                                : 'border-transparent text-muted hover:text-ink'
                        }`}
                    >
                        {formTabLabel}
                    </button>
                </div>
            </div>

            {activeTab === 'list' && (
                <div
                    role="tabpanel"
                    id="panel-list"
                    aria-labelledby="tab-list"
                    className="p-4"
                >
                    <form
                        onSubmit={applyTrashFilter}
                        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                    >
                        <div className="sm:w-48">
                            <label
                                htmlFor="trashed"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Trash
                            </label>
                            <select
                                id="trashed"
                                value={trashed}
                                onChange={(event) =>
                                    setTrashed(event.target.value)
                                }
                                className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
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
                            {filters.trashed && (
                                <button
                                    type="button"
                                    onClick={clearTrashFilter}
                                    className="min-h-11 border border-line bg-white px-4 text-sm text-ink-soft transition hover:border-ink/30"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </form>

                    <div>
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="sticky top-0 bg-teal-500/10">
                                <tr className="border-b border-line text-xs tracking-wide uppercase">
                                    {/* <th className="px-4 py-3 font-medium text-muted">
                                        Reference
                                    </th> */}
                                    <th className="px-4 py-3 font-medium text-muted">
                                        Supplier
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted">
                                        Items
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted">
                                        Grand total
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-medium text-muted">
                                        Created
                                    </th>
                                    <th className="w-14 px-4 py-3 text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotations.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-10 text-center text-muted"
                                        >
                                            No request quotations match these
                                            filters.
                                        </td>
                                    </tr>
                                )}
                                {quotations.data.map((quotation) => {
                                    const isDeleted = Boolean(
                                        quotation.deleted_at,
                                    );

                                    return (
                                        <tr
                                            key={quotation.id}
                                            className="border-b border-line/80 align-top"
                                        >
                                            {/* <td className="max-w-48 px-4 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openDetailModal(
                                                            quotation,
                                                        )
                                                    }
                                                    title={quotation.reference}
                                                    className={`block max-w-full truncate text-left font-mono text-xs break-all underline-offset-2 transition hover:underline focus:underline focus:outline-none ${
                                                        isDeleted
                                                            ? 'text-muted line-through'
                                                            : 'cursor-pointer text-teal-800'
                                                    }`}
                                                >
                                                    {quotation.reference}
                                                </button>
                                            </td> */}
                                            <td className="px-4 py-4 text-ink-soft flex gap-1 items-center">
                                                {quotation.supplier_name || '—'}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openDetailModal(
                                                            quotation,
                                                        )
                                                    }
                                                    title={quotation.reference}
                                                    className={`block max-w-full truncate text-left font-mono font-semibold text-[10px] break-all underline-offset-2 transition hover:underline focus:underline focus:outline-none ${
                                                        isDeleted
                                                            ? 'text-muted line-through'
                                                            : 'cursor-pointer text-teal-800'
                                                    }`}
                                                >
                                                    (View)
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-ink-soft">
                                                {quotation.item_count}
                                            </td>
                                            <td className="px-4 py-4 font-medium text-ink">
                                                {formatMoney(
                                                    quotation.grand_total,
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`rounded-full border px-3 py-1 text-xs ${statusBadgeClass(quotation.status)}`}
                                                    >
                                                        {quotation.status_label}
                                                    </span>
                                                    {quotation.purchased_order_id && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openPurchaseOrderDetail(
                                                                    quotation,
                                                                )
                                                            }
                                                            title={
                                                                quotation.purchased_order_reference ??
                                                                'View purchase order'
                                                            }
                                                            className="rounded-full border border-teal-700/30 bg-teal-500/10 px-3 py-1 text-xs text-teal-800 underline-offset-2 transition hover:bg-teal-500/20 hover:underline focus:underline focus:outline-none"
                                                        >
                                                            PO Created
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-ink-soft">
                                                {formatDate(
                                                    quotation.created_at,
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <RowActionsMenu
                                                    quotation={quotation}
                                                    open={
                                                        openMenuId ===
                                                        quotation.id
                                                    }
                                                    onToggle={() =>
                                                        setOpenMenuId(
                                                            (current) =>
                                                                current ===
                                                                quotation.id
                                                                    ? null
                                                                    : quotation.id,
                                                        )
                                                    }
                                                    onClose={() =>
                                                        setOpenMenuId(null)
                                                    }
                                                    onEdit={openEditTab}
                                                    onDelete={deleteQuotation}
                                                    onRestore={restoreQuotation}
                                                    onSubmit={submitQuotation}
                                                    onApprove={approveQuotation}
                                                    onCreatePurchaseOrder={
                                                        createPurchaseOrderFromQuotation
                                                    }
                                                    onViewPurchaseOrder={
                                                        openPurchaseOrderDetail
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {quotations.last_page > 1 && (
                        <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
                            {quotations.links.map((link, i) => {
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
                                                : 'border border-line bg-white px-3 py-1.5 text-ink-soft hover:border-ink/30'
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
                </div>
            )}

            {activeTab === 'create' && (
                <div
                    role="tabpanel"
                    id="panel-create"
                    aria-labelledby="tab-create"
                    className="p-4"
                >
                    <RequestQuotationForm
                        key={formKey}
                        suppliers={suppliers}
                        products={products}
                        quotation={editingQuotation}
                        onCancel={cancelForm}
                        onSuccess={handleFormSuccess}
                    />
                </div>
            )}

            <RequestQuotationDetailModal
                open={Boolean(detailQuotation)}
                quotation={detailQuotation}
                onClose={closeDetailModal}
                onEdit={openEditTab}
                onDelete={deleteQuotation}
            />

            <PurchasedOrderDetailModal
                open={Boolean(detailPurchaseOrder)}
                order={detailPurchaseOrder}
                onClose={closePurchaseOrderDetail}
            />
        </AppLayout>
    );
}

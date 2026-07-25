import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    approve,
    submit,
} from '@/actions/App/Http/Controllers/RequestQuotationController';
import RequestQuotationForm from '@/components/request-quotation-form';
import AppLayout from '@/layouts/app-layout';

function formatMoney(value) {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return '0.00';
    }

    return amount.toFixed(2);
}

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
    return matchStatus(status, {
        pending: 'border-amber-600/30 bg-amber-400/10 text-amber-800',
        approved: 'border-green-600/30 bg-green-400/10 text-green-700',
        draft: 'border-slate-500/30 bg-slate-400/10 text-slate-700',
        fallback: 'border-line bg-mist text-ink-soft',
    });
}

function matchStatus(status, classes) {
    return classes[status] ?? classes.fallback;
}

export default function RequestQuotationsIndex({
    quotations,
    suppliers,
    products,
}) {
    const [activeTab, setActiveTab] = useState('list');
    const [formKey, setFormKey] = useState(0);

    function openCreateTab() {
        setFormKey((current) => current + 1);
        setActiveTab('create');
    }

    function handleCreated() {
        setActiveTab('list');
        setFormKey((current) => current + 1);
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
                        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-teal-700 text-paper shadow-lg transition hover:bg-teal-800"
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
                        onClick={() => setActiveTab('list')}
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
                        Create New Quotation
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
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[780px] border-collapse text-left text-sm">
                            <thead className="sticky top-0 bg-teal-500/10">
                                <tr className="border-b border-line text-xs tracking-wide uppercase">
                                    <th className="px-4 py-3 font-medium text-muted">
                                        Reference
                                    </th>
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
                                    <th className="w-36 px-4 py-3 text-right">
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
                                            No request quotations yet. Create
                                            one from the Create New Quotation
                                            tab.
                                        </td>
                                    </tr>
                                )}
                                {quotations.data.map((quotation) => (
                                    <tr
                                        key={quotation.id}
                                        className="border-b border-line/80 align-top"
                                    >
                                        <td className="px-4 py-4">
                                            <p className="font-mono text-xs break-all text-ink sm:text-sm">
                                                {quotation.reference}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-ink-soft">
                                            {quotation.supplier_name || '—'}
                                        </td>
                                        <td className="px-4 py-4 text-ink-soft">
                                            {quotation.item_count}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-ink">
                                            {formatMoney(quotation.grand_total)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`rounded-full border px-3 py-1 text-xs ${statusBadgeClass(quotation.status)}`}
                                            >
                                                {quotation.status_label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-ink-soft">
                                            {formatDate(quotation.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {quotation.next_action ===
                                                'submit' && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        submitQuotation(
                                                            quotation,
                                                        )
                                                    }
                                                    className="min-h-11 rounded-md bg-teal-700 px-3 text-sm font-medium text-paper transition hover:bg-teal-800"
                                                >
                                                    Submit
                                                </button>
                                            )}
                                            {quotation.next_action ===
                                                'approve' && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        approveQuotation(
                                                            quotation,
                                                        )
                                                    }
                                                    className="min-h-11 rounded-md bg-teal-700 px-3 text-sm font-medium text-paper transition hover:bg-teal-800"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            {quotation.next_action === null && (
                                                <span className="text-xs text-muted">
                                                    Complete
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
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
                        onCancel={() => setActiveTab('list')}
                        onSuccess={handleCreated}
                    />
                </div>
            )}
        </AppLayout>
    );
}

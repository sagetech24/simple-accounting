import { Link, router } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import { restore as restoreBankAccount } from '@/actions/App/Http/Controllers/BankAccountController';
import { voidCheck } from '@/actions/App/Http/Controllers/BankCheckController';
import BankAccountModal from '@/components/bank-account-modal';
import BankCheckAgainstPoModal from '@/components/bank-check-against-po-modal';
import BankCheckEditModal from '@/components/bank-check-edit-modal';
import BankCheckStandaloneModal from '@/components/bank-check-standalone-modal';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { show as apShow } from '@/routes/accounts-payable';
import { index as bankAccountsIndex, show } from '@/routes/bank-accounts';

function formatDate(value, withTime = false) {
    if (!value) {
        return '—';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            ...(withTime ? { timeStyle: 'short' } : {}),
        }).format(new Date(value));
    } catch {
        return value;
    }
}

function dueStatusLabel(status) {
    return (
        {
            voided: 'Voided',
            overdue: 'Overdue',
            due_today: 'Due today',
            upcoming: 'Upcoming',
        }[status] ?? status
    );
}

function dueStatusClass(status) {
    return (
        {
            voided: 'border-slate-500/30 bg-slate-400/10 text-slate-700',
            overdue: 'border-red-600/30 bg-red-400/10 text-red-700',
            due_today: 'border-amber-600/30 bg-amber-400/10 text-amber-800',
            upcoming: 'border-green-600/30 bg-green-400/10 text-green-700',
        }[status] ?? 'border-line bg-mist text-ink-soft'
    );
}

function accountStatusClass(status) {
    return status === 'active'
        ? 'border-green-600/30 bg-green-400/10 text-green-700'
        : 'border-slate-500/30 bg-slate-400/10 text-slate-700';
}

function IssueCheckMenu({ disabled, onStandalone, onAgainstPo }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const menuId = useId();

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function handlePointerDown(event) {
            if (!rootRef.current?.contains(event.target)) {
                setOpen(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((value) => !value)}
                className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-md bg-teal-700 px-4 text-sm font-medium text-paper transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
            >
                Issue check
                <span aria-hidden="true">▾</span>
            </button>
            {open && (
                <div
                    id={menuId}
                    role="menu"
                    className="absolute right-0 z-20 mt-1 min-w-[12rem] rounded-md border border-line bg-white py-1 shadow-md"
                >
                    <button
                        type="button"
                        role="menuitem"
                        className="flex min-h-11 w-full cursor-pointer items-center px-3 text-left text-sm text-ink transition hover:bg-mist"
                        onClick={() => {
                            setOpen(false);
                            onAgainstPo();
                        }}
                    >
                        Against PO
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        className="flex min-h-11 w-full cursor-pointer items-center px-3 text-left text-sm text-ink transition hover:bg-mist"
                        onClick={() => {
                            setOpen(false);
                            onStandalone();
                        }}
                    >
                        Standalone
                    </button>
                </div>
            )}
        </div>
    );
}

export default function BankAccountShow({
    bankAccount,
    kpis,
    checks = [],
    payments = [],
    auditLogs = [],
    eligibleOrders = [],
    statuses = [],
    filters = {},
}) {
    const isDeleted = Boolean(bankAccount.deleted_at);
    const tab = filters.tab || 'checks';
    const due = filters.due || 'all';
    const [q, setQ] = useState(filters.q || '');
    const [linkage, setLinkage] = useState(filters.linkage || 'all');
    const [auditQ, setAuditQ] = useState(filters.audit_q || '');
    const [editAccountOpen, setEditAccountOpen] = useState(false);
    const [standaloneOpen, setStandaloneOpen] = useState(false);
    const [againstPoOpen, setAgainstPoOpen] = useState(false);
    const [editingCheck, setEditingCheck] = useState(null);
    const [expandedAuditId, setExpandedAuditId] = useState(null);

    function visit(overrides = {}) {
        router.get(
            show.url(bankAccount.id),
            {
                tab,
                due,
                q: q || undefined,
                linkage: linkage === 'all' ? undefined : linkage,
                audit_q: auditQ || undefined,
                ...overrides,
            },
            { preserveState: true, replace: true },
        );
    }

    function setTab(nextTab) {
        visit({ tab: nextTab });
    }

    function setDueFilter(nextDue) {
        visit({ tab: 'checks', due: nextDue });
    }

    function submitCheckFilters(event) {
        event.preventDefault();
        visit({ tab: 'checks' });
    }

    function submitAuditSearch(event) {
        event.preventDefault();
        visit({ tab: 'audit' });
    }

    function voidBankCheck(check) {
        if (check.is_linked) {
            return;
        }

        if (!window.confirm(`Void check #${check.check_number}?`)) {
            return;
        }

        router.post(
            voidCheck.url({
                bank_account: bankAccount.id,
                bank_check: check.id,
            }),
            {},
            { preserveScroll: true },
        );
    }

    function poHref(checkOrPayment) {
        const supplierId =
            checkOrPayment.supplier_id ?? checkOrPayment.supplier_id;
        const reference =
            checkOrPayment.purchased_order_reference ??
            checkOrPayment.purchased_order_reference;

        if (!supplierId || !reference) {
            return null;
        }

        return apShow.url([supplierId, reference]);
    }

    return (
        <AppLayout title={bankAccount.name}>
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    <Link
                        href={bankAccountsIndex.url()}
                        className="cursor-pointer text-teal-800 underline-offset-2 transition hover:underline"
                    >
                        Bank Accounts
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-ink">{bankAccount.name}</span>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-ink">
                            {bankAccount.name}
                        </h2>
                        <p className="mt-1 text-sm text-ink-soft">
                            {[bankAccount.account_name, bankAccount.account_number]
                                .filter(Boolean)
                                .join(' | ') || 'No account details'}
                        </p>
                        {bankAccount.notes && (
                            <p className="mt-2 max-w-2xl text-sm whitespace-pre-wrap text-muted">
                                {bankAccount.notes}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {isDeleted && (
                            <span className="inline-flex rounded-full border border-red-600/30 bg-red-400/10 px-3 py-1 text-xs text-red-700">
                                Deleted
                            </span>
                        )}
                        {!isDeleted && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setEditAccountOpen(true)}
                                    className="inline-flex min-h-11 cursor-pointer items-center border border-line bg-white px-4 text-sm text-ink-soft transition hover:border-ink/30"
                                >
                                    Edit
                                </button>
                                <IssueCheckMenu
                                    onAgainstPo={() => setAgainstPoOpen(true)}
                                    onStandalone={() => setStandaloneOpen(true)}
                                />
                            </>
                        )}
                        {isDeleted && (
                            <button
                                type="button"
                                onClick={() =>
                                    router.post(
                                        restoreBankAccount.url(bankAccount.id),
                                    )
                                }
                                className="inline-flex min-h-11 cursor-pointer items-center rounded-md bg-teal-700 px-4 text-sm font-medium text-paper transition hover:bg-teal-800"
                            >
                                Restore
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-md border border-line bg-white px-4 py-3">
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Open total
                        </p>
                        <p className="mt-1 text-lg font-semibold text-ink">
                            {formatMoney(kpis.open_total)}
                        </p>
                    </div>
                    <div className="rounded-md border border-line bg-white px-4 py-3">
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Overdue
                        </p>
                        <p className="mt-1 text-lg font-semibold text-ink">
                            <span className="text-lg font-medium text-ink-soft">
                                 {formatMoney(kpis.overdue_amount)}
                            </span>
                        </p>
                    </div>
                    <div className="rounded-md border border-line bg-white px-4 py-3">
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Upcoming
                        </p>
                        <p className="mt-1 text-lg font-semibold text-ink">
                            <span className="text-lg font-medium text-ink-soft">
                                 {formatMoney(kpis.upcoming_amount)}
                            </span>
                        </p>
                    </div>
                    <div className="rounded-md border border-line bg-white px-4 py-3">
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Issued
                        </p>
                        <p className="mt-1 text-lg font-semibold text-ink">
                            <span className="text-lg font-medium text-ink-soft">
                                 {formatMoney(kpis.issued_amount)}
                            </span>
                        </p>
                    </div>
                </div>

                <div
                    role="tablist"
                    aria-label="Bank account sections"
                    className="flex flex-wrap gap-2 border-b border-line pb-px"
                >
                    {[
                        { key: 'checks', label: 'Checks' },
                        { key: 'payments', label: 'Payments' },
                        { key: 'audit', label: 'Audit' },
                    ].map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            role="tab"
                            aria-selected={tab === item.key}
                            onClick={() => setTab(item.key)}
                            className={`min-h-11 cursor-pointer border-b-2 px-3 text-sm font-medium transition ${
                                tab === item.key
                                    ? 'border-teal-700 text-teal-800'
                                    : 'border-transparent text-muted hover:text-ink'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {tab === 'checks' && (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap gap-2">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'upcoming', label: 'Upcoming' },
                                { key: 'overdue', label: 'Overdue' },
                            ].map((chip) => (
                                <button
                                    key={chip.key}
                                    type="button"
                                    onClick={() => setDueFilter(chip.key)}
                                    className={`min-h-11 cursor-pointer rounded-md border px-3 text-sm transition ${
                                        due === chip.key
                                            ? 'border-teal-700 bg-teal-700/10 text-teal-900'
                                            : 'border-line bg-white text-ink-soft hover:border-ink/30'
                                    }`}
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>

                        <form
                            onSubmit={submitCheckFilters}
                            className="flex flex-col gap-3 sm:flex-row sm:items-end"
                        >
                            <div className="min-w-0 flex-1 sm:max-w-xs">
                                <label
                                    htmlFor="check_q"
                                    className="mb-1.5 block text-xs tracking-wide text-muted uppercase"
                                >
                                    Search
                                </label>
                                <input
                                    id="check_q"
                                    type="search"
                                    value={q}
                                    onChange={(event) =>
                                        setQ(event.target.value)
                                    }
                                    placeholder="Check #, issued by, PO ref"
                                    className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                />
                            </div>
                            <div className="sm:w-44">
                                <label
                                    htmlFor="check_linkage"
                                    className="mb-1.5 block text-xs tracking-wide text-muted uppercase"
                                >
                                    Linkage
                                </label>
                                <select
                                    id="check_linkage"
                                    value={linkage}
                                    onChange={(event) =>
                                        setLinkage(event.target.value)
                                    }
                                    className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                >
                                    <option value="all">All</option>
                                    <option value="linked">Linked</option>
                                    <option value="standalone">
                                        Standalone
                                    </option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="min-h-11 cursor-pointer rounded-md bg-teal-600 px-4 text-sm font-medium text-paper transition hover:bg-teal-800"
                            >
                                Filter
                            </button>
                        </form>

                        {checks.length === 0 ? (
                            <div className="rounded-md border border-dashed border-line px-4 py-10 text-center">
                                <p className="text-sm text-ink-soft">
                                    No checks match these filters.
                                </p>
                                {!isDeleted && (
                                    <button
                                        type="button"
                                        onClick={() => setStandaloneOpen(true)}
                                        className="mt-3 inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-teal-800 underline-offset-2 hover:underline"
                                    >
                                        Issue a check
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-md border border-line">
                                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                                    <thead className="bg-mist">
                                        <tr className="border-b border-line text-xs tracking-wide uppercase">
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Check #
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Amount
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Due
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Status
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Issued by
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Linked PO
                                            </th>
                                            <th className="px-3 py-2.5 text-right font-medium text-muted">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {checks.map((check) => {
                                            const href = poHref(check);

                                            return (
                                                <tr
                                                    key={check.id}
                                                    className="border-b border-line last:border-b-0"
                                                >
                                                    <td className="px-3 py-3 font-mono text-xs text-ink">
                                                        {check.check_number}
                                                    </td>
                                                    <td className="px-3 py-3 text-ink">
                                                        {formatMoney(
                                                            check.amount,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-ink-soft">
                                                        {formatDate(
                                                            check.due_date,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <span
                                                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${dueStatusClass(check.due_status)}`}
                                                        >
                                                            {dueStatusLabel(
                                                                check.due_status,
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-ink-soft">
                                                        {check.issued_by ||
                                                            '—'}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {check.is_linked &&
                                                        href ? (
                                                            <Link
                                                                href={href}
                                                                className="cursor-pointer font-mono text-xs text-teal-800 underline-offset-2 hover:underline"
                                                            >
                                                                {
                                                                    check.purchased_order_reference
                                                                }
                                                            </Link>
                                                        ) : check.is_linked ? (
                                                            <span className="font-mono text-xs text-ink">
                                                                {
                                                                    check.purchased_order_reference
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">
                                                                Standalone
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex flex-wrap justify-end gap-2">
                                                            {!isDeleted &&
                                                                !check.voided_at && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setEditingCheck(
                                                                                check,
                                                                            )
                                                                        }
                                                                        className="inline-flex min-h-11 cursor-pointer items-center px-2 text-sm text-teal-800 underline-offset-2 hover:underline"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                )}
                                                            {!isDeleted &&
                                                                !check.voided_at &&
                                                                !check.is_linked && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            voidBankCheck(
                                                                                check,
                                                                            )
                                                                        }
                                                                        className="inline-flex min-h-11 cursor-pointer items-center px-2 text-sm text-red-700 underline-offset-2 hover:underline"
                                                                    >
                                                                        Void
                                                                    </button>
                                                                )}
                                                            {!isDeleted &&
                                                                !check.voided_at &&
                                                                check.is_linked && (
                                                                    <span
                                                                        className="inline-flex min-h-11 items-center px-2 text-xs text-muted"
                                                                        title="Void is blocked while this check is linked to a purchase order payment."
                                                                    >
                                                                        Void
                                                                        blocked
                                                                    </span>
                                                                )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'payments' && (
                    <div>
                        {payments.length === 0 ? (
                            <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
                                No PO payments recorded with checks from this
                                bank yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-md border border-line">
                                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                                    <thead className="bg-mist">
                                        <tr className="border-b border-line text-xs tracking-wide uppercase">
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Paid at
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Amount
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Method
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                PO
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Check #
                                            </th>
                                            <th className="px-3 py-2.5 font-medium text-muted">
                                                Recorded by
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment) => {
                                            const href = poHref(payment);

                                            return (
                                                <tr
                                                    key={payment.id}
                                                    className="border-b border-line last:border-b-0"
                                                >
                                                    <td className="px-3 py-3 text-ink-soft">
                                                        {formatDate(
                                                            payment.paid_at,
                                                            true,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-ink">
                                                        {formatMoney(
                                                            payment.amount,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-ink-soft">
                                                        {payment.method_label}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {href ? (
                                                            <Link
                                                                href={href}
                                                                className="cursor-pointer font-mono text-xs text-teal-800 underline-offset-2 hover:underline"
                                                            >
                                                                {
                                                                    payment.purchased_order_reference
                                                                }
                                                            </Link>
                                                        ) : (
                                                            <span className="font-mono text-xs">
                                                                {
                                                                    payment.purchased_order_reference
                                                                }
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 font-mono text-xs text-ink">
                                                        {payment.check_number ||
                                                            '—'}
                                                    </td>
                                                    <td className="px-3 py-3 text-ink-soft">
                                                        {payment.recorded_by ||
                                                            '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'audit' && (
                    <div className="flex flex-col gap-4">
                        <form
                            onSubmit={submitAuditSearch}
                            className="flex flex-col gap-3 sm:flex-row sm:items-end"
                        >
                            <div className="min-w-0 flex-1 sm:max-w-sm">
                                <label
                                    htmlFor="audit_q"
                                    className="mb-1.5 block text-xs tracking-wide text-muted uppercase"
                                >
                                    Search audit
                                </label>
                                <input
                                    id="audit_q"
                                    type="search"
                                    value={auditQ}
                                    onChange={(event) =>
                                        setAuditQ(event.target.value)
                                    }
                                    placeholder="Action or summary"
                                    className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                />
                            </div>
                            <button
                                type="submit"
                                className="min-h-11 cursor-pointer rounded-md bg-teal-600 px-4 text-sm font-medium text-paper transition hover:bg-teal-800"
                            >
                                Search
                            </button>
                        </form>

                        {auditLogs.length === 0 ? (
                            <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
                                No audit events yet for this bank account.
                            </div>
                        ) : (
                            <ul className="divide-y divide-line rounded-md border border-line bg-white">
                                {auditLogs.map((log) => {
                                    const expanded =
                                        expandedAuditId === log.id;
                                    const hasDiff =
                                        log.before || log.after;

                                    return (
                                        <li key={log.id} className="px-4 py-3">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-medium text-ink">
                                                        {log.summary}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted">
                                                        {formatDate(
                                                            log.created_at,
                                                            true,
                                                        )}{' '}
                                                        ·{' '}
                                                        {log.actor_name ||
                                                            'System'}{' '}
                                                        ·{' '}
                                                        <span className="font-mono">
                                                            {log.action}
                                                        </span>
                                                    </p>
                                                </div>
                                                {hasDiff && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setExpandedAuditId(
                                                                expanded
                                                                    ? null
                                                                    : log.id,
                                                            )
                                                        }
                                                        className="min-h-11 cursor-pointer px-2 text-sm text-teal-800 underline-offset-2 hover:underline"
                                                    >
                                                        {expanded
                                                            ? 'Hide changes'
                                                            : 'Show changes'}
                                                    </button>
                                                )}
                                            </div>
                                            {expanded && hasDiff && (
                                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                    <pre className="overflow-x-auto rounded-md bg-mist p-3 text-xs text-ink-soft">
                                                        {JSON.stringify(
                                                            log.before,
                                                            null,
                                                            2,
                                                        )}
                                                    </pre>
                                                    <pre className="overflow-x-auto rounded-md bg-mist p-3 text-xs text-ink-soft">
                                                        {JSON.stringify(
                                                            log.after,
                                                            null,
                                                            2,
                                                        )}
                                                    </pre>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            <BankAccountModal
                open={editAccountOpen}
                mode="edit"
                bankAccount={bankAccount}
                statuses={statuses}
                returnTo="show"
                onClose={() => setEditAccountOpen(false)}
            />
            <BankCheckStandaloneModal
                open={standaloneOpen}
                bankAccount={bankAccount}
                onClose={() => setStandaloneOpen(false)}
            />
            <BankCheckAgainstPoModal
                open={againstPoOpen}
                bankAccount={bankAccount}
                eligibleOrders={eligibleOrders}
                onClose={() => setAgainstPoOpen(false)}
            />
            <BankCheckEditModal
                open={Boolean(editingCheck)}
                bankAccount={bankAccount}
                bankCheck={editingCheck}
                onClose={() => setEditingCheck(null)}
            />
        </AppLayout>
    );
}

import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { storePayment } from '@/actions/App/Http/Controllers/AccountsPayableController';
import PurchasedOrderPrepaymentModal from '@/components/purchased-order-prepayment-modal';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { formatProductLabel } from '@/lib/format-product-label';
import {
    index as accountsPayableIndex,
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

function paymentDetailLines(payment) {
    const details = [];

    if (payment.platform) {
        details.push(payment.platform);
    }
    if (payment.bank_name) {
        details.push(payment.bank_name);
    }
    if (payment.reference_number) {
        details.push(`Ref ${payment.reference_number}`);
    }
    if (payment.bank_check) {
        details.push(payment.bank_check.bank_account_name || 'Bank');
        details.push(`#${payment.bank_check.check_number}`);
        if (payment.bank_check.due_date) {
            details.push(`Due ${payment.bank_check.due_date}`);
        }
    }

    return [...details, payment.notes].filter(Boolean);
}

export default function AccountsPayableShow({
    supplier,
    order,
    paymentMethods = [],
    bankAccounts = [],
}) {
    const [paymentOpen, setPaymentOpen] = useState(false);
    const items = order.items ?? [];
    const payments = order.payments ?? [];
    const settled = Boolean(order.is_settled);
    const canRecordPayment = Boolean(order.can_add_prepayment);

    return (
        <AppLayout title={`AP — ${order.reference}`}>
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    <Link
                        href={accountsPayableIndex.url()}
                        className="text-teal-800 underline-offset-2 transition hover:underline"
                    >
                        Accounts Payable
                    </Link>
                    <span aria-hidden="true">/</span>
                    <Link
                        href={supplierRoute.url(supplier.id)}
                        className="text-teal-800 underline-offset-2 transition hover:underline"
                    >
                        {supplier.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="font-mono text-xs text-ink">
                        {order.reference}
                    </span>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-ink">
                            Accounts Payable: {order.supplier_name || supplier.name}
                        </h2>
                        <p className="mt-1 font-mono text-sm break-all text-ink-soft">
                            PO #: {order.reference}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusBadgeClass(order.status)}`}
                        >
                            {order.status_label}
                        </span>
                        <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs ${
                                settled
                                    ? 'border-green-600/30 bg-green-400/10 text-green-700'
                                    : 'border-amber-600/30 bg-amber-400/10 text-amber-800'
                            }`}
                        >
                            {settled ? 'Settled' : 'Open'}
                        </span>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Supplier
                        </p>
                        <p className="mt-1 text-sm font-medium text-ink">
                            {order.supplier_name || supplier.name}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Grand total
                        </p>
                        <p className="mt-1 text-lg font-semibold text-ink">
                            {formatMoney(order.grand_total)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Amount paid
                        </p>
                        <p className="mt-1 text-sm font-medium text-ink">
                            {formatMoney(order.amount_paid ?? 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Balance due
                        </p>
                        <p className="mt-1 text-sm font-medium text-ink">
                            {formatMoney(
                                order.balance_due ?? order.grand_total,
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Posted to AP
                        </p>
                        <p className="mt-1 text-sm text-ink-soft">
                            {formatDate(order.posted_to_ap_at)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Created
                        </p>
                        <p className="mt-1 text-sm text-ink-soft">
                            {formatDate(order.created_at)}
                        </p>
                    </div>
                </div>

                {order.notes && (
                    <div>
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Notes
                        </p>
                        <p className="mt-1 text-sm whitespace-pre-wrap text-ink-soft">
                            {order.notes}
                        </p>
                    </div>
                )}

                <div>
                    <p className="mb-2 text-xs tracking-wide text-muted uppercase">
                        Line items ({items.length})
                    </p>
                    <div className="overflow-x-auto rounded-md border border-line">
                        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                            <thead className="bg-teal-500/10">
                                <tr className="border-b border-line text-xs tracking-wide uppercase">
                                    <th className="px-3 py-2.5 font-medium text-muted">
                                        Product
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-muted">
                                        Purchase price
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-muted">
                                        Qty
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-muted">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-line/70 last:border-0"
                                    >
                                        <td className="px-3 py-2.5 text-ink">
                                            {formatProductLabel(
                                                item.product_name,
                                                item.product_unit,
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 text-ink-soft">
                                            {formatMoney(item.buying_price)}{item.product_unit ? ` / ${item.product_unit}` : ''}
                                        </td>
                                        <td className="px-3 py-2.5 text-ink-soft">
                                            {item.quantity}
                                        </td>
                                        <td className="px-3 py-2.5 font-medium text-ink">
                                            {formatMoney(item.subtotal)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs tracking-wide text-muted uppercase">
                            Payments ({payments.length})
                        </p>
                        {canRecordPayment && (
                            <button
                                type="button"
                                onClick={() => setPaymentOpen(true)}
                                className="min-h-11 rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition hover:bg-teal-800"
                            >
                                Record payment
                            </button>
                        )}
                    </div>
                    {payments.length === 0 ? (
                        <p className="rounded-md border border-line px-4 py-6 text-sm text-muted">
                            No payments recorded yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-md border border-line">
                            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                                <thead className="bg-teal-500/10">
                                    <tr className="border-b border-line text-xs tracking-wide uppercase">
                                        <th className="px-3 py-2.5 font-medium text-muted">
                                            Method
                                        </th>
                                        <th className="px-3 py-2.5 font-medium text-muted">
                                            Details
                                        </th>
                                        <th className="px-3 py-2.5 font-medium text-muted">
                                            Amount
                                        </th>
                                        <th className="px-3 py-2.5 font-medium text-muted">
                                            Recorded
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment) => {
                                        const detailLines =
                                            paymentDetailLines(payment);
                                        const isPdc =
                                            payment.method ===
                                            'post_dated_check';

                                        return (
                                            <tr
                                                key={payment.id}
                                                className="border-b border-line/70 last:border-0"
                                            >
                                                <td className="flex items-start px-3 py-2.5 font-medium text-ink">
                                                    {isPdc
                                                        ? 'PDC'
                                                        : payment.method_label}
                                                </td>
                                                <td className="px-3 py-2.5 text-ink-soft">
                                                    {detailLines.length ===
                                                    0 ? (
                                                        '—'
                                                    ) : isPdc ? (
                                                        <div className="space-y-0.5">
                                                            <p className="whitespace-nowrap text-xs">
                                                                Banks:{' '}
                                                                {
                                                                    detailLines[0]
                                                                }
                                                            </p>
                                                            <p className="whitespace-nowrap text-xs">
                                                                Check #:{' '}
                                                                {
                                                                    detailLines[1]
                                                                }
                                                            </p>
                                                            <p className="whitespace-nowrap text-xs">
                                                                Due Date:{' '}
                                                                {formatDate(
                                                                    detailLines[2],
                                                                )}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="whitespace-nowrap text-xs">
                                                            {detailLines.join(
                                                                ' · ',
                                                            )}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="flex items-start px-3 py-2.5 font-medium text-ink">
                                                    {formatMoney(
                                                        payment.amount,
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-xs text-ink-soft">
                                                    <p>
                                                        {formatDate(
                                                            payment.paid_at,
                                                        )}
                                                    </p>
                                                    {payment.recorded_by && (
                                                        <p className="mt-1 text-xs text-muted">
                                                            {
                                                                payment.recorded_by
                                                            }
                                                        </p>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="border-t border-line pt-4">
                    <Link
                        href={supplierRoute.url(supplier.id)}
                        className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink"
                    >
                        Back to supplier
                    </Link>
                </div>
            </div>

            <PurchasedOrderPrepaymentModal
                key={order.id}
                open={paymentOpen}
                order={order}
                paymentMethods={paymentMethods}
                bankAccounts={bankAccounts}
                onClose={() => setPaymentOpen(false)}
                submitUrl={storePayment.url({
                    supplier: supplier.id,
                    purchased_order: order.reference,
                })}
                title="Record settlement payment"
                submitLabel="Record payment"
            />
        </AppLayout>
    );
}

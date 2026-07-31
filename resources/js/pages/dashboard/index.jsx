import { Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { index as accountsPayable } from '@/routes/accounts-payable';
import { index as inventory } from '@/routes/inventory';
import { index as purchasedOrders } from '@/routes/purchased-orders';
import { index as requestQuotations } from '@/routes/request-quotations';

const attentionTypes = {
    pending_rfq: {
        label: 'Pending RFQ',
        className: 'border-amber-600/30 bg-amber-400/5 text-amber-800',
    },
    ordered_po: {
        label: 'Ordered PO',
        className: 'border-sky-600/30 bg-sky-400/5 text-sky-800',
    },
    ap_balance: {
        label: 'Accounts Payable',
        className: 'border-teal-600/30 bg-mist text-teal-800',
    },
    low_stock: {
        label: 'Low stock',
        className: 'border-red-600/30 bg-red-400/5 text-red-700',
    },
};

export default function Dashboard({ kpis, attention }) {
    const { settings } = usePage().props;
    const brand = settings?.brand_name || 'JMC Pundasyon';
    const cards = [
        {
            label: 'Pending RFQs',
            value: kpis.pending_rfqs,
            href: requestQuotations.url(),
        },
        {
            label: 'Draft POs',
            value: kpis.draft_pos,
            href: purchasedOrders.url(),
        },
        {
            label: 'Ordered POs',
            value: kpis.ordered_pos,
            href: purchasedOrders.url(),
        },
        {
            label: 'AP balance due',
            value: formatMoney(kpis.ap_balance_due),
            href: accountsPayable.url(),
        },
        {
            label: 'Low stock',
            value: kpis.low_stock,
            href: inventory.url(),
        },
    ];

    return (
        <AppLayout title="Dashboard">
            <div className="space-y-6 p-4">
                <header>
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                        Dashboard
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        {brand} — Procurement snapshot
                    </p>
                </header>

                <section aria-label="Procurement key performance indicators">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                        {cards.map((card) => (
                            <Link
                                key={card.label}
                                href={card.href}
                                className="flex min-h-24 cursor-pointer flex-col justify-between rounded-md border border-line bg-white p-4 transition duration-200 hover:border-teal-600 hover:bg-mist focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                                <span className="text-sm font-medium text-muted">
                                    {card.label}
                                </span>
                                <span className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                                    {card.value}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section
                    aria-labelledby="attention-heading"
                    className="overflow-hidden rounded-md border border-line bg-white"
                >
                    <div className="border-b border-line px-4 py-3">
                        <h3
                            id="attention-heading"
                            className="text-lg font-semibold text-ink"
                        >
                            Needs Attention
                        </h3>
                    </div>

                    {attention.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-muted">
                            Nothing needs attention.
                        </p>
                    ) : (
                        <div className="divide-y divide-line">
                            {attention.map((item, index) => {
                                const type =
                                    attentionTypes[item.type] ??
                                    attentionTypes.low_stock;

                                return (
                                    <Link
                                        key={`${item.type}-${item.title}-${index}`}
                                        href={item.href}
                                        className="grid min-h-16 cursor-pointer gap-2 px-4 py-3 transition duration-200 hover:bg-mist focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset sm:grid-cols-[minmax(9rem,auto)_minmax(0,1fr)_minmax(8rem,auto)] sm:items-center sm:gap-4"
                                    >
                                        <span
                                            className={`w-fit rounded-full border px-2.5 py-1 text-md font-bold ${type.className}`}
                                        >
                                            {type.label}
                                        </span>
                                        <span className="min-w-0">
                                            {item.subtitle ? (
                                                <span className="mt-0.5 block text-md font-medium wrap-break-word text-ink">
                                                    {item.subtitle}
                                                </span>
                                            ) : null}
                                            <span className="block text-[13px] wrap-break-word text-muted">
                                                Reference No.: {item.title}
                                            </span>
                                        </span>
                                        <span className="text-sm text-muted sm:text-right">
                                            {item.reason}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}

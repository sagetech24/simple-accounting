import { Link, usePage } from '@inertiajs/react';
import ProductTrendChart from '@/components/product-trend-chart';
import SalesDailySalesChart from '@/components/sales-daily-sales-chart';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format-money';
import { index as accountsPayable } from '@/routes/accounts-payable';
import { index as inventory } from '@/routes/inventory';
import { index as purchasedOrders } from '@/routes/purchased-orders';
import { index as requestQuotations } from '@/routes/request-quotations';
import { index as salesOrders } from '@/routes/sales-orders';

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
    sales_balance: {
        label: 'Sales due',
        className: 'border-teal-700/30 bg-teal-700/5 text-teal-800',
    },
    low_stock: {
        label: 'Low stock',
        className: 'border-red-600/30 bg-red-400/5 text-red-700',
    },
};

function MetricLegend({ colorClass, label, value }) {
    return (
        <div className="rounded-md border border-line bg-soft px-3 py-2">
            <p className="text-xs text-muted">{label}</p>
            <p className={`text-lg font-semibold tracking-tight ${colorClass}`}>
                {value}
            </p>
        </div>
    );
}

function KpiCard({ label, value, href }) {
    return (
        <Link
            href={href}
            className="flex min-h-24 cursor-pointer flex-col justify-between rounded-md border border-line bg-white p-4 transition duration-200 hover:border-teal-600 hover:bg-mist focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
        >
            <span className="text-sm font-medium text-muted">{label}</span>
            <span className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                {value}
            </span>
        </Link>
    );
}

export default function Dashboard({ kpis, attention, productTrend, dailySales }) {
    const { settings } = usePage().props;
    const brand = settings?.brand_name || 'JMC Pundasyon';
    const salesCards = [
        {
            label: "Today's sales",
            value: formatMoney(kpis.todays_sales),
            href: salesOrders.url(),
        },
        {
            label: 'Unpaid / partial',
            value: kpis.unpaid_partial_sales,
            href: salesOrders.url(),
        },
        {
            label: 'AR balance due',
            value: formatMoney(kpis.sales_ar_balance_due),
            href: salesOrders.url(),
        },
    ];
    const procurementCards = [
        {
            label: 'Pending Requests',
            value: kpis.pending_rfqs,
            href: requestQuotations.url(),
        },
        {
            label: 'Pending POs',
            value: kpis.draft_pos,
            href: purchasedOrders.url(),
        },
        {
            label: 'Purchase Orders',
            value: kpis.ordered_pos,
            href: purchasedOrders.url(),
        },
        {
            label: 'Accounts Payable Due',
            value: formatMoney(kpis.ap_balance_due),
            href: accountsPayable.url(),
        },
        {
            label: 'Low stock',
            value: kpis.low_stock,
            href: inventory.url(),
        },
    ];
    const labels = productTrend?.labels ?? [];
    const receivedSeries = productTrend?.series?.received_units ?? [];
    const adjustmentSeries = productTrend?.series?.adjustment_net ?? [];

    return (
        <AppLayout title="Dashboard">
            <div className="space-y-6 p-4">
                <header>
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                        Dashboard
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        {brand} — Ops snapshot
                    </p>
                </header>

                <section aria-label="Sales key performance indicators">
                    <h3 className="mb-2 text-sm font-medium text-muted">
                        Sales
                    </h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {salesCards.map((card) => (
                            <KpiCard
                                key={card.label}
                                label={card.label}
                                value={card.value}
                                href={card.href}
                            />
                        ))}
                    </div>
                </section>

                <section aria-label="Procurement key performance indicators">
                    <h3 className="mb-2 text-sm font-medium text-muted">
                        Procurement
                    </h3>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                        {procurementCards.map((card) => (
                            <KpiCard
                                key={card.label}
                                label={card.label}
                                value={card.value}
                                href={card.href}
                            />
                        ))}
                    </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <article className="overflow-hidden rounded-md border border-line bg-white">
                        <div className="border-b border-line px-4 py-3">
                            <h3 className="text-lg font-semibold text-ink">
                                Product Trend (Last 6 Months)
                            </h3>
                            <p className="text-xs text-muted">
                                Received units and stock adjustments by month
                            </p>
                        </div>
                        <div className="space-y-4 p-4">
                            <ProductTrendChart
                                labels={labels}
                                receivedUnits={receivedSeries}
                                adjustmentNet={adjustmentSeries}
                            />

                            <div className="grid gap-2 md:grid-cols-2">
                                <MetricLegend
                                    label="Total Received Units"
                                    value={
                                        productTrend?.totals?.received_units ??
                                        0
                                    }
                                    colorClass="text-sky-700"
                                />
                                <MetricLegend
                                    label="Net Adjustments"
                                    value={
                                        productTrend?.totals?.adjustment_net ??
                                        0
                                    }
                                    colorClass="text-amber-700"
                                />
                            </div>
                        </div>
                    </article>

                    <article className="overflow-hidden rounded-md border border-line bg-white">
                        <SalesDailySalesChart
                            labels={dailySales?.labels ?? []}
                            totals={dailySales?.totals ?? []}
                            className="space-y-3 px-4 py-4"
                        />
                    </article>
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

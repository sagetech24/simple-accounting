import { useEffect, useMemo, useState } from 'react';
import { formatMoney } from '@/lib/format-money';

const TEAL = '#0f766e';

const RANGE_OPTIONS = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: 'month', label: 'Current month' },
    { value: '90', label: 'Last 90 days' },
];

function sliceDailySales(labels = [], totals = [], range = '30') {
    const safeLabels = Array.isArray(labels) ? labels : [];
    const safeTotals = Array.isArray(totals) ? totals : [];
    const length = Math.min(safeLabels.length, safeTotals.length);

    if (length === 0) {
        return { labels: [], totals: [] };
    }

    if (range === 'month') {
        const endLabel = safeLabels[length - 1];
        const monthPrefix = endLabel.slice(0, 7); // YYYY-MM
        const startIndex = safeLabels.findIndex(
            (label, index) => index < length && label.startsWith(monthPrefix),
        );

        return {
            labels: safeLabels.slice(startIndex, length),
            totals: safeTotals.slice(startIndex, length),
        };
    }

    const days = range === '7' ? 7 : range === '90' ? 90 : 30;
    const startIndex = Math.max(0, length - days);

    return {
        labels: safeLabels.slice(startIndex, length),
        totals: safeTotals.slice(startIndex, length),
    };
}

function formatAxisDate(value) {
    const parsed = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
        }).format(parsed);
    } catch {
        return value;
    }
}

export default function SalesDailySalesChart({ labels = [], totals = [] }) {
    const [Chart, setChart] = useState(null);
    const [reduceMotion, setReduceMotion] = useState(false);
    const [range, setRange] = useState('30');

    useEffect(() => {
        let cancelled = false;

        setReduceMotion(
            window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        );

        import('react-apexcharts').then((module) => {
            if (!cancelled) {
                setChart(() => module.default);
            }
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const sliced = useMemo(
        () => sliceDailySales(labels, totals, range),
        [labels, totals, range],
    );

    const displayLabels = sliced.labels.map(formatAxisDate);

    const options = {
        chart: {
            id: 'sales-daily-sales',
            type: 'area',
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'Instrument Sans, ui-sans-serif, system-ui, sans-serif',
            animations: {
                enabled: !reduceMotion,
                speed: 500,
            },
        },
        colors: [TEAL],
        stroke: {
            curve: 'smooth',
            width: 3,
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.35,
                opacityTo: 0.05,
                stops: [0, 100],
            },
        },
        dataLabels: { enabled: false },
        markers: {
            size: 0,
            hover: { size: 5 },
        },
        grid: {
            borderColor: '#e4e4e7',
            strokeDashArray: 4,
            padding: { left: 8, right: 8 },
        },
        legend: { show: false },
        tooltip: {
            y: {
                formatter: (value) => formatMoney(value ?? 0),
            },
        },
        xaxis: {
            categories: displayLabels,
            labels: {
                style: {
                    colors: '#71717a',
                    fontSize: '12px',
                },
                rotate: 0,
                hideOverlappingLabels: true,
            },
            axisBorder: { color: '#e4e4e7' },
            axisTicks: { color: '#e4e4e7' },
        },
        yaxis: {
            labels: {
                style: { colors: '#71717a', fontSize: '11px' },
                formatter: (value) => formatMoney(value ?? 0),
            },
        },
    };

    const series = [
        {
            name: 'Sales',
            data: sliced.totals,
        },
    ];

    return (
        <div className="space-y-3 border-b border-line px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-ink">
                        Daily sales
                    </h2>
                    <p className="text-xs text-muted">
                        Active orders only · zero-sales days included
                    </p>
                </div>
                <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
                    <span className="text-muted">Range</span>
                    <select
                        value={range}
                        onChange={(event) => setRange(event.target.value)}
                        className="min-h-11 min-w-44 rounded-md border border-line bg-white px-3 text-sm text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                        {RANGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {!Chart ? (
                <div
                    className="flex h-64 items-center justify-center rounded-md border border-line bg-soft text-sm text-muted"
                    aria-hidden="true"
                >
                    Loading chart…
                </div>
            ) : (
                <div className="rounded-md border border-line bg-soft p-2 md:p-3">
                    <Chart
                        options={options}
                        series={series}
                        type="area"
                        height={256}
                        width="100%"
                    />
                </div>
            )}
        </div>
    );
}

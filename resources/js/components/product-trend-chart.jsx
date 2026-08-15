import { useEffect, useState } from 'react';

const RECEIVED_COLOR = '#0284c7';
const ADJUSTMENT_COLOR = '#d97706';

export default function ProductTrendChart({
    labels = [],
    receivedUnits = [],
    adjustmentNet = [],
    height = 288,
}) {
    const [Chart, setChart] = useState(null);
    const [reduceMotion, setReduceMotion] = useState(false);

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

    const options = {
        chart: {
            id: 'product-trend',
            type: 'line',
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'Instrument Sans, ui-sans-serif, system-ui, sans-serif',
            animations: {
                enabled: !reduceMotion,
                speed: 500,
            },
        },
        colors: [RECEIVED_COLOR, ADJUSTMENT_COLOR],
        stroke: {
            curve: 'stepline',
            width: [3, 2],
            dashArray: [0, 6],
        },
        markers: {
            size: [4, 4],
            hover: { sizeOffset: 2 },
        },
        dataLabels: { enabled: false },
        grid: {
            borderColor: '#e4e4e7',
            strokeDashArray: 4,
            padding: { left: 8, right: 8 },
        },
        legend: {
            position: 'top',
            horizontalAlign: 'left',
            fontSize: '12px',
            markers: { size: 8 },
        },
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: (value) =>
                    typeof value === 'number'
                        ? value.toLocaleString()
                        : String(value ?? 0),
            },
        },
        xaxis: {
            categories: labels,
            labels: {
                style: {
                    colors: '#71717a',
                    fontSize: '12px',
                },
            },
            axisBorder: { color: '#e4e4e7' },
            axisTicks: { color: '#e4e4e7' },
        },
        yaxis: [
            {
                seriesName: 'Received Units',
                title: {
                    text: 'Received',
                    style: { color: RECEIVED_COLOR, fontSize: '11px' },
                },
                labels: {
                    style: { colors: RECEIVED_COLOR, fontSize: '11px' },
                    formatter: (value) => Math.round(value).toLocaleString(),
                },
            },
            {
                opposite: true,
                seriesName: 'Net Adjustments',
                title: {
                    text: 'Adjustments',
                    style: { color: ADJUSTMENT_COLOR, fontSize: '11px' },
                },
                labels: {
                    style: { colors: ADJUSTMENT_COLOR, fontSize: '11px' },
                    formatter: (value) => Math.round(value).toLocaleString(),
                },
            },
        ],
    };

    const series = [
        {
            name: 'Received Units',
            type: 'line',
            data: receivedUnits,
        },
        {
            name: 'Net Adjustments',
            type: 'line',
            data: adjustmentNet,
        },
    ];

    if (!Chart) {
        return (
            <div
                className="flex items-center justify-center rounded-md border border-line bg-soft text-sm text-muted"
                style={{ height }}
                aria-hidden="true"
            >
                Loading chart…
            </div>
        );
    }

    return (
        <div className="rounded-md border border-line bg-soft p-2 md:p-3">
            <Chart
                options={options}
                series={series}
                type="line"
                height={height}
                width="100%"
            />
        </div>
    );
}

import { useEffect, useState } from 'react';

const TEAL = '#0f766e';

export default function TopSoldChart({
    labels = [],
    quantities = [],
    height = 360,
}) {
    const [Chart, setChart] = useState(null);
    const [reduceMotion, setReduceMotion] = useState(false);
    const count = Math.min(labels.length, quantities.length);

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
            id: 'top-sold',
            type: 'bar',
            toolbar: { show: false },
            fontFamily: 'Instrument Sans, ui-sans-serif, system-ui, sans-serif',
            animations: {
                enabled: !reduceMotion,
                speed: 500,
            },
        },
        colors: [TEAL],
        plotOptions: {
            bar: {
                horizontal: false,
                borderRadius: 4,
                columnWidth: '55%',
                dataLabels: {
                    position: 'top',
                },
            },
        },
        dataLabels: {
            enabled: true,
            offsetY: -18,
            formatter: (value) =>
                typeof value === 'number'
                    ? value.toLocaleString()
                    : String(value ?? 0),
            style: {
                fontSize: '11px',
                colors: ['#134e4a'],
            },
        },
        grid: {
            borderColor: '#e4e4e7',
            strokeDashArray: 4,
            padding: { left: 8, right: 8, top: 16 },
        },
        legend: { show: false },
        tooltip: {
            y: {
                formatter: (value) =>
                    `${typeof value === 'number' ? value.toLocaleString() : value} sold`,
            },
        },
        xaxis: {
            categories: labels,
            labels: {
                rotate: -45,
                rotateAlways: true,
                hideOverlappingLabels: true,
                trim: true,
                style: {
                    colors: '#71717a',
                    fontSize: '11px',
                },
            },
            axisBorder: { color: '#e4e4e7' },
            axisTicks: { color: '#e4e4e7' },
        },
        yaxis: {
            title: {
                text: 'Quantity sold',
                style: { color: '#71717a', fontSize: '11px' },
            },
            labels: {
                style: {
                    colors: '#71717a',
                    fontSize: '11px',
                },
                formatter: (value) =>
                    Math.round(Number(value) || 0).toLocaleString(),
            },
        },
    };

    const series = [
        {
            name: 'Quantity sold',
            data: quantities,
        },
    ];

    if (count === 0) {
        return (
            <div
                className="bg-soft flex items-center justify-center rounded-md border border-line text-sm text-muted"
                style={{ height }}
            >
                No sold products to chart.
            </div>
        );
    }

    if (!Chart) {
        return (
            <div
                className="bg-soft flex items-center justify-center rounded-md border border-line text-sm text-muted"
                style={{ height }}
                aria-hidden="true"
            >
                Loading chart…
            </div>
        );
    }

    return (
        <div className="bg-soft rounded-md border border-line p-2 md:p-3">
            <Chart
                options={options}
                series={series}
                type="bar"
                height={height}
                width="100%"
            />
        </div>
    );
}

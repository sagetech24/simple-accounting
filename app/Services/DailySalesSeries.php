<?php

namespace App\Services;

use App\Models\SalesOrder;
use Illuminate\Support\Carbon;

class DailySalesSeries
{
    /**
     * Zero-filled daily grand_total sums for the last 90 calendar days (active orders only).
     *
     * @return array{labels: list<string>, totals: list<float>}
     */
    public function build(): array
    {
        $timezone = config('app.timezone');
        $end = now($timezone)->startOfDay();
        $start = $end->copy()->subDays(89);

        $days = collect(range(0, 89))
            ->map(fn (int $offset) => $start->copy()->addDays($offset));

        $buckets = $days->mapWithKeys(
            fn ($day) => [$day->toDateString() => 0.0],
        );

        $rows = SalesOrder::query()
            ->where('created_at', '>=', $start)
            ->selectRaw('DATE(created_at) as sale_date, SUM(grand_total) as total')
            ->groupBy('sale_date')
            ->get();

        foreach ($rows as $row) {
            $key = Carbon::parse((string) $row->sale_date)->toDateString();

            if ($buckets->has($key)) {
                $buckets->put($key, round((float) $row->total, 2));
            }
        }

        return [
            'labels' => $buckets->keys()->values()->all(),
            'totals' => $buckets->values()->map(fn ($total) => (float) $total)->all(),
        ];
    }
}

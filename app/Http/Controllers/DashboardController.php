<?php

namespace App\Http\Controllers;

use App\Enums\PurchasedOrderStatus;
use App\Enums\RequestQuotationStatus;
use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\PurchasedOrder;
use App\Models\RequestQuotation;
use App\Models\SalesOrder;
use App\Models\StockMovement;
use App\Services\DailySalesSeries;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $pendingRfqs = RequestQuotation::query()
            ->where('status', RequestQuotationStatus::Pending)
            ->count();

        $draftPos = PurchasedOrder::query()
            ->where('status', PurchasedOrderStatus::Draft)
            ->count();

        $orderedPos = PurchasedOrder::query()
            ->where('status', PurchasedOrderStatus::Ordered)
            ->count();

        $apBalanceDue = PurchasedOrder::query()
            ->postedToAccountsPayable()
            ->with('payments')
            ->get()
            ->sum(fn (PurchasedOrder $order) => (float) $order->balanceDue());

        $lowStock = Product::query()
            ->whereNotNull('low_stock_threshold')
            ->whereColumn('quantity', '<=', 'low_stock_threshold')
            ->count();

        $dailySales = (new DailySalesSeries)->build();
        $todaysSales = number_format(
            (float) ($dailySales['totals'][count($dailySales['totals']) - 1] ?? 0),
            2,
            '.',
            '',
        );

        $unpaidPartialSales = SalesOrder::query()
            ->with('payments')
            ->get()
            ->filter(fn (SalesOrder $order) => (float) $order->balanceDue() > 0);

        return Inertia::render('dashboard/index', [
            'kpis' => [
                'pending_rfqs' => $pendingRfqs,
                'draft_pos' => $draftPos,
                'ordered_pos' => $orderedPos,
                'ap_balance_due' => number_format($apBalanceDue, 2, '.', ''),
                'low_stock' => $lowStock,
                'todays_sales' => $todaysSales,
                'unpaid_partial_sales' => $unpaidPartialSales->count(),
                'sales_ar_balance_due' => number_format(
                    $unpaidPartialSales->sum(fn (SalesOrder $order) => (float) $order->balanceDue()),
                    2,
                    '.',
                    '',
                ),
            ],
            'attention' => $this->attentionItems(),
            'productTrend' => $this->productTrend(),
            'dailySales' => $dailySales,
        ]);
    }

    /**
     * @return array{
     *   labels: list<string>,
     *   series: array{received_units: list<int>, adjustment_net: list<int>},
     *   totals: array{received_units: int, adjustment_net: int}
     * }
     */
    private function productTrend(): array
    {
        $startMonth = now()->startOfMonth()->subMonths(5);
        $months = collect(range(0, 5))
            ->map(fn (int $offset) => $startMonth->copy()->addMonths($offset));

        $buckets = $months
            ->mapWithKeys(fn ($month) => [
                $month->format('Y-m') => [
                    'received_units' => 0,
                    'adjustment_net' => 0,
                ],
            ]);

        $movements = StockMovement::query()
            ->where('created_at', '>=', $startMonth)
            ->whereIn('type', [
                StockMovementType::Receipt->value,
                StockMovementType::Adjustment->value,
            ])
            ->get(['type', 'quantity_delta', 'created_at']);

        foreach ($movements as $movement) {
            $monthKey = $movement->created_at?->format('Y-m');

            if (! $monthKey || ! $buckets->has($monthKey)) {
                continue;
            }

            $bucket = $buckets->get($monthKey);

            if ($movement->type === StockMovementType::Receipt) {
                $bucket['received_units'] += max((int) $movement->quantity_delta, 0);
            }

            if ($movement->type === StockMovementType::Adjustment) {
                $bucket['adjustment_net'] += (int) $movement->quantity_delta;
            }

            $buckets->put($monthKey, $bucket);
        }

        $labels = $months
            ->map(fn ($month) => $month->format('M'))
            ->values()
            ->all();

        $receivedUnits = $buckets
            ->map(fn (array $bucket) => $bucket['received_units'])
            ->values()
            ->all();

        $adjustmentNet = $buckets
            ->map(fn (array $bucket) => $bucket['adjustment_net'])
            ->values()
            ->all();

        return [
            'labels' => $labels,
            'series' => [
                'received_units' => $receivedUnits,
                'adjustment_net' => $adjustmentNet,
            ],
            'totals' => [
                'received_units' => array_sum($receivedUnits),
                'adjustment_net' => array_sum($adjustmentNet),
            ],
        ];
    }

    /**
     * @return list<array{type: string, title: string, subtitle: string, reason: string, href: string}>
     */
    private function attentionItems(): array
    {
        $attention = [];

        foreach (
            RequestQuotation::query()
                ->where('status', RequestQuotationStatus::Pending)
                ->with(['supplier:id,name'])
                ->withCount('items')
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->limit(3)
                ->get(['id', 'reference', 'supplier_id', 'grand_total']) as $quotation
        ) {
            $attention[] = [
                'type' => 'pending_rfq',
                'title' => $quotation->reference,
                'subtitle' => $this->joinAttentionSegments([
                    $quotation->supplier?->name,
                    $this->formatAttentionMoney((float) $quotation->grand_total),
                    $this->formatItemCount((int) $quotation->items_count),
                ]),
                'reason' => 'Approve quotation',
                'href' => route('request-quotations.index', absolute: false),
            ];
        }

        foreach (
            PurchasedOrder::query()
                ->where('status', PurchasedOrderStatus::Ordered)
                ->with(['supplier:id,name'])
                ->withCount('items')
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->limit(3)
                ->get(['id', 'reference', 'supplier_id', 'grand_total']) as $order
        ) {
            $attention[] = [
                'type' => 'ordered_po',
                'title' => $order->reference,
                'subtitle' => $this->joinAttentionSegments([
                    $order->supplier?->name,
                    $this->formatAttentionMoney((float) $order->grand_total),
                    $this->formatItemCount((int) $order->items_count),
                ]),
                'reason' => 'Mark received',
                'href' => route('purchased-orders.index', absolute: false),
            ];
        }

        $postedWithBalance = PurchasedOrder::query()
            ->postedToAccountsPayable()
            ->with(['payments', 'supplier:id,name'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(20)
            ->get()
            ->filter(fn (PurchasedOrder $order) => (float) $order->balanceDue() > 0)
            ->take(3);

        foreach ($postedWithBalance as $order) {
            $attention[] = [
                'type' => 'ap_balance',
                'title' => $order->reference,
                'subtitle' => $this->joinAttentionSegments([
                    $order->supplier?->name,
                    'Balance '.$this->formatAttentionMoney((float) $order->balanceDue()),
                ]),
                'reason' => 'Settle payment',
                'href' => route('accounts-payable.show', [$order->supplier_id, $order], absolute: false),
            ];
        }

        foreach (
            Product::query()
                ->whereNotNull('low_stock_threshold')
                ->whereColumn('quantity', '<=', 'low_stock_threshold')
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->limit(3)
                ->get(['id', 'name', 'quantity', 'low_stock_threshold']) as $product
        ) {
            $attention[] = [
                'type' => 'low_stock',
                'title' => $product->name,
                'subtitle' => $this->joinAttentionSegments([
                    $product->quantity.' on hand',
                    'threshold '.$product->low_stock_threshold,
                ]),
                'reason' => 'Review stock',
                'href' => route('inventory.index', absolute: false),
            ];
        }

        return array_values(array_slice($attention, 0, 12));
    }

    /**
     * @param  list<string|null>  $segments
     */
    private function joinAttentionSegments(array $segments): string
    {
        return implode(' · ', array_values(array_filter(
            $segments,
            fn (?string $segment): bool => filled($segment)
        )));
    }

    private function formatAttentionMoney(float $amount): string
    {
        return '₱'.number_format($amount, 2, '.', ',');
    }

    private function formatItemCount(int $count): string
    {
        return $count === 1 ? '1 item' : $count.' items';
    }
}

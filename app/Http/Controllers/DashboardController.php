<?php

namespace App\Http\Controllers;

use App\Enums\PurchasedOrderStatus;
use App\Enums\RequestQuotationStatus;
use App\Models\Product;
use App\Models\PurchasedOrder;
use App\Models\RequestQuotation;
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

        return Inertia::render('dashboard/index', [
            'kpis' => [
                'pending_rfqs' => $pendingRfqs,
                'draft_pos' => $draftPos,
                'ordered_pos' => $orderedPos,
                'ap_balance_due' => number_format($apBalanceDue, 2, '.', ''),
                'low_stock' => $lowStock,
            ],
            'attention' => $this->attentionItems(),
        ]);
    }

    /**
     * @return list<array{type: string, title: string, reason: string, href: string}>
     */
    private function attentionItems(): array
    {
        $attention = [];

        foreach (
            RequestQuotation::query()
                ->where('status', RequestQuotationStatus::Pending)
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->limit(3)
                ->get(['id', 'reference']) as $quotation
        ) {
            $attention[] = [
                'type' => 'pending_rfq',
                'title' => $quotation->reference,
                'reason' => 'Approve quotation',
                'href' => route('request-quotations.index', absolute: false),
            ];
        }

        foreach (
            PurchasedOrder::query()
                ->where('status', PurchasedOrderStatus::Ordered)
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->limit(3)
                ->get(['id', 'reference']) as $order
        ) {
            $attention[] = [
                'type' => 'ordered_po',
                'title' => $order->reference,
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
                ->get(['id', 'name']) as $product
        ) {
            $attention[] = [
                'type' => 'low_stock',
                'title' => $product->name,
                'reason' => 'Review stock',
                'href' => route('inventory.index', absolute: false),
            ];
        }

        return array_values(array_slice($attention, 0, 12));
    }
}

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
            'attention' => [],
        ]);
    }
}

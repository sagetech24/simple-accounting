<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\SalesOrder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AccountsReceivableController extends Controller
{
    /**
     * Customer rollup of non-voided sales orders for collection.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', Rule::in([
                'name',
                'order_count',
                'open_order_count',
                'total_receivable',
                'total_paid',
                'balance_due',
            ])],
            'direction' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
        ]);

        $search = $filters['q'] ?? null;
        $sort = $filters['sort'] ?? 'name';
        $direction = $filters['direction'] ?? 'asc';

        $customers = Customer::query()
            ->withTrashed()
            ->whereHas('salesOrders', fn ($query) => $query->whereNotNull('customer_id'))
            ->with([
                'salesOrders' => fn ($query) => $query
                    ->whereNotNull('customer_id')
                    ->with('payments'),
            ])
            ->search($search)
            ->orderBy('name')
            ->get()
            ->map(function (Customer $customer) {
                $orders = $customer->salesOrders;
                $openOrders = $orders->filter(
                    fn (SalesOrder $order) => (float) $order->balanceDue() > 0,
                );
                $totalReceivable = $orders->sum(
                    fn (SalesOrder $order) => (float) $order->grand_total,
                );
                $totalPaid = $orders->sum(
                    fn (SalesOrder $order) => (float) $order->amountPaid(),
                );
                $balanceDue = $orders->sum(
                    fn (SalesOrder $order) => (float) $order->balanceDue(),
                );

                return [
                    ...$customer->toArrayPayload(),
                    'order_count' => $orders->count(),
                    'open_order_count' => $openOrders->count(),
                    'total_receivable' => number_format($totalReceivable, 2, '.', ''),
                    'total_paid' => number_format($totalPaid, 2, '.', ''),
                    'balance_due' => number_format($balanceDue, 2, '.', ''),
                ];
            })
            ->values();

        $customers = ($direction === 'desc'
            ? $customers->sortByDesc(fn (array $row) => match ($sort) {
                'name' => $row['name'],
                'order_count', 'open_order_count' => (int) $row[$sort],
                default => (float) $row[$sort],
            })
            : $customers->sortBy(fn (array $row) => match ($sort) {
                'name' => $row['name'],
                'order_count', 'open_order_count' => (int) $row[$sort],
                default => (float) $row[$sort],
            }))
            ->values()
            ->all();

        return Inertia::render('accounts-receivable/index', [
            'customers' => $customers,
            'filters' => [
                'q' => $search ?? '',
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }
}

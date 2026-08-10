<?php

namespace App\Http\Controllers;

use App\Enums\CustomerStatus;
use App\Http\Requests\StoreSalesOrderRequest;
use App\Models\Customer;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Services\StockService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class SalesOrderController extends Controller
{
    /**
     * Sales order list (default) with create-tab picker props.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'trashed' => ['nullable', 'string', Rule::in(['only', 'with'])],
        ]);

        $trashed = $filters['trashed'] ?? null;

        $filteredQuery = SalesOrder::query()
            ->when($trashed === 'only', fn ($builder) => $builder->onlyTrashed())
            ->when($trashed === 'with', fn ($builder) => $builder->withTrashed());

        $summary = [
            'order_count' => (clone $filteredQuery)->count(),
            'grand_total_sum' => number_format(
                (float) (clone $filteredQuery)->sum('grand_total'),
                2,
                '.',
                '',
            ),
        ];

        $orders = (clone $filteredQuery)
            ->with(['customer', 'items.product'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(8)
            ->withQueryString()
            ->through(fn (SalesOrder $order) => $order->toArrayPayload());

        return Inertia::render('sales-orders/index', [
            'orders' => $orders,
            'summary' => $summary,
            'filters' => [
                'trashed' => $trashed ?? '',
            ],
            'customers' => Customer::query()
                ->where('status', CustomerStatus::Active)
                ->orderBy('name')
                ->get()
                ->map(fn (Customer $customer) => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'contact_name' => $customer->contact_name,
                    'email' => $customer->email,
                ])
                ->values()
                ->all(),
            'products' => Product::query()
                ->orderBy('name')
                ->get()
                ->map(fn (Product $product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'unit' => $product->unit,
                    'selling_price' => $product->selling_price,
                    'quantity' => $product->quantity,
                    'status' => $product->status->value,
                    'status_label' => $product->status->label(),
                ])
                ->values()
                ->all(),
        ]);
    }

    /**
     * Persist a sales order and post outbound stock movements.
     */
    public function store(StoreSalesOrderRequest $request, StockService $stock): RedirectResponse
    {
        $attributes = $request->orderAttributes();
        $items = $request->itemAttributes();
        $createdBy = $request->user()?->name ?? 'Unknown';

        try {
            DB::transaction(function () use ($attributes, $items, $stock, $createdBy): void {
                [$grandTotal, $lineRows] = $this->buildLineRows($items);

                $order = SalesOrder::query()->create([
                    ...$attributes,
                    'grand_total' => $grandTotal,
                ]);

                $order->items()->createMany($lineRows);
                $order->load('items.product');

                $stock->sellFromSalesOrder($order, $createdBy);
            });
        } catch (InvalidArgumentException $exception) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $exception->getMessage(),
            ]);

            return redirect()->back();
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Sales order recorded. Stock updated.',
        ]);

        return redirect()->route('sales-orders.index');
    }

    /**
     * Void a sales order: soft-delete and restore on-hand stock.
     */
    public function destroy(SalesOrder $salesOrder, StockService $stock, Request $request): RedirectResponse
    {
        $createdBy = $request->user()?->name ?? 'Unknown';

        DB::transaction(function () use ($salesOrder, $stock, $createdBy): void {
            $salesOrder->load('items.product');
            $salesOrder->delete();
            $stock->restoreStockFromSalesOrder($salesOrder, $createdBy);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Sales order voided. Stock restored.',
        ]);

        return redirect()->route('sales-orders.index');
    }

    /**
     * Restore a voided sales order and re-post outbound stock.
     */
    public function restore(SalesOrder $salesOrder, StockService $stock, Request $request): RedirectResponse
    {
        $createdBy = $request->user()?->name ?? 'Unknown';

        try {
            DB::transaction(function () use ($salesOrder, $stock, $createdBy): void {
                $salesOrder->restore();
                $salesOrder->load('items.product');
                $stock->sellFromSalesOrder($salesOrder, $createdBy);
            });
        } catch (InvalidArgumentException $exception) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $exception->getMessage(),
            ]);

            return redirect()->route('sales-orders.index', ['trashed' => 'only']);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Sales order restored. Stock updated.',
        ]);

        return redirect()->route('sales-orders.index');
    }

    /**
     * @param  list<array{product_id: int, selling_price: string, quantity: int}>  $items
     * @return array{0: string, 1: list<array{product_id: int, selling_price: string, quantity: int, subtotal: string}>}
     */
    private function buildLineRows(array $items): array
    {
        $grandTotal = '0.00';
        $lineRows = [];

        foreach ($items as $item) {
            $subtotal = SalesOrderItem::calculateSubtotal(
                $item['selling_price'],
                $item['quantity'],
            );
            $grandTotal = number_format((float) $grandTotal + (float) $subtotal, 2, '.', '');

            $lineRows[] = [
                'product_id' => $item['product_id'],
                'selling_price' => $item['selling_price'],
                'quantity' => $item['quantity'],
                'subtotal' => $subtotal,
            ];
        }

        return [$grandTotal, $lineRows];
    }
}

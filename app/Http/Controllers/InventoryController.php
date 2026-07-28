<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementType;
use App\Http\Requests\AdjustStockRequest;
use App\Http\Requests\UpdateInventorySettingsRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductSellingPriceHistory;
use App\Models\PurchasedOrder;
use App\Models\StockMovement;
use App\Services\StockService;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    /**
     * Inventory on-hand list (default) and stock movement ledger.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'tab' => ['nullable', 'string', Rule::in(['on-hand', 'movements'])],
            'q' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:120'],
            'type' => ['nullable', 'string', Rule::enum(StockMovementType::class)],
            'sort' => ['nullable', 'string', Rule::in(['name', 'quantity', 'created_at'])],
            'direction' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
        ]);

        $tab = $filters['tab'] ?? 'on-hand';
        $query = $filters['q'] ?? null;
        $category = $filters['category'] ?? null;
        $type = $filters['type'] ?? null;
        $sort = $filters['sort'] ?? ($tab === 'movements' ? 'created_at' : 'name');
        $direction = $filters['direction'] ?? ($tab === 'movements' ? 'desc' : 'asc');

        $products = null;
        $movements = null;

        if ($tab === 'movements') {
            $movements = StockMovement::query()
                ->with([
                    'product' => fn ($builder) => $builder->withTrashed(),
                    'reference' => function (MorphTo $morphTo): void {
                        $morphTo->morphWith([
                            PurchasedOrder::class => [
                                'supplier',
                                'requestQuotation',
                                'items.product',
                                'payments.bankCheck.bankAccount',
                            ],
                        ]);
                    },
                ])
                ->when($query, function ($builder) use ($query) {
                    $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $query).'%';

                    $builder->where(function ($inner) use ($like) {
                        $inner->where('notes', 'like', $like)
                            ->orWhere('created_by', 'like', $like)
                            ->orWhereHas('product', function ($productQuery) use ($like) {
                                $productQuery->withTrashed()->where('name', 'like', $like);
                            });
                    });
                })
                ->when($type, fn ($builder) => $builder->where('type', $type))
                ->when(
                    $sort === 'created_at',
                    fn ($builder) => $builder->orderBy('created_at', $direction)->orderBy('id', $direction),
                    fn ($builder) => $builder->orderBy('id', 'desc'),
                )
                ->paginate(15)
                ->withQueryString()
                ->through(fn (StockMovement $movement) => $movement->toInventoryArray());
        } else {
            $allowedSort = in_array($sort, ['name', 'quantity'], true) ? $sort : 'name';

            $products = Product::query()
                ->with([
                    'categories:id,name,slug',
                    'sellingPriceHistories' => fn ($query) => $query->limit(10),
                ])
                ->search($query)
                ->inCategory($category)
                ->orderBy($allowedSort, $direction)
                ->paginate(15)
                ->withQueryString()
                ->through(fn (Product $product) => $product->toInventoryArray());
        }

        $categories = Category::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('inventory/index', [
            'tab' => $tab,
            'products' => $products,
            'movements' => $movements,
            'categories' => $categories,
            'movementTypes' => $this->movementTypeOptions(),
            'filters' => [
                'tab' => $tab,
                'q' => $query ?? '',
                'category' => $category ?? '',
                'type' => $type ?? '',
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    /**
     * Adjust on-hand quantity for a product via an adjustment movement.
     */
    public function adjust(
        AdjustStockRequest $request,
        Product $product,
        StockService $stock,
    ): RedirectResponse {
        $stock->setQuantity(
            product: $product,
            newQuantity: $request->quantity(),
            createdBy: $request->user()?->name ?? 'Unknown',
            notes: $request->notes(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Stock adjusted.',
        ]);

        return redirect()->route('inventory.index', [
            'tab' => 'on-hand',
        ]);
    }

    /**
     * Update inventory settings: low-stock threshold and selling price.
     */
    public function updateSettings(
        UpdateInventorySettingsRequest $request,
        Product $product,
    ): RedirectResponse {
        $createdBy = $request->user()?->name ?? 'Unknown';
        $newSellingPrice = $request->sellingPrice();
        $previousSellingPrice = number_format((float) $product->selling_price, 2, '.', '');

        DB::transaction(function () use ($request, $product, $createdBy, $newSellingPrice, $previousSellingPrice): void {
            $product->update([
                'low_stock_threshold' => $request->lowStockThreshold(),
                'selling_price' => $newSellingPrice,
            ]);

            if ($newSellingPrice !== $previousSellingPrice) {
                ProductSellingPriceHistory::query()->create([
                    'product_id' => $product->id,
                    'previous_price' => $previousSellingPrice,
                    'new_price' => $newSellingPrice,
                    'note' => $request->priceChangeNote(),
                    'created_by' => $createdBy,
                ]);
            }
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Inventory settings saved.',
        ]);

        return redirect()->route('inventory.index', [
            'tab' => 'on-hand',
        ]);
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function movementTypeOptions(): array
    {
        return array_map(
            fn (StockMovementType $type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ],
            StockMovementType::cases(),
        );
    }
}

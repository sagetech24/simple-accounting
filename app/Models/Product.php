<?php

namespace App\Models;

use App\Enums\ProductStatus;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'name',
    'unit',
    'description',
    'quantity',
    'low_stock_threshold',
    'purchase_price',
    'selling_price',
    'status',
])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'low_stock_threshold' => 'integer',
            'purchase_price' => 'decimal:2',
            'selling_price' => 'decimal:2',
            'status' => ProductStatus::class,
        ];
    }

    /**
     * @return BelongsToMany<Category, $this>
     */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class)->withTimestamps();
    }

    /**
     * @return HasMany<StockMovement, $this>
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * @return HasMany<ProductSellingPriceHistory, $this>
     */
    public function sellingPriceHistories(): HasMany
    {
        return $this->hasMany(ProductSellingPriceHistory::class)->latest();
    }

    /**
     * True when on-hand is at or below the configured minimum desired stock.
     */
    public function isLowStock(): bool
    {
        if ($this->low_stock_threshold === null) {
            return false;
        }

        return $this->quantity <= $this->low_stock_threshold;
    }

    /**
     * Suggested default threshold: current on-hand plus reorder buffer of 4.
     */
    public function suggestedLowStockThreshold(): int
    {
        return $this->quantity + 4;
    }

    /**
     * Derived browse availability from status + quantity.
     */
    public function availability(): string
    {
        return match ($this->status) {
            ProductStatus::Unavailable => 'unavailable',
            ProductStatus::Discontinued => 'discontinued',
            ProductStatus::Available => $this->quantity > 0 ? 'in_stock' : 'out_of_stock',
        };
    }

    public function availabilityLabel(): string
    {
        return match ($this->availability()) {
            'in_stock' => 'In stock',
            'out_of_stock' => 'Out of stock',
            'unavailable' => 'Unavailable',
            'discontinued' => 'Discontinued',
        };
    }

    /**
     * Public catalog fields only — never includes purchase_price.
     *
     * @return array<string, mixed>
     */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'unit' => $this->unit,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'selling_price' => $this->selling_price,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'availability' => $this->availability(),
            'availability_label' => $this->availabilityLabel(),
            'categories' => $this->categories->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
            ])->values()->all(),
        ];
    }

    /**
     * Guest catalog fields — never includes purchase_price or quantity.
     *
     * @return array<string, mixed>
     */
    public function toCatalogArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'unit' => $this->unit,
            'description' => $this->description,
            'selling_price' => $this->selling_price,
            'availability' => $this->availability(),
            'availability_label' => $this->availabilityLabel(),
            'categories' => $this->categories->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
            ])->values()->all(),
        ];
    }

    /**
     * Admin catalog fields — includes purchase_price and soft-delete state.
     *
     * @return array<string, mixed>
     */
    public function toAdminArray(): array
    {
        return [
            ...$this->toPublicArray(),
            'purchase_price' => $this->purchase_price,
            'category_ids' => $this->categories->pluck('id')->values()->all(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }

    /**
     * Inventory on-hand payload — includes cost, threshold, and price history.
     *
     * @return array<string, mixed>
     */
    public function toInventoryArray(): array
    {
        return [
            ...$this->toPublicArray(),
            'purchase_price' => $this->purchase_price,
            'low_stock_threshold' => $this->low_stock_threshold,
            'suggested_low_stock_threshold' => $this->suggestedLowStockThreshold(),
            'is_low_stock' => $this->isLowStock(),
            'selling_price_histories' => $this->relationLoaded('sellingPriceHistories')
                ? $this->sellingPriceHistories
                    ->map(fn (ProductSellingPriceHistory $history) => $history->toInventoryArray())
                    ->values()
                    ->all()
                : [],
        ];
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) {
            return $query;
        }

        $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $term).'%';

        return $query->where(function (Builder $builder) use ($like) {
            $builder->where('name', 'like', $like)
                ->orWhere('description', 'like', $like);
        });
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public function scopeInCategory(Builder $query, ?string $categorySlug): Builder
    {
        if (blank($categorySlug)) {
            return $query;
        }

        return $query->whereHas('categories', function (Builder $builder) use ($categorySlug) {
            $builder->where('slug', $categorySlug);
        });
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public function scopePubliclyVisible(Builder $query): Builder
    {
        return $query->where('status', ProductStatus::Available);
    }
}

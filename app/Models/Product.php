<?php

namespace App\Models;

use App\Enums\ProductStatus;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'name',
    'description',
    'quantity',
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
     * Public catalog fields only — never includes purchase_price.
     *
     * @return array<string, mixed>
     */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'selling_price' => $this->selling_price,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
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
}

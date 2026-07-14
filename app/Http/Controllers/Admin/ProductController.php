<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Admin product list with optional trash filter.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'trashed' => ['nullable', 'string', Rule::in(['only', 'with'])],
        ]);

        $query = $filters['q'] ?? null;
        $trashed = $filters['trashed'] ?? null;

        $products = Product::query()
            ->with('categories:id,name,slug')
            ->when($trashed === 'only', fn ($builder) => $builder->onlyTrashed())
            ->when($trashed === 'with', fn ($builder) => $builder->withTrashed())
            ->search($query)
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Product $product) => $product->toAdminArray());

        return Inertia::render('admin/products/index', [
            'products' => $products,
            'filters' => [
                'q' => $query ?? '',
                'trashed' => $trashed ?? '',
            ],
        ]);
    }

    /**
     * Show the create product form.
     */
    public function create(): Response
    {
        return Inertia::render('admin/products/create', [
            'categories' => $this->categoryOptions(),
            'statuses' => $this->statusOptions(),
        ]);
    }

    /**
     * Store a new product.
     */
    public function store(StoreProductRequest $request): RedirectResponse
    {
        $product = Product::query()->create($request->productAttributes());
        $product->categories()->sync($request->categoryIds());

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product created.');
    }

    /**
     * Show the edit product form.
     */
    public function edit(Product $product): Response
    {
        $product->load('categories:id,name,slug');

        return Inertia::render('admin/products/edit', [
            'product' => $product->toAdminArray(),
            'categories' => $this->categoryOptions(),
            'statuses' => $this->statusOptions(),
        ]);
    }

    /**
     * Update an existing product.
     */
    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->productAttributes());
        $product->categories()->sync($request->categoryIds());

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product updated.');
    }

    /**
     * Soft-delete a product.
     */
    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product deleted.');
    }

    /**
     * Restore a soft-deleted product.
     */
    public function restore(Product $product): RedirectResponse
    {
        $product->restore();

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product restored.');
    }

    /**
     * @return list<array{id: int, name: string, slug: string}>
     */
    private function categoryOptions(): array
    {
        return Category::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function statusOptions(): array
    {
        return array_map(
            fn (ProductStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ],
            ProductStatus::cases(),
        );
    }
}

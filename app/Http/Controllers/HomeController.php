<?php

namespace App\Http\Controllers;

use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Authenticated products panel in the app shell.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:120'],
        ]);

        $query = $filters['q'] ?? null;
        $category = $filters['category'] ?? null;

        $products = Product::query()
            ->with('categories:id,name,slug')
            ->search($query)
            ->inCategory($category)
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Product $product) => $product->toAdminArray());

        $categories = Category::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => $categories,
            'statuses' => $this->statusOptions(),
            'filters' => [
                'q' => $query ?? '',
                'category' => $category ?? '',
            ],
        ]);
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

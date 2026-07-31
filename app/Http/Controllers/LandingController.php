<?php

namespace App\Http\Controllers;

use App\Http\Requests\CatalogSearchRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    public function index(CatalogSearchRequest $request): Response
    {
        if ($request->user()) {
            return app(DashboardController::class)->index();
        }

        $validated = $request->validated();
        $query = $validated['q'] ?? null;

        $categories = Category::query()
            ->whereHas('products', fn ($builder) => $builder->publiclyVisible())
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        $categorySlug = $validated['category'] ?? null;
        $validCategorySlugs = $categories->pluck('slug')->all();
        if ($categorySlug !== null && $categorySlug !== '' && ! in_array($categorySlug, $validCategorySlugs, true)) {
            $categorySlug = null;
        }

        $hasSearched = filled($query) || filled($categorySlug);

        if ($hasSearched) {
            $products = Product::query()
                ->with('categories:id,name,slug')
                ->publiclyVisible()
                ->search($query)
                ->inCategory($categorySlug)
                ->orderBy('name')
                ->paginate(12)
                ->withQueryString()
                ->through(fn (Product $product) => $product->toCatalogArray());
        } else {
            $products = new LengthAwarePaginator(
                [],
                0,
                12,
                1,
                [
                    'path' => $request->url(),
                    'query' => $request->query(),
                ],
            );
        }

        return Inertia::render('landing/index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => [
                'q' => $query ?? '',
                'category' => $categorySlug ?? '',
            ],
            'hasSearched' => $hasSearched,
        ]);
    }
}

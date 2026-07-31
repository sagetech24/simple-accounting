# Public Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public catalog search landing page at `/` for guests (price, availability, details) while authenticated admins keep the ops dashboard at the same URL.

**Architecture:** A new `LandingController` owns `GET /` (`home`). Guests get `landing/index` via a slim `PublicLayout` and `Product::toCatalogArray()` (no `purchase_price`, no `quantity`). Admins are delegated to existing `DashboardController@index` unchanged. Search is inline Inertia GET with `?q=` / `?category=`.

**Tech Stack:** Laravel 13, Inertia.js v3, React 19 JSX, Wayfinder, PHPUnit, Tailwind v4 Soft Flat tokens, Pint / ESLint / Prettier.

**Spec:** `docs/superpowers/specs/2026-07-31-public-landing-page-design.md`

## Global Constraints

- Guests may search live catalog public fields only; `purchase_price` and `quantity` must be absent from guest Inertia props.
- Only `ProductStatus::Available` products are publicly visible; soft-deleted stay hidden via SoftDeletes.
- Soft Flat: no shadows, gradients, or translucent panels; teal brand; Instrument Sans; ~4px radius.
- JSX only (`.jsx`); do not hand-edit Wayfinder under `resources/js/routes` or `resources/js/actions`.
- Tablet (~768px+) and desktop must be fully usable; touch targets ≥44px.
- No product images, no public detail routes, no inquiry/cart, no new JS dependencies.
- `DashboardController::index(): Response` takes **no** parameters — call it with `app(DashboardController::class)->index()` (do not invent a Request argument).

## File Structure

| File | Responsibility |
|------|----------------|
| `app/Models/Product.php` | `toCatalogArray()`, `scopePubliclyVisible()` |
| `app/Http/Requests/CatalogSearchRequest.php` | Validate `q`, `category`; `authorize(): true` |
| `app/Http/Controllers/LandingController.php` | Auth branch; guest catalog props; throttle route |
| `routes/web.php` | Public `GET /` → `LandingController@index` named `home` |
| `resources/js/layouts/public-layout.jsx` | Guest shell: SiteHeader + Head + money format |
| `resources/js/pages/landing/index.jsx` | Hero search, category tiles, results cards |
| `resources/js/components/catalog-product-modal.jsx` | Read-only product detail modal |
| `resources/css/app.css` | `catalog-product-modal-slide-down` keyframes |
| `tests/Feature/LandingPageTest.php` | Guest catalog + privacy + filters |
| `tests/Feature/ExampleTest.php` | Guests see landing at `/` (no login redirect) |
| `tests/Feature/DashboardTest.php` | Guests see landing (not login redirect); admin still dashboard |
| `.cursor/rules/PRD.mdc` | Guest actor + public catalog rules |

---

### Task 1: Catalog privacy API on Product

**Files:**
- Modify: `app/Models/Product.php`
- Test: `tests/Feature/LandingPageTest.php` (create; privacy + visibility methods exercised via HTTP in Task 2 — this task adds a focused unit-style feature smoke that hits the model directly, then expands in Task 2)

**Interfaces:**
- Consumes: existing `availability()`, `availabilityLabel()`, `categories` relation, `ProductStatus`
- Produces:
  - `Product::toCatalogArray(): array` — keys only: `id`, `name`, `unit`, `description`, `selling_price`, `availability`, `availability_label`, `categories` (list of `{id,name,slug}`)
  - `Product::scopePubliclyVisible(Builder $query): Builder` — `where('status', ProductStatus::Available)`

- [ ] **Step 1: Write the failing test file skeleton**

Create `tests/Feature/LandingPageTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LandingPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_to_catalog_array_omits_purchase_price_and_quantity(): void
    {
        $product = Product::factory()->available()->create([
            'name' => 'Cedar Notebook',
            'unit' => 'pcs',
            'description' => 'Ruled pages',
            'quantity' => 12,
            'purchase_price' => 7.25,
            'selling_price' => 18.50,
        ]);
        $product->load('categories');

        $payload = $product->toCatalogArray();

        $this->assertSame('Cedar Notebook', $payload['name']);
        $this->assertSame('pcs', $payload['unit']);
        $this->assertSame('Ruled pages', $payload['description']);
        $this->assertSame('18.50', $payload['selling_price']);
        $this->assertArrayNotHasKey('purchase_price', $payload);
        $this->assertArrayNotHasKey('quantity', $payload);
        $this->assertArrayNotHasKey('status', $payload);
        $this->assertArrayNotHasKey('deleted_at', $payload);
    }

    public function test_publicly_visible_scope_includes_only_available_products(): void
    {
        Product::factory()->available()->create(['name' => 'Visible']);
        Product::factory()->unavailable()->create(['name' => 'Hidden Unavailable']);
        Product::factory()->discontinued()->create(['name' => 'Hidden Discontinued']);
        $deleted = Product::factory()->available()->create(['name' => 'Hidden Deleted']);
        $deleted->delete();

        $names = Product::query()->publiclyVisible()->orderBy('name')->pluck('name')->all();

        $this->assertSame(['Visible'], $names);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `php artisan test --filter=LandingPageTest`

Expected: FAIL — `toCatalogArray` / `publiclyVisible` undefined.

- [ ] **Step 3: Implement model methods**

In `app/Models/Product.php`, after `toPublicArray()` (before `toAdminArray()`), add:

```php
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
```

After `scopeInCategory`, add:

```php
/**
 * @param  Builder<Product>  $query
 * @return Builder<Product>
 */
public function scopePubliclyVisible(Builder $query): Builder
{
    return $query->where('status', ProductStatus::Available);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `php artisan test --filter=LandingPageTest`

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add app/Models/Product.php tests/Feature/LandingPageTest.php
git commit -m "$(cat <<'EOF'
feat: add Product catalog array and public visibility scope

Guest payloads can omit purchase cost and stock counts at the model
boundary, and only available products are publicly queryable.
EOF
)"
```

---

### Task 2: Public `/` route, LandingController, and catalog request

**Files:**
- Create: `app/Http/Requests/CatalogSearchRequest.php`
- Create: `app/Http/Controllers/LandingController.php`
- Modify: `routes/web.php`
- Modify: `tests/Feature/LandingPageTest.php`
- Modify: `tests/Feature/ExampleTest.php`
- Modify: `tests/Feature/DashboardTest.php`

**Interfaces:**
- Consumes: `Product::toCatalogArray()`, `Product::scopePubliclyVisible()`, `scopeSearch`, `scopeInCategory`, `DashboardController::index(): Response`
- Produces:
  - Named route `home` → `LandingController@index` (public, `throttle:60,1`)
  - Guest Inertia props: `products` (paginator through `toCatalogArray`), `categories` (`id,name,slug` with `whereHas` publicly visible products), `filters` `{q, category}`, `hasSearched` (bool)
  - Auth users: same response as today's dashboard (`dashboard/index`)

- [ ] **Step 1: Extend failing HTTP tests**

Append to `tests/Feature/LandingPageTest.php`:

```php
public function test_guests_see_landing_page_at_home(): void
{
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->has('products')
            ->has('categories')
            ->has('filters')
            ->where('hasSearched', false)
            ->where('filters.q', '')
            ->where('filters.category', '')
        );
}

public function test_guest_product_payload_omits_purchase_price_and_quantity(): void
{
    Product::factory()->available()->create([
        'name' => 'Cedar Notebook',
        'quantity' => 12,
        'purchase_price' => 7.25,
        'selling_price' => 18.50,
    ]);

    $this->get(route('home', ['q' => 'Cedar']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Cedar Notebook')
            ->where('products.data.0.selling_price', '18.50')
            ->missing('products.data.0.purchase_price')
            ->missing('products.data.0.quantity')
        );
}

public function test_authenticated_users_still_see_dashboard_at_home(): void
{
    $this->actingAs(User::factory()->create())
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/index')
            ->has('kpis')
            ->has('attention')
        );
}

public function test_guests_can_search_by_name(): void
{
    Product::factory()->available()->create(['name' => 'Oak Desk Lamp']);
    Product::factory()->available()->create(['name' => 'Steel Water Bottle']);

    $this->get(route('home', ['q' => 'Desk']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->where('hasSearched', true)
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Oak Desk Lamp')
            ->where('filters.q', 'Desk')
        );
}

public function test_guests_can_filter_by_category(): void
{
    $office = Category::factory()->create(['name' => 'Office', 'slug' => 'office']);
    $kitchen = Category::factory()->create(['name' => 'Kitchen', 'slug' => 'kitchen']);

    $desk = Product::factory()->available()->create(['name' => 'Desk Organizer']);
    $desk->categories()->attach($office);

    $mug = Product::factory()->available()->create(['name' => 'Ceramic Mug']);
    $mug->categories()->attach($kitchen);

    $this->get(route('home', ['category' => 'office']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->where('hasSearched', true)
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Desk Organizer')
            ->where('filters.category', 'office')
            ->has('categories', 2)
        );
}

public function test_unavailable_discontinued_and_trashed_are_hidden_from_guests(): void
{
    Product::factory()->available()->create(['name' => 'Visible Item']);
    Product::factory()->unavailable()->create(['name' => 'Unavailable Item']);
    Product::factory()->discontinued()->create(['name' => 'Discontinued Item']);
    $deleted = Product::factory()->available()->create(['name' => 'Deleted Item']);
    $deleted->delete();

    $this->get(route('home', ['q' => 'Item']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Visible Item')
        );
}

public function test_unknown_category_slug_is_dropped_not_rejected(): void
{
    Product::factory()->available()->create(['name' => 'Anything']);

    $this->get(route('home', ['category' => 'does-not-exist']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->where('hasSearched', false)
            ->where('filters.category', '')
        );
}

public function test_categories_only_include_those_with_visible_products(): void
{
    $withProduct = Category::factory()->create(['name' => 'Office', 'slug' => 'office']);
    Category::factory()->create(['name' => 'Empty Cat', 'slug' => 'empty-cat']);
    $onlyUnavailable = Category::factory()->create(['name' => 'Hidden Cat', 'slug' => 'hidden-cat']);

    $visible = Product::factory()->available()->create(['name' => 'Stapler']);
    $visible->categories()->attach($withProduct);

    $hidden = Product::factory()->unavailable()->create(['name' => 'Ghost']);
    $hidden->categories()->attach($onlyUnavailable);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->has('categories', 1)
            ->where('categories.0.slug', 'office')
        );
}
```

Replace `tests/Feature/ExampleTest.php` method `test_guests_are_redirected_from_home_to_login` with:

```php
public function test_guests_see_landing_page_at_home(): void
{
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('landing/index'));
}
```

Replace `tests/Feature/DashboardTest.php` method `test_guests_cannot_view_dashboard` with:

```php
public function test_guests_see_landing_instead_of_dashboard_at_home(): void
{
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('landing/index'));
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `php artisan test --filter='LandingPageTest|ExampleTest::test_guests_see_landing|DashboardTest::test_guests_see_landing'`

Expected: FAIL — guests still redirected to login / `landing/index` missing.

- [ ] **Step 3: Create CatalogSearchRequest**

Create `app/Http/Requests/CatalogSearchRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CatalogSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:120'],
        ];
    }
}
```

- [ ] **Step 4: Create LandingController**

Create `app/Http/Controllers/LandingController.php`:

```php
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
```

- [ ] **Step 5: Wire the public route**

In `routes/web.php`:

1. Add `use App\Http\Controllers\LandingController;`
2. **Before** the `auth` middleware group, add:

```php
Route::get('/', [LandingController::class, 'index'])
    ->middleware('throttle:60,1')
    ->name('home');
```

3. **Inside** the `auth` group, **remove** the existing:

```php
Route::get('/', [DashboardController::class, 'index'])->name('home');
```

Keep `use App\Http\Controllers\DashboardController;` only if still referenced elsewhere in the file; if not, remove the unused import (DashboardController is only used from LandingController).

- [ ] **Step 6: Run tests to verify they pass**

Run:

```bash
php artisan test --filter='LandingPageTest|ExampleTest|DashboardTest'
```

Expected: PASS.

If Inertia complains that `landing/index` page is missing, create a temporary stub (Task 3 will replace it):

```jsx
// resources/js/pages/landing/index.jsx
export default function LandingIndex() {
    return null;
}
```

Inertia feature tests resolve the component name string; a stub page file is required for Vite/Inertia registration in some setups — create the stub if the suite fails for a missing page, then replace in Task 3.

- [ ] **Step 7: Commit**

```bash
git add app/Http/Requests/CatalogSearchRequest.php app/Http/Controllers/LandingController.php routes/web.php tests/Feature/LandingPageTest.php tests/Feature/ExampleTest.php tests/Feature/DashboardTest.php resources/js/pages/landing/index.jsx
git commit -m "$(cat <<'EOF'
feat: serve public catalog landing at home for guests

Authenticated users still get the ops dashboard at `/`. Guests search
available products without purchase cost or stock counts in the payload.
EOF
)"
```

---

### Task 3: PublicLayout, catalog modal, and landing UI

**Files:**
- Create: `resources/js/layouts/public-layout.jsx`
- Create: `resources/js/components/catalog-product-modal.jsx`
- Create/Replace: `resources/js/pages/landing/index.jsx`
- Modify: `resources/css/app.css`

**Interfaces:**
- Consumes: shared Inertia props `settings`, `auth`; Wayfinder `home` from `@/routes`; `formatMoney` / `configureMoneyFormat`; SiteHeader
- Produces: guest-facing Soft Flat landing with hero search, category tiles, result cards, detail modal

- [ ] **Step 1: Add modal keyframes**

Append to `resources/css/app.css` (alongside existing modal keyframes):

```css
@keyframes catalog-product-modal-slide-down {
    from {
        opacity: 0;
        transform: translateY(-1.5rem);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

- [ ] **Step 2: Create PublicLayout**

Create `resources/js/layouts/public-layout.jsx`:

```jsx
import { Head, usePage } from '@inertiajs/react';
import SiteHeader from '@/components/site-header';
import { configureMoneyFormat } from '@/lib/format-money';

export default function PublicLayout({ title, description, children }) {
    const { props } = usePage();

    if (props.settings) {
        configureMoneyFormat(props.settings);
    }

    return (
        <>
            <Head title={title}>
                {description ? (
                    <meta head-key="description" name="description" content={description} />
                ) : null}
            </Head>
            <div className="relative min-h-screen bg-paper text-ink">
                <SiteHeader />
                <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </>
    );
}
```

- [ ] **Step 3: Create catalog product modal**

Create `resources/js/components/catalog-product-modal.jsx` following `product-modal.jsx` patterns (portal, Escape, backdrop, Soft Flat panel). Full file:

```jsx
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatMoney } from '@/lib/format-money';

function availabilityBadgeClass(availability) {
    switch (availability) {
        case 'in_stock':
            return 'border-green-600/30 bg-green-400/5 text-green-700';
        case 'out_of_stock':
            return 'border-amber-600/30 bg-amber-400/5 text-amber-800';
        default:
            return 'border-line bg-mist text-muted';
    }
}

export default function CatalogProductModal({ open, product, onClose }) {
    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onClose]);

    if (!open || !product) {
        return null;
    }

    const unit = product.unit?.trim();

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-10 sm:px-6">
            <button
                type="button"
                aria-label="Close dialog"
                className="fixed inset-0 bg-ink/40 transition-opacity duration-200"
                onClick={onClose}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="catalog-product-modal-title"
                className="relative z-10 w-full max-w-lg origin-top rounded-md border border-line bg-white p-6 opacity-0 motion-safe:animate-[catalog-product-modal-slide-down_0.35s_ease-out_forwards] motion-reduce:opacity-100"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2
                            id="catalog-product-modal-title"
                            className="text-xl font-semibold tracking-tight text-ink"
                        >
                            {product.name}
                        </h2>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex rounded-md border px-3 py-1 text-xs ${availabilityBadgeClass(product.availability)}`}
                            >
                                {product.availability_label}
                            </span>
                            <p className="text-lg font-medium text-price tabular-nums">
                                {formatMoney(product.selling_price)}
                                {unit ? (
                                    <span className="ml-1 text-sm font-normal text-muted">
                                        / {unit}
                                    </span>
                                ) : null}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition hover:bg-mist hover:text-ink"
                        aria-label="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="size-5"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18 18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {product.description ? (
                    <p className="mt-4 text-sm leading-relaxed text-ink-soft whitespace-pre-wrap">
                        {product.description}
                    </p>
                ) : (
                    <p className="mt-4 text-sm text-muted">No description.</p>
                )}

                {product.categories?.length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                        {product.categories.map((item) => (
                            <span
                                key={item.id}
                                className="rounded-md border border-line bg-mist/60 px-2 py-0.5 text-xs text-ink-soft"
                            >
                                {item.name}
                            </span>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>,
        document.body,
    );
}
```

- [ ] **Step 4: Implement landing page**

Replace `resources/js/pages/landing/index.jsx` with this full file:

```jsx
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import CatalogProductModal from '@/components/catalog-product-modal';
import PublicLayout from '@/layouts/public-layout';
import { formatMoney } from '@/lib/format-money';
import { home } from '@/routes';

function availabilityBadgeClass(availability) {
    switch (availability) {
        case 'in_stock':
            return 'border-green-600/30 bg-green-400/5 text-green-700';
        case 'out_of_stock':
            return 'border-amber-600/30 bg-amber-400/5 text-amber-800';
        default:
            return 'border-line bg-mist text-muted';
    }
}

export default function LandingIndex({
    products,
    categories,
    filters,
    hasSearched,
}) {
    const [q, setQ] = useState(filters.q ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [selected, setSelected] = useState(null);

    function visit(params) {
        router.get(home.url(), params, {
            preserveState: true,
            replace: true,
        });
    }

    function currentParams(overrides = {}) {
        const nextQ = overrides.q !== undefined ? overrides.q : q;
        const nextCategory =
            overrides.category !== undefined ? overrides.category : category;

        return {
            q: nextQ || undefined,
            category: nextCategory || undefined,
        };
    }

    function submitSearch(event) {
        event.preventDefault();
        visit(currentParams());
    }

    function selectCategory(slug) {
        const next = category === slug ? '' : slug;
        setCategory(next);
        visit(currentParams({ category: next }));
    }

    function clearFilters() {
        setQ('');
        setCategory('');
        visit({});
    }

    const catalogEmpty = categories.length === 0;

    return (
        <PublicLayout
            title="Catalog"
            description="Search products for price and availability."
        >
            <section className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-medium tracking-[0.2em] text-muted uppercase">
                    Product catalog
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                    Find a product
                </h1>
                <p className="mt-3 text-base text-ink-soft">
                    Check selling price and availability — no account needed.
                </p>

                <form
                    onSubmit={submitSearch}
                    className="mt-8 flex flex-col gap-3 md:flex-row md:items-stretch"
                >
                    <label htmlFor="catalog-q" className="sr-only">
                        Search products
                    </label>
                    <input
                        id="catalog-q"
                        type="search"
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                        placeholder="Search name or description"
                        className="min-h-14 w-full flex-1 rounded-md border border-line bg-white px-4 text-base text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    <button
                        type="submit"
                        className="min-h-14 cursor-pointer rounded-md bg-teal-700 px-6 text-sm font-medium tracking-wide text-paper transition hover:bg-teal-800"
                    >
                        Search
                    </button>
                </form>
                <p className="mt-2 text-left text-sm text-muted md:text-center">
                    Search by product name or description
                </p>
            </section>

            {catalogEmpty && !hasSearched ? (
                <p className="mx-auto mt-12 max-w-3xl text-center text-sm text-muted">
                    The catalog is being set up.
                </p>
            ) : null}

            {categories.length > 0 ? (
                <section className="mt-12" aria-label="Categories">
                    <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
                        Browse by category
                    </h2>
                    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
                        {categories.map((item) => {
                            const pressed = category === item.slug;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    aria-pressed={pressed}
                                    onClick={() => selectCategory(item.slug)}
                                    className={`min-h-11 cursor-pointer rounded-md border px-3 py-3 text-sm font-medium transition ${
                                        pressed
                                            ? 'border-teal-800 bg-teal-700 text-paper'
                                            : 'border-line bg-white text-ink-soft hover:border-ink/30 hover:bg-mist'
                                    }`}
                                >
                                    {item.name}
                                </button>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            {hasSearched ? (
                <section className="mt-12" aria-label="Search results">
                    <div
                        className="flex flex-wrap items-center justify-between gap-3"
                        aria-live="polite"
                    >
                        <p className="text-sm text-muted">
                            {products.total}{' '}
                            {products.total === 1 ? 'result' : 'results'}
                            {filters.q ? ` for “${filters.q}”` : ''}
                            {filters.category
                                ? ` in ${categories.find((item) => item.slug === filters.category)?.name ?? filters.category}`
                                : ''}
                        </p>
                        {(filters.q || filters.category) && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="min-h-11 cursor-pointer rounded-md border border-line bg-white px-4 text-sm text-ink-soft transition hover:border-ink/30 hover:bg-mist"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {products.data.length === 0 ? (
                        <div className="mt-8 rounded-md border border-line bg-white px-6 py-10 text-center">
                            <p className="text-sm text-muted">
                                No products match this search.
                            </p>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-4 min-h-11 cursor-pointer rounded-md border border-line bg-white px-4 text-sm text-ink-soft transition hover:border-ink/30 hover:bg-mist"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {products.data.map((product) => {
                                const unit = product.unit?.trim();

                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => setSelected(product)}
                                        className="cursor-pointer rounded-md border border-line bg-white p-4 text-left transition hover:border-ink/30 hover:bg-mist/40"
                                    >
                                        <p className="font-medium text-ink">
                                            {product.name}
                                        </p>
                                        {product.description ? (
                                            <p className="mt-1 line-clamp-2 text-xs text-muted">
                                                {product.description}
                                            </p>
                                        ) : null}
                                        <p className="mt-3 text-base font-medium text-price tabular-nums">
                                            {formatMoney(product.selling_price)}
                                            {unit ? (
                                                <span className="ml-1 text-sm font-normal text-muted">
                                                    / {unit}
                                                </span>
                                            ) : null}
                                        </p>
                                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                            <span
                                                className={`inline-flex rounded-md border px-2.5 py-1 text-xs ${availabilityBadgeClass(product.availability)}`}
                                            >
                                                {product.availability_label}
                                            </span>
                                            {product.categories.map((item) => (
                                                <span
                                                    key={item.id}
                                                    className="rounded-md border border-line bg-mist/60 px-2 py-0.5 text-xs text-ink-soft"
                                                >
                                                    {item.name}
                                                </span>
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {products.last_page > 1 ? (
                        <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
                            {products.links.map((link, i) => {
                                if (!link.url) {
                                    return (
                                        <span
                                            key={`${link.label}-${i}`}
                                            className="px-2 py-1 text-muted"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    );
                                }

                                return (
                                    <Link
                                        key={`${link.label}-${i}`}
                                        href={link.url}
                                        className={
                                            link.active
                                                ? 'bg-ink px-3 py-1.5 text-paper'
                                                : 'border border-line bg-white px-3 py-1.5 text-ink-soft hover:border-ink/30'
                                        }
                                        preserveState
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    ) : null}
                </section>
            ) : null}

            <CatalogProductModal
                open={selected !== null}
                product={selected}
                onClose={() => setSelected(null)}
            />
        </PublicLayout>
    );
}
```

- [ ] **Step 5: Lint frontend**

Run:

```bash
npx eslint resources/js/layouts/public-layout.jsx resources/js/pages/landing/index.jsx resources/js/components/catalog-product-modal.jsx
npx prettier --check resources/js/layouts/public-layout.jsx resources/js/pages/landing/index.jsx resources/js/components/catalog-product-modal.jsx resources/css/app.css
```

Fix any issues reported.

- [ ] **Step 6: Re-run feature tests**

Run: `php artisan test --filter='LandingPageTest|ExampleTest|DashboardTest'`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add resources/js/layouts/public-layout.jsx resources/js/pages/landing/index.jsx resources/js/components/catalog-product-modal.jsx resources/css/app.css
git commit -m "$(cat <<'EOF'
feat: build public catalog landing UI with Soft Flat shell

Adds PublicLayout, hero search, category tiles, result cards, and a
read-only product detail modal for guests.
EOF
)"
```

---

### Task 4: Update PRD and verify acceptance

**Files:**
- Modify: `.cursor/rules/PRD.mdc`
- Verify: full test suite + Pint

**Interfaces:**
- Consumes: shipped behaviour from Tasks 1–3
- Produces: PRD aligned with public guest catalog rules

- [ ] **Step 1: Update PRD actors and framing**

In `.cursor/rules/PRD.mdc`:

1. Change the opening framing from “all app screens require login” to note that the public catalog landing at `/` is guest-accessible; all other modules remain auth-gated.

2. Replace the Guest actor line with:

```markdown
- **Guest:** Public catalog landing at `/` — search live products for selling price, availability, unit, description, and categories. No write access; no `purchase_price` or stock quantities. Login page for admin entry.
```

3. In App shell Auth bullet, clarify: guests see catalog landing at `/`; authenticated `/` remains the ops dashboard; login lands on `/` (dashboard).

4. Add a Nav / routes note for the public landing (guests only; same `/` URL as Dashboard for admins):

```markdown
| Catalog (public) | `/` (guest) | Shipped — search price & availability; Soft Flat landing |
| Dashboard | `/` (auth) | Shipped — procurement KPIs + needs-attention list |
```

5. In Product domain / Products UX, add that public landing uses `toCatalogArray()` (no quantity); authenticated `/products` browse may still include quantity via admin/browse arrays as today.

6. In any “Do not assume a public guest catalog” Don’t-rule in related docs/rules — if present in `PRD.mdc` Don’t section or tech-stack rules referencing it, update to: public landing may expose catalog fields except `purchase_price` and `quantity`; authenticated browse panels remain as documented.

Also update `.cursor/rules/rules.mdc` if it still says “Do not assume a public guest catalog — browse panels are authenticated and must still omit admin-only fields”: change to distinguish public landing (`toCatalogArray`) vs authenticated `/products` browse.

- [ ] **Step 2: Run Pint and full PHPUnit**

```bash
vendor/bin/pint --dirty
php artisan test
```

Expected: all tests PASS.

- [ ] **Step 3: Manual smoke checklist**

With `composer run dev` (or existing servers):

1. Logged out: open `/` — hero, tiles, search works; card opens modal; no purchase price/qty visible.
2. Search `?q=` and category filter survive reload.
3. Log in — `/` shows dashboard KPIs.
4. Log out — `/` returns to landing.
5. At ~768px width: search usable, tiles tappable, modal closable.

- [ ] **Step 4: Commit**

```bash
git add .cursor/rules/PRD.mdc .cursor/rules/rules.mdc
git commit -m "$(cat <<'EOF'
docs: align PRD with public catalog landing for guests

Guests may search the live catalog at `/`; purchase cost and stock
counts stay admin-only. Other modules remain auth-gated.
EOF
)"
```

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| `/` auth split + throttle + name `home` | Task 2 |
| `CatalogSearchRequest` | Task 2 |
| `toCatalogArray` / `scopePubliclyVisible` | Task 1 |
| Guest props + unknown category drop | Task 2 |
| `PublicLayout` + Soft Flat | Task 3 |
| Hero search + category tiles + cards + modal | Task 3 |
| No `purchase_price` / `quantity` in guest props | Tasks 1–2 tests |
| Available-only + soft-delete hidden | Tasks 1–2 tests |
| Admin dashboard unchanged at `/` | Task 2 |
| PRD update | Task 4 |
| Feature tests listed in spec | Tasks 1–2 |
| Out of scope (images, detail URLs, cart, etc.) | Not implemented |

## Placeholder / consistency check

- No TBD/TODO left in steps.
- `DashboardController::index()` called with zero args (matches current signature).
- `hasSearched` false → empty paginator (results UI hidden); category tiles still rendered when categories exist.
- Wayfinder: `home` route name unchanged — regenerate via Vite/Wayfinder as usual; do not hand-edit generated files.

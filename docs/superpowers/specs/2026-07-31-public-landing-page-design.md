# Public Landing Page — Catalog Price Checker — 2026-07-31

## Goal

Give logged-out visitors a public landing page at `/` that works like a product search engine: search the live catalog by name or description, filter by category, and see each product's selling price, availability, unit, and description. Logged-in admins keep the existing ops dashboard at `/`.

## Decisions (confirmed)

| Topic | Choice |
|-------|--------|
| Guest data access | **Real search** — live catalog, public fields only |
| Guest sees stock counts | **No** — availability label only, never `quantity` |
| Guest sees purchase cost | **No** — `purchase_price` absent from the payload |
| Routing | **`/` splits by auth** — guests get the landing page, admins get the dashboard; URL unchanged for both |
| Search interaction | **Inline on the landing page** — results replace the browse sections below, `?q=` in the URL for shareable links |
| Product details | **Detail modal** — no public per-product routes |
| Sections below hero | **Category tiles only** — no featured grid, how-it-works, trust band, contact CTA, or stats |
| Product statuses visible | **`available` only** — `unavailable`, `discontinued`, and soft-deleted are hidden |
| Implementation approach | **Dedicated public page + slim `PublicLayout`** |
| Visual language | **Existing Soft Flat teal + Instrument Sans** |

### Rejected alternatives

- **Reuse `AppLayout` in a guest mode** — `AppLayout` is built around the authenticated sidebar; every future nav change would become a "does this leak to guests?" review.
- **Static hero + JSON search endpoint** — would introduce a parallel non-Inertia API for page data, which the project tech-stack rule forbids.
- **Dedicated `/search` results page** — extra page hop for a page whose entire purpose is the search.
- **Navy/gold palette + Rubik/Nunito Sans** (suggested by the ui-ux-pro-max design search) — discarded; the teal Soft Flat brand and Instrument Sans are already established.

## PRD consequence

This feature contradicts two current statements in `.cursor/rules/PRD.mdc`:

- "**Guest:** Login page only. No catalog or write access."
- "Do not assume a public guest catalog — browse panels are authenticated"

Both must be updated as part of implementation. The revised rule: guests may search the catalog and see public fields (`name`, `unit`, `description`, `selling_price`, availability, categories); `purchase_price` and `quantity` remain admin-only, and every other module stays auth-gated.

## Design system inputs

From `ui-ux-pro-max --design-system` (variance 4, motion 3, density 5):

- **Pattern:** Marketplace / Directory — the search bar *is* the call to action; reduce friction to search; categories as a browse affordance
- **Style:** Hero-Centric — large hero, one compelling headline, high-contrast primary action
- **Motion tier:** Subtle — 150–300ms transitions, no choreography, no GSAP dependency
- **Anti-patterns to avoid:** playful design, hidden credentials, AI purple/pink gradients

Adapted to the existing Soft Flat rules: 2D hierarchy via solid colour and borders, ~4px radius, no shadows, no gradients, no translucent panels.

## Backend

### Routing

Move `/` out of the `auth` group into a public route handled by a new `LandingController`, keeping the route name `home` so `home.url()` (site header brand link, post-login redirect) keeps working.

```php
Route::get('/', [LandingController::class, 'index'])
    ->middleware('throttle:60,1')
    ->name('home');
```

`LandingController@index` branches on the authenticated user:

- **Authenticated:** delegate to the existing `DashboardController@index` and return its `Inertia::render` untouched. `CatalogSearchRequest` extends `FormRequest`, which is a `Request`, so it satisfies the dashboard method signature; its two nullable rules are inert for dashboard traffic.
- **Guest:** render `landing/index` with the catalog props below.

The `throttle:60,1` limit applies to `/` for both audiences. 60 requests per minute is far above normal admin dashboard use, so no admin-facing behaviour changes; the limit exists to cap public search volume.

The `auth` middleware group keeps every other route exactly as it is.

### Request validation

New `CatalogSearchRequest` form request:

| Field | Rules | Notes |
|-------|-------|-------|
| `q` | `nullable`, `string`, `max:120` | Reuses `Product::scopeSearch` semantics (name or description LIKE) |
| `category` | `nullable`, `string`, `max:120` | Category slug |

An unknown or stale category slug is **dropped**, not rejected: the controller checks the slug against the visible category list and ignores it if absent, so an old shared link renders a usable page instead of a 422.

`authorize()` returns `true` — this endpoint is intentionally public.

### Model — privacy boundary

Add `Product::toCatalogArray()`. It is **not** built on `toPublicArray()`, because that method includes `quantity`.

```php
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

`purchase_price`, `quantity`, `low_stock_threshold`, price history, and `deleted_at` are structurally absent rather than merely unrendered, so a test can assert on the payload keys.

Add `Product::scopePubliclyVisible()`: `status = ProductStatus::Available` only. Soft deletes are already excluded by the model's default scope.

### Guest props

| Prop | Shape |
|------|-------|
| `products` | Paginator, 12 per page, `->withQueryString()`, `->through(fn (Product $p) => $p->toCatalogArray())` |
| `categories` | `id`, `name`, `slug` — only categories with at least one publicly visible product (`whereHas`), ordered by name |
| `filters` | `{ q: string, category: string }` — echoed back, empty string when unset |
| `hasSearched` | bool — true when `q` or a valid `category` is present; drives whether the results region and its empty state render. Category tiles stay visible either way. |

Query composition: `Product::query()->with('categories:id,name,slug')->publiclyVisible()->search($q)->inCategory($category)->orderBy('name')->paginate(12)`.

Filtering categories to those with visible products means no tile ever leads to an empty result set.

## Frontend

### New files

| File | Purpose |
|------|---------|
| `resources/js/layouts/public-layout.jsx` | Slim guest shell |
| `resources/js/pages/landing/index.jsx` | The landing page |
| `resources/js/components/catalog-product-modal.jsx` | Product detail modal |

### `PublicLayout`

- Root: solid `bg-paper text-ink`, `min-h-screen`, no gradient or overlay
- Reuses the existing `SiteHeader`, which already renders the brand from `settings.brand_name` and an "Admin login" link for guests
- Calls `configureMoneyFormat(props.settings)` exactly as `AppLayout` does, so prices honour the configured currency
- Renders `<Head>` with the page title and a meta description
- No sidebar and no nav tiles

### Hero

- Centred column, capped near `max-w-3xl`
- Small uppercase eyebrow, `h1` at `text-3xl md:text-4xl`, one-line subhead
- Search form is the primary action: a `min-h-14` text input plus a solid teal Search button; inline as one bordered row from `md:` up, stacked below that
- Hint line: "Search by product name or description" — matches what `scopeSearch` actually matches
- Submits a GET to `home.url()` via `router.get` with `preserveState` and `replace`, keeping `?q=` and `?category=` in the URL

### Category tiles

- Persistent grid below the search: 2 columns on phones, 3 at `md:`, 5 at `lg:`
- Each tile runs a category-filtered search
- Active tile: solid teal fill plus `aria-pressed="true"` — state is not conveyed by colour alone
- Hidden entirely when `categories` is empty

### Results

- Card grid, not the admin table: 1 column, 2 at `md:`, 3 at `lg:`
- Card contents: name, description clamped to two lines, `selling_price` in `text-price tabular-nums` with the unit beside it, availability chip, category chips
- Each card is a real `<button type="button">` with a left-aligned text block, so keyboard and screen-reader users get the same affordance as a tap
- Header row above the grid: result count, active filter summary, and a Clear button when filters are set; the region carries `aria-live="polite"` so the count is announced after an Inertia partial reload
- Availability chip classes follow the existing `availabilityBadgeClass` convention from `pages/products/index.jsx`
- Pagination reuses the existing paginator-link rendering pattern
- Empty state: "No products match this search," plus a Clear action
- Zero visible products in the whole catalog: hero renders, tiles and results are replaced by a short "catalog is being set up" line

Products have **no image column** and none is being added, so cards are typographic. Product photography is separate future work.

### Detail modal

`catalog-product-modal.jsx` follows the established modal pattern in this repo:

- Solid panel, `border-line`, ~4px radius, no shadow
- Slide-down keyframes in `resources/css/app.css` (matching the existing `*-modal-slide-down` convention)
- Escape key and backdrop click close it; focus moves into the panel on open and returns to the triggering card on close
- Animation suppressed under `prefers-reduced-motion`
- Shows name, availability chip, price with unit, full description, and categories — nothing further, because nothing further is in the payload

### Visual and motion rules

- 4px radius, solid `border-line` borders, opaque `bg-white` surfaces, solid teal accent
- No shadows, gradients, or translucent fills
- Transitions limited to colour and opacity, 150–300ms
- No new JS dependencies

### Responsive (tablet and up must work)

| Width | Expectation |
|-------|-------------|
| 375px | Search stacked, tiles 2-up, results 1-up, no horizontal page scroll |
| 768px | Search inline, tiles 3-up, results 2-up, modal fully reachable |
| 1024px+ | Tiles 5-up, results 3-up, content column centred |

Every interactive target is at least 44px tall.

### Accessibility

- Search input has a real label (visually hidden is acceptable)
- Category tiles expose pressed state via `aria-pressed`
- Results region uses `aria-live="polite"` for the count
- Availability is conveyed by chip text, not colour alone
- Focus rings use the accent token and remain visible throughout
- `prefers-reduced-motion` respected for the modal animation

## Testing

Feature tests (PHPUnit):

1. Guest `GET /` returns 200 and renders the `landing/index` component.
2. Guest props contain no `purchase_price` and no `quantity` key — asserted against the payload, not rendered output.
3. Authenticated admin `GET /` still renders `dashboard/index`.
4. `?q=` narrows results to name/description matches.
5. `?category=` narrows results to that category.
6. `unavailable`, `discontinued`, and soft-deleted products are absent from guest results.
7. An unknown `category` slug returns 200 with the filter dropped, not a validation error.

Then Pint for PHP and ESLint plus Prettier for JSX.

## Files touched

**New**

- `app/Http/Controllers/LandingController.php`
- `app/Http/Requests/CatalogSearchRequest.php`
- `resources/js/layouts/public-layout.jsx`
- `resources/js/pages/landing/index.jsx`
- `resources/js/components/catalog-product-modal.jsx`
- `tests/Feature/LandingPageTest.php`

**Modified**

- `routes/web.php` — `/` becomes public, throttled, still named `home`
- `app/Models/Product.php` — `toCatalogArray()`, `scopePubliclyVisible()`
- `resources/css/app.css` — modal slide-down keyframes for the catalog modal
- `.cursor/rules/PRD.mdc` — guest actor and public-catalog rules updated

Wayfinder output regenerates from the route change; generated files under `resources/js/routes` and `resources/js/actions` are not hand-edited.

## Acceptance criteria

- [ ] Logged-out visitor at `/` sees the hero search, category tiles, and can search the live catalog
- [ ] Results show name, unit, selling price, availability, categories; a card opens a detail modal with the full description
- [ ] Guest payload contains no `purchase_price` and no `quantity`
- [ ] `unavailable`, `discontinued`, and soft-deleted products never appear publicly
- [ ] Logged-in admin at `/` still sees the unchanged ops dashboard
- [ ] `?q=` and `?category=` survive a page reload and are shareable
- [ ] Unknown category slug renders a usable page rather than an error
- [ ] Empty catalog renders the hero without broken sections
- [ ] Soft Flat obeyed: no shadows, gradients, or translucent panels; teal brand and Instrument Sans retained
- [ ] Fully visible and usable at 768px and above; targets ≥44px
- [ ] Focus states visible; `prefers-reduced-motion` respected
- [ ] PRD updated so the guest rule matches the shipped behaviour

## Out of scope

- Public per-product URLs and SEO structured data or sitemap
- Inquiry / contact form, cart, or guest ordering
- Product images
- Featured products, how-it-works, trust band, contact CTA, catalog stats sections
- Typeahead / instant search
- Dark mode, i18n
- Any change to authenticated modules beyond the `/` routing split

---
name: product
description: >-
  Plans and implements Product module improvements for Product Price Monitoring
  (catalog search, admin CRUD, pricing privacy, soft delete, margin, stock,
  price history). Use when adding or changing product features, public catalog,
  admin products UI, Product model/controllers/requests, or when the user
  mentions Product.md, product backlog, v1 polish, or price monitoring.
---

# Product Module Agent

Guide for **future improvements and features** on the Product domain. Read this skill before planning or shipping Product work.

Canonical depth: [reference.md](reference.md). Product overview also lives in `.cursor/rules/PRD.mdc` and stack rules in `.cursor/rules/rules.mdc`.

## When to apply

- New or changed Product behavior (public catalog or admin)
- Pricing, quantity, status, categories, soft delete / restore
- “Polish”, “v1.x”, margin, low-stock, price history, slug/detail pages
- User references `Product.md` or the Product backlog

Skip for unrelated work (auth-only, pure Category CRUD with no Product touch, unrelated styling).

## Hard constraints (never violate)

1. **Guest never sees `purchase_price`** — public Inertia props must use `toPublicArray()` (or equivalent), never admin payloads.
2. **Soft-deleted products hidden from guests** — default query excludes trash.
3. **Admin writes use Form Requests** — validate store/update; sync `category_ids` via `sync()`.
4. **Stack** — Inertia + React **JSX** pages; Wayfinder for forms/routes; no `.tsx` app pages; no parallel REST API for UI.
5. **Out of scope** — payments, carts, multi-tenant, variants/SKUs, stock ledgers, public/mobile API, multi-role auth (unless user explicitly expands scope).

## Workflow

Copy and track:

```
Product feature progress:
- [ ] 1. Classify tier + confirm not out-of-scope
- [ ] 2. Map touchpoints (model / HTTP / Inertia / tests)
- [ ] 3. Implement smallest slice
- [ ] 4. Preserve privacy + soft-delete rules
- [ ] 5. Add/update Feature tests
- [ ] 6. Verify acceptance checks
```

### 1. Classify the request

| Tier | Examples | Guidance |
|------|----------|----------|
| **v1 core** | Search, CRUD, trash, category sync, public field set | Fix gaps; keep behavior aligned with [reference.md](reference.md) §4.1 |
| **v1 polish** | Availability badge, admin filters/sort, margin, low-stock, delete confirm, public detail | Prefer these next; stay within Product domain |
| **v1.x monitoring** | Price change log/UI, slug URLs, full-text search, ProductPolicy, CSV export | Ship as focused epics; mention data/migration impact up front |
| **Out of scope** | Payments, variants, PO/receiving ledger, images epic, multi-tenant | Refuse or ask to open a dedicated epic first |

Priority default when user says “improve products” without specifics:

1. Availability badge (status + quantity)
2. Admin margin display
3. Low-stock badge
4. Admin status/category filters
5. Public product detail (+ slug later)
6. Price change log (true monitoring)

### 2. Map touchpoints

Typical files:

| Area | Paths |
|------|--------|
| Model | `app/Models/Product.php`, `app/Enums/ProductStatus.php` |
| Admin HTTP | `app/Http/Controllers/Admin/ProductController.php`, `app/Http/Requests/Admin/*ProductRequest.php` |
| Public HTTP | `app/Http/Controllers/HomeController.php` |
| Routes | `routes/web.php` |
| UI | `resources/js/pages/home.jsx`, `resources/js/pages/admin/products/*`, `resources/js/components/product-form.jsx` |
| Tests | `tests/Feature/Admin/ProductTest.php` (+ public catalog tests when changing guest behavior) |
| DB | `database/migrations/*products*`, factories/seeders |

After route/controller changes, regenerate Wayfinder if the project requires it; **do not hand-edit** `resources/js/routes` or `resources/js/actions`.

### 3. Implement

- Prefer thin controllers + model scopes (`search`, `inCategory`, new scopes as needed).
- Derived guest availability: soft-deleted → hidden; “in stock” = `status === available` **and** `quantity > 0`.
- Admin margin: `selling_price - purchase_price` (optional %); compute server-side or in admin-only serialization — never on public payloads.
- Price history (v1.x): append-only log on purchase/selling price change (old, new, user, timestamp); do not overwrite history.
- Keep pages `.jsx`; Inertia `useForm` + Wayfinder for mutations.

### 4. Privacy & trash gate

Before finishing, confirm:

- [ ] No `purchase_price` in any guest/public prop tree
- [ ] Guest queries do not use `withTrashed` / `onlyTrashed`
- [ ] Admin trash filters still work if index filters changed

### 5. Tests

Add or extend Feature tests for the behavior change. Minimum cases by area:

- **Public:** search/filter; response/props omit purchase price; trashed excluded
- **Admin:** auth required; create/update validation; soft delete + restore; category sync

### 6. Acceptance (feature done when)

Reuse the matching set from [reference.md](reference.md) §7, plus any feature-specific checks you listed in the plan.

## Domain cheat sheet

| Field | Guest | Admin |
|-------|-------|-------|
| name, description, quantity, selling_price, status, categories | Yes | Yes |
| purchase_price | **No** | Yes |
| deleted_at / trash | Hidden | Soft delete + restore |

Status enum: `available` | `unavailable` | `discontinued`.

Validation: see [reference.md](reference.md) §6.

## Response style for plans

When the user asks to plan (not implement yet), output:

1. **Tier** (core / polish / v1.x / out-of-scope)
2. **User-facing outcome** (1–2 sentences)
3. **Touchpoints** (files)
4. **Risks** (privacy, migrations, Wayfinder)
5. **Test plan** (3–5 bullets)

Then wait for go-ahead unless they already asked to implement.

## Additional resources

- Full scope, backlog, routes, validation: [reference.md](reference.md)
- Product PRD (always-on): `.cursor/rules/PRD.mdc`
- Stack conventions: `.cursor/rules/rules.mdc`

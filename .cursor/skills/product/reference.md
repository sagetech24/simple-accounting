# Product Module — Scope & Features (Reference)

Detailed domain and backlog for the **product** skill. For day-to-day agent workflow, use [SKILL.md](SKILL.md).

Complements the v1 PRD (`.cursor/rules/PRD.mdc`).

---

## 1. Purpose

Maintain a single catalog of sellable items so:

- **Guests** can search and understand what is available, at what selling price, and in what quantity/status.
- **Admins** can create and maintain products (including cost/`purchase_price`), categorize them, and soft-delete or restore without losing history.

This module is the core domain entity. Categories, auth, and the public landing page all orbit Product.

---

## 2. Actors & access

| Actor | Access |
|-------|--------|
| **Guest** | Read-only public catalog. Never sees `purchase_price`. Soft-deleted products are hidden. |
| **Admin** | Authenticated (seeded account). Full CRUD, soft delete, restore, and all fields including `purchase_price`. |

No public registration. No guest mutations.

---

## 3. Domain model

### 3.1 Fields

| Field | Type | Rules | Visibility |
|-------|------|-------|------------|
| `id` | bigint | PK | Public + admin |
| `name` | string | Required, max 255 | Public + admin |
| `description` | text | Nullable | Public + admin |
| `quantity` | unsigned int | ≥ 0, default 0 | Public + admin |
| `purchase_price` | decimal(12,2) | Required, ≥ 0 | **Admin only** |
| `selling_price` | decimal(12,2) | Required, ≥ 0 | Public + admin |
| `status` | enum string | `available` \| `unavailable` \| `discontinued` | Public + admin |
| `categories` | M2M | Via `category_product`; 0..n | Public + admin (ids/names) |
| `created_at` / `updated_at` | timestamps | System | Admin-useful; optional UI |
| `deleted_at` | soft delete | Null = live | Admin trash filters; never public |

### 3.2 Status semantics

| Status | Meaning | Guest expectation |
|--------|---------|-------------------|
| `available` | Offered for sale when stock allows | Show as available if `quantity > 0`; if `quantity = 0`, show out of stock / not purchasable signal |
| `unavailable` | Temporarily not offered | Clearly “unavailable” regardless of quantity |
| `discontinued` | Permanently retired from offer | Clearly “discontinued”; still searchable for reference unless product is soft-deleted |

**Availability rules (derived):**

1. Soft-deleted → **not listed** for guests.
2. Guest “in stock / buyable” cue = `status === available` **and** `quantity > 0`.
3. Admin may still edit quantity on unavailable/discontinued products (inventory bookkeeping).

### 3.3 Relationships

- **Product ↔ Category** — many-to-many (`categories`, `category_product`). Assign on create/update; filter on public search by category slug.
- Soft delete does not cascade-delete category rows; pivot rows may remain for restore.

### 3.4 Serialization

- **Public payload** (`toPublicArray`): id, name, description, quantity, selling_price, status (+ label), categories `{id,name,slug}`. **Never** `purchase_price`.
- **Admin payload** (`toAdminArray`): public fields + `purchase_price`, `category_ids`, `deleted_at`.

---

## 4. Feature scope

### 4.1 Must-have (v1 core)

#### Public catalog

| Feature | Description |
|---------|-------------|
| Search by text | Filter by `name` / `description` (escape LIKE wildcards) |
| Filter by category | Optional category slug filter |
| Paginated results | Stable page size; preserve query string on page change |
| Result cards / list | Name, selling price, status, quantity or availability cue, categories |
| Empty state | Clear message when no matches |
| Field privacy | Assert no `purchase_price` in Inertia props / HTML for guests |
| Soft-delete hide | Guests never see trashed products |

#### Admin catalog

| Feature | Description |
|---------|-------------|
| List products | Paginated, name order, search (`q`) |
| Trash filters | Active only / trash only (`only`) / with trash (`with`) |
| Create product | Form with all fields + multi category select |
| Edit product | Same form; sync categories |
| Soft delete | Remove from public catalog; keep record |
| Restore | From trash |
| Validation | Form Requests for store/update |
| Flash feedback | Success messages after create/update/delete/restore |
| Auth gate | All admin routes behind `auth` middleware |

#### Data & integrity

| Feature | Description |
|---------|-------------|
| Enum status | Backed enum + UI labels |
| Factories / seeders | Dev and demo catalog data |
| Indexes | At least `name`, `status` for list/search |
| Category sync | `sync()` on store/update with validated existing ids |

---

### 4.2 Strongly useful (v1 polish)

| Feature | Why it matters |
|---------|----------------|
| **Availability badge** | Combine `status` + `quantity` into one clear guest label (In stock / Out of stock / Unavailable / Discontinued) |
| **Admin status + category filters** | Find products faster than search alone |
| **Admin sort options** | By name, selling price, quantity, updated_at |
| **Margin on admin list/detail** | `selling_price - purchase_price` (and optional %) — core for price monitoring |
| **Low-stock badge** | Configurable threshold `N` (e.g. quantity &lt; 5) on admin list |
| **Confirmation on delete** | Prevent accidental soft deletes |
| **Public product detail page** | Dedicated show route (beyond list-only), still without `purchase_price` |
| **Duplicate name warning** | Soft uniqueness (warn or suggest), even if hard unique is deferred |
| **Bulk category assign** | Optional multi-select + apply on admin list |
| **Keyboard-friendly search** | Focus search on load; clear filters control |

---

### 4.3 Recommended next (v1.x — true “monitoring”)

| Feature | Description |
|---------|-------------|
| **Price change log** | On update of `purchase_price` or `selling_price`, record old/new/who/when |
| **Price history UI** | Admin timeline or simple table per product |
| **SEO slug** | `slug` + public `/products/{slug}` |
| **Full-text / indexed search** | Scale beyond `LIKE` as catalog grows |
| **Policies / gates** | `ProductPolicy` even with one admin |
| **Quantity adjustment note** | Optional “reason” when quantity changes (light inventory trail) |
| **Export CSV** | Admin export of current catalog (with/without purchase price toggle) |
| **Discontinue shortcut** | One-click set status to `discontinued` from list |
| **Force delete (admin)** | Permanent purge from trash (rare; confirm strongly) |

---

### 4.4 Explicitly out of scope

Do **not** fold these into Product v1:

- Multi-currency / tax / VAT lines
- Purchase orders, receiving, or stock movements as a transaction ledger
- Barcodes / SKUs / variants (size/color) — add only with a dedicated SKU epic
- Images / media gallery (unless a later media epic lands)
- Payments, carts, checkout
- Multi-tenant catalogs
- Public API / mobile API
- Multi-role permissions beyond single admin

---

## 5. Routes & UX map

### Public

| Method | Route | Behavior |
|--------|-------|----------|
| GET | `/` | Search-first catalog (`q`, `category`, pagination) |
| GET | `/products/{id\|slug}` *(v1.x)* | Public detail |

### Admin (`auth`)

| Method | Route | Behavior |
|--------|-------|----------|
| GET | `/admin/products` | Index + `q`, `trashed` |
| GET | `/admin/products/create` | Create form |
| POST | `/admin/products` | Store |
| GET | `/admin/products/{product}/edit` | Edit form |
| PUT/PATCH | `/admin/products/{product}` | Update |
| DELETE | `/admin/products/{product}` | Soft delete |
| POST | `/admin/products/{product}/restore` | Restore (withTrashed) |

No guest write routes. Prefer Inertia pages + Wayfinder; Form Requests on writes.

---

## 6. Validation rules (canonical)

| Attribute | Store / Update |
|-----------|----------------|
| `name` | required, string, max:255 |
| `description` | nullable, string |
| `quantity` | required, integer, min:0 |
| `purchase_price` | required, numeric, min:0 |
| `selling_price` | required, numeric, min:0 |
| `status` | required, enum `ProductStatus` |
| `category_ids` | nullable, array; each exists in `categories` |

Optional later: `selling_price >= purchase_price` as a soft warning (not hard fail), margin alerts.

---

## 7. Acceptance criteria

### Guest

- [ ] Can search products by name/description and filter by category.
- [ ] Sees selling price, status, quantity/availability, categories — never purchase price.
- [ ] Soft-deleted products never appear.
- [ ] Empty results are understandable; pagination works with filters.

### Admin

- [ ] Can create, edit, soft-delete, and restore products after login.
- [ ] Can assign zero or more categories; categories persist after save.
- [ ] Can see and edit `purchase_price`.
- [ ] Can find products via search and review trash separately.
- [ ] Validation errors surface on the form without silent failure.

### Security / privacy

- [ ] Unauthenticated users cannot hit admin product routes.
- [ ] Public Inertia props omit `purchase_price` for every product payload.

---

## 8. Dependencies

| Dependency | Role |
|------------|------|
| **Auth (session)** | Gates admin Product CRUD |
| **Category module** | Filter + assign tags; admin needs enough category CRUD or seed data to assign |
| **Inertia + React JSX pages** | `home`, `admin/products/*` |
| **ProductStatus enum** | Single source of status values/labels |

---

## 9. Implementation checklist (current baseline)

Already in codebase (keep aligned with this doc):

- Model: fillable fields, casts, SoftDeletes, `categories()`, `search`, `inCategory`, `toPublicArray` / `toAdminArray`
- Migration: products table + indexes + soft deletes
- Admin `ProductController`: index/create/store/edit/update/destroy/restore
- Form Requests: Store / Update
- Public `HomeController` catalog search
- Factory, seeder, feature tests for admin products

Gaps to treat as polish / v1.x (see §4.2–4.3): margin display, low-stock, public detail/slug, price history, richer admin filters.

---

## 10. Non-functional notes

- Prefer thin Inertia controllers; keep query scopes on the model.
- Do not expose admin arrays on public pages.
- Escape user search terms for `LIKE` (already expected in `scopeSearch`).
- Use soft delete as the default “remove from catalog”; reserve force-delete for a later admin tool.
- Keep app pages as `.jsx` under `resources/js/pages/`.

---

## 11. Success definition

The Product module is **complete enough for v1** when an admin can fully manage catalog pricing and stock, and a guest can discover live products with clear availability and selling price — without ever learning cost. It becomes a true **price monitoring** product once price change history and admin margin/low-stock cues land (v1.x).

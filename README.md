<p align="center">
  <img src="https://img.shields.io/badge/Laravel-13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=000000" alt="React">
  <img src="https://img.shields.io/badge/Inertia.js-3-9553E9?style=for-the-badge" alt="Inertia.js">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
</p>

# Simple Accounting

Internal ops app for **catalog pricing** and early **procurement** workflow. Guests can search a public product catalog at `/`. All other modules require login.

Built on Laravel + React **JSX** (Inertia, Vite, Tailwind, Wayfinder) with a Soft Flat teal UI. Primary targets: tablet (~768px+) and desktop.

Canonical product rules live in `.cursor/rules/PRD.mdc` (PRD v1).

---

## Actors

| Actor | Access |
|-------|--------|
| **Guest** | Public catalog at `/` — search selling price, availability, unit, description, and categories. No write access; no `purchase_price` or stock quantities. Admin login at `/login`. |
| **Admin** | Single seeded account (`DatabaseSeeder`). Full access to ops modules after session login (dashboard at `/dashboard`). Can still open the catalog at `/`. No public registration. |

**Seeded admin:** `admin@example.com` / `password`

---

## Modules

| Module | Route | Notes |
|--------|-------|--------|
| Catalog (public) | `/` | Search price & availability; Soft Flat landing (guests and auth) |
| Dashboard | `/dashboard` | Procurement KPIs + needs-attention list |
| Products | `/products` | Auth browse (includes stock; cost via admin edit) |
| Admin products | `/admin/products` | Full CRUD, soft delete / restore, `purchase_price` |
| Suppliers | `/suppliers` | Index-only CRUD in slide-down modal |
| Customers | `/customers` | Index-only CRUD in slide-down modal |
| Sales Orders | `/sales-orders` | Multi-line outbound sale; stock out on save; void restores stock |
| Request Quotations | `/request-quotations` | List + create/edit tabs; draft → pending → approved |
| Purchased Orders | `/purchased-orders` | RFQ→PO; draft → ordered → received; prepayments; post to AP |
| Inventory | `/inventory` | On-hand stock + movement ledger; PO receipts + sales `sale` movements |
| Accounts payable | `/accounts-payable` | Settle posted POs by supplier |

`/received-orders` redirects to `/inventory`.

### App shell

- **Authenticated:** `AppLayout` — site header, tile sidebar nav, main panel
- **Public catalog:** `PublicLayout` — header only (brand + Admin login)
- **Feedback:** `Inertia::flash('toast', …)` → Sonner via `FlashToaster`

---

## Domain summary

### Product

- Fields: name, description, quantity, categories (M2M), selling price, purchase price (**admin-only**), status (`available` \| `unavailable` \| `discontinued`), soft delete
- **Public landing:** `toCatalogArray()` — no quantity, no purchase price; only `available` products
- **Auth browse / admin:** stock and cost rules as in the PRD

### Supplier & Customer

- Contact fields + status (`active` \| `inactive`), soft delete
- Single index page each; create/edit in modal; search, trash filter, sortable columns

### Request Quotation

- UUID reference, supplier, status workflow, server-calculated grand total, soft delete
- Workflow: Draft → Submit (pending) → Approve

### Inventory

- Cached on-hand on `products.quantity`
- Append-only `stock_movements` (`receipt` \| `adjustment` \| `sale`)
- Receiving on Purchased Orders posts receipt movements and increments stock in one transaction
- Sales Orders post outbound `sale` movements on create; void restores stock

### Sales Order

- Optional customer (walk-in allowed), multi-line items, server-calculated grand total
- Save deducts stock immediately; void soft-deletes and restores stock; no edit after save

---

## Stack

| Layer | Details |
|-------|---------|
| Backend | Laravel 13, PHP 8.3+, Eloquent, Form Requests, soft deletes |
| SPA bridge | Inertia.js v3 — no separate REST API for page loads |
| Frontend | React 19 + **JSX only** (`.jsx` pages under `resources/js/pages`) |
| Styling | Tailwind CSS v4, Soft Flat tokens, Instrument Sans |
| Build | Vite 8, React Compiler, Wayfinder (`@/routes`, `@/actions`) |
| Quality | Pint, ESLint + Prettier, PHPUnit |

---

## Project structure

```
app/
  Http/Controllers/          # Thin Inertia controllers
  Http/Requests/             # Form requests for writes
  Models/                    # Domain models + scopes
resources/
  js/
    pages/                   # Inertia pages (landing, dashboard, …)
    layouts/                 # AppLayout, PublicLayout
    components/              # Modals, forms, shared UI
    routes/ / actions/       # Wayfinder-generated (do not hand-edit)
  css/app.css                # Soft Flat theme tokens
  views/app.blade.php        # Root HTML shell
routes/web.php
tests/Feature/               # PHPUnit feature tests
.cursor/rules/PRD.mdc        # Product requirements (source of truth)
```

---

## Requirements

- PHP **8.3+**
- Composer **2.x**
- Node.js **22+** (recommended)

---

## Getting started

### Clone and set up

```bash
git clone https://github.com/sagetech24/simple-accounting.git
cd simple-accounting
composer setup
composer run dev
```

`composer setup` installs Composer/npm deps, creates `.env`, generates the app key, runs migrations, and builds assets.

Visit [http://localhost:8000](http://localhost:8000).

### Manual setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install
npm run build
```

Then either `composer run dev`, or:

```bash
php artisan serve   # terminal 1
npm run dev         # terminal 2
```

---

## Scripts

### Composer

| Command | Description |
|---------|-------------|
| `composer setup` | Full project bootstrap |
| `composer dev` | Server + queue + logs + Vite |
| `composer test` | Pint check + PHPUnit |
| `composer lint` | Fix PHP style with Pint |
| `composer lint:check` | Check PHP style (CI mode) |

### npm

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production asset build |
| `npm run lint` | ESLint on `resources/js` |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier check |
| `npm run format:fix` | Prettier write |

---

## Out of scope (v1)

From the PRD:

- Multi-user roles / policies beyond a single admin
- Public registration
- Multi-tenant
- Mobile API
- Warehouses / lots / serials
- Partial multi-receipt receiving
- Sales payments / Accounts Receivable / COGS costing
- Draft / confirm sales workflow

### Recommended next (v1.x)

- Sales payments / AR
- Low-stock alerts and price history polish
- Policies/gates even with one admin
- Pagination / empty-state polish across modules

---

## CI / quality

GitHub Actions on push/PR (see `.github/workflows/`):

- PHPUnit across supported PHP versions
- Pint, Prettier, and ESLint

Locally:

```bash
composer lint:check
npm run format
npm run lint
php artisan test
```

---

## Repository

https://github.com/sagetech24/simple-accounting

---

## License

MIT License

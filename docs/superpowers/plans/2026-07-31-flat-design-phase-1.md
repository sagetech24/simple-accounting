# Soft Flat Design Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Soft Flat Design to tokens, app shell, and shared chrome so the authenticated ops app uses solid teal-brand surfaces with ~4px radius and no shadows/gradients.

**Architecture:** Evolve existing Tailwind v4 `@theme` tokens and replace glass/shadow/gradient utilities across layout, header, shared components, then a mechanical page sweep. Keep tile nav and Instrument Sans. No backend, route, or Wayfinder changes.

**Tech Stack:** Laravel 13 + Inertia React JSX, Tailwind CSS v4 (`resources/css/app.css`), existing paper/teal token names.

**Spec:** `docs/superpowers/specs/2026-07-31-flat-design-phase-1-design.md`

## Global Constraints

- Soft Flat only: solid fills, `border-line`, ~4px radius (`rounded-md`), no elevation shadows, no decorative gradients/grids, no glass (`bg-white/80`, `bg-white/70`).
- Keep teal brand token names: `ink`, `ink-soft`, `muted`, `paper`, `mist`, `line`, `accent`, `price`, `warn`.
- Keep Instrument Sans; do not switch to Inter.
- Keep sidebar **tile** nav architecture; flatten fills/hover only.
- JSX only; do not introduce TypeScript app pages or hand-edit Wayfinder.
- Tablet (~768px+) and desktop must remain fully usable; touch targets ≥44px.
- No controller/migration/route/behavior changes.
- Phase 1 does **not** redesign page composition (KPI layouts, empty states, density).

## File Structure

| File | Responsibility |
|------|----------------|
| `resources/css/app.css` | Theme tokens + Soft Flat conventions comment block |
| `resources/js/layouts/app-layout.jsx` | Solid paper shell; remove overlays; opaque main panel; flat nav hover |
| `resources/js/components/site-header.jsx` | Flat menus/buttons (no shadow/glass) |
| `resources/js/components/*-modal.jsx` | Drop `shadow-xl`; use `rounded-md` |
| `resources/js/components/*-form.jsx`, `searchable-select.jsx`, related | Opaque `bg-white` fields; flat dropdowns |
| Pages under `resources/js/pages/**` | Mechanical remove `shadow-*`, glass fills, decorative gradients/grids |

Do not create a new component library. Reuse existing JSX class patterns.

---

### Task 1: Theme tokens + Soft Flat conventions

**Files:**
- Modify: `resources/css/app.css`
- Test: ripgrep / visual (no PHPUnit for CSS tokens)

**Interfaces:**
- Consumes: existing `@theme` color names used across the app
- Produces: same token names with Soft Flat documentation; optional `--radius-flat: 0.25rem` if useful — prefer documenting that `rounded-md` is the standard radius

- [ ] **Step 1: Confirm baseline anti-patterns still present**

Run:

```bash
rg -n "radial-gradient|shadow-xl|bg-white/80" resources/css/app.css resources/js/layouts/app-layout.jsx | head
```

Expected: matches in `app-layout.jsx` (gradients / glass). `app.css` may have no shadows yet.

- [ ] **Step 2: Update `resources/css/app.css`**

Replace the `@theme` block contents with (keep keyframes below unchanged):

```css
@theme {
    --font-sans: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
        'Segoe UI Symbol', 'Noto Color Emoji';

    /* Soft Flat — solid teal brand; hierarchy via color + borders; no shadows/gradients */
    --color-ink: #10241f;
    --color-ink-soft: #243530;
    --color-mist: #e8f0ec;
    --color-paper: #f4f8f6;
    --color-line: #c5d4cc;
    --color-price: #0f766e;
    --color-accent: #147a6e;
    --color-warn: #9a5b1a;
    --color-muted: #5c6f68;

    --radius-md: 0.25rem;
}
```

If Tailwind v4 already maps `rounded-md` via defaults, setting `--radius-md: 0.25rem` (~4px) aligns Soft Flat. Keep all existing `@keyframes` blocks for modal slide-down animations.

- [ ] **Step 3: Verify tokens still resolve**

Run:

```bash
rg -n "color-paper|radius-md|Soft Flat" resources/css/app.css
```

Expected: comment + token lines present.

- [ ] **Step 4: Commit**

```bash
git add resources/css/app.css
git commit -m "$(cat <<'EOF'
style: document Soft Flat theme tokens and 4px radius

EOF
)"
```

---

### Task 2: Flatten `AppLayout` shell

**Files:**
- Modify: `resources/js/layouts/app-layout.jsx`
- Test: ripgrep for gradients/glass in this file

**Interfaces:**
- Consumes: `bg-paper`, `border-line`, teal nav classes
- Produces: solid shell with no overlay divs; main panel `bg-white`; nav hover without opacity/glow tricks beyond solid darker teal

- [ ] **Step 1: Write failing verification**

Run:

```bash
rg -n "radial-gradient|background-size:48px|bg-white/80" resources/js/layouts/app-layout.jsx
```

Expected: FAIL acceptance (matches found) before edit.

- [ ] **Step 2: Flatten the layout**

In `resources/js/layouts/app-layout.jsx`:

1. Change outer wrapper to solid paper only — remove the two `aria-hidden` decorative overlay `<div>`s (gradient + grid).

```jsx
<div className="relative min-h-screen bg-paper text-ink">
    <SiteHeader />

    <main className="relative z-10 mx-auto w-full px-4 py-5">
```

2. Nav link classes — keep tile structure; ensure inactive hover is solid darker teal (no `/80` translucent hover if present). Target pattern:

```jsx
className={`flex h-24 flex-col items-center justify-center gap-2 rounded-md border-2 px-3 py-2 text-center text-sm font-semibold transition duration-150 ${
    active
        ? 'cursor-default border-teal-800 bg-teal-800 text-zinc-100'
        : 'cursor-pointer border-teal-700 bg-teal-600 text-zinc-100 hover:border-teal-800 hover:bg-teal-700'
}`}
```

(Adjust only as needed to match Soft Flat; keep labels/icons/active logic intact.)

3. Main panel — opaque white:

```jsx
<div className="min-h-[800px] w-full flex-1 rounded-md border border-line bg-white px-0">
    {children}
</div>
```

- [ ] **Step 3: Verify**

Run:

```bash
rg -n "radial-gradient|background-size:48px|bg-white/80|shadow-" resources/js/layouts/app-layout.jsx
```

Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add resources/js/layouts/app-layout.jsx
git commit -m "$(cat <<'EOF'
style: flatten AppLayout to solid Soft Flat shell

EOF
)"
```

---

### Task 3: Flatten `SiteHeader`

**Files:**
- Modify: `resources/js/components/site-header.jsx`
- Test: ripgrep on this file

**Interfaces:**
- Consumes: `border-line`, `bg-white`, mist hover
- Produces: menus/buttons without `shadow-md` or translucent fills

- [ ] **Step 1: Baseline**

Run:

```bash
rg -n "shadow-|bg-white/" resources/js/components/site-header.jsx
```

Expected: `shadow-md` on menu; `bg-white/70` on logout/login.

- [ ] **Step 2: Apply Soft Flat classes**

User menu panel — replace `shadow-md` with border-only:

```jsx
className="absolute top-full right-0 z-30 mt-1 min-w-44 rounded-md border border-line bg-white py-1"
```

Logout / login controls — opaque:

```jsx
className="rounded-md border border-line bg-white px-3 py-1.5 text-ink-soft transition hover:border-ink/30 hover:bg-mist"
```

(Apply to both authenticated logout button and guest login link.)

Keep account gear button; hover may use `hover:bg-mist` (solid mist), not translucent gray if easy:

```jsx
className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-teal-700 transition hover:bg-mist hover:text-ink"
```

- [ ] **Step 3: Verify**

```bash
rg -n "shadow-|bg-white/" resources/js/components/site-header.jsx
```

Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add resources/js/components/site-header.jsx
git commit -m "$(cat <<'EOF'
style: flatten SiteHeader menus and auth controls

EOF
)"
```

---

### Task 4: Flatten shared modals

**Files:**
- Modify each modal panel class in:
  - `resources/js/components/supplier-modal.jsx`
  - `resources/js/components/customer-modal.jsx`
  - `resources/js/components/product-modal.jsx`
  - `resources/js/components/bank-account-modal.jsx`
  - `resources/js/components/system-preference-modal.jsx`
  - `resources/js/components/inventory-adjust-modal.jsx`
  - `resources/js/components/inventory-settings-modal.jsx`
  - `resources/js/components/purchased-order-detail-modal.jsx`
  - `resources/js/components/purchased-order-prepayment-modal.jsx`
  - `resources/js/components/purchased-order-receive-adjustment-modal.jsx`
  - `resources/js/components/request-quotation-detail-modal.jsx`
- Test: ripgrep `shadow-xl` under `resources/js/components`

**Interfaces:**
- Consumes: existing slide-down keyframe class names
- Produces: modal panels with `rounded-md border border-line bg-white` and **no** `shadow-xl`

- [ ] **Step 1: Baseline**

```bash
rg -n "shadow-xl" resources/js/components --glob '*modal*.jsx'
```

Expected: matches in all listed modals.

- [ ] **Step 2: Mechanical replace on modal dialog panels**

For each modal’s dialog surface `className`:

- Remove `shadow-xl`
- Change `rounded-lg` → `rounded-md` on that panel

Example before:

```jsx
className="relative z-10 w-full max-w-2xl origin-top rounded-lg border border-line bg-white p-6 shadow-xl opacity-0 motion-safe:animate-[…]"
```

After:

```jsx
className="relative z-10 w-full max-w-2xl origin-top rounded-md border border-line bg-white p-6 opacity-0 motion-safe:animate-[…]"
```

Keep animation / `motion-reduce` classes intact. Do not change modal open/close behavior.

Safe bulk approach from repo root (review diff after):

```bash
perl -pi -e 's/rounded-lg border border-line bg-white/rounded-md border border-line bg-white/g; s/\s*shadow-xl//g' \
  resources/js/components/supplier-modal.jsx \
  resources/js/components/customer-modal.jsx \
  resources/js/components/product-modal.jsx \
  resources/js/components/bank-account-modal.jsx \
  resources/js/components/system-preference-modal.jsx \
  resources/js/components/inventory-adjust-modal.jsx \
  resources/js/components/inventory-settings-modal.jsx \
  resources/js/components/purchased-order-detail-modal.jsx \
  resources/js/components/purchased-order-prepayment-modal.jsx \
  resources/js/components/purchased-order-receive-adjustment-modal.jsx \
  resources/js/components/request-quotation-detail-modal.jsx
```

Then manually confirm each dialog class still makes sense (no double spaces / broken strings).

- [ ] **Step 3: Verify**

```bash
rg -n "shadow-xl" resources/js/components --glob '*modal*.jsx'
```

Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add resources/js/components/*modal*.jsx
git commit -m "$(cat <<'EOF'
style: remove modal elevation for Soft Flat panels

EOF
)"
```

---

### Task 5: Flatten shared forms, selects, and dropdown lists

**Files:**
- Modify: `resources/js/components/supplier-form.jsx`
- Modify: `resources/js/components/customer-form.jsx`
- Modify: `resources/js/components/product-form.jsx`
- Modify: `resources/js/components/bank-account-form.jsx`
- Modify: `resources/js/components/system-preference-form.jsx`
- Modify: `resources/js/components/request-quotation-form.jsx`
- Modify: `resources/js/components/purchased-order-form.jsx`
- Modify: `resources/js/components/purchased-order-prepayment-modal.jsx` (FIELD_CLASS + remaining glass fields)
- Modify: `resources/js/components/inventory-adjust-modal.jsx`
- Modify: `resources/js/components/inventory-settings-modal.jsx`
- Modify: `resources/js/components/searchable-select.jsx`
- Test: ripgrep glass/shadow in these files

**Interfaces:**
- Consumes: shared field class pattern `border border-line … focus:border-accent focus:ring-2 focus:ring-accent/20`
- Produces: opaque `bg-white` fields; dropdown lists without `shadow-md`

- [ ] **Step 1: Baseline**

```bash
rg -n "bg-white/80|bg-white/70|shadow-md" resources/js/components --glob '*.jsx' | head -40
```

Expected: many form/select matches.

- [ ] **Step 2: Replace glass fills and dropdown shadows**

Canonical field class:

```text
min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
```

Canonical textarea (no min-h-11 required):

```text
w-full border border-line bg-white px-3 py-2.5 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
```

Canonical secondary/cancel button:

```text
min-h-11 rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition hover:border-ink/30 hover:bg-mist hover:text-ink disabled:opacity-60
```

Dropdown list (searchable-select + RFQ/PO form pickers):

```jsx
className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-line bg-white py-1"
```

Apply via targeted replaces:

```bash
# Opaque fields (components)
rg -l 'bg-white/80|bg-white/70' resources/js/components --glob '*.jsx' | while read -r f; do
  perl -pi -e 's/bg-white\/80/bg-white/g; s/bg-white\/70/bg-white/g' "$f"
done

# Flat dropdowns in components
rg -l 'shadow-md' resources/js/components --glob '*.jsx' | while read -r f; do
  perl -pi -e 's/\s*shadow-md//g' "$f"
done
```

Review `git diff resources/js/components` — ensure only Soft Flat class changes.

- [ ] **Step 3: Verify**

```bash
rg -n "bg-white/80|bg-white/70|shadow-md|shadow-xl|shadow-lg" resources/js/components --glob '*.jsx'
```

Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add resources/js/components
git commit -m "$(cat <<'EOF'
style: flatten shared form fields and select menus

EOF
)"
```

---

### Task 6: Mechanical page sweep (shadows, glass, gradients, FABs)

**Files:**
- Modify pages that still use Soft Flat anti-patterns (from repo grep), including at least:
  - `resources/js/pages/auth/login.jsx`
  - `resources/js/pages/admin/products/index.jsx`
  - `resources/js/pages/admin/products/create.jsx`
  - `resources/js/pages/admin/products/edit.jsx`
  - `resources/js/pages/products/index.jsx`
  - `resources/js/pages/suppliers/index.jsx`
  - `resources/js/pages/customers/index.jsx`
  - `resources/js/pages/bank-accounts/index.jsx`
  - `resources/js/pages/request-quotations/index.jsx`
  - `resources/js/pages/purchased-orders/index.jsx`
  - `resources/js/pages/inventory/index.jsx`
  - `resources/js/pages/accounts-payable/index.jsx`
  - `resources/js/pages/accounts-payable/supplier.jsx`
  - other pages matching the verification grep
- Test: repo-wide ripgrep under `resources/js`

**Interfaces:**
- Consumes: Phase 1 shell tokens
- Produces: pages without decorative gradients/grids, elevation shadows, or glass fills; FABs use `rounded-md` without `shadow-lg`

- [ ] **Step 1: Inventory remaining anti-patterns**

```bash
rg -n "shadow-(sm|md|lg|xl)|bg-white/(70|80)|radial-gradient|background-size:48px" resources/js/pages
```

Expected: list of files to edit.

- [ ] **Step 2: Remove decorative overlays (login + admin product pages)**

Same pattern as AppLayout: delete the two `aria-hidden` overlay divs (radial/linear gradient + grid). Keep a solid `bg-paper` (or existing outer `bg-paper`) wrapper.

Login example structure after:

```jsx
<div className="relative min-h-screen bg-paper text-ink">
  {/* no gradient/grid overlays */}
  …
</div>
```

Apply the same overlay removal to:

- `resources/js/pages/auth/login.jsx`
- `resources/js/pages/admin/products/index.jsx`
- `resources/js/pages/admin/products/create.jsx`
- `resources/js/pages/admin/products/edit.jsx`

- [ ] **Step 3: Opaque fills + flat menus/FABs on index pages**

For each matching page:

1. Replace `bg-white/80` → `bg-white` and `bg-white/70` → `bg-white`
2. Remove `shadow-md` / `shadow-lg` / `shadow-xl` from menus and FABs
3. FAB pattern — Soft Flat (~4px), no shadow:

```jsx
className="flex size-14 items-center justify-center gap-1 rounded-md bg-teal-700 text-paper transition hover:bg-teal-800"
```

(Use `shrink-0` where the page already had it.)

Bulk helpers (review diffs):

```bash
rg -l 'bg-white/80|bg-white/70|shadow-md|shadow-lg|shadow-xl' resources/js/pages | while read -r f; do
  perl -pi -e 's/bg-white\/80/bg-white/g; s/bg-white\/70/bg-white/g; s/\s*shadow-(sm|md|lg|xl)//g' "$f"
done
```

Then fix FABs from `rounded-full` + (already removed shadow) to `rounded-md` where they are create-action FABs (products, suppliers, customers, bank-accounts, RFQ, PO).

- [ ] **Step 4: Verify pages + whole frontend**

```bash
rg -n "shadow-(sm|md|lg|xl)|bg-white/(70|80)|radial-gradient|background-size:48px" resources/js
```

Expected: **no matches** (or only intentional non-UI comments — there should be none).

Optional sanity:

```bash
npm run lint
```

Expected: pass (or only pre-existing issues unrelated to class string edits).

- [ ] **Step 5: Commit**

```bash
git add resources/js/pages
git commit -m "$(cat <<'EOF'
style: Soft Flat page sweep for shadows glass and gradients

EOF
)"
```

---

### Task 7: Acceptance check against the spec

**Files:**
- None required (verification only); fix any stragglers discovered
- Test: checklist below + tablet visual spot-check if app is running

**Interfaces:**
- Consumes: all prior tasks
- Produces: confirmation that Phase 1 acceptance criteria are met

- [ ] **Step 1: Automated Soft Flat gate**

```bash
rg -n "shadow-(sm|md|lg|xl)|bg-white/(70|80)|radial-gradient|background-size:48px" resources/js resources/css
```

Expected: empty.

- [ ] **Step 2: Confirm teal brand tokens still in use**

```bash
rg -n "bg-paper|text-ink|border-line|bg-teal-|text-accent|bg-accent" resources/js/layouts/app-layout.jsx resources/js/components/site-header.jsx | head
```

Expected: matches present (brand not abandoned).

- [ ] **Step 3: Manual tablet spot-check** (if `composer run dev` available)

Visit while authenticated:

1. Dashboard `/` — solid paper background, white main panel, flat teal tiles
2. Open one modal (e.g. Suppliers create) — solid panel, no drop shadow
3. Open header account menu — flat bordered menu
4. Products FAB — square/rounded-md solid teal, no shadow

Confirm ≥768px: nav tiles tappable; modal actions reachable; no horizontal page scroll.

- [ ] **Step 4: Final commit only if Step 1–3 caused fixes**

If fixes were needed:

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
style: finish Soft Flat Phase 1 acceptance fixes

EOF
)"
```

If clean, skip empty commit.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Soft Flat tokens / ~4px radius / no shadow scale | Task 1 |
| Remove AppLayout gradients/grid; solid paper + white panel; flat tile nav | Task 2 |
| Flat SiteHeader menus/buttons | Task 3 |
| Modals: no elevation; ~4px radius | Task 4 |
| Shared forms/selects opaque + flat dropdowns | Task 5 |
| Light page sweep (shadows/glass/gradients/FABs) | Task 6 |
| Acceptance criteria / tablet usability | Task 7 |
| Out of scope: nav redesign, dark mode, font swap, backend | Global Constraints (no tasks) |
| Phase 2 module polish | Deferred (not in this plan) |

## Placeholder scan

No TBD/TODO steps; replacements and verification commands are explicit.

# Soft Flat Design — Phase 1 — 2026-07-31

## Goal

Improve overall app UX/UI by adopting **Soft Flat Design** while keeping the existing teal brand. Phase 1 establishes tokens and shared chrome so later module polish inherits a consistent flat look. No backend, route, or workflow behavior changes.

## Decisions (confirmed)

| Topic | Choice |
|-------|--------|
| Scope model | **Phased** — Phase 1 = shell + tokens + shared patterns; Phase 2 = per-module polish |
| Palette | **Keep teal brand** — evolve ink / mist / paper / accent; no new brand colors |
| Geometry | **Soft Flat** — ~4px radius; solid borders; no shadows or gradients |
| Approach | **Token-first Soft Flat** — update theme + flatten shell/shared chrome; keep tile nav |
| Typography | Keep **Instrument Sans** |
| Nav architecture | Unchanged (tile sidebar); flat solid fills only |

## Style rules (Flat Design)

From ui-ux-pro-max Flat Design guidance, adapted to Soft Flat + teal ops app:

- 2D hierarchy via **solid color + borders** only
- **No** box shadows, decorative gradients, glass/translucent panels (`bg-white/80`), or grid overlays
- Limited solid palette (existing tokens); high enough contrast for WCAG AA body text
- Hover/press = color or opacity shift (150–200ms); no elevation or scale-as-depth
- Icons remain simplified SVG (existing nav icons); no emoji as UI icons
- Tablet (~768px+) and desktop remain fully usable; touch targets ≥44px

## Foundations — tokens

Evolve `@theme` in `resources/css/app.css`. Prefer keeping token **names** so existing Tailwind classes (`bg-paper`, `text-ink`, `border-line`, etc.) keep working.

| Token | Role | Phase 1 direction |
|-------|------|-------------------|
| `ink` | Primary text | Keep dark teal-ink |
| `ink-soft` | Secondary text | Keep |
| `muted` | Tertiary / hints | Keep |
| `paper` | Page background | Solid flat fill (no gradient) |
| `mist` | Subtle fills, hover, header rows | Solid |
| `line` | Borders / dividers | Solid 1px |
| `accent` | Primary actions | Solid teal |
| `price` | Money emphasis | Solid teal (aligned with accent family) |
| `warn` | Warnings | Keep |

**New conventions (document in CSS comments and/or theme):**

- Default control/panel radius ≈ **4px** (`rounded-md` / equivalent)
- Shadow scale unused for UI chrome (`shadow-*` removed from shell + shared components)
- Focus: border color + thin ring using accent (not soft glow stacks)

**Anti-patterns (Phase 1):** new brand palette, dark mode, Inter (or other) font swap, neubrutalist hard offset shadows, glassmorphism.

## Shell

### `AppLayout`

- Remove radial/linear gradient backdrop and decorative grid overlay
- Page root: solid `bg-paper text-ink`
- Main content panel: solid `bg-white`, `border-line`, ~4px radius — **not** `bg-white/80`
- Sidebar tile nav retained:
  - Inactive: solid teal fill + border; hover = solid darker teal only
  - Active: solid darker teal + `aria-current="page"`; no glow/scale
- Layout structure (aside + main, tablet reflow) unchanged

### `SiteHeader`

- Flat header on paper; brand link + account controls
- User menu / dropdowns: solid white + `border-line`; **no** `shadow-md`
- Logout / login controls: opaque fill + border; hover via border/fill only

## Shared components & patterns

Apply Soft Flat consistently to shared UI used across modules:

| Pattern | Spec |
|---------|------|
| Primary button | Solid accent/teal; hover darker solid; no shadow |
| Secondary button | White + `border-line`; hover mist / stronger border |
| Inputs / selects | Solid white, `border-line`, ~4px; focus border + accent ring |
| Modals | Solid panel + border; existing slide-down animation OK; drop `shadow-xl` / elevation |
| Tables | Border + mist header; row hover mist; horizontal scroll wrappers preserved |
| Status badges | Flat bordered chips; prefer small radius; reduce heavy pill styling where cheap |
| FABs | Solid accent, ~4px; no `shadow-lg` |
| Menus / popovers | Solid surface + border; no drop shadow |

**Light page sweep (Phase 1):** remove obvious `shadow-*`, gradients, and translucent fills that fight the new shell when the change is mechanical. Do **not** redesign page composition (KPI card layouts, empty states, density) in Phase 1.

## Files likely touched (Phase 1)

- `resources/css/app.css` — tokens + Flat rules
- `resources/js/layouts/app-layout.jsx` — shell backdrop + main panel
- `resources/js/components/site-header.jsx` — header / menus
- Shared modals and forms under `resources/js/components/` (shadow/glass removal)
- Mechanical class cleanups on pages only where shadows/glass remain after shared fixes

No controller, migration, route, or Wayfinder changes expected.

## Out of scope (Phase 1)

- Sidebar architecture change (tiles → list)
- Per-module visual redesign (Dashboard, Products, RFQ, PO, Inventory, AP, login composition)
- Dark mode
- New color brand or typography system
- Functional/workflow changes
- Creating a parallel component library / shadcn migration (reuse existing JSX patterns)

## Acceptance criteria

- [ ] No decorative gradients or grid overlays on the authenticated shell
- [ ] No elevation shadows on shell, header menus, shared modals, or shared FABs
- [ ] Surfaces are opaque solids; hierarchy uses color + borders
- [ ] Controls and panels use ~4px radius consistently in shared chrome
- [ ] Teal brand remains recognizable (accent/nav fills)
- [ ] Tile nav still works; active state clear without relying on shadow
- [ ] Tablet (≥768px) and desktop: nav, forms, modals, tables remain visible and usable
- [ ] Focus states remain visible; `prefers-reduced-motion` still respected for modal animation
- [ ] No intentional backend/route/behavior regressions

## Phase 2 (later)

Module-by-module Soft Flat polish, suggested order:

1. Dashboard  
2. Products (browse + admin)  
3. Request Quotations  
4. Purchased Orders  
5. Inventory  
6. Accounts Payable  
7. Login  

Each Phase 2 pass may refine density, empty states, and page-specific patterns while obeying Phase 1 tokens.

## Implementation notes

- Prefer shared class strings / repeated Tailwind patterns already used in the repo; avoid introducing TypeScript or new UI frameworks
- Keep Instrument Sans via existing font setup
- After implementation, verify visually on tablet width and desktop; run existing lint/format conventions (Pint N/A for CSS/JSX; ESLint/Prettier for JS)

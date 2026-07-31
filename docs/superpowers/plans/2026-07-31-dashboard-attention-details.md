# Dashboard Attention Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich dashboard Needs attention rows with a server-built compact `subtitle` (supplier, money, item count / stock) rendered under the primary title.

**Architecture:** Extend `DashboardController::attentionItems()` to eager-load related data and compose a `subtitle` string per row. The Inertia page stacks title + subtitle; KPIs, caps, types, and hrefs stay unchanged.

**Tech Stack:** Laravel 13, Inertia.js v3, React 19 JSX, PHPUnit, Pint

## Global Constraints

- Attention prop shape: `type`, `title`, `subtitle`, `reason`, `href`
- Subtitle segments joined with ` · ` (space-middot-space); omit blank segments
- Money: `₱` + `number_format($amount, 2, '.', ',')`
- Item pluralization: `1 item` / `N items`
- Per-type subtitle content per `docs/superpowers/specs/2026-07-31-dashboard-attention-details-design.md`
- No structured `meta` props; no KPI / cap / href changes
- Tablet+ usable; whole row remains a `Link`

## File map

| File | Responsibility |
|------|----------------|
| `tests/Feature/DashboardTest.php` | Assert `subtitle` per attention type |
| `app/Http/Controllers/DashboardController.php` | Eager-load + build `subtitle` (+ small helpers) |
| `resources/js/pages/dashboard/index.jsx` | Render subtitle under title |

---

### Task 1: Backend subtitles + failing/passing tests

**Files:**
- Modify: `tests/Feature/DashboardTest.php`
- Modify: `app/Http/Controllers/DashboardController.php`
- Test: `tests/Feature/DashboardTest.php`

**Interfaces:**
- Consumes: Existing factories (`RequestQuotation`, `PurchasedOrder`, `Product`, `Supplier`, `PurchasedOrderPayment`); routes `dashboard`, module indexes, `accounts-payable.show`
- Produces: Each attention item includes `subtitle: string` with type-specific compact copy

- [ ] **Step 1: Update the attention test to require subtitles**

In `tests/Feature/DashboardTest.php`, update `test_attention_list_includes_actionable_rows_and_excludes_noise` so fixtures have known totals/items and assert exact subtitles.

Replace the RFQ / ordered / posted / product setup and assertions with:

```php
public function test_attention_list_includes_actionable_rows_and_excludes_noise(): void
{
    $admin = User::factory()->create();
    $supplier = Supplier::factory()->active()->create(['name' => 'Acme']);

    $rfq = RequestQuotation::factory()->pending()->create([
        'supplier_id' => $supplier->id,
        'reference' => '11111111-1111-1111-1111-111111111111',
        'grand_total' => '12500.00',
    ]);
    \App\Models\RequestQuotationItem::factory()->create([
        'request_quotation_id' => $rfq->id,
        'buying_price' => '100.00',
        'quantity' => 1,
        'subtotal' => '100.00',
    ]);
    RequestQuotation::factory()->draft()->create(['supplier_id' => $supplier->id]);

    $ordered = PurchasedOrder::factory()->ordered()->create([
        'supplier_id' => $supplier->id,
        'reference' => '22222222-2222-2222-2222-222222222222',
        'grand_total' => '30.00',
    ]);
    \App\Models\PurchasedOrderItem::factory()->create([
        'purchased_order_id' => $ordered->id,
        'buying_price' => '15.00',
        'quantity' => 2,
        'subtotal' => '30.00',
    ]);

    $posted = PurchasedOrder::factory()
        ->received()
        ->postedToAccountsPayable()
        ->create([
            'supplier_id' => $supplier->id,
            'reference' => '33333333-3333-3333-3333-333333333333',
            'grand_total' => '80.00',
        ]);

    $settled = PurchasedOrder::factory()
        ->received()
        ->postedToAccountsPayable()
        ->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '10.00',
        ]);
    PurchasedOrderPayment::factory()->create([
        'purchased_order_id' => $settled->id,
        'amount' => '10.00',
    ]);

    Product::factory()->available()->create([
        'name' => 'Bolt Pack',
        'quantity' => 1,
        'low_stock_threshold' => 4,
    ]);
    Product::factory()->available()->create([
        'name' => 'Plenty',
        'quantity' => 50,
        'low_stock_threshold' => 4,
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('attention', 4)
            ->where('attention.0.type', 'pending_rfq')
            ->where('attention.0.title', $rfq->reference)
            ->where('attention.0.subtitle', 'Acme · ₱12,500.00 · 1 item')
            ->where('attention.0.reason', 'Approve quotation')
            ->where('attention.0.href', route('request-quotations.index', absolute: false))
            ->where('attention.1.type', 'ordered_po')
            ->where('attention.1.title', $ordered->reference)
            ->where('attention.1.subtitle', 'Acme · ₱30.00 · 1 item')
            ->where('attention.1.reason', 'Mark received')
            ->where('attention.1.href', route('purchased-orders.index', absolute: false))
            ->where('attention.2.type', 'ap_balance')
            ->where('attention.2.title', $posted->reference)
            ->where('attention.2.subtitle', 'Acme · Balance ₱80.00')
            ->where('attention.2.reason', 'Settle payment')
            ->where(
                'attention.2.href',
                route('accounts-payable.show', [$supplier, $posted], absolute: false)
            )
            ->where('attention.3.type', 'low_stock')
            ->where('attention.3.title', 'Bolt Pack')
            ->where('attention.3.subtitle', '1 on hand · threshold 4')
            ->where('attention.3.reason', 'Review stock')
            ->where('attention.3.href', route('inventory.index', absolute: false))
        );
}
```

Add `use App\Models\PurchasedOrderItem;` and `use App\Models\RequestQuotationItem;` at the top of `DashboardTest.php` if not already imported.

- [ ] **Step 2: Run the test to verify it fails**

Run: `php artisan test --filter=DashboardTest::test_attention_list_includes_actionable_rows_and_excludes_noise`

Expected: FAIL (missing `subtitle` key or wrong value).

- [ ] **Step 3: Implement subtitle composition in DashboardController**

Replace `attentionItems()` and add helpers so the file’s private section looks like this (keep existing `index()` KPI logic unchanged):

```php
/**
 * @return list<array{type: string, title: string, subtitle: string, reason: string, href: string}>
 */
private function attentionItems(): array
{
    $attention = [];

    foreach (
        RequestQuotation::query()
            ->where('status', RequestQuotationStatus::Pending)
            ->with(['supplier:id,name'])
            ->withCount('items')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(3)
            ->get(['id', 'reference', 'supplier_id', 'grand_total']) as $quotation
    ) {
        $attention[] = [
            'type' => 'pending_rfq',
            'title' => $quotation->reference,
            'subtitle' => $this->joinAttentionSegments([
                $quotation->supplier?->name,
                $this->formatAttentionMoney((float) $quotation->grand_total),
                $this->formatItemCount((int) $quotation->items_count),
            ]),
            'reason' => 'Approve quotation',
            'href' => route('request-quotations.index', absolute: false),
        ];
    }

    foreach (
        PurchasedOrder::query()
            ->where('status', PurchasedOrderStatus::Ordered)
            ->with(['supplier:id,name'])
            ->withCount('items')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(3)
            ->get(['id', 'reference', 'supplier_id', 'grand_total']) as $order
    ) {
        $attention[] = [
            'type' => 'ordered_po',
            'title' => $order->reference,
            'subtitle' => $this->joinAttentionSegments([
                $order->supplier?->name,
                $this->formatAttentionMoney((float) $order->grand_total),
                $this->formatItemCount((int) $order->items_count),
            ]),
            'reason' => 'Mark received',
            'href' => route('purchased-orders.index', absolute: false),
        ];
    }

    $postedWithBalance = PurchasedOrder::query()
        ->postedToAccountsPayable()
        ->with(['payments', 'supplier:id,name'])
        ->orderByDesc('created_at')
        ->orderByDesc('id')
        ->limit(20)
        ->get()
        ->filter(fn (PurchasedOrder $order) => (float) $order->balanceDue() > 0)
        ->take(3);

    foreach ($postedWithBalance as $order) {
        $attention[] = [
            'type' => 'ap_balance',
            'title' => $order->reference,
            'subtitle' => $this->joinAttentionSegments([
                $order->supplier?->name,
                'Balance '.$this->formatAttentionMoney((float) $order->balanceDue()),
            ]),
            'reason' => 'Settle payment',
            'href' => route('accounts-payable.show', [$order->supplier_id, $order], absolute: false),
        ];
    }

    foreach (
        Product::query()
            ->whereNotNull('low_stock_threshold')
            ->whereColumn('quantity', '<=', 'low_stock_threshold')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(3)
            ->get(['id', 'name', 'quantity', 'low_stock_threshold']) as $product
    ) {
        $attention[] = [
            'type' => 'low_stock',
            'title' => $product->name,
            'subtitle' => $this->joinAttentionSegments([
                $product->quantity.' on hand',
                'threshold '.$product->low_stock_threshold,
            ]),
            'reason' => 'Review stock',
            'href' => route('inventory.index', absolute: false),
        ];
    }

    return array_values(array_slice($attention, 0, 12));
}

/**
 * @param  list<string|null>  $segments
 */
private function joinAttentionSegments(array $segments): string
{
    return implode(' · ', array_values(array_filter(
        $segments,
        fn (?string $segment): bool => filled($segment)
    )));
}

private function formatAttentionMoney(float $amount): string
{
    return '₱'.number_format($amount, 2, '.', ',');
}

private function formatItemCount(int $count): string
{
    return $count === 1 ? '1 item' : $count.' items';
}
```

If SQLite/`get([...])` + `with(['supplier:id,name'])` complains about missing FK columns, drop the column list on `get()` and rely on default select (still fine at this scale).

- [ ] **Step 4: Run DashboardTest and fix fillable/item creation if needed**

Run: `php artisan test --filter=DashboardTest`

Expected: PASS (all methods).

If item creation fails validation/fillable, inspect `RequestQuotationItem` / `PurchasedOrderItem` and adjust the test’s `items()->create([...])` fields to match; keep subtitle expectations accurate to the resulting `items_count` and totals.

- [ ] **Step 5: Commit**

```bash
git add tests/Feature/DashboardTest.php app/Http/Controllers/DashboardController.php
git commit -m "$(cat <<'EOF'
feat: add compact subtitles to dashboard attention rows

EOF
)"
```

---

### Task 2: Render subtitle in the dashboard UI

**Files:**
- Modify: `resources/js/pages/dashboard/index.jsx` (Needs attention list rows)
- Test: manual + existing `DashboardTest` still green

**Interfaces:**
- Consumes: `attention[].subtitle` from Task 1
- Produces: Stacked title + muted subtitle in each attention `Link` row

- [ ] **Step 1: Update the attention row markup**

In `resources/js/pages/dashboard/index.jsx`, replace the title-only middle cell with stacked title + subtitle. Keep badge and reason columns.

Change the row’s middle content from:

```jsx
<span className="min-w-0 font-medium wrap-break-word text-ink">
    {item.title}
</span>
```

to:

```jsx
<span className="min-w-0">
    <span className="block font-medium wrap-break-word text-ink">
        {item.title}
    </span>
    {item.subtitle ? (
        <span className="mt-0.5 block text-sm wrap-break-word text-muted">
            {item.subtitle}
        </span>
    ) : null}
</span>
```

Keep the surrounding `Link` grid classes; ensure `min-h-16` still applies for tap height.

- [ ] **Step 2: Sanity-check DashboardTest still passes**

Run: `php artisan test --filter=DashboardTest`

Expected: PASS.

- [ ] **Step 3: Manual UI check (optional if Vite already running)**

Log in → `/dashboard`. Confirm Needs attention rows show badge, reference/name, muted subtitle, and reason; tablet width still usable.

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/dashboard/index.jsx
git commit -m "$(cat <<'EOF'
feat: show attention subtitles on dashboard list

EOF
)"
```

---

## Plan self-review

| Spec requirement | Task |
|------------------|------|
| Server-built `subtitle` prop | Task 1 |
| Per-type segments (RFQ/PO/AP/low stock) | Task 1 |
| Join with ` · `; omit blank supplier | Task 1 helpers |
| Money `₱` + `number_format` | Task 1 `formatAttentionMoney` |
| UI stacked title + muted subtitle | Task 2 |
| Tests assert subtitles | Task 1 |
| Out of scope (KPIs, caps, meta, hrefs) | Not changed |

No TBD placeholders. Prop name `subtitle` consistent across tasks.

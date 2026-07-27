<?php

namespace App\Http\Controllers;

use App\Enums\BankAccountStatus;
use App\Enums\PurchasedOrderPaymentMethod;
use App\Enums\PurchasedOrderStatus;
use App\Enums\SupplierStatus;
use App\Http\Requests\MarkReceivedWithAdjustmentRequest;
use App\Http\Requests\StorePurchasedOrderPaymentRequest;
use App\Http\Requests\StorePurchasedOrderRequest;
use App\Http\Requests\UpdatePurchasedOrderRequest;
use App\Models\BankAccount;
use App\Models\BankCheck;
use App\Models\Product;
use App\Models\PurchasedOrder;
use App\Models\PurchasedOrderItem;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PurchasedOrderController extends Controller
{
    /**
     * Purchase order list (default) with create-tab picker props.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'trashed' => ['nullable', 'string', Rule::in(['only', 'with'])],
        ]);

        $trashed = $filters['trashed'] ?? null;

        $orders = PurchasedOrder::query()
            ->with([
                'supplier',
                'requestQuotation.supplier',
                'requestQuotation.items.product',
                'items.product',
                'payments.bankCheck.bankAccount',
            ])
            ->when($trashed === 'only', fn ($builder) => $builder->onlyTrashed())
            ->when($trashed === 'with', fn ($builder) => $builder->withTrashed())
            ->orderedByWorkflow()
            ->paginate(8)
            ->withQueryString()
            ->through(fn (PurchasedOrder $order) => $order->toArrayPayload());

        return Inertia::render('purchased-orders/index', [
            'orders' => $orders,
            'statuses' => $this->statusOptions(),
            'paymentMethods' => $this->paymentMethodOptions(),
            'filters' => [
                'trashed' => $trashed ?? '',
            ],
            'suppliers' => Supplier::query()
                ->where('status', SupplierStatus::Active)
                ->orderBy('name')
                ->get()
                ->map(fn (Supplier $supplier) => [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'contact_name' => $supplier->contact_name,
                    'email' => $supplier->email,
                ])
                ->values()
                ->all(),
            'products' => Product::query()
                ->orderBy('name')
                ->get()
                ->map(fn (Product $product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'unit' => $product->unit,
                    'purchase_price' => $product->purchase_price,
                    'status' => $product->status->value,
                    'status_label' => $product->status->label(),
                ])
                ->values()
                ->all(),
            'bankAccounts' => BankAccount::query()
                ->where('status', BankAccountStatus::Active)
                ->orderBy('name')
                ->get()
                ->map(fn (BankAccount $bankAccount) => [
                    'id' => $bankAccount->id,
                    'name' => $bankAccount->name,
                ])
                ->values()
                ->all(),
        ]);
    }

    /**
     * Persist a new purchase order with line items as draft.
     */
    public function store(StorePurchasedOrderRequest $request): RedirectResponse
    {
        $attributes = $request->orderAttributes();
        $items = $request->itemAttributes();

        DB::transaction(function () use ($attributes, $items): void {
            [$grandTotal, $lineRows] = $this->buildLineRows($items);

            $order = PurchasedOrder::query()->create([
                ...$attributes,
                'status' => PurchasedOrderStatus::Draft,
                'grand_total' => $grandTotal,
            ]);

            $order->items()->createMany($lineRows);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Purchase order saved as draft.',
        ]);

        return redirect()->route('purchased-orders.index');
    }

    /**
     * Update a draft purchase order. Ordered and received orders are locked.
     */
    public function update(
        UpdatePurchasedOrderRequest $request,
        PurchasedOrder $purchasedOrder,
    ): RedirectResponse {
        if (! $purchasedOrder->isEditable()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Only draft purchase orders can be modified.',
            ]);

            return redirect()->route('purchased-orders.index');
        }

        $attributes = $request->orderAttributes();
        $items = $request->itemAttributes();

        DB::transaction(function () use ($purchasedOrder, $attributes, $items): void {
            [$grandTotal, $lineRows] = $this->buildLineRows($items);

            $purchasedOrder->update([
                ...$attributes,
                'grand_total' => $grandTotal,
            ]);

            $purchasedOrder->items()->delete();
            $purchasedOrder->items()->createMany($lineRows);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Purchase order updated.',
        ]);

        return redirect()->route('purchased-orders.index');
    }

    /**
     * Soft-delete a purchase order.
     */
    public function destroy(PurchasedOrder $purchasedOrder): RedirectResponse
    {
        $purchasedOrder->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Purchase order deleted.',
        ]);

        return redirect()->route('purchased-orders.index');
    }

    /**
     * Restore a soft-deleted purchase order.
     */
    public function restore(PurchasedOrder $purchasedOrder): RedirectResponse
    {
        $purchasedOrder->restore();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Purchase order restored.',
        ]);

        return redirect()->route('purchased-orders.index');
    }

    /**
     * Draft → Ordered.
     */
    public function markOrdered(PurchasedOrder $purchasedOrder): RedirectResponse
    {
        if ($purchasedOrder->status !== PurchasedOrderStatus::Draft) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Only draft purchase orders can be marked as ordered.',
            ]);

            return redirect()->route('purchased-orders.index');
        }

        $purchasedOrder->update([
            'status' => PurchasedOrderStatus::Ordered,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Purchase order marked as ordered.',
        ]);

        return redirect()->route('purchased-orders.index');
    }

    /**
     * Ordered → Received, optionally adjusting line quantities and prices.
     */
    public function markReceivedWithAdjustment(
        MarkReceivedWithAdjustmentRequest $request,
        PurchasedOrder $purchasedOrder,
    ): RedirectResponse {
        if ($purchasedOrder->status !== PurchasedOrderStatus::Ordered) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Only ordered purchase orders can be marked as received.',
            ]);

            return redirect()->route('purchased-orders.index');
        }

        $items = $request->itemAttributes();
        $meta = $request->metaAttributes();

        DB::transaction(function () use ($purchasedOrder, $items, $meta): void {
            [$grandTotal, $lineRows] = $this->buildLineRows($items);

            $purchasedOrder->update([
                'status' => PurchasedOrderStatus::Received,
                'grand_total' => $grandTotal,
                'meta' => $meta,
            ]);

            $purchasedOrder->items()->delete();
            $purchasedOrder->items()->createMany($lineRows);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Purchase order received with adjustments.',
        ]);

        return redirect()->route('purchased-orders.index');
    }

    /**
     * Record a pre-payment against an ordered or received purchase order with balance due.
     */
    public function storePayment(
        StorePurchasedOrderPaymentRequest $request,
        PurchasedOrder $purchasedOrder,
    ): RedirectResponse {
        if (! $purchasedOrder->canAddPrepayment()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Pre-payments can only be added when there is a remaining balance.',
            ]);

            return redirect()->route('purchased-orders.index');
        }

        $userName = $request->user()?->name ?? 'Unknown';
        $paymentAttributes = $request->paymentAttributes($userName);
        $bankCheckAttributes = $request->bankCheckAttributes($userName);

        DB::transaction(function () use ($purchasedOrder, $paymentAttributes, $bankCheckAttributes): void {
            if ($bankCheckAttributes !== null) {
                $bankCheck = BankCheck::query()->create($bankCheckAttributes);
                $paymentAttributes['bank_check_id'] = $bankCheck->id;
            }

            $purchasedOrder->payments()->create($paymentAttributes);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pre-payment recorded.',
        ]);

        return redirect()->route('purchased-orders.index');
    }

    /**
     * Forward an ordered/received purchase order to Accounts Payable for settlement.
     */
    public function postToAccountsPayable(PurchasedOrder $purchasedOrder): RedirectResponse
    {
        if (! $purchasedOrder->canPostToAccountsPayable()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Only ordered or received purchase orders that are not yet posted can be forwarded to Accounts Payable.',
            ]);

            return redirect()->route('purchased-orders.index');
        }

        $purchasedOrder->update([
            'posted_to_ap_at' => now(),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Purchase order posted to Accounts Payable.',
        ]);

        return redirect()->route('accounts-payable.supplier', $purchasedOrder->supplier_id);
    }

    /**
     * @param  list<array{product_id: int, buying_price: string, quantity: int}>  $items
     * @return array{0: string, 1: list<array{product_id: int, buying_price: string, quantity: int, subtotal: string}>}
     */
    private function buildLineRows(array $items): array
    {
        $grandTotal = '0.00';
        $lineRows = [];

        foreach ($items as $item) {
            $subtotal = PurchasedOrderItem::calculateSubtotal(
                $item['buying_price'],
                $item['quantity'],
            );
            $grandTotal = number_format((float) $grandTotal + (float) $subtotal, 2, '.', '');

            $lineRows[] = [
                'product_id' => $item['product_id'],
                'buying_price' => $item['buying_price'],
                'quantity' => $item['quantity'],
                'subtotal' => $subtotal,
            ];
        }

        return [$grandTotal, $lineRows];
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function statusOptions(): array
    {
        return array_map(
            fn (PurchasedOrderStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ],
            PurchasedOrderStatus::cases(),
        );
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function paymentMethodOptions(): array
    {
        return array_map(
            fn (PurchasedOrderPaymentMethod $method) => [
                'value' => $method->value,
                'label' => $method->label(),
            ],
            PurchasedOrderPaymentMethod::cases(),
        );
    }
}

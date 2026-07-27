<?php

namespace App\Http\Controllers;

use App\Enums\PurchasedOrderStatus;
use App\Enums\RequestQuotationStatus;
use App\Enums\SupplierStatus;
use App\Http\Requests\StoreRequestQuotationRequest;
use App\Http\Requests\UpdateRequestQuotationRequest;
use App\Models\Product;
use App\Models\PurchasedOrder;
use App\Models\RequestQuotation;
use App\Models\RequestQuotationItem;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RequestQuotationController extends Controller
{
    /**
     * Quotation list (default) with create-tab picker props.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'trashed' => ['nullable', 'string', Rule::in(['only', 'with'])],
        ]);

        $trashed = $filters['trashed'] ?? null;

        $quotations = RequestQuotation::query()
            ->with(['supplier', 'items.product', 'purchasedOrder.supplier', 'purchasedOrder.items.product'])
            ->when($trashed === 'only', fn ($builder) => $builder->onlyTrashed())
            ->when($trashed === 'with', fn ($builder) => $builder->withTrashed())
            ->orderedByWorkflow()
            ->paginate(8)
            ->withQueryString()
            ->through(fn (RequestQuotation $quotation) => $quotation->toArrayPayload());

        return Inertia::render('request-quotations/index', [
            'quotations' => $quotations,
            'statuses' => $this->statusOptions(),
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
        ]);
    }

    /**
     * Persist a new quotation with line items (draft or approved).
     */
    public function store(StoreRequestQuotationRequest $request): RedirectResponse
    {
        $attributes = $request->quotationAttributes();
        $items = $request->itemAttributes();
        $approve = $request->boolean('save_and_approve');
        $status = $approve
            ? RequestQuotationStatus::Approved
            : RequestQuotationStatus::Draft;

        DB::transaction(function () use ($attributes, $items, $status): void {
            [$grandTotal, $lineRows] = $this->buildLineRows($items);

            $quotation = RequestQuotation::query()->create([
                ...$attributes,
                'status' => $status,
                'grand_total' => $grandTotal,
            ]);

            $quotation->items()->createMany($lineRows);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $approve
                ? 'Request quotation saved and approved.'
                : 'Request quotation saved as draft.',
        ]);

        return redirect()->route('request-quotations.index');
    }

    /**
     * Update a draft or pending quotation. Approved quotations are locked.
     */
    public function update(
        UpdateRequestQuotationRequest $request,
        RequestQuotation $requestQuotation,
    ): RedirectResponse {
        if (! $requestQuotation->isEditable()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Approved quotations cannot be modified.',
            ]);

            return redirect()->route('request-quotations.index');
        }

        $attributes = $request->quotationAttributes();
        $items = $request->itemAttributes();
        $approve = $request->boolean('save_and_approve');

        DB::transaction(function () use ($requestQuotation, $attributes, $items, $approve): void {
            [$grandTotal, $lineRows] = $this->buildLineRows($items);

            $payload = [
                ...$attributes,
                'grand_total' => $grandTotal,
            ];

            if ($approve) {
                $payload['status'] = RequestQuotationStatus::Approved;
            }

            $requestQuotation->update($payload);

            $requestQuotation->items()->delete();
            $requestQuotation->items()->createMany($lineRows);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $approve
                ? 'Request quotation saved and approved.'
                : 'Request quotation updated.',
        ]);

        return redirect()->route('request-quotations.index');
    }

    /**
     * Soft-delete a quotation.
     */
    public function destroy(RequestQuotation $requestQuotation): RedirectResponse
    {
        $requestQuotation->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Request quotation deleted.',
        ]);

        return redirect()->route('request-quotations.index');
    }

    /**
     * Restore a soft-deleted quotation.
     */
    public function restore(RequestQuotation $requestQuotation): RedirectResponse
    {
        $requestQuotation->restore();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Request quotation restored.',
        ]);

        return redirect()->route('request-quotations.index');
    }

    /**
     * Draft → Pending.
     */
    public function submit(RequestQuotation $requestQuotation): RedirectResponse
    {
        if ($requestQuotation->status !== RequestQuotationStatus::Draft) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Only draft quotations can be submitted.',
            ]);

            return redirect()->route('request-quotations.index');
        }

        $requestQuotation->update([
            'status' => RequestQuotationStatus::Pending,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Request quotation submitted for approval.',
        ]);

        return redirect()->route('request-quotations.index');
    }

    /**
     * Pending → Approved.
     */
    public function approve(RequestQuotation $requestQuotation): RedirectResponse
    {
        if ($requestQuotation->status !== RequestQuotationStatus::Pending) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Only pending quotations can be approved.',
            ]);

            return redirect()->route('request-quotations.index');
        }

        $requestQuotation->update([
            'status' => RequestQuotationStatus::Approved,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Request quotation approved.',
        ]);

        return redirect()->route('request-quotations.index');
    }

    /**
     * Approved quotation → draft purchase order (once).
     */
    public function createPurchaseOrder(RequestQuotation $requestQuotation): RedirectResponse
    {
        $requestQuotation->loadMissing(['items', 'purchasedOrder']);

        if ($requestQuotation->status !== RequestQuotationStatus::Approved) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Only approved quotations can create a purchase order.',
            ]);

            return redirect()->route('request-quotations.index');
        }

        if ($requestQuotation->purchasedOrder !== null) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'A purchase order already exists for this quotation.',
            ]);

            return redirect()->route('request-quotations.index');
        }

        DB::transaction(function () use ($requestQuotation): void {
            $order = PurchasedOrder::query()->create([
                'supplier_id' => $requestQuotation->supplier_id,
                'request_quotation_id' => $requestQuotation->id,
                'status' => PurchasedOrderStatus::Draft,
                'grand_total' => $requestQuotation->grand_total,
                'notes' => $requestQuotation->notes,
            ]);

            $lineRows = $requestQuotation->items->map(fn (RequestQuotationItem $item) => [
                'product_id' => $item->product_id,
                'buying_price' => $item->buying_price,
                'quantity' => $item->quantity,
                'subtotal' => $item->subtotal,
            ])->all();

            $order->items()->createMany($lineRows);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Purchase order created from quotation.',
        ]);

        return redirect()->route('purchased-orders.index');
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
            $subtotal = RequestQuotationItem::calculateSubtotal(
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
            fn (RequestQuotationStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ],
            RequestQuotationStatus::cases(),
        );
    }
}

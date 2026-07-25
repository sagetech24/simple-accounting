<?php

namespace App\Http\Controllers;

use App\Enums\RequestQuotationStatus;
use App\Enums\SupplierStatus;
use App\Http\Requests\StoreRequestQuotationRequest;
use App\Models\Product;
use App\Models\RequestQuotation;
use App\Models\RequestQuotationItem;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RequestQuotationController extends Controller
{
    /**
     * Quotation list (default) with create-tab picker props.
     */
    public function index(): Response
    {
        $quotations = RequestQuotation::query()
            ->with(['supplier', 'items.product'])
            ->orderedByWorkflow()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (RequestQuotation $quotation) => $quotation->toArrayPayload());

        return Inertia::render('request-quotations/index', [
            'quotations' => $quotations,
            'statuses' => $this->statusOptions(),
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
                    'purchase_price' => $product->purchase_price,
                    'status' => $product->status->value,
                    'status_label' => $product->status->label(),
                ])
                ->values()
                ->all(),
        ]);
    }

    /**
     * Persist a new draft quotation with line items.
     */
    public function store(StoreRequestQuotationRequest $request): RedirectResponse
    {
        $attributes = $request->quotationAttributes();
        $items = $request->itemAttributes();

        DB::transaction(function () use ($attributes, $items): void {
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

            $quotation = RequestQuotation::query()->create([
                ...$attributes,
                'status' => RequestQuotationStatus::Draft,
                'grand_total' => $grandTotal,
            ]);

            $quotation->items()->createMany($lineRows);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Request quotation saved as draft.',
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

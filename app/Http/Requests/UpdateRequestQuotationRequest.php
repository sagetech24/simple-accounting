<?php

namespace App\Http\Requests;

use App\Enums\SupplierStatus;
use App\Models\Supplier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateRequestQuotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'supplier_id' => [
                'required',
                'integer',
                Rule::exists('suppliers', 'id')->whereNull('deleted_at'),
            ],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('products', 'id')->whereNull('deleted_at'),
            ],
            'items.*.buying_price' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => 'Add at least one product line.',
            'items.min' => 'Add at least one product line.',
            'items.*.product_id.distinct' => 'Each product can only be added once.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $supplierId = $this->integer('supplier_id');
            $supplier = Supplier::query()->find($supplierId);

            if ($supplier === null || $supplier->status !== SupplierStatus::Active) {
                $validator->errors()->add('supplier_id', 'Select an active supplier.');
            }
        });
    }

    /**
     * @return array{supplier_id: int, notes: ?string}
     */
    public function quotationAttributes(): array
    {
        $validated = $this->validated();

        return [
            'supplier_id' => (int) $validated['supplier_id'],
            'notes' => $validated['notes'] ?? null,
        ];
    }

    /**
     * @return list<array{product_id: int, buying_price: string, quantity: int}>
     */
    public function itemAttributes(): array
    {
        return collect($this->validated('items'))
            ->map(fn (array $item) => [
                'product_id' => (int) $item['product_id'],
                'buying_price' => number_format((float) $item['buying_price'], 2, '.', ''),
                'quantity' => (int) $item['quantity'],
            ])
            ->values()
            ->all();
    }
}

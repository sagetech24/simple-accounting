<?php

namespace App\Http\Requests;

use App\Enums\CustomerStatus;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreSalesOrderRequest extends FormRequest
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
            'reference' => ['nullable', 'uuid', 'unique:sales_orders,reference'],
            'customer_id' => [
                'nullable',
                'integer',
                Rule::exists('customers', 'id')->whereNull('deleted_at'),
            ],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('products', 'id')->whereNull('deleted_at'),
            ],
            'items.*.selling_price' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
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

            $customerId = $this->input('customer_id');

            if ($customerId !== null && $customerId !== '') {
                $customer = Customer::query()->find((int) $customerId);

                if ($customer === null || $customer->status !== CustomerStatus::Active) {
                    $validator->errors()->add('customer_id', 'Select an active customer.');
                }
            }

            $items = collect($this->input('items', []));
            $productIds = $items->pluck('product_id')->map(fn ($id) => (int) $id)->all();
            $products = Product::query()
                ->whereIn('id', $productIds)
                ->get()
                ->keyBy('id');

            foreach ($items as $index => $item) {
                $productId = (int) $item['product_id'];
                $quantity = (int) $item['quantity'];
                $product = $products->get($productId);

                if ($product === null) {
                    continue;
                }

                if ($product->quantity < $quantity) {
                    $validator->errors()->add(
                        "items.{$index}.quantity",
                        "Only {$product->quantity} on hand for {$product->name}.",
                    );
                }
            }
        });
    }

    /**
     * @return array{reference: ?string, customer_id: ?int, customer_name: ?string, notes: ?string}
     */
    public function orderAttributes(): array
    {
        $validated = $this->validated();
        $customerId = $validated['customer_id'] ?? null;
        $hasCustomer = $customerId !== null && $customerId !== '';
        $guestName = trim((string) ($validated['customer_name'] ?? ''));

        return [
            'reference' => $validated['reference'] ?? null,
            'customer_id' => $hasCustomer ? (int) $customerId : null,
            'customer_name' => $hasCustomer || $guestName === '' ? null : $guestName,
            'notes' => $validated['notes'] ?? null,
        ];
    }

    /**
     * @return list<array{product_id: int, selling_price: string, quantity: int}>
     */
    public function itemAttributes(): array
    {
        return collect($this->validated('items'))
            ->map(fn (array $item) => [
                'product_id' => (int) $item['product_id'],
                'selling_price' => number_format((float) $item['selling_price'], 2, '.', ''),
                'quantity' => (int) $item['quantity'],
            ])
            ->values()
            ->all();
    }
}

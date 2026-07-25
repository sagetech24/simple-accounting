<?php

namespace App\Http\Requests;

use App\Models\PurchasedOrder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class MarkReceivedWithAdjustmentRequest extends FormRequest
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
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'distinct'],
            'items.*.buying_price' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'invoice_number' => ['nullable', 'string', 'max:255'],
            'delivery_number' => ['nullable', 'string', 'max:255'],
            'delivery_person' => ['nullable', 'string', 'max:255'],
            'delivery_date' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => 'Keep at least one product line.',
            'items.min' => 'Keep at least one product line.',
            'items.*.product_id.distinct' => 'Each product can only be added once.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            /** @var PurchasedOrder $order */
            $order = $this->route('purchased_order');
            $order->loadMissing('items');

            $existingIds = collect($order->items)
                ->pluck('product_id')
                ->map(fn ($id) => (int) $id)
                ->all();

            $submittedIds = collect($this->input('items', []))
                ->pluck('product_id')
                ->map(fn ($id) => (int) $id)
                ->all();

            $unknownIds = array_values(array_diff($submittedIds, $existingIds));

            if ($unknownIds !== []) {
                $validator->errors()->add(
                    'items',
                    'Adjustment can only include products already on this purchase order.',
                );
            }
        });
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

    /**
     * Optional receipt metadata from the supplier, plus the receiving user.
     *
     * @return array{
     *     invoice_number: ?string,
     *     delivery_number: ?string,
     *     delivery_person: ?string,
     *     delivery_date: ?string,
     *     received_by: ?string
     * }
     */
    public function metaAttributes(): array
    {
        $validated = $this->validated();

        return [
            'invoice_number' => $this->nullableTrimmedString($validated['invoice_number'] ?? null),
            'delivery_number' => $this->nullableTrimmedString($validated['delivery_number'] ?? null),
            'delivery_person' => $this->nullableTrimmedString($validated['delivery_person'] ?? null),
            'delivery_date' => filled($validated['delivery_date'] ?? null)
                ? (string) $validated['delivery_date']
                : null,
            'received_by' => $this->user()?->name,
        ];
    }

    private function nullableTrimmedString(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}

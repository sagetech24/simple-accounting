<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInventorySettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'price_change_note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function lowStockThreshold(): int
    {
        return (int) $this->validated('low_stock_threshold');
    }

    public function sellingPrice(): string
    {
        return number_format((float) $this->validated('selling_price'), 2, '.', '');
    }

    public function priceChangeNote(): ?string
    {
        $note = $this->validated('price_change_note');

        return blank($note) ? null : (string) $note;
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdjustStockRequest extends FormRequest
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
            'quantity' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function quantity(): int
    {
        return (int) $this->validated('quantity');
    }

    public function notes(): ?string
    {
        $notes = $this->validated('notes');

        return blank($notes) ? null : (string) $notes;
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBankCheckRequest extends FormRequest
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
            'check_number' => ['required', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'due_date' => ['required', 'date'],
            'issued_by' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function bankCheckAttributes(): array
    {
        $validated = $this->validated();

        return [
            'check_number' => $validated['check_number'],
            'amount' => number_format((float) $validated['amount'], 2, '.', ''),
            'due_date' => $validated['due_date'],
            'issued_by' => $validated['issued_by'],
            'notes' => $validated['notes'] ?? null,
        ];
    }
}

<?php

namespace App\Http\Requests;

use App\Enums\BankAccountStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBankAccountRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255', 'unique:bank_accounts,name'],
            'account_name' => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'status' => ['required', Rule::enum(BankAccountStatus::class)],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function bankAccountAttributes(): array
    {
        return $this->validated();
    }
}

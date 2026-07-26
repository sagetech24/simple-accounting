<?php

namespace App\Http\Requests;

use App\Enums\BankAccountStatus;
use App\Models\BankAccount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBankAccountRequest extends FormRequest
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
        /** @var BankAccount $bankAccount */
        $bankAccount = $this->route('bank_account');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('bank_accounts', 'name')->ignore($bankAccount->id),
            ],
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

<?php

namespace App\Http\Requests;

use App\Enums\BankAccountStatus;
use App\Enums\PurchasedOrderPaymentMethod;
use App\Models\PurchasedOrder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePurchasedOrderPaymentRequest extends FormRequest
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
            'method' => ['required', Rule::enum(PurchasedOrderPaymentMethod::class)],
            'amount' => ['required', 'numeric', 'gt:0'],
            'notes' => ['nullable', 'string'],
            'platform' => [
                'nullable',
                'required_if:method,'.PurchasedOrderPaymentMethod::OnlinePayment->value,
                'string',
                'max:255',
            ],
            'reference_number' => [
                'nullable',
                'required_if:method,'.PurchasedOrderPaymentMethod::BankDeposit->value,
                'string',
                'max:255',
            ],
            'bank_name' => [
                'nullable',
                'required_if:method,'.PurchasedOrderPaymentMethod::BankDeposit->value,
                'string',
                'max:255',
            ],
            'bank_account_id' => [
                'nullable',
                'required_if:method,'.PurchasedOrderPaymentMethod::PostDatedCheck->value,
                'integer',
                Rule::exists('bank_accounts', 'id')->where(function ($query) {
                    $query->where('status', BankAccountStatus::Active->value)
                        ->whereNull('deleted_at');
                }),
            ],
            'check_number' => [
                'nullable',
                'required_if:method,'.PurchasedOrderPaymentMethod::PostDatedCheck->value,
                'string',
                'max:100',
            ],
            'due_date' => [
                'nullable',
                'required_if:method,'.PurchasedOrderPaymentMethod::PostDatedCheck->value,
                'date',
                'after_or_equal:today',
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var PurchasedOrder|null $order */
            $order = $this->route('purchased_order');

            if (! $order instanceof PurchasedOrder || $validator->errors()->has('amount')) {
                return;
            }

            $amount = (float) $this->input('amount');
            $balanceDue = (float) $order->balanceDue();

            if ($amount > $balanceDue + 0.00001) {
                $validator->errors()->add(
                    'amount',
                    'The amount may not exceed the remaining balance of '.number_format($balanceDue, 2, '.', '').'.',
                );
            }
        });
    }

    public function paymentMethod(): PurchasedOrderPaymentMethod
    {
        return PurchasedOrderPaymentMethod::from($this->validated('method'));
    }

    /**
     * Attributes for purchased_order_payments (excluding PDC-only check fields).
     *
     * @return array<string, mixed>
     */
    public function paymentAttributes(string $recordedBy): array
    {
        $method = $this->paymentMethod();
        $validated = $this->validated();

        return [
            'method' => $method,
            'amount' => number_format((float) $validated['amount'], 2, '.', ''),
            'notes' => $validated['notes'] ?? null,
            'platform' => $method === PurchasedOrderPaymentMethod::OnlinePayment
                ? ($validated['platform'] ?? null)
                : null,
            'reference_number' => in_array($method, [
                PurchasedOrderPaymentMethod::OnlinePayment,
                PurchasedOrderPaymentMethod::BankDeposit,
            ], true)
                ? ($validated['reference_number'] ?? null)
                : null,
            'bank_name' => $method === PurchasedOrderPaymentMethod::BankDeposit
                ? ($validated['bank_name'] ?? null)
                : null,
            'recorded_by' => $recordedBy,
            'paid_at' => now(),
        ];
    }

    /**
     * @return array{bank_account_id: int, check_number: string, amount: string, due_date: string, issued_by: string, notes: string|null}|null
     */
    public function bankCheckAttributes(string $issuedBy): ?array
    {
        if ($this->paymentMethod() !== PurchasedOrderPaymentMethod::PostDatedCheck) {
            return null;
        }

        $validated = $this->validated();

        return [
            'bank_account_id' => (int) $validated['bank_account_id'],
            'check_number' => $validated['check_number'],
            'amount' => number_format((float) $validated['amount'], 2, '.', ''),
            'due_date' => $validated['due_date'],
            'issued_by' => $issuedBy,
            'notes' => $validated['notes'] ?? null,
        ];
    }
}

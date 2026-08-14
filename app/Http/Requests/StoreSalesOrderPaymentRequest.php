<?php

namespace App\Http\Requests;

use App\Enums\BankAccountStatus;
use App\Enums\SalesOrderPaymentMethod;
use App\Models\SalesOrder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreSalesOrderPaymentRequest extends FormRequest
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
            'method' => ['required', Rule::enum(SalesOrderPaymentMethod::class)],
            'amount' => ['required', 'numeric', 'gt:0'],
            'notes' => ['nullable', 'string'],
            'platform' => [
                'nullable',
                'required_if:method,'.SalesOrderPaymentMethod::OnlinePayment->value,
                'string',
                'max:255',
            ],
            'reference_number' => [
                'nullable',
                'required_if:method,'.SalesOrderPaymentMethod::BankTransfer->value,
                'string',
                'max:255',
            ],
            'bank_name' => [
                'nullable',
                'required_if:method,'.SalesOrderPaymentMethod::BankTransfer->value,
                'string',
                'max:255',
            ],
            'bank_account_id' => [
                'nullable',
                'required_if:method,'.SalesOrderPaymentMethod::PostDatedCheck->value,
                'integer',
                Rule::exists('bank_accounts', 'id')->where(function ($query) {
                    $query->where('status', BankAccountStatus::Active->value)
                        ->whereNull('deleted_at');
                }),
            ],
            'check_number' => [
                'nullable',
                'required_if:method,'.SalesOrderPaymentMethod::PostDatedCheck->value,
                'string',
                'max:100',
            ],
            'due_date' => [
                'nullable',
                'required_if:method,'.SalesOrderPaymentMethod::PostDatedCheck->value,
                'date',
                'after_or_equal:today',
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var SalesOrder|null $order */
            $order = $this->route('sales_order');

            if (! $order instanceof SalesOrder) {
                return;
            }

            if (! $order->canAddPayment()) {
                return;
            }

            if ($order->customer_id === null
                && $this->input('method') !== SalesOrderPaymentMethod::Cash->value
                && ! $validator->errors()->has('method')
            ) {
                $validator->errors()->add(
                    'method',
                    'Walk-in sales only accept cash payments.',
                );
            }

            if ($validator->errors()->has('amount')) {
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

    public function paymentMethod(): SalesOrderPaymentMethod
    {
        return SalesOrderPaymentMethod::from($this->validated('method'));
    }

    /**
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
            'platform' => $method === SalesOrderPaymentMethod::OnlinePayment
                ? ($validated['platform'] ?? null)
                : null,
            'reference_number' => in_array($method, [
                SalesOrderPaymentMethod::OnlinePayment,
                SalesOrderPaymentMethod::BankTransfer,
            ], true)
                ? ($validated['reference_number'] ?? null)
                : null,
            'bank_name' => $method === SalesOrderPaymentMethod::BankTransfer
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
        if ($this->paymentMethod() !== SalesOrderPaymentMethod::PostDatedCheck) {
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

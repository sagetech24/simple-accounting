<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBankCheckRequest;
use App\Http\Requests\UpdateBankCheckRequest;
use App\Models\BankAccount;
use App\Models\BankCheck;
use App\Services\BankAccountAuditor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BankCheckController extends Controller
{
    public function store(
        StoreBankCheckRequest $request,
        BankAccount $bankAccount,
        BankAccountAuditor $auditor,
    ): RedirectResponse {
        $check = $bankAccount->checks()->create($request->bankCheckAttributes());

        $auditor->record(
            $bankAccount,
            'check.created',
            $check,
            "Issued check #{$check->check_number}",
            null,
            $check->toArrayPayload(),
            $request->user(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Check issued.',
        ]);

        return redirect()->route('bank-accounts.show', $bankAccount);
    }

    public function update(
        UpdateBankCheckRequest $request,
        BankAccount $bankAccount,
        BankCheck $bankCheck,
        BankAccountAuditor $auditor,
    ): RedirectResponse {
        $this->ensureCheckBelongsToAccount($bankAccount, $bankCheck);

        $before = [
            'check_number' => $bankCheck->check_number,
            'amount' => $bankCheck->amount,
            'due_date' => $bankCheck->due_date?->toDateString(),
            'issued_by' => $bankCheck->issued_by,
            'notes' => $bankCheck->notes,
        ];

        $attributes = $request->bankCheckAttributes();
        $bankCheck->update($attributes);

        $changedBefore = [];
        $changedAfter = [];
        foreach ($attributes as $key => $value) {
            $previous = $before[$key] ?? null;
            if ((string) $previous !== (string) $value) {
                $changedBefore[$key] = $previous;
                $changedAfter[$key] = $value;
            }
        }

        if ($changedBefore !== []) {
            $auditor->record(
                $bankAccount,
                'check.updated',
                $bankCheck,
                "Updated check #{$bankCheck->check_number}",
                $changedBefore,
                $changedAfter,
                $request->user(),
            );
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Check updated.',
        ]);

        return redirect()->route('bank-accounts.show', $bankAccount);
    }

    public function voidCheck(
        Request $request,
        BankAccount $bankAccount,
        BankCheck $bankCheck,
        BankAccountAuditor $auditor,
    ): RedirectResponse {
        $this->ensureCheckBelongsToAccount($bankAccount, $bankCheck);

        if ($bankCheck->isLinked()) {
            return redirect()
                ->route('bank-accounts.show', $bankAccount)
                ->withErrors([
                    'void' => 'Void is blocked while this check is linked to a payment.',
                ]);
        }

        if ($bankCheck->isVoided()) {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => 'Check is already voided.',
            ]);

            return redirect()->route('bank-accounts.show', $bankAccount);
        }

        $before = ['voided_at' => null];
        $bankCheck->update(['voided_at' => now()]);

        $auditor->record(
            $bankAccount,
            'check.voided',
            $bankCheck,
            "Voided check #{$bankCheck->check_number}",
            $before,
            ['voided_at' => $bankCheck->fresh()->voided_at?->toIso8601String()],
            $request->user(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Check voided.',
        ]);

        return redirect()->route('bank-accounts.show', $bankAccount);
    }

    private function ensureCheckBelongsToAccount(BankAccount $bankAccount, BankCheck $bankCheck): void
    {
        abort_unless(
            (int) $bankCheck->bank_account_id === (int) $bankAccount->id,
            404,
        );
    }
}

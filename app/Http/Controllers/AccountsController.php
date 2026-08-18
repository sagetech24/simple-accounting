<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Response;

class AccountsController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'tab' => ['nullable', 'string', Rule::in([
                'accounts-payable',
                'accounts-receivable',
                'bank-accounts',
            ])],
        ]);

        $tab = $filters['tab'] ?? 'accounts-payable';

        return match ($tab) {
            'accounts-receivable' => app(AccountsReceivableController::class)->index($request),
            'bank-accounts' => app(BankAccountController::class)->index($request),
            default => app(AccountsPayableController::class)->index($request),
        };
    }
}

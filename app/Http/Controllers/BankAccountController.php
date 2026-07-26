<?php

namespace App\Http\Controllers;

use App\Enums\BankAccountStatus;
use App\Http\Requests\StoreBankAccountRequest;
use App\Http\Requests\UpdateBankAccountRequest;
use App\Models\BankAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BankAccountController extends Controller
{
    /**
     * Bank account list with optional search, trash filter, and sorting.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'trashed' => ['nullable', 'string', Rule::in(['only', 'with'])],
            'sort' => ['nullable', 'string', Rule::in(['name', 'account_name', 'status'])],
            'direction' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
        ]);

        $query = $filters['q'] ?? null;
        $trashed = $filters['trashed'] ?? null;
        $sort = $filters['sort'] ?? 'name';
        $direction = $filters['direction'] ?? 'asc';

        $bankAccounts = BankAccount::query()
            ->when($trashed === 'only', fn ($builder) => $builder->onlyTrashed())
            ->when($trashed === 'with', fn ($builder) => $builder->withTrashed())
            ->search($query)
            ->orderBy($sort, $direction)
            ->orderBy('id')
            ->paginate(8)
            ->withQueryString()
            ->through(fn (BankAccount $bankAccount) => $bankAccount->toArrayPayload());

        return Inertia::render('bank-accounts/index', [
            'bankAccounts' => $bankAccounts,
            'statuses' => $this->statusOptions(),
            'filters' => [
                'q' => $query ?? '',
                'trashed' => $trashed ?? '',
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    /**
     * Store a new bank account.
     */
    public function store(StoreBankAccountRequest $request): RedirectResponse
    {
        BankAccount::query()->create($request->bankAccountAttributes());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Bank account created.',
        ]);

        return redirect()->route('bank-accounts.index');
    }

    /**
     * Update an existing bank account.
     */
    public function update(UpdateBankAccountRequest $request, BankAccount $bankAccount): RedirectResponse
    {
        $bankAccount->update($request->bankAccountAttributes());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Bank account updated.',
        ]);

        return redirect()->route('bank-accounts.index');
    }

    /**
     * Soft-delete a bank account.
     */
    public function destroy(BankAccount $bankAccount): RedirectResponse
    {
        $bankAccount->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Bank account deleted.',
        ]);

        return redirect()->route('bank-accounts.index');
    }

    /**
     * Restore a soft-deleted bank account.
     */
    public function restore(BankAccount $bankAccount): RedirectResponse
    {
        $bankAccount->restore();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Bank account restored.',
        ]);

        return redirect()->route('bank-accounts.index');
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function statusOptions(): array
    {
        return array_map(
            fn (BankAccountStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ],
            BankAccountStatus::cases(),
        );
    }
}

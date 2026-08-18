<?php

namespace App\Http\Controllers;

use App\Enums\BankAccountStatus;
use App\Http\Requests\StoreBankAccountRequest;
use App\Http\Requests\UpdateBankAccountRequest;
use App\Models\BankAccount;
use App\Models\BankAccountAuditLog;
use App\Models\BankCheck;
use App\Models\PurchasedOrder;
use App\Models\PurchasedOrderPayment;
use App\Services\BankAccountAuditor;
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
     * Bank account profile: checks, payments, audit, and KPIs.
     */
    public function show(Request $request, BankAccount $bankAccount): Response
    {
        $filters = $request->validate([
            'tab' => ['nullable', 'string', Rule::in(['checks', 'payments', 'audit'])],
            'due' => ['nullable', 'string', Rule::in(['all', 'upcoming', 'overdue'])],
            'q' => ['nullable', 'string', 'max:120'],
            'linkage' => ['nullable', 'string', Rule::in(['all', 'linked', 'standalone'])],
            'audit_q' => ['nullable', 'string', 'max:120'],
        ]);

        $tab = $filters['tab'] ?? 'checks';
        $due = $filters['due'] ?? 'all';
        $search = $filters['q'] ?? '';
        $linkage = $filters['linkage'] ?? 'all';
        $auditQ = $filters['audit_q'] ?? '';

        $today = now()->startOfDay();

        $allChecks = $bankAccount->checks()
            ->with(['payment.purchasedOrder.supplier', 'bankAccount'])
            ->orderByDesc('due_date')
            ->orderByDesc('id')
            ->get();

        $activeChecks = $allChecks->filter(fn (BankCheck $check) => ! $check->isVoided());

        $overdueChecks = $activeChecks->filter(
            fn (BankCheck $check) => $check->due_date !== null && $check->due_date->lt($today),
        );
        $upcomingChecks = $activeChecks->filter(
            fn (BankCheck $check) => $check->due_date !== null && $check->due_date->gte($today),
        );

        $kpis = [
            'open_total' => number_format((float) $activeChecks->sum(fn (BankCheck $c) => (float) $c->amount), 2, '.', ''),
            'overdue_count' => $overdueChecks->count(),
            'overdue_amount' => number_format((float) $overdueChecks->sum(fn (BankCheck $c) => (float) $c->amount), 2, '.', ''),
            'upcoming_count' => $upcomingChecks->count(),
            'upcoming_amount' => number_format((float) $upcomingChecks->sum(fn (BankCheck $c) => (float) $c->amount), 2, '.', ''),
            'issued_count' => $activeChecks->count(),
        ];

        $filteredChecks = $allChecks
            ->when($due === 'upcoming', fn ($checks) => $checks->filter(
                fn (BankCheck $check) => ! $check->isVoided()
                    && $check->due_date !== null
                    && $check->due_date->gte($today),
            ))
            ->when($due === 'overdue', fn ($checks) => $checks->filter(
                fn (BankCheck $check) => ! $check->isVoided()
                    && $check->due_date !== null
                    && $check->due_date->lt($today),
            ))
            ->when($linkage === 'linked', fn ($checks) => $checks->filter(fn (BankCheck $check) => $check->isLinked()))
            ->when($linkage === 'standalone', fn ($checks) => $checks->filter(fn (BankCheck $check) => ! $check->isLinked()))
            ->when(filled($search), function ($checks) use ($search) {
                $term = mb_strtolower($search);

                return $checks->filter(function (BankCheck $check) use ($term) {
                    $haystack = mb_strtolower(implode(' ', array_filter([
                        $check->check_number,
                        $check->issued_by,
                        $check->payment?->purchasedOrder?->reference,
                    ])));

                    return str_contains($haystack, $term);
                });
            })
            ->values()
            ->take(50)
            ->map(fn (BankCheck $check) => $check->toArrayPayload())
            ->all();

        $payments = PurchasedOrderPayment::query()
            ->whereHas('bankCheck', fn ($query) => $query->where('bank_account_id', $bankAccount->id))
            ->with(['bankCheck.bankAccount', 'purchasedOrder.supplier'])
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(function (PurchasedOrderPayment $payment) {
                $payload = $payment->toArrayPayload();
                $order = $payment->purchasedOrder;

                return array_merge($payload, [
                    'purchased_order_reference' => $order?->reference,
                    'supplier_id' => $order?->supplier_id,
                    'supplier_name' => $order?->supplier?->name,
                    'check_number' => $payment->bankCheck?->check_number,
                ]);
            })
            ->all();

        $auditLogs = BankAccountAuditLog::query()
            ->where('bank_account_id', $bankAccount->id)
            ->with('actor')
            ->when(filled($auditQ), function ($query) use ($auditQ) {
                $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $auditQ).'%';

                $query->where(function ($builder) use ($like) {
                    $builder->where('summary', 'like', $like)
                        ->orWhere('action', 'like', $like);
                });
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(fn (BankAccountAuditLog $log) => $log->toArrayPayload())
            ->all();

        $eligibleOrders = PurchasedOrder::query()
            ->with(['supplier', 'payments'])
            ->whereNull('deleted_at')
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->filter(fn (PurchasedOrder $order) => $order->canAddPrepayment())
            ->values()
            ->map(fn (PurchasedOrder $order) => [
                'id' => $order->id,
                'reference' => $order->reference,
                'supplier_name' => $order->supplier?->name,
                'balance_due' => $order->balanceDue(),
            ])
            ->all();

        return Inertia::render('bank-accounts/show', [
            'bankAccount' => $bankAccount->toArrayPayload(),
            'kpis' => $kpis,
            'checks' => $filteredChecks,
            'payments' => $payments,
            'auditLogs' => $auditLogs,
            'eligibleOrders' => $eligibleOrders,
            'statuses' => $this->statusOptions(),
            'filters' => [
                'tab' => $tab,
                'due' => $due,
                'q' => $search,
                'linkage' => $linkage,
                'audit_q' => $auditQ,
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

        return $this->redirectToHub();
    }

    /**
     * Update an existing bank account.
     */
    public function update(UpdateBankAccountRequest $request, BankAccount $bankAccount): RedirectResponse
    {
        $before = [
            'name' => $bankAccount->name,
            'account_name' => $bankAccount->account_name,
            'account_number' => $bankAccount->account_number,
            'notes' => $bankAccount->notes,
            'status' => $bankAccount->status->value,
        ];

        $bankAccount->update($request->bankAccountAttributes());
        $bankAccount->refresh();

        $after = [
            'name' => $bankAccount->name,
            'account_name' => $bankAccount->account_name,
            'account_number' => $bankAccount->account_number,
            'notes' => $bankAccount->notes,
            'status' => $bankAccount->status->value,
        ];

        $changedBefore = [];
        $changedAfter = [];
        foreach ($after as $key => $value) {
            if ((string) ($before[$key] ?? '') !== (string) ($value ?? '')) {
                $changedBefore[$key] = $before[$key];
                $changedAfter[$key] = $value;
            }
        }

        if ($changedBefore !== []) {
            app(BankAccountAuditor::class)->record(
                $bankAccount,
                'account.updated',
                $bankAccount,
                "Updated bank account {$bankAccount->name}",
                $changedBefore,
                $changedAfter,
                $request->user(),
            );
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Bank account updated.',
        ]);

        if ($request->input('return_to') === 'show') {
            return redirect()->route('bank-accounts.show', $bankAccount);
        }

        return $this->redirectToHub();
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

        return $this->redirectToHub();
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

        return $this->redirectToHub();
    }

    private function redirectToHub(): RedirectResponse
    {
        return redirect()->route('accounts.index', ['tab' => 'bank-accounts']);
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

<?php

namespace App\Http\Controllers;

use App\Enums\BankAccountStatus;
use App\Enums\PurchasedOrderPaymentMethod;
use App\Http\Requests\StorePurchasedOrderPaymentRequest;
use App\Models\BankAccount;
use App\Models\BankCheck;
use App\Models\PurchasedOrder;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AccountsPayableController extends Controller
{
    /**
     * Supplier rollup of purchase orders posted to Accounts Payable.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', Rule::in([
                'name',
                'posted_order_count',
                'open_order_count',
                'total_payable',
                'total_paid',
                'balance_due',
            ])],
            'direction' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
        ]);

        $search = $filters['q'] ?? null;
        $sort = $filters['sort'] ?? 'name';
        $direction = $filters['direction'] ?? 'asc';

        $suppliers = Supplier::query()
            ->withTrashed()
            ->whereHas('purchasedOrders', fn ($query) => $query->postedToAccountsPayable())
            ->with([
                'purchasedOrders' => fn ($query) => $query
                    ->postedToAccountsPayable()
                    ->with('payments'),
            ])
            ->search($search)
            ->orderBy('name')
            ->get()
            ->map(function (Supplier $supplier) {
                $orders = $supplier->purchasedOrders;
                $openOrders = $orders->filter(
                    fn (PurchasedOrder $order) => (float) $order->balanceDue() > 0,
                );

                $totalPayable = $orders->sum(
                    fn (PurchasedOrder $order) => (float) $order->grand_total,
                );
                $totalPaid = $orders->sum(
                    fn (PurchasedOrder $order) => (float) $order->amountPaid(),
                );
                $balanceDue = $orders->sum(
                    fn (PurchasedOrder $order) => (float) $order->balanceDue(),
                );

                return [
                    ...$supplier->toArrayPayload(),
                    'posted_order_count' => $orders->count(),
                    'open_order_count' => $openOrders->count(),
                    'total_payable' => number_format($totalPayable, 2, '.', ''),
                    'total_paid' => number_format($totalPaid, 2, '.', ''),
                    'balance_due' => number_format($balanceDue, 2, '.', ''),
                ];
            })
            ->values();

        $suppliers = ($direction === 'desc'
            ? $suppliers->sortByDesc(fn (array $row) => match ($sort) {
                'name' => $row['name'],
                'posted_order_count', 'open_order_count' => (int) $row[$sort],
                default => (float) $row[$sort],
            })
            : $suppliers->sortBy(fn (array $row) => match ($sort) {
                'name' => $row['name'],
                'posted_order_count', 'open_order_count' => (int) $row[$sort],
                default => (float) $row[$sort],
            }))
            ->values()
            ->all();

        return Inertia::render('accounts-payable/index', [
            'suppliers' => $suppliers,
            'filters' => [
                'q' => $search ?? '',
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    /**
     * Posted purchase orders for a single supplier.
     */
    public function supplier(Request $request, Supplier $supplier): Response
    {
        $filters = $request->validate([
            'settlement' => ['nullable', 'string', Rule::in(['open', 'settled'])],
        ]);

        $settlement = $filters['settlement'] ?? null;

        $orders = PurchasedOrder::query()
            ->postedToAccountsPayable()
            ->where('supplier_id', $supplier->id)
            ->with(['supplier', 'items.product', 'payments.bankCheck.bankAccount'])
            ->orderByDesc('posted_to_ap_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (PurchasedOrder $order) => $order->toArrayPayload())
            ->when($settlement === 'open', fn ($collection) => $collection->filter(
                fn (array $order) => (float) $order['balance_due'] > 0,
            ))
            ->when($settlement === 'settled', fn ($collection) => $collection->filter(
                fn (array $order) => (float) $order['balance_due'] <= 0,
            ))
            ->values()
            ->all();

        $totalPayable = collect($orders)->sum(fn (array $order) => (float) $order['grand_total']);
        $totalPaid = collect($orders)->sum(fn (array $order) => (float) $order['amount_paid']);
        $balanceDue = collect($orders)->sum(fn (array $order) => (float) $order['balance_due']);

        return Inertia::render('accounts-payable/supplier', [
            'supplier' => $supplier->toArrayPayload(),
            'orders' => $orders,
            'summary' => [
                'order_count' => count($orders),
                'total_payable' => number_format($totalPayable, 2, '.', ''),
                'total_paid' => number_format($totalPaid, 2, '.', ''),
                'balance_due' => number_format($balanceDue, 2, '.', ''),
            ],
            'filters' => [
                'settlement' => $settlement ?? '',
            ],
        ]);
    }

    /**
     * Settlement detail for a purchase order posted to Accounts Payable.
     */
    public function show(Supplier $supplier, PurchasedOrder $purchasedOrder): Response
    {
        $this->ensureOrderBelongsToSupplier($supplier, $purchasedOrder);

        if (! $purchasedOrder->isPostedToAccountsPayable()) {
            throw new NotFoundHttpException;
        }

        $purchasedOrder->load([
            'supplier' => fn ($query) => $query->withTrashed(),
            'requestQuotation.supplier',
            'requestQuotation.items.product',
            'items.product',
            'payments.bankCheck.bankAccount',
        ]);

        return Inertia::render('accounts-payable/show', [
            'supplier' => $supplier->toArrayPayload(),
            'order' => $purchasedOrder->toArrayPayload(),
            'paymentMethods' => $this->paymentMethodOptions(),
            'bankAccounts' => BankAccount::query()
                ->where('status', BankAccountStatus::Active)
                ->orderBy('name')
                ->get()
                ->map(fn (BankAccount $bankAccount) => [
                    'id' => $bankAccount->id,
                    'name' => $bankAccount->name,
                ])
                ->values()
                ->all(),
        ]);
    }

    /**
     * Record a settlement payment against a posted purchase order.
     */
    public function storePayment(
        StorePurchasedOrderPaymentRequest $request,
        Supplier $supplier,
        PurchasedOrder $purchasedOrder,
    ): RedirectResponse {
        $this->ensureOrderBelongsToSupplier($supplier, $purchasedOrder);

        if (! $purchasedOrder->isPostedToAccountsPayable()) {
            throw new NotFoundHttpException;
        }

        if (! $purchasedOrder->canAddPrepayment()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Payments can only be recorded when there is a remaining balance.',
            ]);

            return redirect()->route('accounts-payable.show', [
                $supplier,
                $purchasedOrder,
            ]);
        }

        $userName = $request->user()?->name ?? 'Unknown';
        $paymentAttributes = $request->paymentAttributes($userName);
        $bankCheckAttributes = $request->bankCheckAttributes($userName);

        DB::transaction(function () use ($purchasedOrder, $paymentAttributes, $bankCheckAttributes): void {
            if ($bankCheckAttributes !== null) {
                $bankCheck = BankCheck::query()->create($bankCheckAttributes);
                $paymentAttributes['bank_check_id'] = $bankCheck->id;
            }

            $purchasedOrder->payments()->create($paymentAttributes);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Settlement payment recorded.',
        ]);

        return redirect()->route('accounts-payable.show', [
            $supplier,
            $purchasedOrder,
        ]);
    }

    private function ensureOrderBelongsToSupplier(Supplier $supplier, PurchasedOrder $purchasedOrder): void
    {
        if ((int) $purchasedOrder->supplier_id !== (int) $supplier->id) {
            throw new NotFoundHttpException;
        }
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function paymentMethodOptions(): array
    {
        return array_map(
            fn (PurchasedOrderPaymentMethod $method) => [
                'value' => $method->value,
                'label' => $method->label(),
            ],
            PurchasedOrderPaymentMethod::cases(),
        );
    }
}

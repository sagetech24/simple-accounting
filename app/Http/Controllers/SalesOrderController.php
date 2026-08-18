<?php

namespace App\Http\Controllers;

use App\Enums\BankAccountStatus;
use App\Enums\CustomerStatus;
use App\Enums\SalesOrderPaymentMethod;
use App\Http\Requests\StoreSalesOrderPaymentRequest;
use App\Http\Requests\StoreSalesOrderRequest;
use App\Models\BankAccount;
use App\Models\BankCheck;
use App\Models\Customer;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\SalesOrderPayment;
use App\Services\BankAccountAuditor;
use App\Services\DailySalesSeries;
use App\Services\StockService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class SalesOrderController extends Controller
{
    /**
     * Sales order list (default) with create-tab picker props.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'trashed' => ['nullable', 'string', Rule::in(['only', 'with'])],
        ]);

        $trashed = $filters['trashed'] ?? null;

        $filteredQuery = SalesOrder::query()
            ->when($trashed === 'only', fn ($builder) => $builder->onlyTrashed())
            ->when($trashed === 'with', fn ($builder) => $builder->withTrashed());

        $summary = [
            'order_count' => (clone $filteredQuery)->count(),
            'grand_total_sum' => number_format(
                (float) (clone $filteredQuery)->sum('grand_total'),
                2,
                '.',
                '',
            ),
        ];

        $orders = (clone $filteredQuery)
            ->with(['customer', 'items.product', 'payments.bankCheck.bankAccount'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(8)
            ->withQueryString()
            ->through(fn (SalesOrder $order) => $order->toArrayPayload());

        return Inertia::render('sales-orders/index', [
            'orders' => $orders,
            'summary' => $summary,
            'dailySales' => (new DailySalesSeries)->build(),
            'filters' => [
                'trashed' => $trashed ?? '',
            ],
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
            'customers' => Customer::query()
                ->where('status', CustomerStatus::Active)
                ->orderBy('name')
                ->get()
                ->map(fn (Customer $customer) => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'contact_name' => $customer->contact_name,
                    'email' => $customer->email,
                ])
                ->values()
                ->all(),
            'products' => Product::query()
                ->orderBy('name')
                ->get()
                ->map(fn (Product $product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'unit' => $product->unit,
                    'selling_price' => $product->selling_price,
                    'quantity' => $product->quantity,
                    'status' => $product->status->value,
                    'status_label' => $product->status->label(),
                ])
                ->values()
                ->all(),
        ]);
    }

    /**
     * Persist a sales order and post outbound stock movements.
     */
    public function store(StoreSalesOrderRequest $request, StockService $stock): RedirectResponse
    {
        $attributes = $request->orderAttributes();
        $items = $request->itemAttributes();
        $createdBy = $request->user()?->name ?? 'Unknown';

        try {
            DB::transaction(function () use ($attributes, $items, $stock, $createdBy, $request): void {
                [$subtotal, $lineRows] = $this->buildLineRows($items);
                $totals = SalesOrder::calculateHeaderTotals(
                    $subtotal,
                    $request->validated('discount_type'),
                    $request->validated('discount_value'),
                );

                $order = SalesOrder::query()->create([
                    ...$attributes,
                    ...$totals,
                ]);

                $order->items()->createMany($lineRows);
                $order->load('items.product');

                $stock->sellFromSalesOrder($order, $createdBy);
            });
        } catch (InvalidArgumentException $exception) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $exception->getMessage(),
            ]);

            return redirect()->back();
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Sales order recorded. Stock updated.',
        ]);

        return redirect()->route('sales-orders.index');
    }

    /**
     * Record a payment against a sales order with remaining balance.
     */
    public function storePayment(
        StoreSalesOrderPaymentRequest $request,
        SalesOrder $salesOrder,
    ): RedirectResponse {
        if (! $salesOrder->canAddPayment()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Payments can only be added when there is a remaining balance.',
            ]);

            return $this->redirectAfterPayment($request, $salesOrder);
        }

        $userName = $request->user()?->name ?? 'Unknown';
        $paymentAttributes = $request->paymentAttributes($userName);
        $bankCheckAttributes = $request->bankCheckAttributes($userName);

        $createdBankCheck = null;
        $createdPayment = null;

        DB::transaction(function () use ($salesOrder, $paymentAttributes, $bankCheckAttributes, &$createdBankCheck, &$createdPayment): void {
            if ($bankCheckAttributes !== null) {
                $createdBankCheck = BankCheck::query()->create($bankCheckAttributes);
                $paymentAttributes['bank_check_id'] = $createdBankCheck->id;
            }

            $createdPayment = $salesOrder->payments()->create($paymentAttributes);
        });

        if ($createdBankCheck !== null && $createdPayment !== null) {
            $createdBankCheck->load('bankAccount');
            $auditor = app(BankAccountAuditor::class);
            $account = $createdBankCheck->bankAccount;

            if ($account !== null) {
                $auditor->record(
                    $account,
                    'check.created',
                    $createdBankCheck,
                    "Issued check #{$createdBankCheck->check_number}",
                    null,
                    $createdBankCheck->toArrayPayload(),
                    $request->user(),
                );
                $auditor->record(
                    $account,
                    'payment.recorded',
                    $createdPayment,
                    "Recorded check payment {$createdPayment->amount}",
                    null,
                    $createdPayment->toArrayPayload(),
                    $request->user(),
                );
            }
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Payment recorded.',
        ]);

        return $this->redirectAfterPayment($request, $salesOrder);
    }

    /**
     * Void a sales order: soft-delete and restore on-hand stock.
     */
    public function destroy(SalesOrder $salesOrder, StockService $stock, Request $request): RedirectResponse
    {
        if (! $salesOrder->canVoid()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Void is only available while the sales order is unpaid. Void payments first.',
            ]);

            return redirect()->route('sales-orders.index');
        }

        $createdBy = $request->user()?->name ?? 'Unknown';

        DB::transaction(function () use ($salesOrder, $stock, $createdBy): void {
            $salesOrder->load('items.product');
            $salesOrder->delete();
            $stock->restoreStockFromSalesOrder($salesOrder, $createdBy);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Sales order voided. Stock restored.',
        ]);

        return redirect()->route('sales-orders.index');
    }

    /**
     * Void a recorded payment. PDC payments also void the linked bank check.
     */
    public function destroyPayment(
        Request $request,
        SalesOrder $salesOrder,
        SalesOrderPayment $salesOrderPayment,
        BankAccountAuditor $auditor,
    ): RedirectResponse {
        abort_unless(
            (int) $salesOrderPayment->sales_order_id === (int) $salesOrder->id,
            404,
        );

        $salesOrderPayment->load('bankCheck.bankAccount');
        $bankCheck = $salesOrderPayment->bankCheck;

        DB::transaction(function () use ($salesOrderPayment, $bankCheck): void {
            $salesOrderPayment->delete();

            if ($bankCheck !== null && $bankCheck->voided_at === null) {
                $bankCheck->update(['voided_at' => now()]);
            }
        });

        if ($bankCheck !== null) {
            $account = $bankCheck->bankAccount;

            if ($account !== null) {
                $auditor->record(
                    $account,
                    'check.voided',
                    $bankCheck->fresh(),
                    "Voided check #{$bankCheck->check_number}",
                    ['voided_at' => null],
                    ['voided_at' => $bankCheck->fresh()->voided_at?->toIso8601String()],
                    $request->user(),
                );
            }
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Payment voided.',
        ]);

        return $this->redirectAfterPayment($request, $salesOrder);
    }

    /**
     * Restore a voided sales order and re-post outbound stock.
     */
    public function restore(SalesOrder $salesOrder, StockService $stock, Request $request): RedirectResponse
    {
        $createdBy = $request->user()?->name ?? 'Unknown';

        try {
            DB::transaction(function () use ($salesOrder, $stock, $createdBy): void {
                $salesOrder->restore();
                $salesOrder->load('items.product');
                $stock->sellFromSalesOrder($salesOrder, $createdBy);
            });
        } catch (InvalidArgumentException $exception) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $exception->getMessage(),
            ]);

            return redirect()->route('sales-orders.index', ['trashed' => 'only']);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Sales order restored. Stock updated.',
        ]);

        return redirect()->route('sales-orders.index');
    }

    /**
     * @param  list<array{product_id: int, selling_price: string, quantity: int}>  $items
     * @return array{0: string, 1: list<array{product_id: int, selling_price: string, quantity: int, subtotal: string}>}
     */
    private function buildLineRows(array $items): array
    {
        $subtotal = '0.00';
        $lineRows = [];

        foreach ($items as $item) {
            $lineSubtotal = SalesOrderItem::calculateSubtotal(
                $item['selling_price'],
                $item['quantity'],
            );
            $subtotal = number_format((float) $subtotal + (float) $lineSubtotal, 2, '.', '');

            $lineRows[] = [
                'product_id' => $item['product_id'],
                'selling_price' => $item['selling_price'],
                'quantity' => $item['quantity'],
                'subtotal' => $lineSubtotal,
            ];
        }

        return [$subtotal, $lineRows];
    }

    private function redirectAfterPayment(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        if ($request->input('return_to') === 'accounts-receivable'
            && $salesOrder->customer_id
        ) {
            return redirect()->route('accounts-receivable.show', [
                $salesOrder->customer_id,
                $salesOrder,
            ]);
        }

        return redirect()->route('sales-orders.index');
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function paymentMethodOptions(): array
    {
        return array_map(
            fn (SalesOrderPaymentMethod $method) => [
                'value' => $method->value,
                'label' => $method->label(),
            ],
            SalesOrderPaymentMethod::cases(),
        );
    }
}

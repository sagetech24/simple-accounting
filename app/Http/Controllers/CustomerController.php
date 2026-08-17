<?php

namespace App\Http\Controllers;

use App\Enums\CustomerStatus;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use App\Models\SalesOrder;
use App\Models\SalesOrderPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    /**
     * Customer list with optional search, trash filter, and sorting.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'trashed' => ['nullable', 'string', Rule::in(['only', 'with'])],
            'sort' => ['nullable', 'string', Rule::in(['name', 'contact_name', 'status'])],
            'direction' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
        ]);

        $query = $filters['q'] ?? null;
        $trashed = $filters['trashed'] ?? null;
        $sort = $filters['sort'] ?? 'name';
        $direction = $filters['direction'] ?? 'asc';

        $customers = Customer::query()
            ->when($trashed === 'only', fn ($builder) => $builder->onlyTrashed())
            ->when($trashed === 'with', fn ($builder) => $builder->withTrashed())
            ->search($query)
            ->orderBy($sort, $direction)
            ->orderBy('id')
            ->paginate(8)
            ->withQueryString()
            ->through(fn (Customer $customer) => $customer->toArrayPayload());

        return Inertia::render('customers/index', [
            'customers' => $customers,
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
     * Customer profile: details, KPIs, sales orders, and payments.
     */
    public function show(Request $request, Customer $customer): Response
    {
        $filters = $request->validate([
            'tab' => ['nullable', 'string', Rule::in(['orders', 'payments'])],
            'trashed' => ['nullable', 'string', Rule::in(['only', 'with'])],
        ]);

        $tab = $filters['tab'] ?? 'orders';
        $trashed = $filters['trashed'] ?? '';

        $orders = $customer->salesOrders()
            ->when($trashed === 'only', fn ($builder) => $builder->onlyTrashed())
            ->when($trashed === 'with', fn ($builder) => $builder->withTrashed())
            ->with(['customer', 'items.product', 'payments.bankCheck.bankAccount'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(8, ['*'], 'orders_page')
            ->withQueryString()
            ->through(fn (SalesOrder $order) => $order->toArrayPayload());

        $payments = SalesOrderPayment::query()
            ->whereHas('salesOrder', fn ($query) => $query->where('customer_id', $customer->id))
            ->with([
                'bankCheck.bankAccount',
                'salesOrder.customer',
                'salesOrder.items.product',
                'salesOrder.payments.bankCheck.bankAccount',
            ])
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->paginate(8, ['*'], 'payments_page')
            ->withQueryString()
            ->through(fn (SalesOrderPayment $payment) => $this->paymentProfilePayload($payment));

        return Inertia::render('customers/show', [
            'customer' => $customer->toArrayPayload(),
            'kpis' => $this->customerKpis($customer),
            'orders' => $orders,
            'payments' => $payments,
            'statuses' => $this->statusOptions(),
            'filters' => [
                'tab' => $tab,
                'trashed' => $trashed,
            ],
        ]);
    }

    /**
     * Store a new customer.
     */
    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        Customer::query()->create($request->customerAttributes());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Customer created.',
        ]);

        return redirect()->route('customers.index');
    }

    /**
     * Update an existing customer.
     */
    public function update(UpdateCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->customerAttributes());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Customer updated.',
        ]);

        return redirect()->route('customers.index');
    }

    /**
     * Soft-delete a customer.
     */
    public function destroy(Customer $customer): RedirectResponse
    {
        $customer->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Customer deleted.',
        ]);

        return redirect()->route('customers.index');
    }

    /**
     * Restore a soft-deleted customer.
     */
    public function restore(Customer $customer): RedirectResponse
    {
        $customer->restore();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Customer restored.',
        ]);

        return redirect()->route('customers.index');
    }

    /**
     * @return array{order_count: int, lifetime_sales: string, outstanding: string, last_order_at: ?string}
     */
    private function customerKpis(Customer $customer): array
    {
        $activeOrders = $customer->salesOrders();
        $lifetime = (float) (clone $activeOrders)->sum('grand_total');
        $paid = (float) SalesOrderPayment::query()
            ->whereHas(
                'salesOrder',
                fn ($query) => $query->where('customer_id', $customer->id)->whereNull('deleted_at'),
            )
            ->sum('amount');
        $lastOrderAt = (clone $activeOrders)->max('created_at');

        return [
            'order_count' => (clone $activeOrders)->count(),
            'lifetime_sales' => number_format($lifetime, 2, '.', ''),
            'outstanding' => number_format(max(0, $lifetime - $paid), 2, '.', ''),
            'last_order_at' => $lastOrderAt
                ? Carbon::parse($lastOrderAt)->toIso8601String()
                : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function paymentProfilePayload(SalesOrderPayment $payment): array
    {
        $order = $payment->salesOrder;

        return array_merge($payment->toArrayPayload(), [
            'sales_order_reference' => $order?->reference,
            'sales_order' => $order?->toArrayPayload(),
        ]);
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function statusOptions(): array
    {
        return array_map(
            fn (CustomerStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ],
            CustomerStatus::cases(),
        );
    }
}

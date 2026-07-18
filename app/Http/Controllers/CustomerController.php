<?php

namespace App\Http\Controllers;

use App\Enums\CustomerStatus;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            ->paginate(15)
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

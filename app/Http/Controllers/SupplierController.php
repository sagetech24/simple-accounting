<?php

namespace App\Http\Controllers;

use App\Enums\SupplierStatus;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    /**
     * Supplier list with optional search, trash filter, and sorting.
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

        $suppliers = Supplier::query()
            ->when($trashed === 'only', fn ($builder) => $builder->onlyTrashed())
            ->when($trashed === 'with', fn ($builder) => $builder->withTrashed())
            ->search($query)
            ->orderBy($sort, $direction)
            ->orderBy('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Supplier $supplier) => $supplier->toArrayPayload());

        return Inertia::render('suppliers/index', [
            'suppliers' => $suppliers,
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
     * Store a new supplier.
     */
    public function store(StoreSupplierRequest $request): RedirectResponse
    {
        Supplier::query()->create($request->supplierAttributes());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Supplier created.',
        ]);

        return redirect()->route('suppliers.index');
    }

    /**
     * Update an existing supplier.
     */
    public function update(UpdateSupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update($request->supplierAttributes());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Supplier updated.',
        ]);

        return redirect()->route('suppliers.index');
    }

    /**
     * Soft-delete a supplier.
     */
    public function destroy(Supplier $supplier): RedirectResponse
    {
        $supplier->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Supplier deleted.',
        ]);

        return redirect()->route('suppliers.index');
    }

    /**
     * Restore a soft-deleted supplier.
     */
    public function restore(Supplier $supplier): RedirectResponse
    {
        $supplier->restore();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Supplier restored.',
        ]);

        return redirect()->route('suppliers.index');
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function statusOptions(): array
    {
        return array_map(
            fn (SupplierStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ],
            SupplierStatus::cases(),
        );
    }
}

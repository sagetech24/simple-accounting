import { useForm } from '@inertiajs/react';

export default function ProductForm({
    categories,
    statuses,
    initialValues,
    submitLabel,
    onSubmit,
}) {
    const form = useForm({
        name: initialValues?.name ?? '',
        description: initialValues?.description ?? '',
        quantity: initialValues?.quantity ?? 0,
        purchase_price: initialValues?.purchase_price ?? '',
        selling_price: initialValues?.selling_price ?? '',
        status: initialValues?.status ?? statuses[0]?.value ?? 'available',
        category_ids: initialValues?.category_ids ?? [],
    });

    function toggleCategory(categoryId) {
        const next = form.data.category_ids.includes(categoryId)
            ? form.data.category_ids.filter((id) => id !== categoryId)
            : [...form.data.category_ids, categoryId];

        form.setData('category_ids', next);
    }

    function submit(event) {
        event.preventDefault();
        onSubmit(form);
    }

    return (
        <form onSubmit={submit} className="space-y-6">
            <div>
                <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                >
                    Name
                </label>
                <input
                    id="name"
                    type="text"
                    value={form.data.name}
                    onChange={(event) =>
                        form.setData('name', event.target.value)
                    }
                    className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {form.errors.name && (
                    <p className="mt-1.5 text-sm text-warn">
                        {form.errors.name}
                    </p>
                )}
            </div>

            <div>
                <label
                    htmlFor="description"
                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                >
                    Description
                </label>
                <textarea
                    id="description"
                    rows={4}
                    value={form.data.description ?? ''}
                    onChange={(event) =>
                        form.setData('description', event.target.value)
                    }
                    className="w-full border border-line bg-white/80 px-3 py-2.5 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {form.errors.description && (
                    <p className="mt-1.5 text-sm text-warn">
                        {form.errors.description}
                    </p>
                )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="quantity"
                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                    >
                        Quantity
                    </label>
                    <input
                        id="quantity"
                        type="number"
                        min="0"
                        step="1"
                        value={form.data.quantity}
                        onChange={(event) =>
                            form.setData(
                                'quantity',
                                event.target.value === ''
                                    ? ''
                                    : Number(event.target.value),
                            )
                        }
                        className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    {form.errors.quantity && (
                        <p className="mt-1.5 text-sm text-warn">
                            {form.errors.quantity}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="status"
                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                    >
                        Status
                    </label>
                    <select
                        id="status"
                        value={form.data.status}
                        onChange={(event) =>
                            form.setData('status', event.target.value)
                        }
                        className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    >
                        {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                    {form.errors.status && (
                        <p className="mt-1.5 text-sm text-warn">
                            {form.errors.status}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="purchase_price"
                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                    >
                        Purchase price
                    </label>
                    <input
                        id="purchase_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.data.purchase_price}
                        onChange={(event) =>
                            form.setData('purchase_price', event.target.value)
                        }
                        className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    {form.errors.purchase_price && (
                        <p className="mt-1.5 text-sm text-warn">
                            {form.errors.purchase_price}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="selling_price"
                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                    >
                        Selling price
                    </label>
                    <input
                        id="selling_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.data.selling_price}
                        onChange={(event) =>
                            form.setData('selling_price', event.target.value)
                        }
                        className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    {form.errors.selling_price && (
                        <p className="mt-1.5 text-sm text-warn">
                            {form.errors.selling_price}
                        </p>
                    )}
                </div>
            </div>

            <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink-soft">
                    Categories
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                    {categories.map((category) => (
                        <label
                            key={category.id}
                            className="flex items-center gap-2 text-sm text-ink-soft"
                        >
                            <input
                                type="checkbox"
                                checked={form.data.category_ids.includes(
                                    category.id,
                                )}
                                onChange={() => toggleCategory(category.id)}
                                className="size-4 rounded-sm border-line text-accent focus:ring-accent/30"
                            />
                            {category.name}
                        </label>
                    ))}
                </div>
                {form.errors.category_ids && (
                    <p className="mt-1.5 text-sm text-warn">
                        {form.errors.category_ids}
                    </p>
                )}
            </fieldset>

            <button
                type="submit"
                disabled={form.processing}
                className="min-h-11 bg-ink px-5 text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft disabled:opacity-60"
            >
                {form.processing ? 'Saving…' : submitLabel}
            </button>
        </form>
    );
}

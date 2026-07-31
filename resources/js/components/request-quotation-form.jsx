import { useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    store,
    update,
} from '@/actions/App/Http/Controllers/RequestQuotationController';
import SearchableSelect from '@/components/searchable-select';
import { formatDecimal, formatMoney } from '@/lib/format-money';
import { formatProductLabel } from '@/lib/format-product-label';

function lineSubtotal(buyingPrice, quantity) {
    const price = Number(buyingPrice);
    const qty = Number(quantity);

    if (Number.isNaN(price) || Number.isNaN(qty)) {
        return 0;
    }

    return price * qty;
}

export default function RequestQuotationForm({
    suppliers,
    products,
    quotation = null,
    onCancel,
    onSuccess,
}) {
    const isEditing = Boolean(quotation?.id);
    const [reference] = useState(
        () => quotation?.reference ?? crypto.randomUUID(),
    );
    const [productQuery, setProductQuery] = useState('');
    const [productPickerOpen, setProductPickerOpen] = useState(false);

    const form = useForm({
        reference,
        supplier_id: quotation?.supplier_id ?? '',
        notes: quotation?.notes ?? '',
        save_and_approve: false,
        items: (quotation?.items ?? []).map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_unit: item.product_unit ?? null,
            buying_price: formatDecimal(item.buying_price),
            quantity: item.quantity,
        })),
    });

    const availableProducts = useMemo(() => {
        const selectedIds = new Set(
            form.data.items.map((item) => item.product_id),
        );

        return products.filter((product) => !selectedIds.has(product.id));
    }, [products, form.data.items]);

    const filteredProducts = useMemo(() => {
        const term = productQuery.trim().toLowerCase();

        if (!term) {
            return availableProducts;
        }

        return availableProducts.filter((product) =>
            product.name.toLowerCase().includes(term),
        );
    }, [availableProducts, productQuery]);

    const grandTotal = useMemo(
        () =>
            form.data.items.reduce(
                (sum, item) =>
                    sum + lineSubtotal(item.buying_price, item.quantity),
                0,
            ),
        [form.data.items],
    );

    function selectSupplier(supplier) {
        form.setData('supplier_id', supplier?.id ?? '');
    }

    function addProduct(product) {
        form.setData('items', [
            ...form.data.items,
            {
                product_id: product.id,
                product_name: product.name,
                product_unit: product.unit ?? null,
                buying_price: formatDecimal(product.purchase_price),
                quantity: 1,
            },
        ]);
        setProductQuery('');
        setProductPickerOpen(false);
        form.clearErrors('items');
    }

    function updateItem(index, field, value) {
        form.setData(
            'items',
            form.data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item,
            ),
        );
    }

    function removeItem(index) {
        form.setData(
            'items',
            form.data.items.filter((_, itemIndex) => itemIndex !== index),
        );
    }

    function persist(approve) {
        form.transform((data) => ({
            ...data,
            save_and_approve: approve,
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess?.();
            },
            onFinish: () => {
                form.transform((data) => data);
            },
        };

        if (isEditing) {
            form.put(update.url(quotation.id), options);
            return;
        }

        form.post(store.url(), options);
    }

    function submit(event) {
        event.preventDefault();
        persist(false);
    }

    function saveAndApprove(event) {
        event.preventDefault();
        persist(true);
    }

    const selectedSupplier =
        suppliers.find((supplier) => supplier.id === form.data.supplier_id) ??
        null;

    const draftLabel = isEditing
        ? form.processing
            ? 'Saving…'
            : 'Save changes'
        : form.processing
          ? 'Saving…'
          : 'Save as Draft';

    const approveLabel = form.processing ? 'Saving…' : 'Save & Approve';

    return (
        <form onSubmit={submit} className="space-y-6">
            {isEditing && (
                <p className="rounded-md border border-line bg-mist/40 px-3 py-2 text-sm text-ink-soft">
                    Editing {quotation.status_label.toLowerCase()} quotation.
                    Reference stays the same.
                </p>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <div>
                    <label
                        htmlFor="reference"
                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                    >
                        Quotation reference
                    </label>
                    <input
                        id="reference"
                        type="text"
                        value={form.data.reference}
                        readOnly
                        className="min-h-11 w-full border border-line bg-mist/40 px-3 font-mono text-sm text-ink-soft outline-none"
                    />
                    <p className="mt-1.5 text-xs text-muted">
                        Auto-generated UUID for this quotation.
                    </p>
                    {form.errors.reference && (
                        <p className="mt-1.5 text-sm text-warn">
                            {form.errors.reference}
                        </p>
                    )}
                </div>

                <SearchableSelect
                    id="supplier_id"
                    label="Supplier"
                    placeholder="Search suppliers…"
                    options={suppliers}
                    value={selectedSupplier?.id ?? null}
                    onChange={selectSupplier}
                    getOptionLabel={(supplier) => supplier.name}
                    getOptionMeta={(supplier) =>
                        [supplier.contact_name, supplier.email]
                            .filter(Boolean)
                            .join(' · ')
                    }
                    emptyMessage="No active suppliers match."
                    error={form.errors.supplier_id}
                    disabled={form.processing}
                />
            </div>

            <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label
                        htmlFor="product_search"
                        className="block text-sm font-medium text-ink-soft"
                    >
                        Add products
                    </label>
                    <span className="text-xs text-muted">
                        {form.data.items.length}{' '}
                        {form.data.items.length === 1 ? 'line' : 'lines'}
                    </span>
                </div>

                <div className="relative">
                    <input
                        id="product_search"
                        type="search"
                        value={productQuery}
                        disabled={
                            form.processing || availableProducts.length === 0
                        }
                        placeholder={
                            availableProducts.length === 0
                                ? 'All products already added'
                                : 'Search products to add…'
                        }
                        onChange={(event) => {
                            setProductQuery(event.target.value);
                            setProductPickerOpen(true);
                        }}
                        onFocus={() => setProductPickerOpen(true)}
                        onBlur={() => {
                            window.setTimeout(
                                () => setProductPickerOpen(false),
                                150,
                            );
                        }}
                        className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
                    />

                    {productPickerOpen && availableProducts.length > 0 && (
                        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-line bg-white py-1">
                            {filteredProducts.length === 0 && (
                                <li className="px-3 py-2 text-sm text-muted">
                                    No products match.
                                </li>
                            )}
                            {filteredProducts.map((product) => (
                                <li key={product.id}>
                                    <button
                                        type="button"
                                        onMouseDown={(event) =>
                                            event.preventDefault()
                                        }
                                        onClick={() => addProduct(product)}
                                        className="block w-full px-3 py-2.5 text-left transition hover:bg-mist"
                                    >
                                        <span className="block text-sm font-medium text-ink">
                                            {formatProductLabel(
                                                product.name,
                                                product.unit,
                                            )}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted">
                                            Buy{' '}
                                            {formatMoney(
                                                product.purchase_price,
                                            )}{' '}
                                            · {product.status_label}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {form.errors.items && (
                    <p className="mt-1.5 text-sm text-warn">
                        {form.errors.items}
                    </p>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead className="bg-mist">
                        <tr className="border-b border-line text-xs tracking-wide uppercase">
                            <th className="px-4 py-3 font-medium text-muted">
                                Product
                            </th>
                            <th className="px-4 py-3 font-medium text-muted">
                                Purchase price
                            </th>
                            <th className="px-4 py-3 font-medium text-muted">
                                Qty
                            </th>
                            <th className="px-4 py-3 font-medium text-muted">
                                Subtotal
                            </th>
                            <th className="w-24 px-4 py-3 text-right">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {form.data.items.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-10 text-center text-muted"
                                >
                                    Search and add products to build this
                                    quotation.
                                </td>
                            </tr>
                        )}
                        {form.data.items.map((item, index) => {
                            const subtotal = lineSubtotal(
                                item.buying_price,
                                item.quantity,
                            );
                            const priceError =
                                form.errors[`items.${index}.buying_price`];
                            const qtyError =
                                form.errors[`items.${index}.quantity`];
                            const productError =
                                form.errors[`items.${index}.product_id`];

                            return (
                                <tr
                                    key={item.product_id}
                                    className="border-b border-line/80 align-top"
                                >
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-ink">
                                            {formatProductLabel(
                                                item.product_name,
                                                item.product_unit,
                                            )}
                                        </p>
                                        {productError && (
                                            <p className="mt-1 text-sm text-warn">
                                                {productError}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex min-h-11 max-w-48 items-center gap-1.5">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.buying_price}
                                                disabled={form.processing}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'buying_price',
                                                        event.target.value,
                                                    )
                                                }
                                                className="min-h-11 w-full max-w-36 border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                            />
                                            {item.product_unit?.trim() && (
                                                <span className="shrink-0 text-sm text-muted">
                                                    /{item.product_unit.trim()}
                                                </span>
                                            )}
                                        </div>
                                        {priceError && (
                                            <p className="mt-1 text-sm text-warn">
                                                {priceError}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={item.quantity}
                                            disabled={form.processing}
                                            onChange={(event) =>
                                                updateItem(
                                                    index,
                                                    'quantity',
                                                    event.target.value,
                                                )
                                            }
                                            className="min-h-11 w-full max-w-24 border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                        />
                                        {qtyError && (
                                            <p className="mt-1 text-sm text-warn">
                                                {qtyError}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-ink">
                                        {formatMoney(subtotal)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            disabled={form.processing}
                                            onClick={() => removeItem(index)}
                                            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-warn transition hover:border-warn/40 disabled:opacity-60"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="sm:max-w-md sm:flex-1">
                    <label
                        htmlFor="notes"
                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                    >
                        Notes
                    </label>
                    <textarea
                        id="notes"
                        rows={3}
                        value={form.data.notes ?? ''}
                        disabled={form.processing}
                        onChange={(event) =>
                            form.setData('notes', event.target.value)
                        }
                        className="w-full border border-line bg-white px-3 py-2.5 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    {form.errors.notes && (
                        <p className="mt-1.5 text-sm text-warn">
                            {form.errors.notes}
                        </p>
                    )}
                </div>

                <div className="rounded-md border border-line bg-mist/40 px-4 py-3 text-right sm:min-w-56">
                    <p className="text-xs tracking-wide text-muted uppercase">
                        Grand total
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-ink">
                        {formatMoney(grandTotal)}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="submit"
                    disabled={form.processing}
                    className="min-h-11 rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition hover:bg-teal-800 disabled:opacity-60"
                >
                    {draftLabel}
                </button>
                <button
                    type="button"
                    onClick={saveAndApprove}
                    disabled={form.processing}
                    className="min-h-11 rounded-md border border-teal-700 bg-white px-5 text-sm font-medium tracking-wide text-teal-800 transition hover:bg-teal-50 disabled:opacity-60"
                >
                    {approveLabel}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={form.processing}
                        className="min-h-11 rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink disabled:opacity-60"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

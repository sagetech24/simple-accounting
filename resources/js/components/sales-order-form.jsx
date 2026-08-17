import { useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { store } from '@/actions/App/Http/Controllers/SalesOrderController';
import SearchableSelect from '@/components/searchable-select';
import { currencyPrefix, formatDecimal, formatMoney } from '@/lib/format-money';
import { formatProductLabel } from '@/lib/format-product-label';

function lineSubtotal(sellingPrice, quantity) {
    const price = Number(sellingPrice);
    const qty = Number(quantity);

    if (Number.isNaN(price) || Number.isNaN(qty)) {
        return 0;
    }

    return price * qty;
}

function headerDiscountAmount(subtotal, type, value) {
    const amount = Number(value);

    if (Number.isNaN(amount) || amount <= 0) {
        return 0;
    }

    if (type === 'percent') {
        return Math.round(subtotal * amount) / 100;
    }

    return Math.round(amount * 100) / 100;
}

export default function SalesOrderForm({
    customers,
    products,
    onCancel,
    onSuccess,
}) {
    const [reference] = useState(() => crypto.randomUUID());
    const [productQuery, setProductQuery] = useState('');
    const [productPickerOpen, setProductPickerOpen] = useState(false);

    const form = useForm({
        reference,
        customer_id: '',
        customer_name: '',
        discount_type: 'amount',
        discount_value: '',
        notes: '',
        items: [],
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

    const subtotal = useMemo(
        () =>
            form.data.items.reduce(
                (sum, item) =>
                    sum + lineSubtotal(item.selling_price, item.quantity),
                0,
            ),
        [form.data.items],
    );

    const discountAmount = useMemo(
        () =>
            headerDiscountAmount(
                subtotal,
                form.data.discount_type,
                form.data.discount_value,
            ),
        [subtotal, form.data.discount_type, form.data.discount_value],
    );

    const grandTotal = Math.max(0, subtotal - discountAmount);

    function selectCustomer(customer) {
        form.setData({
            ...form.data,
            customer_id: customer?.id ?? '',
            customer_name: '',
        });
    }

    function setCustomCustomerName(name) {
        form.setData({
            ...form.data,
            customer_id: '',
            customer_name: name,
        });
    }

    function addProduct(product) {
        form.setData('items', [
            ...form.data.items,
            {
                product_id: product.id,
                product_name: product.name,
                product_unit: product.unit ?? null,
                selling_price: formatDecimal(product.selling_price),
                quantity: 1,
                on_hand: product.quantity,
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

    function submit(event) {
        event.preventDefault();

        form.post(store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess?.();
            },
        });
    }

    const selectedCustomer =
        customers.find((customer) => customer.id === form.data.customer_id) ??
        null;

    return (
        <form onSubmit={submit} className="space-y-6">
            <p className="rounded-md border border-line bg-mist/40 px-3 py-2 text-sm text-ink-soft">
                Saving records the sale and deducts stock immediately. To fix a
                mistake, void the sale from the list (stock is restored).
            </p>

            <div className="grid gap-6 lg:grid-cols-2">
                <div>
                    <label
                        htmlFor="reference"
                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                    >
                        Order reference
                    </label>
                    <input
                        id="reference"
                        type="text"
                        value={form.data.reference}
                        readOnly
                        className="min-h-11 w-full border border-line bg-mist/40 px-3 font-mono text-sm text-ink-soft outline-none"
                    />
                    <p className="mt-1.5 text-xs text-muted">
                        Auto-generated UUID for this sales order.
                    </p>
                    {form.errors.reference && (
                        <p className="mt-1.5 text-sm text-warn">
                            {form.errors.reference}
                        </p>
                    )}
                </div>

                <SearchableSelect
                    id="customer_id"
                    label="Customer"
                    placeholder="Search or type a name… leave blank for Walk-in"
                    options={customers}
                    value={selectedCustomer?.id ?? null}
                    onChange={selectCustomer}
                    allowCustomValue
                    customValue={form.data.customer_name}
                    onCustomValueChange={setCustomCustomerName}
                    getOptionLabel={(customer) => customer.name}
                    getOptionMeta={(customer) =>
                        [customer.contact_name, customer.email]
                            .filter(Boolean)
                            .join(' · ')
                    }
                    emptyMessage="No matching customers. This name will be used on the order."
                    error={form.errors.customer_id || form.errors.customer_name}
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
                                            Sell{' '}
                                            {formatMoney(product.selling_price)}{' '}
                                            · {product.quantity} on hand ·{' '}
                                            {product.status_label}
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
                                Selling price
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
                                    Search and add products to build this sales
                                    order.
                                </td>
                            </tr>
                        )}
                        {form.data.items.map((item, index) => {
                            const subtotal = lineSubtotal(
                                item.selling_price,
                                item.quantity,
                            );
                            const priceError =
                                form.errors[`items.${index}.selling_price`];
                            const qtyError =
                                form.errors[`items.${index}.quantity`];
                            const productError =
                                form.errors[`items.${index}.product_id`];

                            return (
                                <tr
                                    key={item.product_id}
                                    className="border-b border-line align-top"
                                >
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-ink">
                                            {formatProductLabel(
                                                item.product_name,
                                                item.product_unit,
                                            )}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted">
                                            {item.on_hand ?? '—'} on hand
                                        </p>
                                        {productError && (
                                            <p className="mt-1 text-sm text-warn">
                                                {productError}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.selling_price}
                                            disabled={form.processing}
                                            onChange={(event) =>
                                                updateItem(
                                                    index,
                                                    'selling_price',
                                                    event.target.value,
                                                )
                                            }
                                            className="min-h-11 w-28 border border-line bg-white px-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
                                        />
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
                                            className="min-h-11 w-24 border border-line bg-white px-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
                                        />
                                        {qtyError && (
                                            <p className="mt-1 text-sm text-warn">
                                                {qtyError}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-ink tabular-nums">
                                        {formatMoney(subtotal)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            disabled={form.processing}
                                            onClick={() => removeItem(index)}
                                            className="min-h-11 cursor-pointer px-3 text-sm text-warn transition hover:underline disabled:opacity-60"
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

            <div>
                <label
                    htmlFor="notes"
                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                >
                    Notes
                </label>
                <textarea
                    id="notes"
                    rows={3}
                    value={form.data.notes}
                    disabled={form.processing}
                    onChange={(event) =>
                        form.setData('notes', event.target.value)
                    }
                    className="w-full border border-line bg-white px-3 py-2 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
                />
                {form.errors.notes && (
                    <p className="mt-1.5 text-sm text-warn">
                        {form.errors.notes}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-4 border-t border-line pt-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="w-full max-w-sm space-y-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-ink-soft">Subtotal</span>
                        <span className="text-ink tabular-nums">
                            {formatMoney(subtotal)}
                        </span>
                    </div>

                    <div>
                        <label
                            htmlFor="discount_value"
                            className="mb-1.5 block text-sm font-medium text-ink-soft"
                        >
                            Discount
                        </label>
                        <div className="flex items-stretch gap-2">
                            <div className="inline-flex overflow-hidden rounded-md border border-line">
                                <button
                                    type="button"
                                    disabled={form.processing}
                                    onClick={() =>
                                        form.setData('discount_type', 'amount')
                                    }
                                    className={`min-h-11 min-w-11 cursor-pointer px-3 text-sm font-medium transition ${
                                        form.data.discount_type === 'amount'
                                            ? 'bg-teal-700 text-paper'
                                            : 'bg-white text-ink-soft hover:bg-mist'
                                    } disabled:opacity-60`}
                                >
                                    {currencyPrefix()}
                                </button>
                                <button
                                    type="button"
                                    disabled={form.processing}
                                    onClick={() =>
                                        form.setData('discount_type', 'percent')
                                    }
                                    className={`min-h-11 min-w-11 cursor-pointer border-l border-line px-3 text-sm font-medium transition ${
                                        form.data.discount_type === 'percent'
                                            ? 'bg-teal-700 text-paper'
                                            : 'bg-white text-ink-soft hover:bg-mist'
                                    } disabled:opacity-60`}
                                >
                                    %
                                </button>
                            </div>
                            <input
                                id="discount_value"
                                type="number"
                                min="0"
                                step="0.01"
                                max={
                                    form.data.discount_type === 'percent'
                                        ? '100'
                                        : undefined
                                }
                                value={form.data.discount_value}
                                disabled={form.processing}
                                placeholder="0"
                                onChange={(event) =>
                                    form.setData(
                                        'discount_value',
                                        event.target.value,
                                    )
                                }
                                className="min-h-11 min-w-0 flex-1 border border-line bg-white px-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
                            />
                        </div>
                        {form.errors.discount_type && (
                            <p className="mt-1.5 text-sm text-warn">
                                {form.errors.discount_type}
                            </p>
                        )}
                        {form.errors.discount_value && (
                            <p className="mt-1.5 text-sm text-warn">
                                {form.errors.discount_value}
                            </p>
                        )}
                    </div>

                    {discountAmount > 0 ? (
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-ink-soft">Less discount</span>
                            <span className="text-ink tabular-nums">
                                −{formatMoney(discountAmount)}
                            </span>
                        </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-ink-soft">
                            Grand total
                        </span>
                        <span className="text-lg font-semibold text-ink tabular-nums">
                            {formatMoney(grandTotal)}
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {onCancel ? (
                        <button
                            type="button"
                            disabled={form.processing}
                            onClick={onCancel}
                            className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-line bg-white px-5 text-sm font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink disabled:opacity-60"
                        >
                            Cancel
                        </button>
                    ) : null}
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex min-h-11 cursor-pointer items-center rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition hover:bg-teal-800 disabled:opacity-60"
                    >
                        {form.processing ? 'Saving…' : 'Record sale'}
                    </button>
                </div>
            </div>
        </form>
    );
}

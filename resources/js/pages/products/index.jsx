import AppLayout from '@/layouts/app-layout';

export default function ProductsIndex({ products }) {
    return (
        <AppLayout title="Products">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
                Products
            </h2>
            <p className="mt-1 text-sm text-muted">
                {products.total}{' '}
                {products.total === 1 ? 'product' : 'products'}
            </p>

            {products.data.length === 0 ? (
                <p className="mt-8 text-sm text-muted">No products found.</p>
            ) : (
                <ul className="mt-6 divide-y divide-line/70 border-y border-line/70">
                    {products.data.map((product) => (
                        <li key={product.id} className="py-3">
                            <p className="truncate font-medium text-ink">
                                {product.name}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </AppLayout>
    );
}

import { Head, Link } from '@inertiajs/react';
import { update } from '@/actions/App/Http/Controllers/Admin/ProductController';
import ProductForm from '@/components/product-form';
import SiteHeader from '@/components/site-header';
import { formatProductLabel } from '@/lib/format-product-label';
import { index } from '@/routes/admin/products';

export default function EditProduct({ product, categories, statuses }) {
    return (
        <>
            <Head title={`Edit · ${formatProductLabel(product.name, product.unit)}`} />
            <div className="relative min-h-screen bg-paper text-ink">
                <SiteHeader />

                <main className="relative z-10 mx-auto w-full max-w-2xl px-5 pb-16 sm:px-8">
                    <div className="opacity-0 motion-safe:animate-[fade-up_0.7s_ease_forwards]">
                        <p className="mb-3 text-xs font-medium tracking-[0.22em] text-accent uppercase">
                            Admin
                        </p>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <h1 className="font-sans text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                                Edit product
                            </h1>
                            <Link
                                href={index.url()}
                                className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink"
                            >
                                Back to list
                            </Link>
                        </div>
                        <p className="mt-2 text-sm text-muted">
                            {formatProductLabel(product.name, product.unit)}
                        </p>
                    </div>

                    <div
                        className="mt-10 opacity-0 motion-safe:animate-[fade-up_0.8s_ease_forwards]"
                        style={{ animationDelay: '100ms' }}
                    >
                        <ProductForm
                            categories={categories}
                            statuses={statuses}
                            initialValues={product}
                            submitLabel="Save changes"
                            onSubmit={(form) =>
                                form.put(update.url(product.id))
                            }
                        />
                    </div>
                </main>
            </div>

            <style>{`
                @keyframes fade-up {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
}

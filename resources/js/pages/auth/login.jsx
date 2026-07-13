import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { store } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import SiteHeader from '@/components/site-header';
import { home } from '@/routes';

export default function Login() {
    const { name } = usePage().props;
    const brand = name || 'PriceWatch';
    const form = useForm({
        email: 'admin@example.com',
        password: 'password',
        remember: true,
    });

    function submit(event) {
        event.preventDefault();
        form.post(store.url());
    }

    return (
        <>
            <Head title="Admin login" />
            <div className="relative min-h-screen overflow-hidden bg-paper text-ink">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(20,122,110,0.16),_transparent_50%),linear-gradient(165deg,#f4f8f6_0%,#e7f0eb_100%)]"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(16,36,31,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,36,31,0.05)_1px,transparent_1px)] [background-size:48px_48px] opacity-[0.3]"
                />

                <SiteHeader />

                <main className="relative z-10 mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-lg flex-col justify-center px-5 pb-16 sm:px-8">
                    <div className="opacity-0 motion-safe:animate-[fade-up_0.7s_ease_forwards]">
                        <p className="mb-3 text-xs font-medium tracking-[0.22em] text-accent uppercase">
                            Admin access
                        </p>
                        <h1 className="font-sans text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                            {brand}
                        </h1>
                        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                            Sign in to manage products, categories, and purchase
                            prices.
                        </p>
                    </div>

                    <form
                        onSubmit={submit}
                        className="mt-10 space-y-5 opacity-0 motion-safe:animate-[fade-up_0.8s_ease_forwards]"
                        style={{ animationDelay: '120ms' }}
                    >
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="username"
                                value={form.data.email}
                                onChange={(event) =>
                                    form.setData('email', event.target.value)
                                }
                                className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            />
                            {form.errors.email && (
                                <p className="mt-1.5 text-sm text-warn">
                                    {form.errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-1.5 block text-sm font-medium text-ink-soft"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                value={form.data.password}
                                onChange={(event) =>
                                    form.setData('password', event.target.value)
                                }
                                className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            />
                            {form.errors.password && (
                                <p className="mt-1.5 text-sm text-warn">
                                    {form.errors.password}
                                </p>
                            )}
                        </div>

                        <label className="flex items-center gap-2 text-sm text-muted">
                            <input
                                type="checkbox"
                                checked={form.data.remember}
                                onChange={(event) =>
                                    form.setData(
                                        'remember',
                                        event.target.checked,
                                    )
                                }
                                className="size-4 rounded-sm border-line text-accent focus:ring-accent/30"
                            />
                            Remember me
                        </label>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="min-h-11 w-full bg-ink text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft disabled:opacity-60"
                        >
                            {form.processing ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <p
                        className="mt-8 text-sm text-muted opacity-0 motion-safe:animate-[fade-up_0.8s_ease_forwards]"
                        style={{ animationDelay: '220ms' }}
                    >
                        <Link
                            href={home.url()}
                            className="underline decoration-line underline-offset-4 hover:text-ink"
                        >
                            Back to catalog
                        </Link>
                    </p>
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

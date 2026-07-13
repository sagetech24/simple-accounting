import { Link, router, usePage } from '@inertiajs/react';
import { destroy } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import { home, login } from '@/routes';

export default function SiteHeader() {
    const { auth, name } = usePage().props;
    const brand = name || 'PriceWatch';

    return (
        <header className="relative z-20 flex items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
            <Link
                href={home.url()}
                className="font-sans text-lg font-semibold tracking-tight text-ink transition-opacity duration-300 hover:opacity-80"
            >
                {brand}
            </Link>

            <nav className="flex items-center gap-3 text-sm">
                {auth?.user ? (
                    <>
                        <span className="hidden text-muted sm:inline">
                            {auth.user.name}
                        </span>
                        <button
                            type="button"
                            onClick={() => router.post(destroy.url())}
                            className="rounded-sm border border-line bg-white/70 px-3 py-1.5 text-ink-soft transition hover:border-ink/30 hover:bg-white"
                        >
                            Log out
                        </button>
                    </>
                ) : (
                    <Link
                        href={login.url()}
                        className="rounded-sm border border-line bg-white/70 px-3 py-1.5 text-ink-soft transition hover:border-ink/30 hover:bg-white"
                    >
                        Admin login
                    </Link>
                )}
            </nav>
        </header>
    );
}

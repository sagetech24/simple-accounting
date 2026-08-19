import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import { destroy } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import SystemPreferenceModal from '@/components/system-preference-modal';
import { dashboard, home, login } from '@/routes';

function UserMenu({ userName, onSystemPreference }) {
    const [open, setOpen] = useState(false);
    const menuId = useId();
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function handlePointerDown(event) {
            if (!rootRef.current?.contains(event.target)) {
                setOpen(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    const menuItems = [
        {
            label: 'System Preference',
            onSelect: () => {
                setOpen(false);
                onSystemPreference();
            },
        },
        {
            label: 'View Profile',
            onSelect: () => setOpen(false),
        },
        {
            label: 'Change Password',
            onSelect: () => setOpen(false),
        },
    ];

    return (
        <div
            ref={rootRef}
            className="relative flex items-center gap-1.5"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <span className="hidden text-muted sm:inline">{userName}</span>
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-teal-700 transition hover:bg-mist hover:text-ink"
                aria-label="Account settings"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4"
                    aria-hidden="true"
                >
                    <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.07 7.07 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.77 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.68.22l2.39-.96c.5.39 1.04.71 1.63.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.25.12.54.02.68-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z" />
                </svg>
            </button>

            {open && (
                <div
                    id={menuId}
                    role="menu"
                    className="absolute top-full right-0 z-30 min-w-44 rounded-md border border-line bg-white py-1"
                >
                    {menuItems.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            role="menuitem"
                            onClick={item.onSelect}
                            className="block w-full px-3 py-2.5 text-left text-sm text-ink-soft transition hover:bg-mist hover:text-ink"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SiteHeader() {
    const { auth, settings, currencyOptions } = usePage().props;
    const [systemPreferenceOpen, setSystemPreferenceOpen] = useState(false);
    const brand = settings?.brand_name || 'JMC Pundasyon';

    return (
        <>
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
                            <Link
                                href={dashboard.url()}
                                className="rounded-md border border-line bg-white px-3 py-1.5 text-ink-soft transition hover:border-ink/30 hover:bg-mist"
                            >
                                Dashboard
                            </Link>
                            <UserMenu
                                userName={auth.user.name}
                                onSystemPreference={() =>
                                    setSystemPreferenceOpen(true)
                                }
                            />

                            <button
                                type="button"
                                onClick={() => router.post(destroy.url())}
                                className="rounded-md border border-line bg-white px-3 py-1.5 text-ink-soft transition hover:border-ink/30 hover:bg-mist"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <Link
                            href={login.url()}
                            className="rounded-md border border-line bg-white px-3 py-1.5 text-ink-soft transition hover:border-ink/30 hover:bg-mist"
                        >
                            Admin login
                        </Link>
                    )}
                </nav>
            </header>

            <SystemPreferenceModal
                open={systemPreferenceOpen}
                settings={settings}
                currencyOptions={currencyOptions}
                onClose={() => setSystemPreferenceOpen(false)}
            />
        </>
    );
}

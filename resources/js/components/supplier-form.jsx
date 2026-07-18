import { useForm } from '@inertiajs/react';

export default function SupplierForm({
    statuses,
    initialValues,
    submitLabel,
    onSubmit,
}) {
    const form = useForm({
        name: initialValues?.name ?? '',
        contact_name: initialValues?.contact_name ?? '',
        email: initialValues?.email ?? '',
        phone: initialValues?.phone ?? '',
        address: initialValues?.address ?? '',
        notes: initialValues?.notes ?? '',
        status: initialValues?.status ?? statuses[0]?.value ?? 'active',
    });

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
                    Company name
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

            <div className="grid gap-6 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="contact_name"
                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                    >
                        Contact name
                    </label>
                    <input
                        id="contact_name"
                        type="text"
                        value={form.data.contact_name ?? ''}
                        onChange={(event) =>
                            form.setData('contact_name', event.target.value)
                        }
                        className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    {form.errors.contact_name && (
                        <p className="mt-1.5 text-sm text-warn">
                            {form.errors.contact_name}
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

            <div className="grid gap-6 sm:grid-cols-2">
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
                        value={form.data.email ?? ''}
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
                        htmlFor="phone"
                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                    >
                        Phone
                    </label>
                    <input
                        id="phone"
                        type="text"
                        value={form.data.phone ?? ''}
                        onChange={(event) =>
                            form.setData('phone', event.target.value)
                        }
                        className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    {form.errors.phone && (
                        <p className="mt-1.5 text-sm text-warn">
                            {form.errors.phone}
                        </p>
                    )}
                </div>
            </div>

            <div>
                <label
                    htmlFor="address"
                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                >
                    Address
                </label>
                <textarea
                    id="address"
                    rows={3}
                    value={form.data.address ?? ''}
                    onChange={(event) =>
                        form.setData('address', event.target.value)
                    }
                    className="w-full border border-line bg-white/80 px-3 py-2.5 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {form.errors.address && (
                    <p className="mt-1.5 text-sm text-warn">
                        {form.errors.address}
                    </p>
                )}
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
                    value={form.data.notes ?? ''}
                    onChange={(event) =>
                        form.setData('notes', event.target.value)
                    }
                    className="w-full border border-line bg-white/80 px-3 py-2.5 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {form.errors.notes && (
                    <p className="mt-1.5 text-sm text-warn">
                        {form.errors.notes}
                    </p>
                )}
            </div>

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

import { useForm } from '@inertiajs/react';

export default function BankAccountForm({
    statuses,
    initialValues,
    submitLabel,
    onSubmit,
    onCancel,
}) {
    const form = useForm({
        name: initialValues?.name ?? '',
        account_name: initialValues?.account_name ?? '',
        account_number: initialValues?.account_number ?? '',
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
                    Bank name
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
                        htmlFor="account_name"
                        className="mb-1.5 block text-sm font-medium text-ink-soft"
                    >
                        Account name
                    </label>
                    <input
                        id="account_name"
                        type="text"
                        value={form.data.account_name ?? ''}
                        onChange={(event) =>
                            form.setData('account_name', event.target.value)
                        }
                        className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    {form.errors.account_name && (
                        <p className="mt-1.5 text-sm text-warn">
                            {form.errors.account_name}
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

            <div>
                <label
                    htmlFor="account_number"
                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                >
                    Account number
                </label>
                <input
                    id="account_number"
                    type="text"
                    value={form.data.account_number ?? ''}
                    onChange={(event) =>
                        form.setData('account_number', event.target.value)
                    }
                    className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {form.errors.account_number && (
                    <p className="mt-1.5 text-sm text-warn">
                        {form.errors.account_number}
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

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="submit"
                    disabled={form.processing}
                    className="min-h-11 rounded-md bg-teal-700 px-5 text-sm font-medium tracking-wide text-paper transition hover:bg-teal-800 disabled:opacity-60"
                >
                    {form.processing ? 'Saving…' : submitLabel}
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

import { useForm } from '@inertiajs/react';

export default function SystemPreferenceForm({
    settings,
    currencyOptions,
    submitLabel,
    onSubmit,
    onCancel,
}) {
    const form = useForm({
        brand_name: settings?.brand_name ?? '',
        tagline: settings?.tagline ?? '',
        default_currency: settings?.default_currency ?? 'PHP',
    });

    function submit(event) {
        event.preventDefault();
        onSubmit(form);
    }

    return (
        <form onSubmit={submit} className="space-y-6">
            <div>
                <label
                    htmlFor="brand_name"
                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                >
                    Brand name
                </label>
                <input
                    id="brand_name"
                    type="text"
                    value={form.data.brand_name}
                    onChange={(event) =>
                        form.setData('brand_name', event.target.value)
                    }
                    placeholder="JMC Pundasyon"
                    className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {form.errors.brand_name && (
                    <p className="mt-1.5 text-sm text-warn">
                        {form.errors.brand_name}
                    </p>
                )}
            </div>

            <div>
                <label
                    htmlFor="tagline"
                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                >
                    Tagline
                </label>
                <textarea
                    id="tagline"
                    rows={3}
                    value={form.data.tagline ?? ''}
                    onChange={(event) =>
                        form.setData('tagline', event.target.value)
                    }
                    placeholder="A short description shown on the login screen."
                    className="min-h-24 w-full resize-y border border-line bg-white/80 px-3 py-2 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {form.errors.tagline && (
                    <p className="mt-1.5 text-sm text-warn">
                        {form.errors.tagline}
                    </p>
                )}
            </div>

            <div>
                <label
                    htmlFor="default_currency"
                    className="mb-1.5 block text-sm font-medium text-ink-soft"
                >
                    Default currency
                </label>
                <select
                    id="default_currency"
                    value={form.data.default_currency}
                    onChange={(event) =>
                        form.setData('default_currency', event.target.value)
                    }
                    className="min-h-11 w-full border border-line bg-white/80 px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                    {currencyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {form.errors.default_currency && (
                    <p className="mt-1.5 text-sm text-warn">
                        {form.errors.default_currency}
                    </p>
                )}
                <p className="mt-1.5 text-xs text-muted">
                    Monetary values across the app will use this currency.
                </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="min-h-11 rounded-sm border border-line bg-white px-4 text-sm font-medium text-ink-soft transition hover:border-ink/30 hover:bg-mist"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={form.processing}
                    className="min-h-11 rounded-sm bg-teal-700 px-4 text-sm font-medium text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {form.processing ? 'Saving…' : submitLabel}
                </button>
            </div>
        </form>
    );
}

import { useEffect, useId, useMemo, useRef, useState } from 'react';

function useOutsideClose(open, onClose) {
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function handlePointerDown(event) {
            if (!rootRef.current?.contains(event.target)) {
                onClose();
            }
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onClose]);

    return rootRef;
}

export default function SearchableSelect({
    id,
    label,
    placeholder = 'Search…',
    options,
    value,
    onChange,
    getOptionLabel,
    getOptionMeta,
    emptyMessage = 'No matches found.',
    error,
    disabled = false,
    allowCustomValue = false,
    customValue = '',
    onCustomValueChange,
}) {
    const listboxId = useId();
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const rootRef = useOutsideClose(open, () => setOpen(false));

    const selected = useMemo(
        () => options.find((option) => option.id === value) ?? null,
        [options, value],
    );

    const inputValue = allowCustomValue && !selected ? customValue : query;

    const filtered = useMemo(() => {
        const term = inputValue.trim().toLowerCase();

        if (!term) {
            return options;
        }

        return options.filter((option) => {
            const labelText = getOptionLabel(option).toLowerCase();
            const meta = getOptionMeta?.(option)?.toLowerCase() ?? '';

            return labelText.includes(term) || meta.includes(term);
        });
    }, [options, inputValue, getOptionLabel, getOptionMeta]);

    function selectOption(option) {
        onChange(option);
        setQuery('');
        setOpen(false);
    }

    function clearSelection() {
        onChange(null);
        setQuery('');
        setOpen(false);
    }

    function handleInputChange(event) {
        const nextValue = event.target.value;

        if (allowCustomValue) {
            onCustomValueChange?.(nextValue);
        } else {
            setQuery(nextValue);
        }

        setOpen(true);
    }

    return (
        <div ref={rootRef} className="relative">
            <label
                htmlFor={id}
                className="mb-1.5 block text-sm font-medium text-ink-soft"
            >
                {label}
            </label>

            {selected ? (
                <div className="flex min-h-11 items-stretch gap-2">
                    <div className="flex min-w-0 flex-1 items-center border border-line bg-white px-3">
                        <div className="min-w-0">
                            <p className="truncate font-medium text-ink">
                                {getOptionLabel(selected)}
                            </p>
                            {getOptionMeta?.(selected) && (
                                <p className="truncate text-xs text-muted">
                                    {getOptionMeta(selected)}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={clearSelection}
                        disabled={disabled}
                        className="min-h-11 shrink-0 rounded-md border border-line bg-white px-4 text-sm text-ink-soft transition hover:border-ink/30 hover:text-ink disabled:opacity-60"
                    >
                        Change
                    </button>
                </div>
            ) : (
                <>
                    <input
                        id={id}
                        type="search"
                        value={inputValue}
                        disabled={disabled}
                        placeholder={placeholder}
                        onChange={handleInputChange}
                        onFocus={() => setOpen(true)}
                        role="combobox"
                        aria-expanded={open}
                        aria-controls={listboxId}
                        aria-autocomplete="list"
                        className="min-h-11 w-full border border-line bg-white px-3 text-ink transition outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
                    />

                    {open && (
                        <ul
                            id={listboxId}
                            role="listbox"
                            className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-line bg-white py-1"
                        >
                            {filtered.length === 0 && (
                                <li className="px-3 py-2 text-sm text-muted">
                                    {emptyMessage}
                                </li>
                            )}
                            {filtered.map((option) => (
                                <li key={option.id} role="option">
                                    <button
                                        type="button"
                                        onClick={() => selectOption(option)}
                                        className="block w-full px-3 py-2.5 text-left transition hover:bg-mist"
                                    >
                                        <span className="block text-sm font-medium text-ink">
                                            {getOptionLabel(option)}
                                        </span>
                                        {getOptionMeta?.(option) && (
                                            <span className="mt-0.5 block text-xs text-muted">
                                                {getOptionMeta(option)}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

            {error && <p className="mt-1.5 text-sm text-warn">{error}</p>}
        </div>
    );
}

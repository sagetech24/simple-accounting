/**
 * Format a product name with optional unit for display.
 *
 * @param {string|null|undefined} name
 * @param {string|null|undefined} unit
 * @returns {string}
 */
export function formatProductLabel(name, unit) {
    const label = name?.trim() || '—';
    const unitLabel = unit?.trim();

    if (!unitLabel) {
        return label;
    }

    return `${label} (${unitLabel})`;
}

/**
 * Format a quantity with optional unit.
 *
 * @param {number|string|null|undefined} quantity
 * @param {string|null|undefined} unit
 * @returns {string}
 */
export function formatQuantityWithUnit(quantity, unit) {
    const qty =
        quantity === null || quantity === undefined || quantity === ''
            ? '—'
            : String(quantity);
    const unitLabel = unit?.trim();

    if (!unitLabel || qty === '—') {
        return qty;
    }

    return `${qty} ${unitLabel}`;
}

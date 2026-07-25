/**
 * Format a numeric amount as USD currency: $1,234.56
 */
export function formatMoney(value) {
    const amount = Number(value);

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isNaN(amount) ? 0 : amount);
}

/**
 * Format a plain decimal for number inputs (no currency symbol or grouping).
 */
export function formatDecimal(value) {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return '0.00';
    }

    return amount.toFixed(2);
}

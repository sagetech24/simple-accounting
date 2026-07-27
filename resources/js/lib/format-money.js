let currency = 'PHP';
let locale = 'en-PH';

/**
 * Sync the global money formatter with application settings.
 *
 * @param {{ default_currency?: string, currency_locale?: string }} settings
 */
export function configureMoneyFormat(settings = {}) {
    if (settings.default_currency) {
        currency = settings.default_currency;
    }

    if (settings.currency_locale) {
        locale = settings.currency_locale;
    }
}

/**
 * Format a numeric amount using the configured application currency.
 */
export function formatMoney(value) {
    const amount = Number(value);

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
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

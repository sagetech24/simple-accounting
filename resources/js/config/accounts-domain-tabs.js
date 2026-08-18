import { index as accounts } from '@/routes/accounts';

/**
 * Navigation tabs for the Accounts domain section.
 * Add future domains here with a unique `key`, `label`, and `href`.
 */
export const accountsDomainTabs = [
    {
        key: 'accounts-payable',
        label: 'Accounts Payable',
        href: () => accounts.url({ query: { tab: 'accounts-payable' } }),
    },
    {
        key: 'accounts-receivable',
        label: 'Accounts Receivable',
        href: () => accounts.url({ query: { tab: 'accounts-receivable' } }),
    },
    {
        key: 'bank-accounts',
        label: 'Bank Accounts',
        href: () => accounts.url({ query: { tab: 'bank-accounts' } }),
    },
];

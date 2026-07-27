import { index as accountsPayable } from '@/routes/accounts-payable';
import { index as bankAccounts } from '@/routes/bank-accounts';

/**
 * Navigation tabs for the Accounts domain section.
 * Add future domains here with a unique `key`, `label`, and `href`.
 */
export const accountsDomainTabs = [
    {
        key: 'accounts-payable',
        label: 'Accounts Payable',
        href: () => accountsPayable.url(),
    },
    {
        key: 'bank-accounts',
        label: 'Bank Accounts',
        href: () => bankAccounts.url(),
    },
];

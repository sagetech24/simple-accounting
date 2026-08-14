import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\BankCheckController::store
* @see app/Http/Controllers/BankCheckController.php:16
* @route '/bank-accounts/{bank_account}/checks'
*/
export const store = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/bank-accounts/{bank_account}/checks',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\BankCheckController::store
* @see app/Http/Controllers/BankCheckController.php:16
* @route '/bank-accounts/{bank_account}/checks'
*/
store.url = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { bank_account: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { bank_account: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            bank_account: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        bank_account: typeof args.bank_account === 'object'
        ? args.bank_account.id
        : args.bank_account,
    }

    return store.definition.url
            .replace('{bank_account}', parsedArgs.bank_account.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\BankCheckController::store
* @see app/Http/Controllers/BankCheckController.php:16
* @route '/bank-accounts/{bank_account}/checks'
*/
store.post = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BankCheckController::store
* @see app/Http/Controllers/BankCheckController.php:16
* @route '/bank-accounts/{bank_account}/checks'
*/
const storeForm = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BankCheckController::store
* @see app/Http/Controllers/BankCheckController.php:16
* @route '/bank-accounts/{bank_account}/checks'
*/
storeForm.post = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\BankCheckController::update
* @see app/Http/Controllers/BankCheckController.php:41
* @route '/bank-accounts/{bank_account}/checks/{bank_check}'
*/
export const update = (args: { bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } ], options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/bank-accounts/{bank_account}/checks/{bank_check}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\BankCheckController::update
* @see app/Http/Controllers/BankCheckController.php:41
* @route '/bank-accounts/{bank_account}/checks/{bank_check}'
*/
update.url = (args: { bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            bank_account: args[0],
            bank_check: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        bank_account: typeof args.bank_account === 'object'
        ? args.bank_account.id
        : args.bank_account,
        bank_check: typeof args.bank_check === 'object'
        ? args.bank_check.id
        : args.bank_check,
    }

    return update.definition.url
            .replace('{bank_account}', parsedArgs.bank_account.toString())
            .replace('{bank_check}', parsedArgs.bank_check.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\BankCheckController::update
* @see app/Http/Controllers/BankCheckController.php:41
* @route '/bank-accounts/{bank_account}/checks/{bank_check}'
*/
update.patch = (args: { bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } ], options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\BankCheckController::update
* @see app/Http/Controllers/BankCheckController.php:41
* @route '/bank-accounts/{bank_account}/checks/{bank_check}'
*/
const updateForm = (args: { bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BankCheckController::update
* @see app/Http/Controllers/BankCheckController.php:41
* @route '/bank-accounts/{bank_account}/checks/{bank_check}'
*/
updateForm.patch = (args: { bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\BankCheckController::voidCheck
* @see app/Http/Controllers/BankCheckController.php:90
* @route '/bank-accounts/{bank_account}/checks/{bank_check}/void'
*/
export const voidCheck = (args: { bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: voidCheck.url(args, options),
    method: 'post',
})

voidCheck.definition = {
    methods: ["post"],
    url: '/bank-accounts/{bank_account}/checks/{bank_check}/void',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\BankCheckController::voidCheck
* @see app/Http/Controllers/BankCheckController.php:90
* @route '/bank-accounts/{bank_account}/checks/{bank_check}/void'
*/
voidCheck.url = (args: { bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            bank_account: args[0],
            bank_check: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        bank_account: typeof args.bank_account === 'object'
        ? args.bank_account.id
        : args.bank_account,
        bank_check: typeof args.bank_check === 'object'
        ? args.bank_check.id
        : args.bank_check,
    }

    return voidCheck.definition.url
            .replace('{bank_account}', parsedArgs.bank_account.toString())
            .replace('{bank_check}', parsedArgs.bank_check.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\BankCheckController::voidCheck
* @see app/Http/Controllers/BankCheckController.php:90
* @route '/bank-accounts/{bank_account}/checks/{bank_check}/void'
*/
voidCheck.post = (args: { bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: voidCheck.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BankCheckController::voidCheck
* @see app/Http/Controllers/BankCheckController.php:90
* @route '/bank-accounts/{bank_account}/checks/{bank_check}/void'
*/
const voidCheckForm = (args: { bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: voidCheck.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BankCheckController::voidCheck
* @see app/Http/Controllers/BankCheckController.php:90
* @route '/bank-accounts/{bank_account}/checks/{bank_check}/void'
*/
voidCheckForm.post = (args: { bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number }, bank_check: string | number | { id: string | number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: voidCheck.url(args, options),
    method: 'post',
})

voidCheck.form = voidCheckForm

const BankCheckController = { store, update, voidCheck }

export default BankCheckController
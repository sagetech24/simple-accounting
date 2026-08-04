import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
import checks from './checks'
/**
* @see \App\Http\Controllers\BankAccountController::restore
* @see app/Http/Controllers/BankAccountController.php:299
* @route '/bank-accounts/{bank_account}/restore'
*/
export const restore = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

restore.definition = {
    methods: ["post"],
    url: '/bank-accounts/{bank_account}/restore',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\BankAccountController::restore
* @see app/Http/Controllers/BankAccountController.php:299
* @route '/bank-accounts/{bank_account}/restore'
*/
restore.url = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
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

    return restore.definition.url
            .replace('{bank_account}', parsedArgs.bank_account.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\BankAccountController::restore
* @see app/Http/Controllers/BankAccountController.php:299
* @route '/bank-accounts/{bank_account}/restore'
*/
restore.post = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BankAccountController::restore
* @see app/Http/Controllers/BankAccountController.php:299
* @route '/bank-accounts/{bank_account}/restore'
*/
const restoreForm = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: restore.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BankAccountController::restore
* @see app/Http/Controllers/BankAccountController.php:299
* @route '/bank-accounts/{bank_account}/restore'
*/
restoreForm.post = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: restore.url(args, options),
    method: 'post',
})

restore.form = restoreForm

/**
* @see \App\Http\Controllers\BankAccountController::show
* @see app/Http/Controllers/BankAccountController.php:64
* @route '/bank-accounts/{bank_account}'
*/
export const show = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/bank-accounts/{bank_account}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BankAccountController::show
* @see app/Http/Controllers/BankAccountController.php:64
* @route '/bank-accounts/{bank_account}'
*/
show.url = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{bank_account}', parsedArgs.bank_account.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\BankAccountController::show
* @see app/Http/Controllers/BankAccountController.php:64
* @route '/bank-accounts/{bank_account}'
*/
show.get = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BankAccountController::show
* @see app/Http/Controllers/BankAccountController.php:64
* @route '/bank-accounts/{bank_account}'
*/
show.head = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BankAccountController::show
* @see app/Http/Controllers/BankAccountController.php:64
* @route '/bank-accounts/{bank_account}'
*/
const showForm = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BankAccountController::show
* @see app/Http/Controllers/BankAccountController.php:64
* @route '/bank-accounts/{bank_account}'
*/
showForm.get = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BankAccountController::show
* @see app/Http/Controllers/BankAccountController.php:64
* @route '/bank-accounts/{bank_account}'
*/
showForm.head = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\BankAccountController::index
* @see app/Http/Controllers/BankAccountController.php:25
* @route '/bank-accounts'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/bank-accounts',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BankAccountController::index
* @see app/Http/Controllers/BankAccountController.php:25
* @route '/bank-accounts'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BankAccountController::index
* @see app/Http/Controllers/BankAccountController.php:25
* @route '/bank-accounts'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BankAccountController::index
* @see app/Http/Controllers/BankAccountController.php:25
* @route '/bank-accounts'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BankAccountController::index
* @see app/Http/Controllers/BankAccountController.php:25
* @route '/bank-accounts'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BankAccountController::index
* @see app/Http/Controllers/BankAccountController.php:25
* @route '/bank-accounts'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BankAccountController::index
* @see app/Http/Controllers/BankAccountController.php:25
* @route '/bank-accounts'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\BankAccountController::store
* @see app/Http/Controllers/BankAccountController.php:212
* @route '/bank-accounts'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/bank-accounts',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\BankAccountController::store
* @see app/Http/Controllers/BankAccountController.php:212
* @route '/bank-accounts'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BankAccountController::store
* @see app/Http/Controllers/BankAccountController.php:212
* @route '/bank-accounts'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BankAccountController::store
* @see app/Http/Controllers/BankAccountController.php:212
* @route '/bank-accounts'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BankAccountController::store
* @see app/Http/Controllers/BankAccountController.php:212
* @route '/bank-accounts'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\BankAccountController::update
* @see app/Http/Controllers/BankAccountController.php:227
* @route '/bank-accounts/{bank_account}'
*/
export const update = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/bank-accounts/{bank_account}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\BankAccountController::update
* @see app/Http/Controllers/BankAccountController.php:227
* @route '/bank-accounts/{bank_account}'
*/
update.url = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{bank_account}', parsedArgs.bank_account.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\BankAccountController::update
* @see app/Http/Controllers/BankAccountController.php:227
* @route '/bank-accounts/{bank_account}'
*/
update.put = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\BankAccountController::update
* @see app/Http/Controllers/BankAccountController.php:227
* @route '/bank-accounts/{bank_account}'
*/
update.patch = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\BankAccountController::update
* @see app/Http/Controllers/BankAccountController.php:227
* @route '/bank-accounts/{bank_account}'
*/
const updateForm = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BankAccountController::update
* @see app/Http/Controllers/BankAccountController.php:227
* @route '/bank-accounts/{bank_account}'
*/
updateForm.put = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BankAccountController::update
* @see app/Http/Controllers/BankAccountController.php:227
* @route '/bank-accounts/{bank_account}'
*/
updateForm.patch = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\BankAccountController::destroy
* @see app/Http/Controllers/BankAccountController.php:284
* @route '/bank-accounts/{bank_account}'
*/
export const destroy = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/bank-accounts/{bank_account}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\BankAccountController::destroy
* @see app/Http/Controllers/BankAccountController.php:284
* @route '/bank-accounts/{bank_account}'
*/
destroy.url = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{bank_account}', parsedArgs.bank_account.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\BankAccountController::destroy
* @see app/Http/Controllers/BankAccountController.php:284
* @route '/bank-accounts/{bank_account}'
*/
destroy.delete = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\BankAccountController::destroy
* @see app/Http/Controllers/BankAccountController.php:284
* @route '/bank-accounts/{bank_account}'
*/
const destroyForm = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BankAccountController::destroy
* @see app/Http/Controllers/BankAccountController.php:284
* @route '/bank-accounts/{bank_account}'
*/
destroyForm.delete = (args: { bank_account: string | number | { id: string | number } } | [bank_account: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const bankAccounts = {
    restore: Object.assign(restore, restore),
    show: Object.assign(show, show),
    checks: Object.assign(checks, checks),
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
}

export default bankAccounts
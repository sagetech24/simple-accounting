import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PurchasedOrderController::markOrdered
* @see app/Http/Controllers/PurchasedOrderController.php:220
* @route '/purchased-orders/{purchased_order}/mark-ordered'
*/
export const markOrdered = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markOrdered.url(args, options),
    method: 'post',
})

markOrdered.definition = {
    methods: ["post"],
    url: '/purchased-orders/{purchased_order}/mark-ordered',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PurchasedOrderController::markOrdered
* @see app/Http/Controllers/PurchasedOrderController.php:220
* @route '/purchased-orders/{purchased_order}/mark-ordered'
*/
markOrdered.url = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { purchased_order: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { purchased_order: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            purchased_order: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        purchased_order: typeof args.purchased_order === 'object'
        ? args.purchased_order.id
        : args.purchased_order,
    }

    return markOrdered.definition.url
            .replace('{purchased_order}', parsedArgs.purchased_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PurchasedOrderController::markOrdered
* @see app/Http/Controllers/PurchasedOrderController.php:220
* @route '/purchased-orders/{purchased_order}/mark-ordered'
*/
markOrdered.post = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markOrdered.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::markOrdered
* @see app/Http/Controllers/PurchasedOrderController.php:220
* @route '/purchased-orders/{purchased_order}/mark-ordered'
*/
const markOrderedForm = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: markOrdered.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::markOrdered
* @see app/Http/Controllers/PurchasedOrderController.php:220
* @route '/purchased-orders/{purchased_order}/mark-ordered'
*/
markOrderedForm.post = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: markOrdered.url(args, options),
    method: 'post',
})

markOrdered.form = markOrderedForm

/**
* @see \App\Http\Controllers\PurchasedOrderController::markReceivedWithAdjustment
* @see app/Http/Controllers/PurchasedOrderController.php:246
* @route '/purchased-orders/{purchased_order}/mark-received-with-adjustment'
*/
export const markReceivedWithAdjustment = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markReceivedWithAdjustment.url(args, options),
    method: 'post',
})

markReceivedWithAdjustment.definition = {
    methods: ["post"],
    url: '/purchased-orders/{purchased_order}/mark-received-with-adjustment',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PurchasedOrderController::markReceivedWithAdjustment
* @see app/Http/Controllers/PurchasedOrderController.php:246
* @route '/purchased-orders/{purchased_order}/mark-received-with-adjustment'
*/
markReceivedWithAdjustment.url = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { purchased_order: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { purchased_order: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            purchased_order: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        purchased_order: typeof args.purchased_order === 'object'
        ? args.purchased_order.id
        : args.purchased_order,
    }

    return markReceivedWithAdjustment.definition.url
            .replace('{purchased_order}', parsedArgs.purchased_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PurchasedOrderController::markReceivedWithAdjustment
* @see app/Http/Controllers/PurchasedOrderController.php:246
* @route '/purchased-orders/{purchased_order}/mark-received-with-adjustment'
*/
markReceivedWithAdjustment.post = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markReceivedWithAdjustment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::markReceivedWithAdjustment
* @see app/Http/Controllers/PurchasedOrderController.php:246
* @route '/purchased-orders/{purchased_order}/mark-received-with-adjustment'
*/
const markReceivedWithAdjustmentForm = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: markReceivedWithAdjustment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::markReceivedWithAdjustment
* @see app/Http/Controllers/PurchasedOrderController.php:246
* @route '/purchased-orders/{purchased_order}/mark-received-with-adjustment'
*/
markReceivedWithAdjustmentForm.post = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: markReceivedWithAdjustment.url(args, options),
    method: 'post',
})

markReceivedWithAdjustment.form = markReceivedWithAdjustmentForm

/**
* @see \App\Http\Controllers\PurchasedOrderController::storePayment
* @see app/Http/Controllers/PurchasedOrderController.php:291
* @route '/purchased-orders/{purchased_order}/payments'
*/
export const storePayment = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storePayment.url(args, options),
    method: 'post',
})

storePayment.definition = {
    methods: ["post"],
    url: '/purchased-orders/{purchased_order}/payments',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PurchasedOrderController::storePayment
* @see app/Http/Controllers/PurchasedOrderController.php:291
* @route '/purchased-orders/{purchased_order}/payments'
*/
storePayment.url = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { purchased_order: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { purchased_order: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            purchased_order: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        purchased_order: typeof args.purchased_order === 'object'
        ? args.purchased_order.id
        : args.purchased_order,
    }

    return storePayment.definition.url
            .replace('{purchased_order}', parsedArgs.purchased_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PurchasedOrderController::storePayment
* @see app/Http/Controllers/PurchasedOrderController.php:291
* @route '/purchased-orders/{purchased_order}/payments'
*/
storePayment.post = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storePayment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::storePayment
* @see app/Http/Controllers/PurchasedOrderController.php:291
* @route '/purchased-orders/{purchased_order}/payments'
*/
const storePaymentForm = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storePayment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::storePayment
* @see app/Http/Controllers/PurchasedOrderController.php:291
* @route '/purchased-orders/{purchased_order}/payments'
*/
storePaymentForm.post = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storePayment.url(args, options),
    method: 'post',
})

storePayment.form = storePaymentForm

/**
* @see \App\Http\Controllers\PurchasedOrderController::postToAccountsPayable
* @see app/Http/Controllers/PurchasedOrderController.php:365
* @route '/purchased-orders/{purchased_order}/post-to-accounts-payable'
*/
export const postToAccountsPayable = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: postToAccountsPayable.url(args, options),
    method: 'post',
})

postToAccountsPayable.definition = {
    methods: ["post"],
    url: '/purchased-orders/{purchased_order}/post-to-accounts-payable',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PurchasedOrderController::postToAccountsPayable
* @see app/Http/Controllers/PurchasedOrderController.php:365
* @route '/purchased-orders/{purchased_order}/post-to-accounts-payable'
*/
postToAccountsPayable.url = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { purchased_order: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { purchased_order: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            purchased_order: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        purchased_order: typeof args.purchased_order === 'object'
        ? args.purchased_order.id
        : args.purchased_order,
    }

    return postToAccountsPayable.definition.url
            .replace('{purchased_order}', parsedArgs.purchased_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PurchasedOrderController::postToAccountsPayable
* @see app/Http/Controllers/PurchasedOrderController.php:365
* @route '/purchased-orders/{purchased_order}/post-to-accounts-payable'
*/
postToAccountsPayable.post = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: postToAccountsPayable.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::postToAccountsPayable
* @see app/Http/Controllers/PurchasedOrderController.php:365
* @route '/purchased-orders/{purchased_order}/post-to-accounts-payable'
*/
const postToAccountsPayableForm = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: postToAccountsPayable.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::postToAccountsPayable
* @see app/Http/Controllers/PurchasedOrderController.php:365
* @route '/purchased-orders/{purchased_order}/post-to-accounts-payable'
*/
postToAccountsPayableForm.post = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: postToAccountsPayable.url(args, options),
    method: 'post',
})

postToAccountsPayable.form = postToAccountsPayableForm

/**
* @see \App\Http\Controllers\PurchasedOrderController::restore
* @see app/Http/Controllers/PurchasedOrderController.php:205
* @route '/purchased-orders/{purchased_order}/restore'
*/
export const restore = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

restore.definition = {
    methods: ["post"],
    url: '/purchased-orders/{purchased_order}/restore',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PurchasedOrderController::restore
* @see app/Http/Controllers/PurchasedOrderController.php:205
* @route '/purchased-orders/{purchased_order}/restore'
*/
restore.url = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { purchased_order: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { purchased_order: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            purchased_order: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        purchased_order: typeof args.purchased_order === 'object'
        ? args.purchased_order.id
        : args.purchased_order,
    }

    return restore.definition.url
            .replace('{purchased_order}', parsedArgs.purchased_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PurchasedOrderController::restore
* @see app/Http/Controllers/PurchasedOrderController.php:205
* @route '/purchased-orders/{purchased_order}/restore'
*/
restore.post = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::restore
* @see app/Http/Controllers/PurchasedOrderController.php:205
* @route '/purchased-orders/{purchased_order}/restore'
*/
const restoreForm = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: restore.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::restore
* @see app/Http/Controllers/PurchasedOrderController.php:205
* @route '/purchased-orders/{purchased_order}/restore'
*/
restoreForm.post = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: restore.url(args, options),
    method: 'post',
})

restore.form = restoreForm

/**
* @see \App\Http\Controllers\PurchasedOrderController::index
* @see app/Http/Controllers/PurchasedOrderController.php:33
* @route '/purchased-orders'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/purchased-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PurchasedOrderController::index
* @see app/Http/Controllers/PurchasedOrderController.php:33
* @route '/purchased-orders'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PurchasedOrderController::index
* @see app/Http/Controllers/PurchasedOrderController.php:33
* @route '/purchased-orders'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::index
* @see app/Http/Controllers/PurchasedOrderController.php:33
* @route '/purchased-orders'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::index
* @see app/Http/Controllers/PurchasedOrderController.php:33
* @route '/purchased-orders'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::index
* @see app/Http/Controllers/PurchasedOrderController.php:33
* @route '/purchased-orders'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::index
* @see app/Http/Controllers/PurchasedOrderController.php:33
* @route '/purchased-orders'
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
* @see \App\Http\Controllers\PurchasedOrderController::store
* @see app/Http/Controllers/PurchasedOrderController.php:123
* @route '/purchased-orders'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/purchased-orders',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PurchasedOrderController::store
* @see app/Http/Controllers/PurchasedOrderController.php:123
* @route '/purchased-orders'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PurchasedOrderController::store
* @see app/Http/Controllers/PurchasedOrderController.php:123
* @route '/purchased-orders'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::store
* @see app/Http/Controllers/PurchasedOrderController.php:123
* @route '/purchased-orders'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::store
* @see app/Http/Controllers/PurchasedOrderController.php:123
* @route '/purchased-orders'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\PurchasedOrderController::update
* @see app/Http/Controllers/PurchasedOrderController.php:151
* @route '/purchased-orders/{purchased_order}'
*/
export const update = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/purchased-orders/{purchased_order}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\PurchasedOrderController::update
* @see app/Http/Controllers/PurchasedOrderController.php:151
* @route '/purchased-orders/{purchased_order}'
*/
update.url = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { purchased_order: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { purchased_order: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            purchased_order: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        purchased_order: typeof args.purchased_order === 'object'
        ? args.purchased_order.id
        : args.purchased_order,
    }

    return update.definition.url
            .replace('{purchased_order}', parsedArgs.purchased_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PurchasedOrderController::update
* @see app/Http/Controllers/PurchasedOrderController.php:151
* @route '/purchased-orders/{purchased_order}'
*/
update.put = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::update
* @see app/Http/Controllers/PurchasedOrderController.php:151
* @route '/purchased-orders/{purchased_order}'
*/
update.patch = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::update
* @see app/Http/Controllers/PurchasedOrderController.php:151
* @route '/purchased-orders/{purchased_order}'
*/
const updateForm = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::update
* @see app/Http/Controllers/PurchasedOrderController.php:151
* @route '/purchased-orders/{purchased_order}'
*/
updateForm.put = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::update
* @see app/Http/Controllers/PurchasedOrderController.php:151
* @route '/purchased-orders/{purchased_order}'
*/
updateForm.patch = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\PurchasedOrderController::destroy
* @see app/Http/Controllers/PurchasedOrderController.php:190
* @route '/purchased-orders/{purchased_order}'
*/
export const destroy = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/purchased-orders/{purchased_order}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\PurchasedOrderController::destroy
* @see app/Http/Controllers/PurchasedOrderController.php:190
* @route '/purchased-orders/{purchased_order}'
*/
destroy.url = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { purchased_order: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { purchased_order: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            purchased_order: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        purchased_order: typeof args.purchased_order === 'object'
        ? args.purchased_order.id
        : args.purchased_order,
    }

    return destroy.definition.url
            .replace('{purchased_order}', parsedArgs.purchased_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PurchasedOrderController::destroy
* @see app/Http/Controllers/PurchasedOrderController.php:190
* @route '/purchased-orders/{purchased_order}'
*/
destroy.delete = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::destroy
* @see app/Http/Controllers/PurchasedOrderController.php:190
* @route '/purchased-orders/{purchased_order}'
*/
const destroyForm = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::destroy
* @see app/Http/Controllers/PurchasedOrderController.php:190
* @route '/purchased-orders/{purchased_order}'
*/
destroyForm.delete = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const PurchasedOrderController = { markOrdered, markReceivedWithAdjustment, storePayment, postToAccountsPayable, restore, index, store, update, destroy }

export default PurchasedOrderController
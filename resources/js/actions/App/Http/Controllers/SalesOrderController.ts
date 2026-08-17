import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SalesOrderController::restore
* @see app/Http/Controllers/SalesOrderController.php:304
* @route '/sales-orders/{sales_order}/restore'
*/
export const restore = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

restore.definition = {
    methods: ["post"],
    url: '/sales-orders/{sales_order}/restore',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SalesOrderController::restore
* @see app/Http/Controllers/SalesOrderController.php:304
* @route '/sales-orders/{sales_order}/restore'
*/
restore.url = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { sales_order: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { sales_order: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            sales_order: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        sales_order: typeof args.sales_order === 'object'
        ? args.sales_order.id
        : args.sales_order,
    }

    return restore.definition.url
            .replace('{sales_order}', parsedArgs.sales_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesOrderController::restore
* @see app/Http/Controllers/SalesOrderController.php:304
* @route '/sales-orders/{sales_order}/restore'
*/
restore.post = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SalesOrderController::restore
* @see app/Http/Controllers/SalesOrderController.php:304
* @route '/sales-orders/{sales_order}/restore'
*/
const restoreForm = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: restore.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SalesOrderController::restore
* @see app/Http/Controllers/SalesOrderController.php:304
* @route '/sales-orders/{sales_order}/restore'
*/
restoreForm.post = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: restore.url(args, options),
    method: 'post',
})

restore.form = restoreForm

/**
* @see \App\Http\Controllers\SalesOrderController::storePayment
* @see app/Http/Controllers/SalesOrderController.php:158
* @route '/sales-orders/{sales_order}/payments'
*/
export const storePayment = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storePayment.url(args, options),
    method: 'post',
})

storePayment.definition = {
    methods: ["post"],
    url: '/sales-orders/{sales_order}/payments',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SalesOrderController::storePayment
* @see app/Http/Controllers/SalesOrderController.php:158
* @route '/sales-orders/{sales_order}/payments'
*/
storePayment.url = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { sales_order: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { sales_order: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            sales_order: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        sales_order: typeof args.sales_order === 'object'
        ? args.sales_order.id
        : args.sales_order,
    }

    return storePayment.definition.url
            .replace('{sales_order}', parsedArgs.sales_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesOrderController::storePayment
* @see app/Http/Controllers/SalesOrderController.php:158
* @route '/sales-orders/{sales_order}/payments'
*/
storePayment.post = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storePayment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SalesOrderController::storePayment
* @see app/Http/Controllers/SalesOrderController.php:158
* @route '/sales-orders/{sales_order}/payments'
*/
const storePaymentForm = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storePayment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SalesOrderController::storePayment
* @see app/Http/Controllers/SalesOrderController.php:158
* @route '/sales-orders/{sales_order}/payments'
*/
storePaymentForm.post = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storePayment.url(args, options),
    method: 'post',
})

storePayment.form = storePaymentForm

/**
* @see \App\Http\Controllers\SalesOrderController::destroyPayment
* @see app/Http/Controllers/SalesOrderController.php:255
* @route '/sales-orders/{sales_order}/payments/{sales_order_payment}'
*/
export const destroyPayment = (args: { sales_order: number | { id: number }, sales_order_payment: number | { id: number } } | [sales_order: number | { id: number }, sales_order_payment: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyPayment.url(args, options),
    method: 'delete',
})

destroyPayment.definition = {
    methods: ["delete"],
    url: '/sales-orders/{sales_order}/payments/{sales_order_payment}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SalesOrderController::destroyPayment
* @see app/Http/Controllers/SalesOrderController.php:255
* @route '/sales-orders/{sales_order}/payments/{sales_order_payment}'
*/
destroyPayment.url = (args: { sales_order: number | { id: number }, sales_order_payment: number | { id: number } } | [sales_order: number | { id: number }, sales_order_payment: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            sales_order: args[0],
            sales_order_payment: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        sales_order: typeof args.sales_order === 'object'
        ? args.sales_order.id
        : args.sales_order,
        sales_order_payment: typeof args.sales_order_payment === 'object'
        ? args.sales_order_payment.id
        : args.sales_order_payment,
    }

    return destroyPayment.definition.url
            .replace('{sales_order}', parsedArgs.sales_order.toString())
            .replace('{sales_order_payment}', parsedArgs.sales_order_payment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesOrderController::destroyPayment
* @see app/Http/Controllers/SalesOrderController.php:255
* @route '/sales-orders/{sales_order}/payments/{sales_order_payment}'
*/
destroyPayment.delete = (args: { sales_order: number | { id: number }, sales_order_payment: number | { id: number } } | [sales_order: number | { id: number }, sales_order_payment: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyPayment.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\SalesOrderController::destroyPayment
* @see app/Http/Controllers/SalesOrderController.php:255
* @route '/sales-orders/{sales_order}/payments/{sales_order_payment}'
*/
const destroyPaymentForm = (args: { sales_order: number | { id: number }, sales_order_payment: number | { id: number } } | [sales_order: number | { id: number }, sales_order_payment: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyPayment.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SalesOrderController::destroyPayment
* @see app/Http/Controllers/SalesOrderController.php:255
* @route '/sales-orders/{sales_order}/payments/{sales_order_payment}'
*/
destroyPaymentForm.delete = (args: { sales_order: number | { id: number }, sales_order_payment: number | { id: number } } | [sales_order: number | { id: number }, sales_order_payment: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyPayment.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroyPayment.form = destroyPaymentForm

/**
* @see \App\Http\Controllers\SalesOrderController::index
* @see app/Http/Controllers/SalesOrderController.php:33
* @route '/sales-orders'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/sales-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SalesOrderController::index
* @see app/Http/Controllers/SalesOrderController.php:33
* @route '/sales-orders'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesOrderController::index
* @see app/Http/Controllers/SalesOrderController.php:33
* @route '/sales-orders'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SalesOrderController::index
* @see app/Http/Controllers/SalesOrderController.php:33
* @route '/sales-orders'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SalesOrderController::index
* @see app/Http/Controllers/SalesOrderController.php:33
* @route '/sales-orders'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SalesOrderController::index
* @see app/Http/Controllers/SalesOrderController.php:33
* @route '/sales-orders'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SalesOrderController::index
* @see app/Http/Controllers/SalesOrderController.php:33
* @route '/sales-orders'
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
* @see \App\Http\Controllers\SalesOrderController::store
* @see app/Http/Controllers/SalesOrderController.php:113
* @route '/sales-orders'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/sales-orders',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SalesOrderController::store
* @see app/Http/Controllers/SalesOrderController.php:113
* @route '/sales-orders'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesOrderController::store
* @see app/Http/Controllers/SalesOrderController.php:113
* @route '/sales-orders'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SalesOrderController::store
* @see app/Http/Controllers/SalesOrderController.php:113
* @route '/sales-orders'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SalesOrderController::store
* @see app/Http/Controllers/SalesOrderController.php:113
* @route '/sales-orders'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\SalesOrderController::destroy
* @see app/Http/Controllers/SalesOrderController.php:225
* @route '/sales-orders/{sales_order}'
*/
export const destroy = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/sales-orders/{sales_order}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SalesOrderController::destroy
* @see app/Http/Controllers/SalesOrderController.php:225
* @route '/sales-orders/{sales_order}'
*/
destroy.url = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { sales_order: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { sales_order: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            sales_order: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        sales_order: typeof args.sales_order === 'object'
        ? args.sales_order.id
        : args.sales_order,
    }

    return destroy.definition.url
            .replace('{sales_order}', parsedArgs.sales_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesOrderController::destroy
* @see app/Http/Controllers/SalesOrderController.php:225
* @route '/sales-orders/{sales_order}'
*/
destroy.delete = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\SalesOrderController::destroy
* @see app/Http/Controllers/SalesOrderController.php:225
* @route '/sales-orders/{sales_order}'
*/
const destroyForm = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SalesOrderController::destroy
* @see app/Http/Controllers/SalesOrderController.php:225
* @route '/sales-orders/{sales_order}'
*/
destroyForm.delete = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const SalesOrderController = { restore, storePayment, destroyPayment, index, store, destroy }

export default SalesOrderController
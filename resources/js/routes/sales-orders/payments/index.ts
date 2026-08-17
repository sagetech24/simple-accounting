import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SalesOrderController::store
* @see app/Http/Controllers/SalesOrderController.php:153
* @route '/sales-orders/{sales_order}/payments'
*/
export const store = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/sales-orders/{sales_order}/payments',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SalesOrderController::store
* @see app/Http/Controllers/SalesOrderController.php:153
* @route '/sales-orders/{sales_order}/payments'
*/
store.url = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return store.definition.url
            .replace('{sales_order}', parsedArgs.sales_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesOrderController::store
* @see app/Http/Controllers/SalesOrderController.php:153
* @route '/sales-orders/{sales_order}/payments'
*/
store.post = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SalesOrderController::store
* @see app/Http/Controllers/SalesOrderController.php:153
* @route '/sales-orders/{sales_order}/payments'
*/
const storeForm = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SalesOrderController::store
* @see app/Http/Controllers/SalesOrderController.php:153
* @route '/sales-orders/{sales_order}/payments'
*/
storeForm.post = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\SalesOrderController::destroy
* @see app/Http/Controllers/SalesOrderController.php:250
* @route '/sales-orders/{sales_order}/payments/{sales_order_payment}'
*/
export const destroy = (args: { sales_order: number | { id: number }, sales_order_payment: number | { id: number } } | [sales_order: number | { id: number }, sales_order_payment: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/sales-orders/{sales_order}/payments/{sales_order_payment}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SalesOrderController::destroy
* @see app/Http/Controllers/SalesOrderController.php:250
* @route '/sales-orders/{sales_order}/payments/{sales_order_payment}'
*/
destroy.url = (args: { sales_order: number | { id: number }, sales_order_payment: number | { id: number } } | [sales_order: number | { id: number }, sales_order_payment: number | { id: number } ], options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{sales_order}', parsedArgs.sales_order.toString())
            .replace('{sales_order_payment}', parsedArgs.sales_order_payment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesOrderController::destroy
* @see app/Http/Controllers/SalesOrderController.php:250
* @route '/sales-orders/{sales_order}/payments/{sales_order_payment}'
*/
destroy.delete = (args: { sales_order: number | { id: number }, sales_order_payment: number | { id: number } } | [sales_order: number | { id: number }, sales_order_payment: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\SalesOrderController::destroy
* @see app/Http/Controllers/SalesOrderController.php:250
* @route '/sales-orders/{sales_order}/payments/{sales_order_payment}'
*/
const destroyForm = (args: { sales_order: number | { id: number }, sales_order_payment: number | { id: number } } | [sales_order: number | { id: number }, sales_order_payment: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see app/Http/Controllers/SalesOrderController.php:250
* @route '/sales-orders/{sales_order}/payments/{sales_order_payment}'
*/
destroyForm.delete = (args: { sales_order: number | { id: number }, sales_order_payment: number | { id: number } } | [sales_order: number | { id: number }, sales_order_payment: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const payments = {
    store: Object.assign(store, store),
    destroy: Object.assign(destroy, destroy),
}

export default payments
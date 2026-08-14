import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
import payments from './payments'
/**
* @see \App\Http\Controllers\SalesOrderController::restore
* @see app/Http/Controllers/SalesOrderController.php:299
* @route '/sales-orders/{sales_order}/restore'
*/
export const restore = (args: { sales_order: string | number | { id: string | number } } | [sales_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

restore.definition = {
    methods: ["post"],
    url: '/sales-orders/{sales_order}/restore',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SalesOrderController::restore
* @see app/Http/Controllers/SalesOrderController.php:299
* @route '/sales-orders/{sales_order}/restore'
*/
restore.url = (args: { sales_order: string | number | { id: string | number } } | [sales_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/SalesOrderController.php:299
* @route '/sales-orders/{sales_order}/restore'
*/
restore.post = (args: { sales_order: string | number | { id: string | number } } | [sales_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

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
* @see \App\Http\Controllers\SalesOrderController::destroy
* @see app/Http/Controllers/SalesOrderController.php:220
* @route '/sales-orders/{sales_order}'
*/
export const destroy = (args: { sales_order: string | number | { id: string | number } } | [sales_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/sales-orders/{sales_order}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SalesOrderController::destroy
* @see app/Http/Controllers/SalesOrderController.php:220
* @route '/sales-orders/{sales_order}'
*/
destroy.url = (args: { sales_order: string | number | { id: string | number } } | [sales_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/SalesOrderController.php:220
* @route '/sales-orders/{sales_order}'
*/
destroy.delete = (args: { sales_order: string | number | { id: string | number } } | [sales_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

const salesOrders = {
    restore: Object.assign(restore, restore),
    payments: Object.assign(payments, payments),
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    destroy: Object.assign(destroy, destroy),
}

export default salesOrders
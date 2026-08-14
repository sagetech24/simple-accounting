import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SalesOrderController::store
* @see app/Http/Controllers/SalesOrderController.php:152
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
* @see app/Http/Controllers/SalesOrderController.php:152
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
* @see app/Http/Controllers/SalesOrderController.php:152
* @route '/sales-orders/{sales_order}/payments'
*/
store.post = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SalesOrderController::store
* @see app/Http/Controllers/SalesOrderController.php:152
* @route '/sales-orders/{sales_order}/payments'
*/
const storeForm = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SalesOrderController::store
* @see app/Http/Controllers/SalesOrderController.php:152
* @route '/sales-orders/{sales_order}/payments'
*/
storeForm.post = (args: { sales_order: number | { id: number } } | [sales_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

store.form = storeForm

const payments = {
    store: Object.assign(store, store),
}

export default payments
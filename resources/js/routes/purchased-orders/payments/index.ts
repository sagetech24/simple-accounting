import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\PurchasedOrderController::store
* @see app/Http/Controllers/PurchasedOrderController.php:291
* @route '/purchased-orders/{purchased_order}/payments'
*/
export const store = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/purchased-orders/{purchased_order}/payments',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PurchasedOrderController::store
* @see app/Http/Controllers/PurchasedOrderController.php:291
* @route '/purchased-orders/{purchased_order}/payments'
*/
store.url = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
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

    return store.definition.url
            .replace('{purchased_order}', parsedArgs.purchased_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PurchasedOrderController::store
* @see app/Http/Controllers/PurchasedOrderController.php:291
* @route '/purchased-orders/{purchased_order}/payments'
*/
store.post = (args: { purchased_order: string | number | { id: string | number } } | [purchased_order: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

const payments = {
    store: Object.assign(store, store),
}

export default payments
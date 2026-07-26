import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\PurchasedOrderController::store
* @see app/Http/Controllers/PurchasedOrderController.php:264
* @route '/purchased-orders/{purchased_order}/payments'
*/
export const store = (args: { purchased_order: number | { id: number } } | [purchased_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/purchased-orders/{purchased_order}/payments',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PurchasedOrderController::store
* @see app/Http/Controllers/PurchasedOrderController.php:264
* @route '/purchased-orders/{purchased_order}/payments'
*/
store.url = (args: { purchased_order: number | { id: number } } | [purchased_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/PurchasedOrderController.php:264
* @route '/purchased-orders/{purchased_order}/payments'
*/
store.post = (args: { purchased_order: number | { id: number } } | [purchased_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::store
* @see app/Http/Controllers/PurchasedOrderController.php:264
* @route '/purchased-orders/{purchased_order}/payments'
*/
const storeForm = (args: { purchased_order: number | { id: number } } | [purchased_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchasedOrderController::store
* @see app/Http/Controllers/PurchasedOrderController.php:264
* @route '/purchased-orders/{purchased_order}/payments'
*/
storeForm.post = (args: { purchased_order: number | { id: number } } | [purchased_order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

store.form = storeForm

const payments = {
    store: Object.assign(store, store),
}

export default payments
import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\AccountsPayableController::store
* @see app/Http/Controllers/AccountsPayableController.php:192
* @route '/accounts-payable/{supplier}/{purchased_order}/payments'
*/
export const store = (args: { supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } } | [supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/accounts-payable/{supplier}/{purchased_order}/payments',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AccountsPayableController::store
* @see app/Http/Controllers/AccountsPayableController.php:192
* @route '/accounts-payable/{supplier}/{purchased_order}/payments'
*/
store.url = (args: { supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } } | [supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            supplier: args[0],
            purchased_order: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        supplier: typeof args.supplier === 'object'
        ? args.supplier.id
        : args.supplier,
        purchased_order: typeof args.purchased_order === 'object'
        ? args.purchased_order.reference
        : args.purchased_order,
    }

    return store.definition.url
            .replace('{supplier}', parsedArgs.supplier.toString())
            .replace('{purchased_order}', parsedArgs.purchased_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountsPayableController::store
* @see app/Http/Controllers/AccountsPayableController.php:192
* @route '/accounts-payable/{supplier}/{purchased_order}/payments'
*/
store.post = (args: { supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } } | [supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::store
* @see app/Http/Controllers/AccountsPayableController.php:192
* @route '/accounts-payable/{supplier}/{purchased_order}/payments'
*/
const storeForm = (args: { supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } } | [supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::store
* @see app/Http/Controllers/AccountsPayableController.php:192
* @route '/accounts-payable/{supplier}/{purchased_order}/payments'
*/
storeForm.post = (args: { supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } } | [supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

store.form = storeForm

const payments = {
    store: Object.assign(store, store),
}

export default payments
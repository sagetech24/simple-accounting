import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AccountsPayableController::index
* @see app/Http/Controllers/AccountsPayableController.php:25
* @route '/accounts-payable'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/accounts-payable',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountsPayableController::index
* @see app/Http/Controllers/AccountsPayableController.php:25
* @route '/accounts-payable'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountsPayableController::index
* @see app/Http/Controllers/AccountsPayableController.php:25
* @route '/accounts-payable'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::index
* @see app/Http/Controllers/AccountsPayableController.php:25
* @route '/accounts-payable'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::supplier
* @see app/Http/Controllers/AccountsPayableController.php:109
* @route '/accounts-payable/{supplier}'
*/
export const supplier = (args: { supplier: string | number | { id: string | number } } | [supplier: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: supplier.url(args, options),
    method: 'get',
})

supplier.definition = {
    methods: ["get","head"],
    url: '/accounts-payable/{supplier}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountsPayableController::supplier
* @see app/Http/Controllers/AccountsPayableController.php:109
* @route '/accounts-payable/{supplier}'
*/
supplier.url = (args: { supplier: string | number | { id: string | number } } | [supplier: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { supplier: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { supplier: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            supplier: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        supplier: typeof args.supplier === 'object'
        ? args.supplier.id
        : args.supplier,
    }

    return supplier.definition.url
            .replace('{supplier}', parsedArgs.supplier.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountsPayableController::supplier
* @see app/Http/Controllers/AccountsPayableController.php:109
* @route '/accounts-payable/{supplier}'
*/
supplier.get = (args: { supplier: string | number | { id: string | number } } | [supplier: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: supplier.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::supplier
* @see app/Http/Controllers/AccountsPayableController.php:109
* @route '/accounts-payable/{supplier}'
*/
supplier.head = (args: { supplier: string | number | { id: string | number } } | [supplier: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: supplier.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::show
* @see app/Http/Controllers/AccountsPayableController.php:156
* @route '/accounts-payable/{supplier}/{purchased_order}'
*/
export const show = (args: { supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } } | [supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/accounts-payable/{supplier}/{purchased_order}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountsPayableController::show
* @see app/Http/Controllers/AccountsPayableController.php:156
* @route '/accounts-payable/{supplier}/{purchased_order}'
*/
show.url = (args: { supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } } | [supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } ], options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{supplier}', parsedArgs.supplier.toString())
            .replace('{purchased_order}', parsedArgs.purchased_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountsPayableController::show
* @see app/Http/Controllers/AccountsPayableController.php:156
* @route '/accounts-payable/{supplier}/{purchased_order}'
*/
show.get = (args: { supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } } | [supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::show
* @see app/Http/Controllers/AccountsPayableController.php:156
* @route '/accounts-payable/{supplier}/{purchased_order}'
*/
show.head = (args: { supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } } | [supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::storePayment
* @see app/Http/Controllers/AccountsPayableController.php:192
* @route '/accounts-payable/{supplier}/{purchased_order}/payments'
*/
export const storePayment = (args: { supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } } | [supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storePayment.url(args, options),
    method: 'post',
})

storePayment.definition = {
    methods: ["post"],
    url: '/accounts-payable/{supplier}/{purchased_order}/payments',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AccountsPayableController::storePayment
* @see app/Http/Controllers/AccountsPayableController.php:192
* @route '/accounts-payable/{supplier}/{purchased_order}/payments'
*/
storePayment.url = (args: { supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } } | [supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } ], options?: RouteQueryOptions) => {
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

    return storePayment.definition.url
            .replace('{supplier}', parsedArgs.supplier.toString())
            .replace('{purchased_order}', parsedArgs.purchased_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountsPayableController::storePayment
* @see app/Http/Controllers/AccountsPayableController.php:192
* @route '/accounts-payable/{supplier}/{purchased_order}/payments'
*/
storePayment.post = (args: { supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } } | [supplier: string | number | { id: string | number }, purchased_order: string | number | { reference: string | number } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storePayment.url(args, options),
    method: 'post',
})

const AccountsPayableController = { index, supplier, show, storePayment }

export default AccountsPayableController
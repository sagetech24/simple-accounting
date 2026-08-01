import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
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
* @see \App\Http\Controllers\AccountsPayableController::index
* @see app/Http/Controllers/AccountsPayableController.php:25
* @route '/accounts-payable'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::index
* @see app/Http/Controllers/AccountsPayableController.php:25
* @route '/accounts-payable'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::index
* @see app/Http/Controllers/AccountsPayableController.php:25
* @route '/accounts-payable'
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
* @see \App\Http\Controllers\AccountsPayableController::supplier
* @see app/Http/Controllers/AccountsPayableController.php:109
* @route '/accounts-payable/{supplier}'
*/
export const supplier = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
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
supplier.url = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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
supplier.get = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: supplier.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::supplier
* @see app/Http/Controllers/AccountsPayableController.php:109
* @route '/accounts-payable/{supplier}'
*/
supplier.head = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: supplier.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::supplier
* @see app/Http/Controllers/AccountsPayableController.php:109
* @route '/accounts-payable/{supplier}'
*/
const supplierForm = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: supplier.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::supplier
* @see app/Http/Controllers/AccountsPayableController.php:109
* @route '/accounts-payable/{supplier}'
*/
supplierForm.get = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: supplier.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::supplier
* @see app/Http/Controllers/AccountsPayableController.php:109
* @route '/accounts-payable/{supplier}'
*/
supplierForm.head = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: supplier.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

supplier.form = supplierForm

/**
* @see \App\Http\Controllers\AccountsPayableController::show
* @see app/Http/Controllers/AccountsPayableController.php:165
* @route '/accounts-payable/{supplier}/{purchased_order}'
*/
export const show = (args: { supplier: number | { id: number }, purchased_order: string | { reference: string } } | [supplier: number | { id: number }, purchased_order: string | { reference: string } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/accounts-payable/{supplier}/{purchased_order}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountsPayableController::show
* @see app/Http/Controllers/AccountsPayableController.php:165
* @route '/accounts-payable/{supplier}/{purchased_order}'
*/
show.url = (args: { supplier: number | { id: number }, purchased_order: string | { reference: string } } | [supplier: number | { id: number }, purchased_order: string | { reference: string } ], options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/AccountsPayableController.php:165
* @route '/accounts-payable/{supplier}/{purchased_order}'
*/
show.get = (args: { supplier: number | { id: number }, purchased_order: string | { reference: string } } | [supplier: number | { id: number }, purchased_order: string | { reference: string } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::show
* @see app/Http/Controllers/AccountsPayableController.php:165
* @route '/accounts-payable/{supplier}/{purchased_order}'
*/
show.head = (args: { supplier: number | { id: number }, purchased_order: string | { reference: string } } | [supplier: number | { id: number }, purchased_order: string | { reference: string } ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::show
* @see app/Http/Controllers/AccountsPayableController.php:165
* @route '/accounts-payable/{supplier}/{purchased_order}'
*/
const showForm = (args: { supplier: number | { id: number }, purchased_order: string | { reference: string } } | [supplier: number | { id: number }, purchased_order: string | { reference: string } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::show
* @see app/Http/Controllers/AccountsPayableController.php:165
* @route '/accounts-payable/{supplier}/{purchased_order}'
*/
showForm.get = (args: { supplier: number | { id: number }, purchased_order: string | { reference: string } } | [supplier: number | { id: number }, purchased_order: string | { reference: string } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::show
* @see app/Http/Controllers/AccountsPayableController.php:165
* @route '/accounts-payable/{supplier}/{purchased_order}'
*/
showForm.head = (args: { supplier: number | { id: number }, purchased_order: string | { reference: string } } | [supplier: number | { id: number }, purchased_order: string | { reference: string } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\AccountsPayableController::storePayment
* @see app/Http/Controllers/AccountsPayableController.php:201
* @route '/accounts-payable/{supplier}/{purchased_order}/payments'
*/
export const storePayment = (args: { supplier: number | { id: number }, purchased_order: string | { reference: string } } | [supplier: number | { id: number }, purchased_order: string | { reference: string } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storePayment.url(args, options),
    method: 'post',
})

storePayment.definition = {
    methods: ["post"],
    url: '/accounts-payable/{supplier}/{purchased_order}/payments',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AccountsPayableController::storePayment
* @see app/Http/Controllers/AccountsPayableController.php:201
* @route '/accounts-payable/{supplier}/{purchased_order}/payments'
*/
storePayment.url = (args: { supplier: number | { id: number }, purchased_order: string | { reference: string } } | [supplier: number | { id: number }, purchased_order: string | { reference: string } ], options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/AccountsPayableController.php:201
* @route '/accounts-payable/{supplier}/{purchased_order}/payments'
*/
storePayment.post = (args: { supplier: number | { id: number }, purchased_order: string | { reference: string } } | [supplier: number | { id: number }, purchased_order: string | { reference: string } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storePayment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::storePayment
* @see app/Http/Controllers/AccountsPayableController.php:201
* @route '/accounts-payable/{supplier}/{purchased_order}/payments'
*/
const storePaymentForm = (args: { supplier: number | { id: number }, purchased_order: string | { reference: string } } | [supplier: number | { id: number }, purchased_order: string | { reference: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storePayment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AccountsPayableController::storePayment
* @see app/Http/Controllers/AccountsPayableController.php:201
* @route '/accounts-payable/{supplier}/{purchased_order}/payments'
*/
storePaymentForm.post = (args: { supplier: number | { id: number }, purchased_order: string | { reference: string } } | [supplier: number | { id: number }, purchased_order: string | { reference: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storePayment.url(args, options),
    method: 'post',
})

storePayment.form = storePaymentForm

const AccountsPayableController = { index, supplier, show, storePayment }

export default AccountsPayableController
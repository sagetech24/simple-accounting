import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\AccountsReceivableController::customer
* @see app/Http/Controllers/AccountsReceivableController.php:104
* @route '/accounts-receivable/{customer}'
*/
export const customer = (args: { customer: number | { id: number } } | [customer: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: customer.url(args, options),
    method: 'get',
})

customer.definition = {
    methods: ["get","head"],
    url: '/accounts-receivable/{customer}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountsReceivableController::customer
* @see app/Http/Controllers/AccountsReceivableController.php:104
* @route '/accounts-receivable/{customer}'
*/
customer.url = (args: { customer: number | { id: number } } | [customer: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { customer: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { customer: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            customer: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        customer: typeof args.customer === 'object'
        ? args.customer.id
        : args.customer,
    }

    return customer.definition.url
            .replace('{customer}', parsedArgs.customer.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountsReceivableController::customer
* @see app/Http/Controllers/AccountsReceivableController.php:104
* @route '/accounts-receivable/{customer}'
*/
customer.get = (args: { customer: number | { id: number } } | [customer: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: customer.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsReceivableController::customer
* @see app/Http/Controllers/AccountsReceivableController.php:104
* @route '/accounts-receivable/{customer}'
*/
customer.head = (args: { customer: number | { id: number } } | [customer: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: customer.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AccountsReceivableController::customer
* @see app/Http/Controllers/AccountsReceivableController.php:104
* @route '/accounts-receivable/{customer}'
*/
const customerForm = (args: { customer: number | { id: number } } | [customer: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: customer.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsReceivableController::customer
* @see app/Http/Controllers/AccountsReceivableController.php:104
* @route '/accounts-receivable/{customer}'
*/
customerForm.get = (args: { customer: number | { id: number } } | [customer: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: customer.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsReceivableController::customer
* @see app/Http/Controllers/AccountsReceivableController.php:104
* @route '/accounts-receivable/{customer}'
*/
customerForm.head = (args: { customer: number | { id: number } } | [customer: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: customer.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

customer.form = customerForm

/**
* @see \App\Http\Controllers\AccountsReceivableController::show
* @see app/Http/Controllers/AccountsReceivableController.php:158
* @route '/accounts-receivable/{customer}/{sales_order}'
*/
export const show = (args: { customer: number | { id: number }, sales_order: number | { id: number } } | [customer: number | { id: number }, sales_order: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/accounts-receivable/{customer}/{sales_order}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountsReceivableController::show
* @see app/Http/Controllers/AccountsReceivableController.php:158
* @route '/accounts-receivable/{customer}/{sales_order}'
*/
show.url = (args: { customer: number | { id: number }, sales_order: number | { id: number } } | [customer: number | { id: number }, sales_order: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            customer: args[0],
            sales_order: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        customer: typeof args.customer === 'object'
        ? args.customer.id
        : args.customer,
        sales_order: typeof args.sales_order === 'object'
        ? args.sales_order.id
        : args.sales_order,
    }

    return show.definition.url
            .replace('{customer}', parsedArgs.customer.toString())
            .replace('{sales_order}', parsedArgs.sales_order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountsReceivableController::show
* @see app/Http/Controllers/AccountsReceivableController.php:158
* @route '/accounts-receivable/{customer}/{sales_order}'
*/
show.get = (args: { customer: number | { id: number }, sales_order: number | { id: number } } | [customer: number | { id: number }, sales_order: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsReceivableController::show
* @see app/Http/Controllers/AccountsReceivableController.php:158
* @route '/accounts-receivable/{customer}/{sales_order}'
*/
show.head = (args: { customer: number | { id: number }, sales_order: number | { id: number } } | [customer: number | { id: number }, sales_order: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AccountsReceivableController::show
* @see app/Http/Controllers/AccountsReceivableController.php:158
* @route '/accounts-receivable/{customer}/{sales_order}'
*/
const showForm = (args: { customer: number | { id: number }, sales_order: number | { id: number } } | [customer: number | { id: number }, sales_order: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsReceivableController::show
* @see app/Http/Controllers/AccountsReceivableController.php:158
* @route '/accounts-receivable/{customer}/{sales_order}'
*/
showForm.get = (args: { customer: number | { id: number }, sales_order: number | { id: number } } | [customer: number | { id: number }, sales_order: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsReceivableController::show
* @see app/Http/Controllers/AccountsReceivableController.php:158
* @route '/accounts-receivable/{customer}/{sales_order}'
*/
showForm.head = (args: { customer: number | { id: number }, sales_order: number | { id: number } } | [customer: number | { id: number }, sales_order: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

const accountsReceivable = {
    customer: Object.assign(customer, customer),
    show: Object.assign(show, show),
}

export default accountsReceivable
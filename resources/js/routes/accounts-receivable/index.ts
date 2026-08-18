import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\AccountsReceivableController::customer
* @see app/Http/Controllers/AccountsReceivableController.php:100
* @route '/accounts-receivable/{customer}'
*/
export const customer = (args: { customer: string | number | { id: string | number } } | [customer: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: customer.url(args, options),
    method: 'get',
})

customer.definition = {
    methods: ["get","head"],
    url: '/accounts-receivable/{customer}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountsReceivableController::customer
* @see app/Http/Controllers/AccountsReceivableController.php:100
* @route '/accounts-receivable/{customer}'
*/
customer.url = (args: { customer: string | number | { id: string | number } } | [customer: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/AccountsReceivableController.php:100
* @route '/accounts-receivable/{customer}'
*/
customer.get = (args: { customer: string | number | { id: string | number } } | [customer: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: customer.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountsReceivableController::customer
* @see app/Http/Controllers/AccountsReceivableController.php:100
* @route '/accounts-receivable/{customer}'
*/
customer.head = (args: { customer: string | number | { id: string | number } } | [customer: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: customer.url(args, options),
    method: 'head',
})

const accountsReceivable = {
    customer: Object.assign(customer, customer),
}

export default accountsReceivable
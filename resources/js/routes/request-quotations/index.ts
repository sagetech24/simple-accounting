import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\RequestQuotationController::submit
* @see app/Http/Controllers/RequestQuotationController.php:108
* @route '/request-quotations/{request_quotation}/submit'
*/
export const submit = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

submit.definition = {
    methods: ["post"],
    url: '/request-quotations/{request_quotation}/submit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RequestQuotationController::submit
* @see app/Http/Controllers/RequestQuotationController.php:108
* @route '/request-quotations/{request_quotation}/submit'
*/
submit.url = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { request_quotation: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { request_quotation: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            request_quotation: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        request_quotation: typeof args.request_quotation === 'object'
        ? args.request_quotation.id
        : args.request_quotation,
    }

    return submit.definition.url
            .replace('{request_quotation}', parsedArgs.request_quotation.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RequestQuotationController::submit
* @see app/Http/Controllers/RequestQuotationController.php:108
* @route '/request-quotations/{request_quotation}/submit'
*/
submit.post = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::submit
* @see app/Http/Controllers/RequestQuotationController.php:108
* @route '/request-quotations/{request_quotation}/submit'
*/
const submitForm = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: submit.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::submit
* @see app/Http/Controllers/RequestQuotationController.php:108
* @route '/request-quotations/{request_quotation}/submit'
*/
submitForm.post = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: submit.url(args, options),
    method: 'post',
})

submit.form = submitForm

/**
* @see \App\Http\Controllers\RequestQuotationController::approve
* @see app/Http/Controllers/RequestQuotationController.php:134
* @route '/request-quotations/{request_quotation}/approve'
*/
export const approve = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})

approve.definition = {
    methods: ["post"],
    url: '/request-quotations/{request_quotation}/approve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RequestQuotationController::approve
* @see app/Http/Controllers/RequestQuotationController.php:134
* @route '/request-quotations/{request_quotation}/approve'
*/
approve.url = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { request_quotation: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { request_quotation: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            request_quotation: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        request_quotation: typeof args.request_quotation === 'object'
        ? args.request_quotation.id
        : args.request_quotation,
    }

    return approve.definition.url
            .replace('{request_quotation}', parsedArgs.request_quotation.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RequestQuotationController::approve
* @see app/Http/Controllers/RequestQuotationController.php:134
* @route '/request-quotations/{request_quotation}/approve'
*/
approve.post = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::approve
* @see app/Http/Controllers/RequestQuotationController.php:134
* @route '/request-quotations/{request_quotation}/approve'
*/
const approveForm = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: approve.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::approve
* @see app/Http/Controllers/RequestQuotationController.php:134
* @route '/request-quotations/{request_quotation}/approve'
*/
approveForm.post = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: approve.url(args, options),
    method: 'post',
})

approve.form = approveForm

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:22
* @route '/request-quotations'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/request-quotations',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:22
* @route '/request-quotations'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:22
* @route '/request-quotations'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:22
* @route '/request-quotations'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:22
* @route '/request-quotations'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:22
* @route '/request-quotations'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:22
* @route '/request-quotations'
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
* @see \App\Http\Controllers\RequestQuotationController::store
* @see app/Http/Controllers/RequestQuotationController.php:64
* @route '/request-quotations'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/request-quotations',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RequestQuotationController::store
* @see app/Http/Controllers/RequestQuotationController.php:64
* @route '/request-quotations'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RequestQuotationController::store
* @see app/Http/Controllers/RequestQuotationController.php:64
* @route '/request-quotations'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::store
* @see app/Http/Controllers/RequestQuotationController.php:64
* @route '/request-quotations'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::store
* @see app/Http/Controllers/RequestQuotationController.php:64
* @route '/request-quotations'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

const requestQuotations = {
    submit: Object.assign(submit, submit),
    approve: Object.assign(approve, approve),
    index: Object.assign(index, index),
    store: Object.assign(store, store),
}

export default requestQuotations
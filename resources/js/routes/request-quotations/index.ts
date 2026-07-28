import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\RequestQuotationController::submit
* @see app/Http/Controllers/RequestQuotationController.php:193
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
* @see app/Http/Controllers/RequestQuotationController.php:193
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
* @see app/Http/Controllers/RequestQuotationController.php:193
* @route '/request-quotations/{request_quotation}/submit'
*/
submit.post = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::approve
* @see app/Http/Controllers/RequestQuotationController.php:219
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
* @see app/Http/Controllers/RequestQuotationController.php:219
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
* @see app/Http/Controllers/RequestQuotationController.php:219
* @route '/request-quotations/{request_quotation}/approve'
*/
approve.post = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::createPurchaseOrder
* @see app/Http/Controllers/RequestQuotationController.php:245
* @route '/request-quotations/{request_quotation}/create-purchase-order'
*/
export const createPurchaseOrder = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createPurchaseOrder.url(args, options),
    method: 'post',
})

createPurchaseOrder.definition = {
    methods: ["post"],
    url: '/request-quotations/{request_quotation}/create-purchase-order',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RequestQuotationController::createPurchaseOrder
* @see app/Http/Controllers/RequestQuotationController.php:245
* @route '/request-quotations/{request_quotation}/create-purchase-order'
*/
createPurchaseOrder.url = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
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

    return createPurchaseOrder.definition.url
            .replace('{request_quotation}', parsedArgs.request_quotation.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RequestQuotationController::createPurchaseOrder
* @see app/Http/Controllers/RequestQuotationController.php:245
* @route '/request-quotations/{request_quotation}/create-purchase-order'
*/
createPurchaseOrder.post = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createPurchaseOrder.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::restore
* @see app/Http/Controllers/RequestQuotationController.php:178
* @route '/request-quotations/{request_quotation}/restore'
*/
export const restore = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

restore.definition = {
    methods: ["post"],
    url: '/request-quotations/{request_quotation}/restore',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RequestQuotationController::restore
* @see app/Http/Controllers/RequestQuotationController.php:178
* @route '/request-quotations/{request_quotation}/restore'
*/
restore.url = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
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

    return restore.definition.url
            .replace('{request_quotation}', parsedArgs.request_quotation.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RequestQuotationController::restore
* @see app/Http/Controllers/RequestQuotationController.php:178
* @route '/request-quotations/{request_quotation}/restore'
*/
restore.post = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:27
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
* @see app/Http/Controllers/RequestQuotationController.php:27
* @route '/request-quotations'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:27
* @route '/request-quotations'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:27
* @route '/request-quotations'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::store
* @see app/Http/Controllers/RequestQuotationController.php:81
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
* @see app/Http/Controllers/RequestQuotationController.php:81
* @route '/request-quotations'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RequestQuotationController::store
* @see app/Http/Controllers/RequestQuotationController.php:81
* @route '/request-quotations'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::update
* @see app/Http/Controllers/RequestQuotationController.php:115
* @route '/request-quotations/{request_quotation}'
*/
export const update = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/request-quotations/{request_quotation}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\RequestQuotationController::update
* @see app/Http/Controllers/RequestQuotationController.php:115
* @route '/request-quotations/{request_quotation}'
*/
update.url = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{request_quotation}', parsedArgs.request_quotation.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RequestQuotationController::update
* @see app/Http/Controllers/RequestQuotationController.php:115
* @route '/request-quotations/{request_quotation}'
*/
update.put = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::update
* @see app/Http/Controllers/RequestQuotationController.php:115
* @route '/request-quotations/{request_quotation}'
*/
update.patch = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::destroy
* @see app/Http/Controllers/RequestQuotationController.php:163
* @route '/request-quotations/{request_quotation}'
*/
export const destroy = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/request-quotations/{request_quotation}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\RequestQuotationController::destroy
* @see app/Http/Controllers/RequestQuotationController.php:163
* @route '/request-quotations/{request_quotation}'
*/
destroy.url = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{request_quotation}', parsedArgs.request_quotation.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RequestQuotationController::destroy
* @see app/Http/Controllers/RequestQuotationController.php:163
* @route '/request-quotations/{request_quotation}'
*/
destroy.delete = (args: { request_quotation: string | number | { id: string | number } } | [request_quotation: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

const requestQuotations = {
    submit: Object.assign(submit, submit),
    approve: Object.assign(approve, approve),
    createPurchaseOrder: Object.assign(createPurchaseOrder, createPurchaseOrder),
    restore: Object.assign(restore, restore),
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
}

export default requestQuotations
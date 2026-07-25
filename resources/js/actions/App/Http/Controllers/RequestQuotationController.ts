import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\RequestQuotationController::submit
* @see app/Http/Controllers/RequestQuotationController.php:175
* @route '/request-quotations/{request_quotation}/submit'
*/
export const submit = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

submit.definition = {
    methods: ["post"],
    url: '/request-quotations/{request_quotation}/submit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RequestQuotationController::submit
* @see app/Http/Controllers/RequestQuotationController.php:175
* @route '/request-quotations/{request_quotation}/submit'
*/
submit.url = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/RequestQuotationController.php:175
* @route '/request-quotations/{request_quotation}/submit'
*/
submit.post = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::submit
* @see app/Http/Controllers/RequestQuotationController.php:175
* @route '/request-quotations/{request_quotation}/submit'
*/
const submitForm = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: submit.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::submit
* @see app/Http/Controllers/RequestQuotationController.php:175
* @route '/request-quotations/{request_quotation}/submit'
*/
submitForm.post = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: submit.url(args, options),
    method: 'post',
})

submit.form = submitForm

/**
* @see \App\Http\Controllers\RequestQuotationController::approve
* @see app/Http/Controllers/RequestQuotationController.php:201
* @route '/request-quotations/{request_quotation}/approve'
*/
export const approve = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})

approve.definition = {
    methods: ["post"],
    url: '/request-quotations/{request_quotation}/approve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RequestQuotationController::approve
* @see app/Http/Controllers/RequestQuotationController.php:201
* @route '/request-quotations/{request_quotation}/approve'
*/
approve.url = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/RequestQuotationController.php:201
* @route '/request-quotations/{request_quotation}/approve'
*/
approve.post = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::approve
* @see app/Http/Controllers/RequestQuotationController.php:201
* @route '/request-quotations/{request_quotation}/approve'
*/
const approveForm = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: approve.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::approve
* @see app/Http/Controllers/RequestQuotationController.php:201
* @route '/request-quotations/{request_quotation}/approve'
*/
approveForm.post = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: approve.url(args, options),
    method: 'post',
})

approve.form = approveForm

/**
* @see \App\Http\Controllers\RequestQuotationController::restore
* @see app/Http/Controllers/RequestQuotationController.php:160
* @route '/request-quotations/{request_quotation}/restore'
*/
export const restore = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

restore.definition = {
    methods: ["post"],
    url: '/request-quotations/{request_quotation}/restore',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RequestQuotationController::restore
* @see app/Http/Controllers/RequestQuotationController.php:160
* @route '/request-quotations/{request_quotation}/restore'
*/
restore.url = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/RequestQuotationController.php:160
* @route '/request-quotations/{request_quotation}/restore'
*/
restore.post = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::restore
* @see app/Http/Controllers/RequestQuotationController.php:160
* @route '/request-quotations/{request_quotation}/restore'
*/
const restoreForm = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: restore.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::restore
* @see app/Http/Controllers/RequestQuotationController.php:160
* @route '/request-quotations/{request_quotation}/restore'
*/
restoreForm.post = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: restore.url(args, options),
    method: 'post',
})

restore.form = restoreForm

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:25
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
* @see app/Http/Controllers/RequestQuotationController.php:25
* @route '/request-quotations'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:25
* @route '/request-quotations'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:25
* @route '/request-quotations'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:25
* @route '/request-quotations'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:25
* @route '/request-quotations'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::index
* @see app/Http/Controllers/RequestQuotationController.php:25
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
* @see app/Http/Controllers/RequestQuotationController.php:78
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
* @see app/Http/Controllers/RequestQuotationController.php:78
* @route '/request-quotations'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RequestQuotationController::store
* @see app/Http/Controllers/RequestQuotationController.php:78
* @route '/request-quotations'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::store
* @see app/Http/Controllers/RequestQuotationController.php:78
* @route '/request-quotations'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::store
* @see app/Http/Controllers/RequestQuotationController.php:78
* @route '/request-quotations'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\RequestQuotationController::update
* @see app/Http/Controllers/RequestQuotationController.php:106
* @route '/request-quotations/{request_quotation}'
*/
export const update = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/request-quotations/{request_quotation}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\RequestQuotationController::update
* @see app/Http/Controllers/RequestQuotationController.php:106
* @route '/request-quotations/{request_quotation}'
*/
update.url = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/RequestQuotationController.php:106
* @route '/request-quotations/{request_quotation}'
*/
update.put = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::update
* @see app/Http/Controllers/RequestQuotationController.php:106
* @route '/request-quotations/{request_quotation}'
*/
update.patch = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::update
* @see app/Http/Controllers/RequestQuotationController.php:106
* @route '/request-quotations/{request_quotation}'
*/
const updateForm = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::update
* @see app/Http/Controllers/RequestQuotationController.php:106
* @route '/request-quotations/{request_quotation}'
*/
updateForm.put = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::update
* @see app/Http/Controllers/RequestQuotationController.php:106
* @route '/request-quotations/{request_quotation}'
*/
updateForm.patch = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\RequestQuotationController::destroy
* @see app/Http/Controllers/RequestQuotationController.php:145
* @route '/request-quotations/{request_quotation}'
*/
export const destroy = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/request-quotations/{request_quotation}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\RequestQuotationController::destroy
* @see app/Http/Controllers/RequestQuotationController.php:145
* @route '/request-quotations/{request_quotation}'
*/
destroy.url = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/RequestQuotationController.php:145
* @route '/request-quotations/{request_quotation}'
*/
destroy.delete = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::destroy
* @see app/Http/Controllers/RequestQuotationController.php:145
* @route '/request-quotations/{request_quotation}'
*/
const destroyForm = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RequestQuotationController::destroy
* @see app/Http/Controllers/RequestQuotationController.php:145
* @route '/request-quotations/{request_quotation}'
*/
destroyForm.delete = (args: { request_quotation: number | { id: number } } | [request_quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const RequestQuotationController = { submit, approve, restore, index, store, update, destroy }

export default RequestQuotationController
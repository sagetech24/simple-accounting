import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
const RedirectController980bb49ee7ae63891f1d891d2fbcf1c9 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'get',
})

RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.definition = {
    methods: ["get","head","post","put","patch","delete","options"],
    url: '/',
} satisfies RouteDefinition<["get","head","post","put","patch","delete","options"]>

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url = (options?: RouteQueryOptions) => {
    return RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.definition.url + queryParams(options)
}

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'get',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'head',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'post',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'put',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'patch',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'delete',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.options = (options?: RouteQueryOptions): RouteDefinition<'options'> => ({
    url: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'options',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
const RedirectController980bb49ee7ae63891f1d891d2fbcf1c9Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'get',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'get',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'post',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9Form.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9Form.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9Form.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/'
*/
RedirectController980bb49ee7ae63891f1d891d2fbcf1c9Form.options = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'OPTIONS',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

RedirectController980bb49ee7ae63891f1d891d2fbcf1c9.form = RedirectController980bb49ee7ae63891f1d891d2fbcf1c9Form
/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
const RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'get',
})

RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.definition = {
    methods: ["get","head","post","put","patch","delete","options"],
    url: '/received-orders',
} satisfies RouteDefinition<["get","head","post","put","patch","delete","options"]>

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url = (options?: RouteQueryOptions) => {
    return RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.definition.url + queryParams(options)
}

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'get',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'head',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'post',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'put',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'patch',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'delete',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.options = (options?: RouteQueryOptions): RouteDefinition<'options'> => ({
    url: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'options',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
const RedirectController3cdccbc8ab2387bcd670af6eb2b4da6bForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'get',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6bForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'get',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6bForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6bForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'post',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6bForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6bForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6bForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \Illuminate\Routing\RedirectController::__invoke
* @see vendor/laravel/framework/src/Illuminate/Routing/RedirectController.php:19
* @route '/received-orders'
*/
RedirectController3cdccbc8ab2387bcd670af6eb2b4da6bForm.options = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'OPTIONS',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b.form = RedirectController3cdccbc8ab2387bcd670af6eb2b4da6bForm

/**
* Multiple routes resolve to \Illuminate\Routing\RedirectController::RedirectController, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `RedirectController['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
const RedirectController = {
    '/': RedirectController980bb49ee7ae63891f1d891d2fbcf1c9,
    '/received-orders': RedirectController3cdccbc8ab2387bcd670af6eb2b4da6b,
}

export default RedirectController
import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/customers'
*/
const Controller17db0779708803cbc1df8d15c89edd8e = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller17db0779708803cbc1df8d15c89edd8e.url(options),
    method: 'get',
})

Controller17db0779708803cbc1df8d15c89edd8e.definition = {
    methods: ["get","head"],
    url: '/customers',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/customers'
*/
Controller17db0779708803cbc1df8d15c89edd8e.url = (options?: RouteQueryOptions) => {
    return Controller17db0779708803cbc1df8d15c89edd8e.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/customers'
*/
Controller17db0779708803cbc1df8d15c89edd8e.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller17db0779708803cbc1df8d15c89edd8e.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/customers'
*/
Controller17db0779708803cbc1df8d15c89edd8e.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller17db0779708803cbc1df8d15c89edd8e.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/customers'
*/
const Controller17db0779708803cbc1df8d15c89edd8eForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller17db0779708803cbc1df8d15c89edd8e.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/customers'
*/
Controller17db0779708803cbc1df8d15c89edd8eForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller17db0779708803cbc1df8d15c89edd8e.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/customers'
*/
Controller17db0779708803cbc1df8d15c89edd8eForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller17db0779708803cbc1df8d15c89edd8e.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controller17db0779708803cbc1df8d15c89edd8e.form = Controller17db0779708803cbc1df8d15c89edd8eForm
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/request-quotations'
*/
const Controllercae9b2d5e8c0535c278da399646a00a9 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllercae9b2d5e8c0535c278da399646a00a9.url(options),
    method: 'get',
})

Controllercae9b2d5e8c0535c278da399646a00a9.definition = {
    methods: ["get","head"],
    url: '/request-quotations',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/request-quotations'
*/
Controllercae9b2d5e8c0535c278da399646a00a9.url = (options?: RouteQueryOptions) => {
    return Controllercae9b2d5e8c0535c278da399646a00a9.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/request-quotations'
*/
Controllercae9b2d5e8c0535c278da399646a00a9.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllercae9b2d5e8c0535c278da399646a00a9.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/request-quotations'
*/
Controllercae9b2d5e8c0535c278da399646a00a9.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controllercae9b2d5e8c0535c278da399646a00a9.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/request-quotations'
*/
const Controllercae9b2d5e8c0535c278da399646a00a9Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllercae9b2d5e8c0535c278da399646a00a9.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/request-quotations'
*/
Controllercae9b2d5e8c0535c278da399646a00a9Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllercae9b2d5e8c0535c278da399646a00a9.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/request-quotations'
*/
Controllercae9b2d5e8c0535c278da399646a00a9Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllercae9b2d5e8c0535c278da399646a00a9.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controllercae9b2d5e8c0535c278da399646a00a9.form = Controllercae9b2d5e8c0535c278da399646a00a9Form
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/purchased-orders'
*/
const Controllerce78fcc7f29d28301eb93f208e355c2e = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllerce78fcc7f29d28301eb93f208e355c2e.url(options),
    method: 'get',
})

Controllerce78fcc7f29d28301eb93f208e355c2e.definition = {
    methods: ["get","head"],
    url: '/purchased-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/purchased-orders'
*/
Controllerce78fcc7f29d28301eb93f208e355c2e.url = (options?: RouteQueryOptions) => {
    return Controllerce78fcc7f29d28301eb93f208e355c2e.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/purchased-orders'
*/
Controllerce78fcc7f29d28301eb93f208e355c2e.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllerce78fcc7f29d28301eb93f208e355c2e.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/purchased-orders'
*/
Controllerce78fcc7f29d28301eb93f208e355c2e.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controllerce78fcc7f29d28301eb93f208e355c2e.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/purchased-orders'
*/
const Controllerce78fcc7f29d28301eb93f208e355c2eForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllerce78fcc7f29d28301eb93f208e355c2e.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/purchased-orders'
*/
Controllerce78fcc7f29d28301eb93f208e355c2eForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllerce78fcc7f29d28301eb93f208e355c2e.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/purchased-orders'
*/
Controllerce78fcc7f29d28301eb93f208e355c2eForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllerce78fcc7f29d28301eb93f208e355c2e.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controllerce78fcc7f29d28301eb93f208e355c2e.form = Controllerce78fcc7f29d28301eb93f208e355c2eForm
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/received-orders'
*/
const Controller3cdccbc8ab2387bcd670af6eb2b4da6b = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'get',
})

Controller3cdccbc8ab2387bcd670af6eb2b4da6b.definition = {
    methods: ["get","head"],
    url: '/received-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/received-orders'
*/
Controller3cdccbc8ab2387bcd670af6eb2b4da6b.url = (options?: RouteQueryOptions) => {
    return Controller3cdccbc8ab2387bcd670af6eb2b4da6b.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/received-orders'
*/
Controller3cdccbc8ab2387bcd670af6eb2b4da6b.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/received-orders'
*/
Controller3cdccbc8ab2387bcd670af6eb2b4da6b.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/received-orders'
*/
const Controller3cdccbc8ab2387bcd670af6eb2b4da6bForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/received-orders'
*/
Controller3cdccbc8ab2387bcd670af6eb2b4da6bForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller3cdccbc8ab2387bcd670af6eb2b4da6b.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/received-orders'
*/
Controller3cdccbc8ab2387bcd670af6eb2b4da6bForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller3cdccbc8ab2387bcd670af6eb2b4da6b.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controller3cdccbc8ab2387bcd670af6eb2b4da6b.form = Controller3cdccbc8ab2387bcd670af6eb2b4da6bForm

/**
* Multiple routes resolve to \Inertia\Controller::Controller, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `Controller['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
const Controller = {
    '/customers': Controller17db0779708803cbc1df8d15c89edd8e,
    '/request-quotations': Controllercae9b2d5e8c0535c278da399646a00a9,
    '/purchased-orders': Controllerce78fcc7f29d28301eb93f208e355c2e,
    '/received-orders': Controller3cdccbc8ab2387bcd670af6eb2b4da6b,
}

export default Controller
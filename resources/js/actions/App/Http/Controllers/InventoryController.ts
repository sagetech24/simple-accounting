import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\InventoryController::index
* @see app/Http/Controllers/InventoryController.php:29
* @route '/inventory'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventory',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventoryController::index
* @see app/Http/Controllers/InventoryController.php:29
* @route '/inventory'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::index
* @see app/Http/Controllers/InventoryController.php:29
* @route '/inventory'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\InventoryController::index
* @see app/Http/Controllers/InventoryController.php:29
* @route '/inventory'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\InventoryController::index
* @see app/Http/Controllers/InventoryController.php:29
* @route '/inventory'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\InventoryController::index
* @see app/Http/Controllers/InventoryController.php:29
* @route '/inventory'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\InventoryController::index
* @see app/Http/Controllers/InventoryController.php:29
* @route '/inventory'
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
* @see \App\Http\Controllers\InventoryController::adjust
* @see app/Http/Controllers/InventoryController.php:132
* @route '/inventory/{product}/adjust'
*/
export const adjust = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: adjust.url(args, options),
    method: 'post',
})

adjust.definition = {
    methods: ["post"],
    url: '/inventory/{product}/adjust',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventoryController::adjust
* @see app/Http/Controllers/InventoryController.php:132
* @route '/inventory/{product}/adjust'
*/
adjust.url = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { product: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { product: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            product: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        product: typeof args.product === 'object'
        ? args.product.id
        : args.product,
    }

    return adjust.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::adjust
* @see app/Http/Controllers/InventoryController.php:132
* @route '/inventory/{product}/adjust'
*/
adjust.post = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: adjust.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\InventoryController::adjust
* @see app/Http/Controllers/InventoryController.php:132
* @route '/inventory/{product}/adjust'
*/
const adjustForm = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: adjust.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\InventoryController::adjust
* @see app/Http/Controllers/InventoryController.php:132
* @route '/inventory/{product}/adjust'
*/
adjustForm.post = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: adjust.url(args, options),
    method: 'post',
})

adjust.form = adjustForm

/**
* @see \App\Http\Controllers\InventoryController::updateSettings
* @see app/Http/Controllers/InventoryController.php:157
* @route '/inventory/{product}/settings'
*/
export const updateSettings = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSettings.url(args, options),
    method: 'post',
})

updateSettings.definition = {
    methods: ["post"],
    url: '/inventory/{product}/settings',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventoryController::updateSettings
* @see app/Http/Controllers/InventoryController.php:157
* @route '/inventory/{product}/settings'
*/
updateSettings.url = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { product: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { product: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            product: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        product: typeof args.product === 'object'
        ? args.product.id
        : args.product,
    }

    return updateSettings.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::updateSettings
* @see app/Http/Controllers/InventoryController.php:157
* @route '/inventory/{product}/settings'
*/
updateSettings.post = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSettings.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\InventoryController::updateSettings
* @see app/Http/Controllers/InventoryController.php:157
* @route '/inventory/{product}/settings'
*/
const updateSettingsForm = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateSettings.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\InventoryController::updateSettings
* @see app/Http/Controllers/InventoryController.php:157
* @route '/inventory/{product}/settings'
*/
updateSettingsForm.post = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateSettings.url(args, options),
    method: 'post',
})

updateSettings.form = updateSettingsForm

const InventoryController = { index, adjust, updateSettings }

export default InventoryController
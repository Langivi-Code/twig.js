import TwigError from "./TwigError.js";

export class TwigTemplates {
    // Namespace for template storage and retrieval

    /**
     * Registered template loaders - use Twig.Templates.registerLoader to add supported loaders
     * @type {Object}
     */
    loaders;

    /**
     * Registered template parsers - use Twig.Templates.registerParser to add supported parsers
     * @type {Object}
     */
    parsers;

    #twig;

    constructor(twig) {
        this.loaders = {};
        this.parsers = {};
        this.#twig = twig;
    }

    /**
     * Register a template loader
     *
     * @example
     * Twig.extend(function (Twig) {
     *    Twig.Templates.registerLoader('custom_loader', function (location, params, callback, errorCallback) {
     *        // ... load the template ...
     *        params.data = loadedTemplateData;
     *        // create and return the template
     *        var template = new Twig.Template(params);
     *        if (typeof callback === 'function') {
     *            callback(template);
     *        }
     *        return template;
     *    });
     * });
     *
     * @param {String} methodName The method this loader is intended for (ajax, fs)
     * @param {Function} func The function to execute when loading the template
     * @param {Object|undefined} scope Optional scope parameter to bind func to
     *
     * @throws TwigError
     *
     * @return {void}
     */
    registerLoader(methodName, func, scope) {
        if (typeof func !== 'function') {
            throw new TwigError('Unable to add loader for ' + methodName + ': Invalid function reference given.');
        }

        if (scope) {
            func = func.bind(scope);
        }

        this.loaders[methodName] = func;
    };

    /**
     * Remove a registered loader
     *
     * @param {String} methodName The method name for the loader you wish to remove
     *
     * @return {void}
     */
    unRegisterLoader(methodName) {
        if (this.isRegisteredLoader(methodName)) {
            delete this.loaders[methodName];
        }
    };

    /**
     * See if a loader is registered by its method name
     *
     * @param {String} methodName The name of the loader you are looking for
     *
     * @return {boolean}
     */
    isRegisteredLoader(methodName) {
        return Object.hasOwnProperty.call(this.loaders, methodName);
    };

    /**
     * Register a template parser
     *
     * @example
     * Twig.extend(function (Twig) {
     *    Twig.Templates.registerParser('custom_parser', function (params) {
     *        // this template source can be accessed in params.data
     *        var template = params.data
     *
     *        // ... custom process that modifies the template
     *
     *        // return the parsed template
     *        return template;
     *    });
     * });
     *
     * @param {String} methodName The method this parser is intended for (twig, source)
     * @param {Function} func The function to execute when parsing the template
     * @param {Object|undefined} scope Optional scope parameter to bind func to
     *
     * @throws TwigError
     *
     * @return {void}
     */
    registerParser(methodName, func, scope) {
        if (typeof func !== 'function') {
            throw new TwigError('Unable to add parser for ' + methodName + ': Invalid function regerence given.');
        }

        if (scope) {
            func = func.bind(scope);
        }

        this.parsers[methodName] = func;
    };

    /**
     * Remove a registered parser
     *
     * @param {String} methodName The method name for the parser you wish to remove
     *
     * @return {void}
     */
    unRegisterParser(methodName) {
        if (this.isRegisteredParser(methodName)) {
            delete this.parsers[methodName];
        }
    };

    /**
     * See if a parser is registered by its method name
     *
     * @param {String} methodName The name of the parser you are looking for
     *
     * @return {boolean}
     */
    isRegisteredParser(methodName) {
        return Object.hasOwnProperty.call(this.parsers, methodName);
    };

    /**
     * Save a template object to the store.
     *
     * @param {Twig.Template} template   The twig.js template to store.
     */
    async save(template) {
        if (template.id === undefined) {
            throw new TwigError('Unable to save template with no id');
        }
        
        const jsonTemplate = JSON.stringify(template);
        if (await this.#twig.cacher.findCacheFile(template.id)) {
            return;
        } else {
            await this.#twig.cacher.setCache(template.id,jsonTemplate);
        }
    }

    /**
     * Load a previously saved template from the store.
     *
     * @param {string} id   The ID of the template to load.
     *
     * @return {Twig.Template} A twig.js template stored with the provided ID.
     */
    load(id) {
        if(!this.#twig.cacher.findCacheFile(id)){
            return null;
        }
        return this.#twig.cacher.buildTemplateForCache(this.#twig.cacher.getCache(id));
    };

    /**
     * Load a template from a remote location using AJAX and saves in with the given ID.
     *
     * Available parameters:
     *
     *      async:       Should the HTTP request be performed asynchronously.
     *                      Defaults to true.
     *      method:      What method should be used to load the template
     *                      (fs or ajax)
     *      parser:      What method should be used to parse the template
     *                      (twig or source)
     *      precompiled: Has the template already been compiled.
     *
     * @param {string} location  The remote URL to load as a template.
     * @param {Object} params The template parameters.
     * @param {function} callback  A callback triggered when the template finishes loading.
     * @param {function} errorCallback  A callback triggered if an error occurs loading the template.
     *
     *
     */
    loadRemote(location, params) {
        // Default to the URL so the template is cached.
        const id = typeof params.id === 'undefined' ? location : params.id;
          // Default to async
        if (typeof params.async === 'undefined') {
            params.async = true;
        }

        let cached;
        if(this.#twig.cacher.findCacheFile(id)){
            cached = this.#twig.cacher.getCache(id);
        }
        if (cached) {
            const buildcache = this.#twig.cacher.buildTemplateForCache(cached);
            if(!params.async ){
                return buildcache;
            }
            return new Promise(resolve=>{resolve(buildcache)});
        }

        // If the parser name hasn't been set, default it to twig
        params.parser = params.parser || 'twig';
        params.id = id;

        // Assume 'fs' if the loader is not defined
        const loader = this.loaders[params.method] || this.loaders.fs;
        return loader.call(this,location,params);
    }
}
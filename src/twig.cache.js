class TwigCache {
    #twig;

    constructor(twig) {
        this.#twig = twig;
        this.#twig.lib.ensureDir("./cache");
    }

    findCacheFile(id) {
        try {
            Deno.statSync(`./cache/${id}.txt`);
            return true;
        } catch (e) {
            if (e instanceof Deno.errors.NotFound) {
                return false;
            }
            throw e;
        }
    }

    async setCache(id, template) {
        try {
            await Deno.writeTextFile(`./cache/${id}.txt`, template);
        } catch (e) {
            console.log("Cache don't write", e);
        }
    }

    getCache(id) {
        try {
            const cacheJson = Deno.readTextFileSync(`./cache/${id}.txt`);
            return JSON.parse(cacheJson);
        } catch (e) {
            if (e instanceof Deno.errors.NotFound){
                console.error("file does not exists");
                return false;
            }
            throw e;
        }
    }

    buildTemplateForCache(cached) {
        if (!(cached.hasOwnProperty("options"))) {
            cached.options = {
                strictVariables: false,
                autoescape: false,
                allowInlineIncludes: false,
                rethrow: false
            };
        }
        cached.data = cached.tokens;
        return new this.#twig.Template(cached);
    }
}

export {TwigCache};

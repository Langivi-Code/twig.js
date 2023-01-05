import { TwigTemplate } from "./twig.template.js";
class TwigCache {
    #twig;
    #cacheDir = "./.twig_cache";

    constructor(twig) {
        this.#twig = twig;
        this.#twig.lib.ensureDir(this.#cacheDir);
    }

    set cacheDir(dir){
        this.#twig.lib.ensureDir(dir);
        this.#cacheDir = dir;
    }

    findCacheFile(id) {
        try {
            Deno.statSync(`${this.#cacheDir}/${id}.txt`);
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
            await Deno.writeTextFile(`${this.#cacheDir}/${id}.txt`, template);
        } catch (e) {
            console.log("Cache don't write", e);
        }
    }

    getCache(id) {
        try {
            const cacheJson = Deno.readTextFileSync(`${this.#cacheDir}/${id}.txt`);
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
        return new TwigTemplate(cached);
    }
}

export {TwigCache};

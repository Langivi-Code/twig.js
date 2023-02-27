import { TwigTemplate } from "./twig.template.js";
import { twigLib } from "./TwigLib.js";
class TwigCache {
    
    #cacheDir = "./.twig_cache";

    constructor() {
        twigLib.ensureDir(this.#cacheDir);
    }

    set cacheDir(dir){
        twigLib.ensureDir(dir);
        this.#cacheDir = dir;
    }

    findCacheFile(id) {
        try {
            const hashId = twigLib.hasher(id);
            twigLib.fileStatSync(`${this.#cacheDir}/${hashId}.txt`);
            return true;
        } catch (e) {
            return false;
        }
    }

    setCache(id, template) {
        try {
            const hashId = twigLib.hasher(id);
            twigLib.writeFileSync(`${this.#cacheDir}/${hashId}.txt`, template);
        } catch (e) {
            console.log("Cache don't write", e);
        }
    }

    getCache(id) {
        try {
            const hashId = twigLib.hasher(id);
            const cacheJson = twigLib.readFileSync(`${this.#cacheDir}/${hashId}.txt`);
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

    emptyCacheDir(){
        twigLib.emptyDir(this.#cacheDir);
    }
}

const twigCache = new TwigCache(); 

export {twigCache};

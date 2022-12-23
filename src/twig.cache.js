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
        } catch(e) {
            if(e instanceof Deno.errors.NotFound){
        return false;
            }else{
                throw e;
            }
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
            const cacheJson =  Deno.readTextFileSync(`./cache/${id}.txt`);
            const cache = JSON.parse(cacheJson);
            return cache;
        } catch (e) {
            if (e instanceof Deno.errors.NotFound)
                console.error("file does not exists");
        }
    }

    buildTemplateForCache(cached) {
        const tem = new this.#twig.Template(cached);
        tem.tokens = cached.tokens;
        return tem;
    }
}

export { TwigCache };

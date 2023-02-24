// ## TwigLib.js
//
// This file contains 3rd party libraries used within twig.
//
// Copies of the licenses for the code included here can be found in the
// LICENSES.md file.
//
let importPath = "";
let fs;
let ensureDir;
let emptyDir;
try {
    if (globalThis?.performance?.nodeTiming?.name == "node") {
        importPath = "./twig.deps.node.js";
        fs = await import("fs");
        emptyDir = await import("emptydir");
    } else if (globalThis?.Deno?.version.hasOwnProperty("deno")) {
        importPath = "./twig.deps.js";
        ensureDir = await import("https://deno.land/std@0.168.0/fs/mod.ts");
        emptyDir = await import("https://deno.land/std@0.168.0/fs/mod.ts");
    }
} catch (e) {
    console.log(e);
}

const {
    sprintf,
    vsprintf,
    strip_tags,
    round,
    max,
    min,
    strtotime,
    date,
    boolval,
    clm,
    currencies,
    datauri,
    dateFns,
    converter,
    langToLang,
    getLanguageName,
    getLanguageNameWithCountry,
    showdown,
    slug,
    timeZoneName,
    iconv,
    md5,
} = await import(importPath);

class TwigLib {
    constructor() {
        this.sprintf = sprintf;
        this.vsprintf = vsprintf;
        this.round = round;
        this.max = max;
        this.min = min;
        this.stripTags = strip_tags;
        this.strtotime = strtotime;
        this.date = date;
        this.boolval = boolval;
        this.iconv = iconv;
        this.datauri = datauri;
        this.dateFns = dateFns;
        this.clm = clm;
        this.hasher = md5;
        this.currenciesMap = currencies;
        this.converter = converter;
        this.languageName = langToLang;
        this.getLanguageName = getLanguageName;
        this.getLanguageNameWithCountry = getLanguageNameWithCountry;
        this.showdown = showdown;
        this.slug = slug;
        this.timeZoneName = timeZoneName;
    }

    isEnvironment() {
        if (globalThis?.performance?.nodeTiming?.name == "node") {
            return "node";
        } else if (globalThis?.Deno?.version.hasOwnProperty("deno")) {
            return "deno";
        }
    }
    ensureDir(path) {
        if (this.isDeno()) {
            return ensureDir.ensureDirSync(path);
        } else if (this.isNode()) {
            if (!fs.existsSync(path)) {
                return fs.mkdirSync(path);
            }
        }
    }

    emptyDir(path) {
        if (this.isDeno()) {
            return emptyDir.emptyDirSync(path);
        } else if (this.isNode()) {
            return emptyDir.emptyDirsSync(path);
        }
    }

    isNode() {
        if (globalThis?.performance?.nodeTiming?.name == "node") {
            return true;
        } else {
            return false;
        }
    }

    isDeno() {
        if (globalThis?.Deno?.version.hasOwnProperty("deno")) {
            return true;
        } else {
            return false;
        }
    }
    is(type, obj) {
        if (typeof obj === "undefined" || obj === null) {
            return false;
        }

        switch (type) {
            case "Array":
                return Array.isArray(obj);
            case "Date":
                return obj instanceof Date;
            case "String":
                return typeof obj === "string" || obj instanceof String;
            case "Number":
                return typeof obj === "number" || obj instanceof Number;
            case "Function":
                return typeof obj === "function";
            case "Boolean":
                return typeof obj === "boolean" || obj instanceof Boolean;
            case "Object":
                return obj instanceof Object;
            default:
                return false;
        }
    }

    replaceAll(string, search, replace) {
        // Escape possible regular expression syntax
        const searchEscaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        return string.replace(new RegExp(searchEscaped, "g"), replace);
    }

    // Chunk an array (arr) into arrays of (size) items, returns an array of arrays, or an empty array on invalid input
    chunkArray(arr, size) {
        const returnVal = [];
        let x = 0;
        const len = arr.length;

        if (size < 1 || !Array.isArray(arr)) {
            return [];
        }

        while (x < len) {
            returnVal.push(arr.slice(x, (x += size)));
        }

        return returnVal;
    }

    async readFile(path) {
        try {
            if (this.isDeno()) {
                return await Deno.readTextFile(path);
            } else if (this.isNode()) {
                return fs.readFileSync(path, "utf8");
            }
        } catch (e) {
            console.log(e);
        }
    }

    readFileSync(path) {
        if (this.isDeno()) {
            return Deno.readTextFileSync(path);
        } else if (this.isNode()) {
            return fs.readFileSync(path, "utf8");
        }
    }

    fileStatSync(path) {
        if (this.isDeno()) {
            return !!Deno.statSync(path);
        } else if (this.isNode()) {
            return fs.statSync(path).isFile();
        }
    }

    async fileStat(path) {
        if (this.isDeno()) {
            return !!(await Deno.stat(path));
        } else if (this.isNode()) {
            const fileStat = fs.statSync(path);
            console.log("FILE STATE NODE", fileStat);
            return fileStat.isFile();
        }
    }

    writeFileSync(path, data) {
        if (this.isDeno()) {
            return Deno.writeTextFileSync(path, data);
        } else if (this.isNode()) {
            return fs.writeFileSync(path, data);
        }
    }

}
export const twigLib = new TwigLib();
export { TwigLib };

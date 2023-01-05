// ## TwigLib.js
//
// This file contains 3rd party libraries used within twig.
//
// Copies of the licenses for the code included here can be found in the
// LICENSES.md file.
//

import {sprintf, vsprintf, strip_tags, round, max, min, strtotime, date, boolval, clm, Currencies, datauri, lookup, fromUint8Array, datetime, turndown, DOMParser, langToLang, getLanguageName, getLanguageNameWithCountry, showdown, slug, timeZoneName, encode, createHash, ensureDir} from './twig.deps.js';


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
        this.encode = encode;
        this.clm = clm;
        this.hasher = createHash;
        this.currenciesMap = Currencies;
        this.datauri = datauri;
        this.lookup = lookup;
        this.fromUint8Array = fromUint8Array;
        this.datetime = datetime;
        this.turndown = turndown;
        this.domParser = DOMParser;
        this.languageName = langToLang;
        this.getLanguageName = getLanguageName;
        this.getLanguageNameWithCountry = getLanguageNameWithCountry;
        this.showdown = showdown;
        this.slug = slug;
        this.timeZoneName = timeZoneName;
        this.ensureDir = ensureDir;
    }

    is(type, obj) {
        if (typeof obj === 'undefined' || obj === null) {
            return false;
        }

        switch (type) {
            case 'Array':
                return Array.isArray(obj);
            case 'Date':
                return obj instanceof Date;
            case 'String':
                return (typeof obj === 'string' || obj instanceof String);
            case 'Number':
                return (typeof obj === 'number' || obj instanceof Number);
            case 'Function':
                return (typeof obj === 'function');
            case 'Boolean':
                return (typeof obj === "boolean" || obj instanceof Boolean);
            case 'Object':
                return obj instanceof Object;
            default:
                return false;
        }
    };

    replaceAll(string, search, replace) {
        // Escape possible regular expression syntax
        const searchEscaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        return string.replace(new RegExp(searchEscaped, 'g'), replace);
    };

    // Chunk an array (arr) into arrays of (size) items, returns an array of arrays, or an empty array on invalid input
    chunkArray(arr, size) {
        const returnVal = [];
        let x = 0;
        const len = arr.length;

        if (size < 1 || !Array.isArray(arr)) {
            return [];
        }

        while (x < len) {
            returnVal.push(arr.slice(x, x += size));
        }

        return returnVal;
    };

}
export const twigLib = new TwigLib();
export {TwigLib};

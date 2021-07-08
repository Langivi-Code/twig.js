// ## twig.lib.js
//
// This file contains 3rd party libraries used within twig.
//
// Copies of the licenses for the code included here can be found in the
// LICENSES.md file.
//
import {strings, math, datetime, boolval}  from './twig.deps.js';
const {strtotime, date} = datetime;
const {round, max, min} = math;
const {sprintf, vsprintf, strip_tags} = strings;
export default function  (Twig) {
    // Namespace for libraries
    Twig.lib = { };
    Twig.lib.sprintf = sprintf;
    Twig.lib.vsprintf = vsprintf;
    Twig.lib.round = round;
    Twig.lib.max = max;
    Twig.lib.min = min;
    Twig.lib.stripTags = strip_tags;
    Twig.lib.strtotime = strtotime;
    Twig.lib.date = date;
    Twig.lib.boolval = boolval;

    Twig.lib.is = function (type, obj) {
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
            case 'Object':
                return obj instanceof Object;
            default:
                return false;
        }
    };

    Twig.lib.replaceAll = function (string, search, replace) {
        // Escape possible regular expression syntax
        const searchEscaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        return string.replace(new RegExp(searchEscaped, 'g'), replace);
    };

    // Chunk an array (arr) into arrays of (size) items, returns an array of arrays, or an empty array on invalid input
    Twig.lib.chunkArray = function (arr, size) {
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

    return Twig;
};

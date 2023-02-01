// ## twig.functions.js
//

// This file handles parsing filters.
import { TwigCore } from "./twig.core.js";
import TwigError from "./TwigError.js";
import { twigLogic } from "./TwigLogic.js";
import { twigTemplates } from "./twig.templates.js";
import { twigLib } from "./TwigLib.js";

/**
 * @constant
 * @type {string}
 */
const TEMPLATE_NOT_FOUND_MESSAGE = 'Template "{name}" is not defined.';

class TwigFunctions {
    //  Attribute, block, constant, date, dump, parent, random,.

    // Range function from http://phpjs.org/functions/range:499
    // Used under an MIT License
    range(low, high, step) {
        // http://kevin.vanzonneveld.net
        // +   original by: Waldo Malqui Silva
        // *     example 1: range ( 0, 12 );
        // *     returns 1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        // *     example 2: range( 0, 100, 10 );
        // *     returns 2: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        // *     example 3: range( 'a', 'i' );
        // *     returns 3: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
        // *     example 4: range( 'c', 'a' );
        // *     returns 4: ['c', 'b', 'a']
        const matrix = [];
        let inival;
        let endval;
        const walker = step || 1;
        let chars = false;

        if (!isNaN(low) && !isNaN(high)) {
            inival = parseInt(low, 10);
            endval = parseInt(high, 10);
        } else if (isNaN(low) && isNaN(high)) {
            chars = true;
            inival = low.charCodeAt(0);
            endval = high.charCodeAt(0);
        } else {
            inival = (isNaN(low) ? 0 : low);
            endval = (isNaN(high) ? 0 : high);
        }

        const plus = (!((inival > endval)));
        if (plus) {
            while (inival <= endval) {
                matrix.push(((chars) ? String.fromCharCode(inival) : inival));
                inival += walker;
            }
        } else {
            while (inival >= endval) {
                matrix.push(((chars) ? String.fromCharCode(inival) : inival));
                inival -= walker;
            }
        }

        return matrix;
    }

    cycle(arr, i) {
        const pos = i % arr.length;
        return arr[pos];
    }

    country_timezones(arg){
        if(typeof arg === 'string'){
            const clm = twigLib.clm;
            const country = clm.getCountryByAlpha2(arg);
            if(country){
                return `${country.name}/${country.alpha2}`;
            }else{
                throw new Error("Country not exist");
            }
        }else{
            throw new Error("Argument must be a string")
        }
    }

    constant(...arg){
        if(!globalThis.globalConst){
            globalThis.globalConst = {};
        }
        if(arg.length == 1){
            if(globalThis.globalConst[arg]){
                return globalThis.globalConst[arg]
            }else{
                throw `${arg} constant does not exist`;
            }
        }else if (arg.length == 2){
            globalThis.globalConst[arg[0]]= arg[1];
            return  globalThis.globalConst[arg[0]];
        }
    }

    html_classes(...args){
        const classes = [];
        args.forEach(element => {
            if(typeof element === 'string' || element instanceof String){
                classes.push(element);
            }else if(Array.isArray(element)) {
                element.forEach(item => {
                    if(typeof item !== "string"){
                        throw new Error(`The html_classes function argument ${item} should be a string` )
                    }
                    classes.push(item);
                });

            }else{
                throw new Error(`The html_classes function argument ${element} should be either a string or an array`)
            }

        });
        return classes.join(" ");

    }

    dump(...args) {
        // Don't pass arguments to `Array.slice`, that is a performance killer

        const argsCopy = [...args];
        const state = this;

        const EOL = '\n';
        const indentChar = '  ';
        let indentTimes = 0;
        let out = '';
        const indent = function (times) {
            let ind = '';
            while (times > 0) {
                times--;
                ind += indentChar;
            }

            return ind;
        };

        const displayVar = function (variable) {
            out += indent(indentTimes);
            if (typeof (variable) === 'object') {
                dumpVar(variable);
            } else if (typeof (variable) === 'function') {
                out += 'function()' + EOL;
            } else if (typeof (variable) === 'string') {
                out += 'string(' + variable.length + ') "' + variable + '"' + EOL;
            } else if (typeof (variable) === 'number') {
                out += 'number(' + variable + ')' + EOL;
            } else if (typeof (variable) === 'boolean') {
                out += 'bool(' + variable + ')' + EOL;
            }
        };

        const dumpVar = function (variable) {
            let i;
            if (variable === null) {
                out += 'NULL' + EOL;
            } else if (variable === undefined) {
                out += 'undefined' + EOL;
            } else if (typeof variable === 'object') {
                out += indent(indentTimes) + typeof (variable);
                indentTimes++;
                out += '(' + (function (obj) {
                    let size = 0;
                    let key;
                    for (key in obj) {
                        if (Object.hasOwnProperty.call(obj, key)) {
                            size++;
                        }
                    }

                    return size;
                })(variable) + ') {' + EOL;
                for (i in variable) {
                    if (Object.hasOwnProperty.call(variable, i)) {
                        out += indent(indentTimes) + '[' + i + ']=> ' + EOL;
                        displayVar(variable[i]);
                    }
                }

                indentTimes--;
                out += indent(indentTimes) + '}' + EOL;
            } else {
                displayVar(variable);
            }
        };

            // Handle no argument case by dumping the entire render context
        if (argsCopy.length === 0) {
            argsCopy.push(state.context);
        }

        argsCopy.forEach(variable => {
            dumpVar(variable);
        });

        return out;
    }

    date(date) {
        let dateObj;
        if (date === undefined || date === null || date === '') {
            dateObj = new Date();
        } else if (twigLib.is('Date', date)) {
            dateObj = date;
        } else if (twigLib.is('String', date)) {
            if (date.match(/^\d+$/)) {
                dateObj = new Date(date * 1000);
            } else {
                dateObj = new Date(twigLib.strtotime(date) * 1000);
            }
        } else if (twigLib.is('Number', date)) {
            // Timestamp
            dateObj = new Date(date * 1000);
        } else {
            throw new TwigError('Unable to parse date ' + date);
        }

        return dateObj;
    }

    block(blockName) {
        const state = this;

        const block = state.getBlock(blockName);

        if (block !== undefined) {
            return block.render(state, state.context);
        }
    }

    include(name, secondArg, thirdArg) {
        let paramsInclude;
        let ignoreMissing;
        let templateTwig;
        let templateFound = false;
        const isNodeEnvironment = typeof module !== 'undefined' && typeof module.exports !== 'undefined' && typeof window === 'undefined' || typeof Deno !== "undefined";
        let loader;
        const path = name;
        const state = this;
        if(twigLib.is("Object",name) ) {
            return name.render();
        }
        if (twigLib.is("Object", secondArg)) {
            paramsInclude = secondArg;
        }else if (twigLib.is("Boolean",secondArg)){
            ignoreMissing = secondArg;
        }

        if(twigLib.is("Boolean",thirdArg)){
            ignoreMissing = thirdArg;
        }
        // If we are running in a node.js environment, set the loader to 'fs'.
        if (isNodeEnvironment) {
            loader = 'fs';
        } else {
            loader = 'ajax';
        }

        // Build the params object
        const paramsLoad = {
            id: name,
            path,
            method: loader,
            parser: 'twig',
            async: false,
            fetchTemplateSource: true
        };

        // Default ignoreMissing to false
        if (typeof ignoreMissing === 'undefined') {
            ignoreMissing = false;
        }

        // Try to load the remote template
        //
        // on exception, log it
        try {
            templateTwig = twigTemplates.loadRemote(name, paramsLoad);
            // If the template is undefined or null, set the template to an empty string and do NOT flip the
            // boolean indicating we found the template
            //
            // else, all is good! flip the boolean indicating we found the template
            if (typeof templateTwig === 'undefined' || templateTwig === null) {
                templateTwig = '';
            } else {
                templateFound = true;
            }
        } catch (error) {
            TwigCore.log.debug('twigFunctions.source: ', 'Problem loading template  ', error);
        }

        // If the template was NOT found AND we are not ignoring missing templates, return the same message
        // that is returned by the PHP implementation of the twig source() function
        //
        // else, return the template source
        if (!templateFound && !ignoreMissing) {
            return TEMPLATE_NOT_FOUND_MESSAGE.replace('{name}', name);
        } else if (!templateFound && ignoreMissing) {
            return;
        }
        const params = this.context;
        templateTwig.options = { ...this.options };
        if(twigLib.is("Object",paramsInclude)){
            state.context = {...state.context, ...paramsInclude};
        }

        return templateTwig.render(state.context);
    }

    parent() {
        const state = this;

        return state.getBlock(state.getNestingStackToken(twigLogic.type.block).blockName, true).render(state, state.context);
    }

    attribute(object, method, params) {
        if (twigLib.is('Object', object)) {
            if (Object.hasOwnProperty.call(object, method)) {
                if (typeof object[method] === 'function') {
                    return object[method].apply(undefined, params);
                }

                return object[method];
            }
        }

        // Array will return element 0-index
        return object ? (object[method] || undefined) : undefined;
    }

    max(values, ...args) {
        if (twigLib.is('Object', values)) {
            delete values._keys;
            return twigLib.max(values);
        }

        return Reflect.apply(twigLib.max, null, [values, ...args]);
    }

    min(values, ...args) {
        if (twigLib.is('Object', values)) {
            delete values._keys;
            return twigLib.min(values);
        }

        return Reflect.apply(twigLib.min, null, [values, ...args]);
    }

    /* eslint-disable-next-line camelcase */
    template_from_string(template) {
        const state = this;

        if (template === undefined) {
            template = '';
        }

        return twigTemplates.parsers.twig({
            options: state.template.options,
            data: template
        });
    }

    random(value) {
        const LIMIT_INT31 = 0x80000000;

        function getRandomNumber(n) {
            const random = Math.floor(Math.random() * LIMIT_INT31);
            const min = Math.min.call(null, 0, n);
            const max = Math.max.call(null, 0, n);
            return min + Math.floor((max - min + 1) * random / LIMIT_INT31);
        }

        if (twigLib.is('Number', value)) {
            return getRandomNumber(value);
        }

        if (twigLib.is('String', value)) {
            return value.charAt(getRandomNumber(value.length - 1));
        }

        if (twigLib.is('Array', value)) {
            return value[getRandomNumber(value.length - 1)];
        }

        if (twigLib.is('Object', value)) {
            const keys = Object.keys(value);
            return value[keys[getRandomNumber(keys.length - 1)]];
        }

        return getRandomNumber(LIMIT_INT31 - 1);
    }

    /**
     * Returns the content of a template without rendering it
     * @param {string} name
     * @param {boolean} [ignoreMissing=false]
     * @returns {string}
     */
    source(name, ignoreMissing) {
        let templateSource;
        let templateFound = false;
        const isNodeEnvironment = typeof module !== 'undefined' && typeof module.exports !== 'undefined' && typeof window === 'undefined' || typeof Deno !== 'undefined';
        let loader;
        const path = name;
        // If we are running in a node.js environment, set the loader to 'fs'.
        if (isNodeEnvironment) {
            loader = 'fs';
        } else {
            loader = 'ajax';
        }

        // Build the params object
        const params = {
            id: name,
            path,
            method: loader,
            parser: 'source',
            async: false,
            fetchTemplateSource: true
        };

        // Default ignoreMissing to false
        if (typeof ignoreMissing === 'undefined') {
            ignoreMissing = false;
        }

        // Try to load the remote template
        //
        // on exception, log it
        try {
            templateSource = twigTemplates.loadRemote(name, params);

            // If the template is undefined or null, set the template to an empty string and do NOT flip the
            // boolean indicating we found the template
            //
            // else, all is good! flip the boolean indicating we found the template
            if (typeof templateSource === 'undefined' || templateSource === null) {
                templateSource = '';
            } else {
                templateFound = true;
            }
        } catch (error) {
            TwigCore.log.debug('twigFunctions.source: ', 'Problem loading template  ', error);
        }

        // If the template was NOT found AND we are not ignoring missing templates, return the same message
        // that is returned by the PHP implementation of the twig source() function
        //
        // else, return the template source
        if (!templateFound && !ignoreMissing) {
            return TEMPLATE_NOT_FOUND_MESSAGE.replace('{name}', name);
        }
        return templateSource;
    }

    _function(_function, value, params) {
        if (!this[_function]) {
            throw new TwigError('Unable to find function ' + _function);
        }

        return this[_function](value, params);
    };

    extend(_function, definition) {
        this[_function] = definition;
    };

}

const twigFunctions = new TwigFunctions();
export {twigFunctions}; 
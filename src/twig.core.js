// ## twig.core.js
//
// This file provides extension points and other hooks into the twig functionality.

import {TwigFilters} from "./twig.filters.js";
import TwigError from "./TwigError.js";
import {twig} from "./twig.js";
import {twigExpression} from "./TwigExpression.js";
import {twigFunctions} from "./TwigFunctions.js";
import { twigLogic } from "./TwigLogic.js";
import { twigTemplates } from "./twig.templates.js";
import { twigFilters } from "./twig.filters.js";
class TwigCore {
    VERSION;
    compiler;
    _function;
    tests;
    logic;
    lib;
    path;
    cacher;
    // Default caching to true for the improved performance it offers
    cache = true;
    trace = false;
    debug = false;

    noop() {
    }

    /**
     * Container for methods related to handling high level template tokens
     *      (for example: {{ expression }}, {% logic %}, {# comment #}, raw data)
     */
    static token = {
        /**
         * Token types.
         */
        type: {
            output: 'output',
            logic: 'logic',
            comment: 'comment',
            raw: 'raw',
            outputWhitespacePre: 'output_whitespace_pre',
            outputWhitespacePost: 'output_whitespace_post',
            outputWhitespaceBoth: 'output_whitespace_both',
            logicWhitespacePre: 'logic_whitespace_pre',
            logicWhitespacePost: 'logic_whitespace_post',
            logicWhitespaceBoth: 'logic_whitespace_both'
        },

        /**
         * Token syntax definitions.
         */
        definitions: [
            {
                type: "raw",
                open: '{% raw %}',
                close: '{% endraw %}'
            },
            {
                type: 'raw',
                open: '{% verbatim %}',
                close: '{% endverbatim %}'
            },
            // *Whitespace type tokens*
            //
            // These typically take the form `{{- expression -}}` or `{{- expression }}` or `{{ expression -}}`.
            {
                type: 'output_whitespace_pre',
                open: '{{-',
                close: '}}'
            },
            {
                type: 'output_whitespace_post',
                open: '{{',
                close: '-}}'
            },
            {
                type: 'output_whitespace_both',
                open: '{{-',
                close: '-}}'
            },
            {
                type: 'logic_whitespace_pre',
                open: '{%-',
                close: '%}'
            },
            {
                type: 'logic_whitespace_post',
                open: '{%',
                close: '-%}'
            },
            {
                type: 'logic_whitespace_both',
                open: '{%-',
                close: '-%}'
            },
            // *Output type tokens*
            //
            // These typically take the form `{{ expression }}`.
            {
                type: 'output',
                open: '{{',
                close: '}}'
            },
            // *Logic type tokens*
            //
            // These typically take a form like `{% if expression %}` or `{% endif %}`
            {
                type: 'logic',
                open: '{%',
                close: '%}'
            },
            // *Comment type tokens*
            //
            // These take the form `{# anything #}`
            {
                type: 'comment',
                open: '{#',
                close: '#}'
            }
        ],
        /**
         * What characters start "strings" in token definitions. We need this to ignore token close
         * strings inside an expression.
         */
        strings: ['"', '\''],

        findStart: function (template) {
            const output = {
                position: null,
                def: null
            };
            let closePosition = null;
            const len = TwigCore.token.definitions.length;
            let i;
            let tokenTemplate;
            let firstKeyPosition;
            let closeKeyPosition;

            for (i = 0; i < len; i++) {
                tokenTemplate = TwigCore.token.definitions[i];
                firstKeyPosition = template.indexOf(tokenTemplate.open);
                closeKeyPosition = template.indexOf(tokenTemplate.close);

                TwigCore.log.trace('Twig.token.findStart: ', 'Searching for ', tokenTemplate.open, ' found at ', firstKeyPosition);

                // Special handling for mismatched tokens
                if (firstKeyPosition >= 0) {
                    // This token matches the template
                    if (tokenTemplate.open.length !== tokenTemplate.close.length) {
                        // This token has mismatched closing and opening tags
                        if (closeKeyPosition < 0) {
                            // This token's closing tag does not match the template
                            continue;
                        }
                    }
                }
                // Does this token occur before any other types?

                if (firstKeyPosition >= 0 && (output.position === null || firstKeyPosition < output.position)) {
                    output.position = firstKeyPosition;
                    output.def = tokenTemplate;
                    closePosition = closeKeyPosition;
                } else if (firstKeyPosition >= 0 && output.position !== null && firstKeyPosition === output.position) {
                    /* This token exactly matches another token,
                    greedily match to check if this token has a greater specificity */
                    if (tokenTemplate.open.length > output.def.open.length) {
                        // This token's opening tag is more specific than the previous match
                        output.position = firstKeyPosition;
                        output.def = tokenTemplate;
                        closePosition = closeKeyPosition;
                    } else if (tokenTemplate.open.length === output.def.open.length) {
                        if (tokenTemplate.close.length > output.def.close.length) {
                            // This token's opening tag is as specific as the previous match,
                            // but the closing tag has greater specificity
                            if (closeKeyPosition >= 0 && closeKeyPosition < closePosition) {
                                // This token's closing tag exists in the template,
                                // and it occurs sooner than the previous match
                                output.position = firstKeyPosition;
                                output.def = tokenTemplate;
                                closePosition = closeKeyPosition;
                            }
                        } else if (closeKeyPosition >= 0 && closeKeyPosition < closePosition) {
                            // This token's closing tag is not more specific than the previous match,
                            // but it occurs sooner than the previous match
                            output.position = firstKeyPosition;
                            output.def = tokenTemplate;
                            closePosition = closeKeyPosition;
                        }
                    }
                }
            }

            return output;
        },

        findEnd: function (template, tokenDef, start) {
            let end = null;
            let found = false;
            let offset = 0;

            // String position variables
            let strPos = null;
            let strFound = null;
            let pos = null;
            let endOffset = null;
            let thisStrPos = null;
            let endStrPos = null;

            // For loop variables
            let i;
            let l;

            while (!found) {
                strPos = null;
                strFound = null;
                pos = template.indexOf(tokenDef.close, offset);

                if (pos >= 0) {
                    end = pos;
                    found = true;
                } else {
                    // Throw an exception
                    throw new TwigError('Unable to find closing bracket \'' + tokenDef.close +
                        '\' opened near template position ' + start);
                }

                // Ignore quotes within comments; just look for the next comment close sequence,
                // regardless of what comes before it. https://github.com/justjohn/twig.js/issues/95
                if (tokenDef.type === TwigCore.token.type.comment) {
                    break;
                }
                // Ignore quotes within raw tag
                // Fixes #283

                if (tokenDef.type === TwigCore.token.type.raw) {
                    break;
                }

                l = TwigCore.token.strings.length;
                for (i = 0; i < l; i += 1) {
                    thisStrPos = template.indexOf(TwigCore.token.strings[i], offset);

                    if (thisStrPos > 0 && thisStrPos < pos &&
                        (strPos === null || thisStrPos < strPos)) {
                        strPos = thisStrPos;
                        strFound = TwigCore.token.strings[i];
                    }
                }

                // We found a string before the end of the token, now find the string's end and set the search offset to it
                if (strPos !== null) {
                    endOffset = strPos + 1;
                    end = null;
                    found = false;
                    for (; ;) {
                        endStrPos = template.indexOf(strFound, endOffset);
                        if (endStrPos < 0) {
                            throw new TwigError('Unclosed string in template');
                        }
                        // Ignore escaped quotes

                        if (template.slice(endStrPos - 1, endStrPos) === '\\') {
                            endOffset = endStrPos + 1;
                        } else {
                            offset = endStrPos + 1;
                            break;
                        }
                    }
                }
            }

            return end;
        },
    };
    /**
     * Wrapper for logging to the console.
     */
    static log = {
        trace(...args) {
            if (TwigCore.trace && console) {
                console.log(Array.prototype.slice.call(args));
            }
        },
        debug(...args) {
            if (TwigCore.debug && console) {
                console.log(Array.prototype.slice.call(args));
            }
        }
    };

    /**
     * Convert a template into high-level tokens.
     */
    tokenize(template) {
        const tokens = [];
        // An offset for reporting errors locations in the template.
        let errorOffset = 0;

        // The start and type of the first token found in the template.
        let foundToken = null;
        // The end position of the matched token.
        let end = null;

        while (template.length > 0) {
            // Find the first occurance of any token type in the template
            foundToken = TwigCore.token.findStart(template);

            TwigCore.log.trace('Twig.tokenize: ', 'Found token: ', foundToken);

            if (foundToken.position === null) {
                // No more tokens -> add the rest of the template as a raw-type token
                tokens.push({
                    type: TwigCore.token.type.raw,
                    value: template
                });
                template = '';
            } else {
                // Add a raw type token for anything before the start of the token
                if (foundToken.position > 0) {
                    tokens.push({
                        type: TwigCore.token.type.raw,
                        value: template.slice(0, Math.max(0, foundToken.position))
                    });
                }

                template = template.slice(foundToken.position + foundToken.def.open.length);
                errorOffset += foundToken.position + foundToken.def.open.length;

                // Find the end of the token
                end = TwigCore.token.findEnd(template, foundToken.def, errorOffset);

                TwigCore.log.trace('Twig.tokenize: ', 'Token ends at ', end);

                tokens.push({
                    type: foundToken.def.type,
                    value: template.slice(0, Math.max(0, end)).trim()
                });

                if (template.slice(end + foundToken.def.close.length, end + foundToken.def.close.length + 1) === '\n') {
                    switch (foundToken.def.type) {
                        case 'logic_whitespace_pre':
                        case 'logic_whitespace_post':
                        case 'logic_whitespace_both':
                        case 'logic':
                            // Newlines directly after logic tokens are ignored
                            end += 1;
                            break;
                        default:
                            break;
                    }
                }

                template = template.slice(end + foundToken.def.close.length);

                // Increment the position in the template
                errorOffset += end + foundToken.def.close.length;
            }
        }

        return tokens;
    }

    compile(tokens,options,id) {
        // const self = this;
        try {
            // Output and intermediate stacks
            const output = [];
            const stack = [];
            // The tokens between open and close tags
            let intermediateOutput = [];

            let token = null;
            let logicToken = null;
            let unclosedToken = null;
            // Temporary previous token.
            let prevToken = null;
            // Temporary previous output.
            let prevOutput = null;
            // Temporary previous intermediate output.
            let prevIntermediateOutput = null;
            // The previous token's template
            let prevTemplate = null;
            // Token lookahead
            let nextToken = null;
            // The output token
            let tokOutput = null;

            // Logic Token values
            let type = null;
            let open = null;
            let next = null;

            const compileOutput =  (token) => {
              
                twigExpression.compile.call(this, token);
                if (stack.length > 0) {
                    intermediateOutput.push(token);
                } else {
                    output.push(token);
                }
            };

            const compileLogic = (token) => {
                // Compile the logic token
                logicToken = twigLogic.compile.call(this, token);

                type = logicToken.type;
                open = twigLogic.handler[type].open;
                next = twigLogic.handler[type].next;

                TwigCore.log.trace('Twig.compile: ', 'Compiled logic token to ', logicToken,
                    ' next is: ', next, ' open is : ', open);

                // Not a standalone token, check logic stack to see if this is expected
                if (open !== undefined && !open) {
                    prevToken = stack.pop();
                    prevTemplate = twigLogic.handler[prevToken.type];

                    if (!prevTemplate.next.includes(type)) {
                        throw new Error(type + ' not expected after a ' + prevToken.type);
                    }

                    prevToken.output = prevToken.output || [];

                    prevToken.output = prevToken.output.concat(intermediateOutput);
                    intermediateOutput = [];

                    tokOutput = {
                        type: TwigCore.token.type.logic,
                        token: prevToken
                    };
                    if (stack.length > 0) {
                        intermediateOutput.push(tokOutput);
                    } else {
                        output.push(tokOutput);
                    }
                }

                // This token requires additional tokens to complete the logic structure.
                if (next !== undefined && next.length > 0) {
                    TwigCore.log.trace('Twig.compile: ', 'Pushing ', logicToken, ' to logic stack.');

                    if (stack.length > 0) {
                        // Put any currently held output into the output list of the logic operator
                        // currently at the head of the stack before we push a new one on.
                        prevToken = stack.pop();
                        prevToken.output = prevToken.output || [];
                        prevToken.output = prevToken.output.concat(intermediateOutput);
                        stack.push(prevToken);
                        intermediateOutput = [];
                    }

                    // Push the new logic token onto the logic stack
                    stack.push(logicToken);
                } else if (open !== undefined && open) {
                    tokOutput = {
                        type: TwigCore.token.type.logic,
                        token: logicToken
                    };
                    // Standalone token (like {% set ... %}
                    if (stack.length > 0) {
                        intermediateOutput.push(tokOutput);
                    } else {
                        output.push(tokOutput);
                    }
                }
            };

            while (tokens.length > 0) {
                token = tokens.shift();
                prevOutput = output[output.length - 1];
                prevIntermediateOutput = intermediateOutput[intermediateOutput.length - 1];
                nextToken = tokens[0];
                TwigCore.log.trace('Compiling token ', token);
                switch (token.type) {
                    case TwigCore.token.type.raw:
                        if (stack.length > 0) {
                            intermediateOutput.push(token);
                        } else {
                            output.push(token);
                        }

                        break;

                    case TwigCore.token.type.logic:
                        compileLogic(token);
                        break;

                    // Do nothing, comments should be ignored
                    case TwigCore.token.type.comment:
                        break;

                    case TwigCore.token.type.output:
                        compileOutput(token);
                        break;

                    // Kill whitespace ahead and behind this token
                    case TwigCore.token.type.logicWhitespacePre:
                    case TwigCore.token.type.logicWhitespacePost:
                    case TwigCore.token.type.logicWhitespaceBoth:
                    case TwigCore.token.type.outputWhitespacePre:
                    case TwigCore.token.type.outputWhitespacePost:
                    case TwigCore.token.type.outputWhitespaceBoth:
                        if (token.type !== TwigCore.token.type.outputWhitespacePost && token.type !== TwigCore.token.type.logicWhitespacePost) {
                            if (prevOutput) {
                                // If the previous output is raw, pop it off
                                if (prevOutput.type === TwigCore.token.type.raw) {
                                    output.pop();

                                    prevOutput.value = prevOutput.value.trimEnd();
                                    // Repush the previous output
                                    output.push(prevOutput);
                                }
                            }

                            if (prevIntermediateOutput) {
                                // If the previous intermediate output is raw, pop it off
                                if (prevIntermediateOutput.type === TwigCore.token.type.raw) {
                                    intermediateOutput.pop();

                                    prevIntermediateOutput.value = prevIntermediateOutput.value.trimEnd();
                                    // Repush the previous intermediate output
                                    intermediateOutput.push(prevIntermediateOutput);
                                }
                            }
                        }

                        // Compile this token
                        switch (token.type) {
                            case TwigCore.token.type.outputWhitespacePre:
                            case TwigCore.token.type.outputWhitespacePost:
                            case TwigCore.token.type.outputWhitespaceBoth:
                                compileOutput(token);
                                break;
                            case TwigCore.token.type.logicWhitespacePre:
                            case TwigCore.token.type.logicWhitespacePost:
                            case TwigCore.token.type.logicWhitespaceBoth:
                                compileLogic(token);
                                break;
                            default:
                                break;
                        }

                        if (token.type !== TwigCore.token.type.outputWhitespacePre && token.type !== TwigCore.token.type.logicWhitespacePre) {
                            if (nextToken) {
                                // If the next token is raw, shift it out
                                if (nextToken.type === TwigCore.token.type.raw) {
                                    tokens.shift();

                                    nextToken.value = nextToken.value.trimStart();
                                    // Unshift the next token
                                    tokens.unshift(nextToken);
                                }
                            }
                        }

                        break;
                    default:
                        break;
                }

                TwigCore.log.trace('Twig.compile: ', ' Output: ', output,
                    ' Logic Stack: ', stack,
                    ' Pending Output: ', intermediateOutput
                );
            }

            // Verify that there are no logic tokens left in the stack.
            if (stack.length > 0) {
                unclosedToken = stack.pop();
                throw new Error('Unable to find an end tag for ' + unclosedToken.type +
                    ', expecting one of ' + unclosedToken.next);
            }
            return output;
        } catch (error) {
            if (options.rethrow) {
                if (error.type === 'TwigException' && !error.file) {
                    error.file = id;
                }

                throw error;
            } else {
                TwigCore.log.error('Error compiling twig template ' + this.id + ': ');
                if (error.stack) {
                    TwigCore.log.error(error.stack);
                } else {
                    TwigCore.log.error(error.toString());
                }
            }
        }
    }

    /**
     * Tokenize and compile a string template.
     *
     * @param {string} data The template.
     *
     * @return {Array} The compiled tokens.
     */
    prepare(data,options,id) {
        // Tokenize

        TwigCore.log.debug('Twig.prepare: ', 'Tokenizing ', data);
        const rawTokens = this.tokenize(data);

        // Compile
        TwigCore.log.debug('Twig.prepare: ', 'Compiling ', rawTokens);
        const tokens = this.compile(rawTokens,options,id);

        TwigCore.log.debug('Twig.prepare: ', 'Compiled ', tokens);

        return tokens;
    }


    /**
     * Join the output token's stack and escape it if needed
     *
     * @param {Array} output token's stack
     *
     * @return {string|String} Autoescaped output
     */
     output(output) {
        const {autoescape} = this.options;

        if (!autoescape) {
            return output.join('');
        }

        const strategy = (typeof autoescape === 'string') ? autoescape : 'html';

        const escapedOutput = output.map(str => {
            if (
                str &&
                (str.twigMarkup !== true && str.twigMarkup !== strategy) &&
                !(strategy === 'html' && str.twigMarkup === 'html_attr')
            ) {
                str = twigFilters.escape(str, [strategy]);
            }

            return str;
        });

        if (escapedOutput.length === 0) {
            return '';
        }

        const joinedOutput = escapedOutput.join('');
        if (joinedOutput.length === 0) {
            return '';
        }
        return twig.Markup(joinedOutput, true);
    };

    /**
     * Is this id valid for a twig template?
     *
     * @param {string} id The ID to check.
     *
     * @throws {Twig.Error} If the ID is invalid or used.
     * @return {boolean} True if the ID is valid.
     */
    validateId (id) {
        if (id === 'prototype') {
            throw new TwigError(id + ' is not a valid twig identifier');
        } else if (this.cache && this.cacher.findCacheFile(id)) {
            throw new  TwigError('There is already a template with the ID ' + id);
        }

        return true;
    };

     // Determine object type
    is(type, obj) {
        const clas = Object.prototype.toString.call(obj).slice(8, -1);
        return obj !== undefined && obj !== null && clas === type;
    }

    /**
     * Create safe output
     *
     * @param {string} content safe to output
     * @param {string} strategy to output
     *
     * @return {String}  Content wrapped into a String
     */

     Markup(content, strategy) {
        if (typeof content !== 'string') {
            return content;
        }

        /* eslint-disable no-new-wrappers, unicorn/new-for-builtins */
        const output = new String(content);
        /* eslint-enable */
        output.twigMarkup = (typeof strategy === 'undefined') ? true : strategy;

        return output;
    };


    /**
     * Is this id valid for a twig template?
     *
     * @param {string} id The ID to check.
     *
     * @throws {TwigError} If the ID is invalid or used.
     * @return {boolean} True if the ID is valid.
     */
    validateId(id) {
        if (id === 'prototype') {
            throw new TwigError(id + ' is not a valid twig identifier');
        } else if (this.cache && this.cacher.findCacheFile(id)) {
            throw new TwigError('There is already a template with the ID ' + id);
        }

        return true;
    };

    constructor(version) {
        this.VERSION = version;
        // Express 3 handler
        this.__express = this.renderFile;
    }


    setCompile(compilerSetter) {
        this.compiler = compilerSetter(this);
        return this;
    }

    setLibClass(libSetter) {
        this.lib = libSetter(this);
        return this;
    }


    setTestsClass(testssSetter) {
        this.tests = testssSetter(this);
        return this;
    }
    setExpression(expressionSetter) {
        this.expression = expressionSetter(this);
        return this;
    }

    setCacheClass(cacherSetter) {
        this.cacher = cacherSetter(this);
        return this;
    }

    merge(target, source, onlyChanged) {
        Object.keys(source).forEach(key => {
            if (onlyChanged && !(key in target)) {
                return;
            }

            target[key] = source[key];
        });

        return target;
    };

    /**
     * Create and compile a twig.js template.
     *
     * @param {Object} params Paramteres for creating a Twig template.
     *
     * @return {TwigTemplate} A Twig template ready for rendering.
     */
    async twig(params) {
        'use strict';
        const {id} = params;
        const options = {
            strictVariables: params.strict_variables || false,
            // TODO: turn autoscape on in the next major version
            autoescape: (params.autoescape !== null && params.autoescape) || false,
            allowInlineIncludes: params.allowInlineIncludes || false,
            rethrow: params.rethrow || false,
            namespaces: params.namespaces
        };

        if (this.cache && id) {
            this.validateId(id);
        }

        if (params.debug !== undefined) {
            this.debug = params.debug;
        }

        if (params.trace !== undefined) {
            this.trace = params.trace;
        }

        if (params.data !== undefined) {
            return twigTemplates.parsers.twig({
                data: params.data,
                path: params.hasOwnProperty('path') ? params.path : undefined,
                module: params.module,
                id,
                options
            });
        }

        if (params.ref !== undefined) {
            if (params.id !== undefined) {
                throw new TwigError('Both ref and id cannot be set on a twig.js template.');
            }

            return twigTemplates.load(params.ref);
        }

        if (params.method !== undefined) {
            if (!twigTemplates.isRegisteredLoader(params.method)) {
                throw new TwigError('Loader for "' + params.method + '" is not defined.');
            }
            try{
                const template = await twigTemplates.loadRemote(params.name || params.href || params.path || id || undefined, {
                     id,
                     method: params.method,
                     parser: params.parser || 'twig',
                     base: params.base,
                     module: params.module,
                     precompiled: params.precompiled,
                     async: params.async,
                     options
                 });
                 params.load(template);
             }catch(e){  
                 params.error(e);
             }
        }

        if (params.href !== undefined) {
            try{
                const template = await twigTemplates.loadRemote(params.href, {
                id,
                method: 'ajax',
                parser: params.parser || 'twig',
                base: params.base,
                module: params.module,
                precompiled: params.precompiled,
                async: params.async,
                options
                });
                params.load(template);
            }catch(e){
                params.error(e);
            }
        }

        if (params.path !== undefined) {
            try{ 
                const template = await twigTemplates.loadRemote(params.path, {
                id,
                method: 'fs',
                parser: params.parser || 'twig',
                base: params.base,
                module: params.module,
                precompiled: params.precompiled,
                async: params.async,
                options
                });
                params.load(template);
            }catch(e){
                params.error(e);
            }
        }
    }

    filter(filter, value, params) {
        const state = this;
        if (!twigFilters[filter]) {
            throw new TwigError('Unable to find filter ' + filter);
        }

        return twigFilters[filter](value, params);
    }

    // Extend Twig with a new filter.
    extendFilter(filter, definition) {
        TwigFilters.addFilter(twigFilters, filter, definition)
    }

    // Extend Twig with a new function.
    extendFunction(fn, definition) {
        twigFunctions.extend(fn, definition);
    }

    // Extend Twig with a new test.
    extendTest(test, definition) {
        this.tests[test] = definition;
    }

    test(test, value, params) {
        if (!this.tests[test]) {
            throw this.Error('Test ' + test + ' is not defined.');
        }

        return this.tests[test](value, params);
    };

    // Extend Twig with a new definition.
    extendTag(definition) {
        twigLogic.extend(definition);
    };

    /**
     * Provide an extension for use with express 3.
     *
     * @param {string} path The location of the template file on disk.
     * @param {Object|Function} options or callback.
     * @param {Function} fn callback.
     *
     * @throws this.Error
     */
    renderFile(path, options, fn) {
        // Handle callback in options
        if (typeof options === 'function') {
            fn = options;
            options = {};
        }

        options = options || {};

        const settings = options.settings || {};

        // Mixin any options provided to the express app.
        const viewOptions = settings['twig options'];

        const params = {
            path,
            base: settings.views,
            load(template) {
                // Render and return template as a simple string, see https://github.com/twigjs/twig.js/pull/348 for more information
                if (!viewOptions || !viewOptions.allowAsync) {
                    fn(null, String(template.render(options)));
                    return;
                }

                template.renderAsync(options)
                    .then(out => fn(null, out), fn);
            },
            error(err) {
                fn(err);
            }
        };

        if (viewOptions) {
            for (const option in viewOptions) {
                if (viewOptions.hasOwnProperty(option)) {
                    params[option] = viewOptions[option];
                }
            }
        }

        this.twig(params);
    };

    /**
     * Provide an extension for use with Opine.
     *
     * @param {string} path The location of the template file on disk.
     * @param {Object} options or callback.
     *
     * @throws this.Error
     */
    renderToString(path, options) {
        return new Promise(
            (resolve, reject) => {
                this.renderFile(path, options, (err, html) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(html);
                    }
                });
            });
    };

    /**
     * Should Twig.js cache templates.
     * Disable during development to see changes to templates without
     * reloading, and disable in production to improve performance.
     *
     * @param {boolean} cache
     */
    setCache(cache) {
        this.cache = cache;
    };


    // Provide an environment for extending Twig core.
    // Calls fn with the internal Twig object.
    extend(fn) {
        fn(this);
    };

     /**
     * Checks for `thenable` objects
     */
    isPromise(obj) {
        return obj && obj.then && (typeof obj.then === 'function');
    };
    /**
     * Provide an extension for use with express 2.
     *
     * @param {string} markup The template markup.
     * @param {array} options The express options.
     *
     * @return {string} The rendered template.
     */
    // Twig.compile = function (markup, options) {
    //     const id = options.filename;
    //     const path = options.filename;
    //
    //     // Try to load the template from the cache
    //     const template = new Twig.Template({
    //         data: markup,
    //         path,
    //         id,
    //         options: options.settings['twig options']
    //     }); // Twig.Templates.load(id) ||
    //
    //     return function (context) {
    //         return template.render(context);
    //     };
    // };
}

if (typeof console === 'undefined') {
    TwigCore.log.error = function () {};
} else if (typeof console.error !== 'undefined') {
    TwigCore.log.error = function (...args) {
        console.error(...args);
    };
} else if (typeof console.log !== 'undefined') {
    TwigCore.log.error = function (...args) {
        console.log(...args);
    };
}
export {TwigCore}
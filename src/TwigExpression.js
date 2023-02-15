import { TwigCore } from './twig.core.js';
import { AsyncTwig } from "./async/twig.async.js";
import TwigError from "./TwigError.js";
import { TwigPromise } from './async/twig.promise.js';
import {twig as Twig } from './twig.js';
import {twigExpressionOperator} from './TwigExpressionOperator.js';


function parseParams(state, params, context) {
    if (params) {
        return twigExpression.parseAsync.call(state, params, context);
    }

    return TwigPromise.resolve(false);
}

class TwigExpression {
    constructor (){
        this.handler = {};
        while (this.definitions.length > 0) {
            this.extend(this.definitions.shift());
        }
    }
    reservedWords = [
        'true', 'false', 'null', 'TRUE', 'FALSE', 'NULL', '_context', 'and', 'b-and', 'or', 'b-or', 'b-xor', 'in', 'not in', 'if', 'matches', 'starts', 'ends', 'with'
    ];

    type = {
        comma: 'Twig.expression.type.comma',
        operator: {
            unary: 'Twig.expression.type.operator.unary',
            binary: 'Twig.expression.type.operator.binary'
        },
        string: 'Twig.expression.type.string',
        bool: 'Twig.expression.type.bool',
        slice: 'Twig.expression.type.slice',
        array: {
            start: 'Twig.expression.type.array.start',
            end: 'Twig.expression.type.array.end'
        },
        object: {
            start: 'Twig.expression.type.object.start',
            end: 'Twig.expression.type.object.end'
        },
        parameter: {
            start: 'Twig.expression.type.parameter.start',
            end: 'Twig.expression.type.parameter.end'
        },
        subexpression: {
            start: 'Twig.expression.type.subexpression.start',
            end: 'Twig.expression.type.subexpression.end'
        },
        key: {
            period: 'Twig.expression.type.key.period',
            brackets: 'Twig.expression.type.key.brackets'
        },
        filter: 'Twig.expression.type.filter',
        _function: 'Twig.expression.type._function',
        variable: 'Twig.expression.type.variable',
        number: 'Twig.expression.type.number',
        _null: 'Twig.expression.type.null',
        context: 'Twig.expression.type.context',
        test: 'Twig.expression.type.test'
    };

    set = {
        // What can follow an expression (in general)
        operations: [
            this.type.filter,
            this.type.operator.unary,
            this.type.operator.binary,
            this.type.array.end,
            this.type.object.end,
            this.type.parameter.end,
            this.type.subexpression.end,
            this.type.comma,
            this.type.test
        ],
        expressions: [
            this.type._function,
            this.type.bool,
            this.type.string,
            this.type.variable,
            this.type.number,
            this.type._null,
            this.type.context,
            this.type.parameter.start,
            this.type.array.start,
            this.type.object.start,
            this.type.subexpression.start,
            this.type.operator.unary
        ],
        operationsExtended: [
            this.type.filter,
            this.type.operator.unary,
            this.type.operator.binary,
            this.type.array.end,
            this.type.object.end,
            this.type.parameter.end,
            this.type.subexpression.end,
            this.type.comma,
            this.type.test,
            this.type.key.period,
            this.type.key.brackets,
            this.type.slice
        ]
    };

    fn = {
        compile: {
            push(token, stack, output) {
                output.push(token);
            },
            pushBoth(token, stack, output) {
                output.push(token);
                stack.push(token);
            }
        },
        parse: {
            push(token, stack) {
                stack.push(token);
            },
            pushValue(token, stack) {
                stack.push(token.value);
            }
        }
    };


    definitions = [
        {
            type: this.type.test,
            regex: /^is\s+(not)?\s*([a-zA-Z_]\w*(\s?as)?)/,
            next: this.set.operations.concat([this.type.parameter.start]),
            compile(token, stack, output) {
                token.filter = token.match[2];
                token.modifier = token.match[1];
                delete token.match;
                delete token.value;
                output.push(token);
            },
            parse(token, stack, context) {
                const value = stack.pop();
                const state = this;

                return parseParams(state, token.params, context)
                    .then(params => {
                        const result = Twig.test(token.filter, value, params);

                        if (token.modifier === 'not') {
                            stack.push(!result);
                        } else {
                            stack.push(result);
                        }
                    });
            }
        },
        {
            type: this.type.comma,
            // Match a comma
            regex: /^,/,
            next: this.set.expressions.concat([this.type.array.end, this.type.object.end]),
            compile(token, stack, output) {
                let i = stack.length - 1;
                let stackToken;

                delete token.match;
                delete token.value;

                // Pop tokens off the stack until the start of the object
                for (; i >= 0; i--) {
                    stackToken = stack.pop();
                    if (stackToken.type === twigExpression.type.object.start ||
                        stackToken.type === twigExpression.type.parameter.start ||
                        stackToken.type === twigExpression.type.array.start) {
                        stack.push(stackToken);
                        break;
                    }

                    output.push(stackToken);
                }

                output.push(token);
            }
        },
        {
            /**
             * Match a number (integer or decimal)
             */
            type: this.type.number,
            // Match a number
            regex: /^-?\d+(\.\d+)?/,
            next: this.set.operations,
            compile(token, stack, output) {
                token.value = Number(token.value);
                output.push(token);
            },
            parse: this.fn.parse.pushValue
        },
        {
            type: this.type.operator.binary,
            // Match any of ??, ?:, +, *, /, -, %, ~, <, <=, >, >=, !=, ==, **, ?, :, and, b-and, or, b-or, b-xor, in, not in
            // and, or, in, not in, matches, starts with, ends with can be followed by a space or parenthesis
            regex: /(^\?\?|^\?:|^(b-and)|^(b-or)|^(b-xor)|^[+\-~%?]|^[:](?!\d\])|^[!=]==?|^[!<>]=?|^\*\*?|^\/\/?|^(and)[(|\s+]|^(or)[(|\s+]|^(in)[(|\s+]|^(not in)[(|\s+]|^(matches)|^(starts with)|^(ends with)|^\.\.)/,
            next: this.set.expressions,
            transform(match, tokens) {
                switch (match[0]) {
                    case 'and(':
                    case 'or(':
                    case 'in(':
                    case 'not in(':
                        // Strip off the ( if it exists
                        tokens[tokens.length - 1].value = match[2];
                        return match[0];
                    default:
                        return '';
                }
            },
            compile(token, stack, output) {
                delete token.match;

                token.value = token.value.trim();
                const { value } = token;
                const operator = twigExpressionOperator.lookup(value, token);

                TwigCore.log.trace('this.compile: ', 'Operator: ', operator, ' from ', value);

                while (stack.length > 0 &&
                    (stack[stack.length - 1].type === twigExpression.type.operator.unary || stack[stack.length - 1].type === twigExpression.type.operator.binary) &&
                    (
                        (operator.associativity === twigExpressionOperator.operator.leftToRight &&
                            operator.precidence >= stack[stack.length - 1].precidence) ||

                        (operator.associativity === twigExpressionOperator.operator.rightToLeft &&
                            operator.precidence > stack[stack.length - 1].precidence)
                    )
                ) {
                    const temp = stack.pop();
                    output.push(temp);
                }

                if (value === ':') {
                    // Check if this is a ternary or object key being set
                    if (stack[stack.length - 1] && stack[stack.length - 1].value === '?') {
                        // Continue as normal for a ternary
                    } else {
                        // This is not a ternary so we push the token to the output where it can be handled
                        //   when the assocated object is closed.
                        const keyToken = output.pop();

                        if (keyToken.type === twigExpression.type.string ||
                            keyToken.type === twigExpression.type.variable) {
                            token.key = keyToken.value;
                        } else if (keyToken.type === twigExpression.type.number) {
                            // Convert integer keys into string keys
                            token.key = keyToken.value.toString();
                        } else if (keyToken.expression &&
                            (keyToken.type === twigExpression.type.parameter.end ||
                                keyToken.type === twigExpression.type.subexpression.end)) {
                            token.params = keyToken.params;
                        } else {
                            throw new TwigError('Unexpected value before \':\' of ' + keyToken.type + ' = ' + keyToken.value);
                        }

                        output.push(token);
                    }
                } else {
                    stack.push(operator);
                }
            },
            parse(token, stack, context) {
                const state = this;

                if (token.key) {
                    // Handle ternary ':' operator
                    stack.push(token);
                } else if (token.params) {
                    // Handle "{(expression):value}"
                    return twigExpression.parseAsync.call(state, token.params, context)
                        .then(key => {
                            token.key = key;
                            stack.push(token);

                            // If we're in a loop, we might need token.params later, especially in this form of "(expression):value"
                            if (!context.loop) {
                                delete (token.params);
                            }
                        });
                } else {
                    twigExpressionOperator.parse(token.value, stack);
                }
            }
        },
        {
            type: this.type.operator.unary,
            // Match any of not
            regex: /(^not\s+)/,
            next: this.set.expressions,
            compile(token, stack, output) {
                delete token.match;

                token.value = token.value.trim();
                const { value } = token;
                const operator = twigExpressionOperator.lookup(value, token);

                TwigCore.log.trace('this.compile: ', 'Operator: ', operator, ' from ', value);

                while (stack.length > 0 &&
                    (stack[stack.length - 1].type === twigExpression.type.operator.unary || stack[stack.length - 1].type === twigExpression.type.operator.binary) &&
                    (
                        (operator.associativity === twigExpressionOperator.operator.leftToRight &&
                            operator.precidence >= stack[stack.length - 1].precidence) ||

                        (operator.associativity === twigExpressionOperator.operator.rightToLeft &&
                            operator.precidence > stack[stack.length - 1].precidence)
                    )
                ) {
                    const temp = stack.pop();
                    output.push(temp);
                }

                stack.push(operator);
            },
            parse(token, stack) {
                twigExpressionOperator.parse(token.value, stack);
            }
        },
        {
            /**
             * Match a string. This is anything between a pair of single or double quotes.
             */
            type: this.type.string,
            // See: http://blog.stevenlevithan.com/archives/match-quoted-string
            regex: /^(["'])(?:(?=(\\?))\2[\s\S])*?\1/,
            next: this.set.operationsExtended,
            compile(token, stack, output) {
                let { value } = token;
                delete token.match;

                // Remove the quotes from the string
                if (value.slice(0, 1) === '"') {
                    value = value.replace('\\"', '"');
                } else {
                    value = value.replace('\\\'', '\'');
                }

                token.value = value.slice(1, -1).replace(/\\n/g, '\n').replace(/\\r/g, '\r');
                TwigCore.log.trace('this.compile: ', 'String value: ', token.value);
                output.push(token);
            },
            parse: this.fn.parse.pushValue
        },
        {
            /**
             * Match a subexpression set start.
             */
            type: this.type.subexpression.start,
            regex: /^\({1}\[?\w*,?\s?\w*\]?\)\s{0,2}=>\s{0,2}([`\{$].*[`\}$]|\w*\s{0,2}[\+\-\/\*\=\!=)]\s{0,2}\w*)|^\(/,
            next: this.set.expressions.concat([this.type.subexpression.end]),
            validate(match,tokens){
                if(/^\({1}\[?\w*,?\s?\w*\]?\)\s{0,2}=>\s{0,2}([`\{$].*[`\}$]|\w*\s{0,2}[\+\-\/\*\=\!=)]\s{0,2}\w*)/.test(match)){
                    return false;
                }else {
                    return true;
                }

            },
            compile(token, stack, output) {
                token.value = '(';
                output.push(token);
                stack.push(token);
            },
            parse: this.fn.parse.push
        },
        {
            /**
             * Match a subexpression set end.
             */
            type: this.type.subexpression.end,
            regex: /^\)/,
            next: this.set.operationsExtended,
            validate(match, tokens) {
                // Iterate back through previous tokens to ensure we follow a subexpression start
                let i = tokens.length - 1;
                let foundSubexpressionStart = false;
                let nextSubexpressionStartInvalid = false;
                let unclosedParameterCount = 0;

                while (!foundSubexpressionStart && i >= 0) {
                    const token = tokens[i];

                    foundSubexpressionStart = token.type === twigExpression.type.subexpression.start;

                    // If we have previously found a subexpression end, then this subexpression start is the start of
                    // that subexpression, not the subexpression we are searching for
                    if (foundSubexpressionStart && nextSubexpressionStartInvalid) {
                        nextSubexpressionStartInvalid = false;
                        foundSubexpressionStart = false;
                    }

                    // Count parameter tokens to ensure we dont return truthy for a parameter opener
                    if (token.type === twigExpression.type.parameter.start) {
                        unclosedParameterCount++;
                    } else if (token.type === twigExpression.type.parameter.end) {
                        unclosedParameterCount--;
                    } else if (token.type === twigExpression.type.subexpression.end) {
                        nextSubexpressionStartInvalid = true;
                    }

                    i--;
                }

                // If we found unclosed parameters, return false
                // If we didnt find subexpression start, return false
                // Otherwise return true

                return (foundSubexpressionStart && (unclosedParameterCount === 0));
            },
            compile(token, stack, output) {
                // This is basically a copy of parameter end compilation
                let stackToken;
                const endToken = token;

                stackToken = stack.pop();
                while (stack.length > 0 && stackToken.type !== twigExpression.type.subexpression.start) {
                    output.push(stackToken);
                    stackToken = stack.pop();
                }

                // Move contents of parens into preceding filter
                const paramStack = [];
                while (token.type !== twigExpression.type.subexpression.start) {
                    // Add token to arguments stack
                    paramStack.unshift(token);
                    token = output.pop();
                }

                paramStack.unshift(token);

                // If the token at the top of the *stack* is a function token, pop it onto the output queue.
                // Get the token preceding the parameters
                stackToken = stack[stack.length - 1];

                if (stackToken === undefined ||
                    (stackToken.type !== twigExpression.type._function &&
                        stackToken.type !== twigExpression.type.filter &&
                        stackToken.type !== twigExpression.type.test &&
                        stackToken.type !== twigExpression.type.key.brackets)) {
                    endToken.expression = true;

                    // Remove start and end token from stack
                    paramStack.pop();
                    paramStack.shift();

                    endToken.params = paramStack;

                    output.push(endToken);
                } else {
                    // This should never be hit
                    endToken.expression = false;
                    stackToken.params = paramStack;
                }
            },
            parse(token, stack, context) {
                const state = this;

                if (token.expression) {
                    return twigExpression.parseAsync.call(state, token.params, context)
                        .then(value => {
                            stack.push(value);
                        });
                }

                throw new TwigError('Unexpected subexpression end when token is not marked as an expression');
            }
        },
        {
            /**
             * Match a parameter set start.
             */
            type: this.type.parameter.start,
            regex: /^\({1}\[?\w*,?\s?\w*\]?\)\s{0,2}=>\s{0,2}([`\{$].*[`\}$]|\w*\s{0,2}[\+\-\/\*\=\!=)]\s{0,2}\w*)|^\(/,
            next: this.set.expressions.concat([this.type.parameter.end]),
            validate(match, tokens) {
                if(/^\({1}\[?\w*,?\s?\w*\]?\)\s{0,2}=>\s{0,2}([`\{$].*[`\}$]|\w*\s{0,2}[\+\-\/\*\=\!=)]\s{0,2}\w*)/.test(match)){
                    return false;
                }
                const lastToken = tokens[tokens.length - 1];
                // We can't use the regex to test if we follow a space because expression is trimmed
                return lastToken && (!twigExpression.reservedWords.includes(lastToken.value.trim()));
            },
            compile: this.fn.compile.pushBoth,
            parse: this.fn.parse.push
        },
        {
            /**
             * Match a parameter set end.
             */
            type: this.type.parameter.end,
            regex: /^\)/,
            next: this.set.operationsExtended,
            compile(token, stack, output) {
                let stackToken;
                const endToken = token;

                stackToken = stack.pop();
                while (stack.length > 0 && stackToken.type !== twigExpression.type.parameter.start) {
                    output.push(stackToken);
                    stackToken = stack.pop();
                }

                // Move contents of parens into preceding filter
                const paramStack = [];
                while (token.type !== twigExpression.type.parameter.start) {
                    // Add token to arguments stack
                    paramStack.unshift(token);
                    token = output.pop();
                }

                paramStack.unshift(token);

                // Get the token preceding the parameters
                token = output[output.length - 1];

                if (token === undefined ||
                    (token.type !== twigExpression.type._function &&
                        token.type !== twigExpression.type.filter &&
                        token.type !== twigExpression.type.test &&
                        token.type !== twigExpression.type.key.brackets)) {
                    endToken.expression = true;

                    // Remove start and end token from stack
                    paramStack.pop();
                    paramStack.shift();

                    endToken.params = paramStack;

                    output.push(endToken);
                } else {
                    endToken.expression = false;
                    token.params = paramStack;
                }
            },
            parse(token, stack, context) {
                const newArray = [];
                let arrayEnded = false;
                let value = null;
                const state = this;

                if (token.expression) {
                    return twigExpression.parseAsync.call(state, token.params, context)
                        .then(value => {
                            stack.push(value);
                        });
                }

                while (stack.length > 0) {
                    value = stack.pop();
                    // Push values into the array until the start of the array
                    if (value && value.type && value.type === twigExpression.type.parameter.start) {
                        arrayEnded = true;
                        break;
                    }

                    newArray.unshift(value);
                }

                if (!arrayEnded) {
                    throw new TwigError('Expected end of parameter set.');
                }

                stack.push(newArray);
            }
        },
        {
            type: this.type.slice,
            regex: /^\[(\d*:\d*)\]/,
            next: this.set.operationsExtended,
            compile(token, stack, output) {
                const sliceRange = token.match[1].split(':');

                // SliceStart can be undefined when we pass parameters to the slice filter later
                const sliceStart = (sliceRange[0]) ? parseInt(sliceRange[0], 10) : undefined;
                const sliceEnd = (sliceRange[1]) ? parseInt(sliceRange[1], 10) : undefined;

                token.value = 'slice';
                token.params = [sliceStart, sliceEnd];

                // SliceEnd can't be undefined as the slice filter doesn't check for this, but it does check the length
                // of the params array, so just shorten it.
                if (!sliceEnd) {
                    token.params = [sliceStart];
                }

                output.push(token);
            },
            parse(token, stack) {
                const input = stack.pop();
                const { params } = token;
                const state = this;
                stack.push(Twig.filter(token.value, input, params));
            }
        },
        {
            /**
             * Match an array start.
             */
            type: this.type.array.start,
            regex: /^\[/,
            next: this.set.expressions.concat([this.type.array.end]),
            compile: this.fn.compile.pushBoth,
            parse: this.fn.parse.push
        },
        {
            /**
             * Match an array end.
             */
            type: this.type.array.end,
            regex: /^\]/,
            next: this.set.operationsExtended,
            compile(token, stack, output) {
                let i = stack.length - 1;
                let stackToken;
                // Pop tokens off the stack until the start of the object
                for (; i >= 0; i--) {
                    stackToken = stack.pop();
                    if (stackToken.type === twigExpression.type.array.start) {
                        break;
                    }

                    output.push(stackToken);
                }

                output.push(token);
            },
            parse(token, stack) {
                const newArray = [];
                let arrayEnded = false;
                let value = null;

                while (stack.length > 0) {
                    value = stack.pop();
                    // Push values into the array until the start of the array
                    if (value && value.type && value.type === twigExpression.type.array.start) {
                        arrayEnded = true;
                        break;
                    }

                    newArray.unshift(value);
                }

                if (!arrayEnded) {
                    throw new TwigError('Expected end of array.');
                }

                stack.push(newArray);
            }
        },
        // Token that represents the start of a hash map '}'
        //
        // Hash maps take the form:
        //    { "key": 'value', "another_key": item }
        //
        // Keys must be quoted (either single or double) and values can be any expression.
        {
            type: this.type.object.start,
            regex: /^\{/,
            next: this.set.expressions.concat([this.type.object.end]),
            compile: this.fn.compile.pushBoth,
            parse: this.fn.parse.push
        },

        // Token that represents the end of a Hash Map '}'
        //
        // This is where the logic for building the internal
        // representation of a hash map is defined.
        {
            type: this.type.object.end,
            regex: /^\}/,
            next: this.set.operationsExtended,
            compile(token, stack, output) {
                let i = stack.length - 1;
                let stackToken;

                // Pop tokens off the stack until the start of the object
                for (; i >= 0; i--) {
                    stackToken = stack.pop();
                    if (stackToken && stackToken.type === twigExpression.type.object.start) {
                        break;
                    }

                    output.push(stackToken);
                }

                output.push(token);
            },
            parse(endToken, stack) {
                const newObject = {};
                let objectEnded = false;
                let token = null;
                let hasValue = false;
                let value = null;

                while (stack.length > 0) {
                    token = stack.pop();
                    // Push values into the array until the start of the object
                    if (token && token.type && token.type === twigExpression.type.object.start) {
                        objectEnded = true;
                        break;
                    }

                    if (token && token.type && (token.type === twigExpression.type.operator.binary || token.type === twigExpression.type.operator.unary) && token.key) {
                        if (!hasValue) {
                            throw new TwigError('Missing value for key \'' + token.key + '\' in object definition.');
                        }

                        newObject[token.key] = value;

                        // Preserve the order that elements are added to the map
                        // This is necessary since JavaScript objects don't
                        // guarantee the order of keys
                        if (newObject._keys === undefined) {
                            newObject._keys = [];
                        }

                        newObject._keys.unshift(token.key);

                        // Reset value check
                        value = null;
                        hasValue = false;
                    } else {
                        hasValue = true;
                        value = token;
                    }
                }

                if (!objectEnded) {
                    throw new TwigError('Unexpected end of object.');
                }

                stack.push(newObject);
            }
        },

        // Token representing a filter
        //
        // Filters can follow any expression and take the form:
        //    expression|filter(optional, args)
        //
        // Filter parsing is done in the Twig.filters namespace.
        {
            type: this.type.filter,
            // Match a | then a letter or _, then any number of letters, numbers, _ or -
            regex: /^\|\s?([a-zA-Z_][a-zA-Z0-9_-]*)/,
            next: this.set.operationsExtended.concat([
                this.type.parameter.start
            ]),
            compile(token, stack, output) {
                token.value = token.match[1];
                output.push(token);
            },
            parse(token, stack, context) {
                const input = stack.pop();
                const state = this;

                return parseParams(state, token.params, context)
                    .then(params => {
                        return Twig.filter(token.value, input, params);
                    })
                    .then(value => {
                        stack.push(value);
                    });
            }
        },
        {
            type: this.type._function,
            // Match any letter or _, then any number of letters, numbers, _ or - followed by (
            regex: /^([a-zA-Z_]\w*)\s*\(/,
            next: this.type.parameter.start,
            validate(match) {
                // Make sure this function is not a reserved word
                return match[1] && (!twigExpression.reservedWords.includes(match[1]));
            },
            transform() {
                return '(';
            },
            compile(token, stack, output) {
                const fn = token.match[1];
                token.fn = fn;
                // Cleanup token
                delete token.match;
                delete token.value;

                output.push(token);
            },
            parse(token, stack, context) {
                const state = this;
                const { fn } = token;
                let value;

                return parseParams(state, token.params, context)
                    .then(params => {
                        if (Twig.functions[fn]) {
                            // Get the function from the built-in functions
                            value = Twig.functions[fn].apply(state, params);
                        } else if (typeof context[fn] === 'function') {
                            // Get the function from the user/context defined functions
                            value = context[fn](...params);
                        } else {
                            throw new TwigError(fn + ' function does not exist and is not defined in the context');
                        }

                        return value;
                    })
                    .then(result => {
                        stack.push(result);
                    });
            }
        },

        // Token representing a variable.
        //
        // Variables can contain letters, numbers, underscores and
        // dashes, but must start with a letter or underscore.
        //
        // Variables are retrieved from the render context and take
        // the value of 'undefined' if the given variable doesn't
        // exist in the context.
        {
            type: this.type.variable,
            // Match any letter or _, then any number of letters, numbers, _ or -
            regex: /((^\w*|^\({1}\[?\w*,?\s?\w*\]?\))\s{0,2}=>\s{0,2}([\{\`].*[\}\`]|\w*\s{0,2}[\+\-\*\/\=\!\=\`\{\}\$\>\<\>=\<=]\s{0,2}\w*)|^[a-zA-Z_]\w*)/g,
            next: this.set.operationsExtended.concat([
                this.type.parameter.start
            ]),
            compile: this.fn.compile.push,
            validate(match) {
                if ((/(^\w*|^\({1}\[?\w*,?\s?\w*\]?\))\s{0,2}=>\s{0,2}([\{\`].*[\}\`]|\w*\s{0,2}[\+\-\*\/\=\!\=\`\{\}\$\>\<\>=\<=]\s{0,2}\w*)/g).test(match)) {
                    return true;
                } else {
                    return (!twigExpression.reservedWords.includes(match[0]));
                }
            },
            parse(token, stack, context) {
                const state = this;
                // Get the variable from the context
                if ((/(^\w*|^\({1}\[?\w*,?\s?\w*\]?\))\s{0,2}=>\s{0,2}([\{\`].*[\}\`]|\w*\s{0,2}[\+\-\*\/\=\!\=\`\{\}\$\>\<\>=\<=]\s{0,2}\w*)/g).test(token.value)) {
                    return stack.push(eval(token.value));
                }
                    return twigExpression.resolveAsync.call(state, context[token.value], context)
                        .then(value => {
                            if (state.template.options.strictVariables && value === undefined) {
                                throw new TwigError('Variable "' + token.value + '" does not exist.');
                            }
                            stack.push(value);
                        });

            }
        },
        {
            type: this.type.key.period,
            regex: /^\.(\w+)/,
            next: this.set.operationsExtended.concat([
                this.type.parameter.start
            ]),
            compile(token, stack, output) {
                token.key = token.match[1];
                delete token.match;
                delete token.value;

                output.push(token);
            },
            parse(token, stack, context, nextToken) {
                const state = this;
                const { key } = token;
                const object = stack.pop();
                let value;

                if (object && !Object.prototype.hasOwnProperty.call(object, key) && state.template.options.strictVariables) {
                    const keys = Object.keys(object);
                    if (keys.length > 0) {
                        throw new TwigError('Key "' + key + '" for object with keys "' + Object.keys(object).join(', ') + '" does not exist.');
                    } else {
                        throw new TwigError('Key "' + key + '" does not exist as the object is empty.');
                    }
                }

                return parseParams(state, token.params, context)
                    .then(params => {
                        if (object === null || object === undefined) {
                            value = undefined;
                        } else {
                            const capitalize = function (value) {
                                return value.slice(0, 1).toUpperCase() + value.slice(1);
                            };

                            // Get the variable from the context
                            if (typeof object === 'object' && key in object) {
                                value = object[key];
                            } else if (object['get' + capitalize(key)]) {
                                value = object['get' + capitalize(key)];
                            } else if (object['is' + capitalize(key)]) {
                                value = object['is' + capitalize(key)];
                            } else {
                                value = undefined;
                            }
                        }

                        // When resolving an expression we need to pass nextToken in case the expression is a function
                        return twigExpression.resolveAsync.call(state, value, context, params, nextToken, object);
                    })
                    .then(result => {
                        stack.push(result);
                    });
            }
        },
        {
            type: this.type.key.brackets,
            regex: /^\[([^\]:]*)\]/,
            next: this.set.operationsExtended.concat([
                this.type.parameter.start
            ]),
            compile(token, stack, output) {
                const match = token.match[1];
                delete token.value;
                delete token.match;

                // The expression stack for the key
                token.stack = twigExpression.compile({
                    value: match
                }).stack;

                output.push(token);
            },
            parse(token, stack, context, nextToken) {
                // Evaluate key
                const state = this;
                let params = null;
                let object;
                let value;

                return parseParams(state, token.params, context)
                    .then(parameters => {
                        params = parameters;
                        return twigExpression.parseAsync.call(state, token.stack, context);
                    })
                    .then(key => {
                        object = stack.pop();

                        if (object && !Object.prototype.hasOwnProperty.call(object, key) && state.template.options.strictVariables) {
                            const keys = Object.keys(object);
                            if (keys.length > 0) {
                                throw new TwigError('Key "' + key + '" for array with keys "' + keys.join(', ') + '" does not exist.');
                            } else {
                                throw new TwigError('Key "' + key + '" does not exist as the array is empty.');
                            }
                        } else if (object === null || object === undefined) {
                            return null;
                        }

                        // Get the variable from the context
                        if (typeof object === 'object' && key in object) {
                            value = object[key];
                        } else {
                            value = null;
                        }

                        // When resolving an expression we need to pass nextToken in case the expression is a function
                        return twigExpression.resolveAsync.call(state, value, object, params, nextToken);
                    })
                    .then(result => {
                        stack.push(result);
                    });
            }
        },
        {
            /**
             * Match a null value.
             */
            type: this.type._null,
            // Match a number
            regex: /^(null|NULL|none|NONE)/,
            next: this.set.operations,
            compile(token, stack, output) {
                delete token.match;
                token.value = null;
                output.push(token);
            },
            parse: this.fn.parse.pushValue
        },
        {
            /**
             * Match the context
             */
            type: this.type.context,
            regex: /^_context/,
            next: this.set.operationsExtended.concat([
                this.type.parameter.start
            ]),
            compile: this.fn.compile.push,
            parse(token, stack, context) {
                stack.push(context);
            }
        },
        {
            /**
             * Match a boolean
             */
            type: this.type.bool,
            regex: /^(true|TRUE|false|FALSE)/,
            next: this.set.operations,
            compile(token, stack, output) {
                token.value = (token.match[0].toLowerCase() === 'true');
                delete token.match;
                output.push(token);
            },
            parse: this.fn.parse.pushValue
        }
    ];


    /**
     * Resolve a context value.
     *
     * If the value is a function, it is executed with a context parameter.
     *
     * @param {string} key The context object key.
     * @param {Object} context The render context.
     */
    resolveAsync = function (value, context, params, nextToken, object) {
        const state = this;

        if (typeof value !== 'function') {
            return TwigPromise.resolve(value);
        }

        let promise = TwigPromise.resolve(params);

        /*
        If value is a function, it will have been impossible during the compile stage to determine that a following
        set of parentheses were parameters for this function.

        Those parentheses will have therefore been marked as an expression, with their own parameters, which really
        belong to this function.

        Those parameters will also need parsing in case they are actually an expression to pass as parameters.
            */
        if (nextToken && nextToken.type === twigExpression.type.parameter.end) {
            // When parsing these parameters, we need to get them all back, not just the last item on the stack.
            const tokensAreParameters = true;

            promise = promise.then(() => {
                return nextToken.params && twigExpression.parseAsync.call(state, nextToken.params, context, tokensAreParameters);
            })
                .then(p => {
                    // Clean up the parentheses tokens on the next loop
                    nextToken.cleanup = true;

                    return p;
                });
        }

        return promise.then(params => {
            return value.apply(object || context, params || []);
        });
    };

    resolve(value, context, params, nextToken, object) {
        return AsyncTwig.potentiallyAsync(this, false, function () {
            return twigExpression.resolveAsync.call(this, value, context, params, nextToken, object);
        });
    };

     /**
     * Define a new expression type, available at Twig.logic.type.{type}
     *
     * @param {string} type The name of the new type.
     */
     extendType(type) {
        this.type[type] = 'this.type.' + type;
    };


    /**
     * Extend the expression parsing functionality with a new definition.
     *
     * Token definitions follow this format:
     *  {
     *      type:     One of this.type.[type], either pre-defined or added using
     *                    this.extendType
     *
     *      next:     Array of types from this.type that can follow this token,
     *
     *      regex:    A regex or array of regex's that should match the token.
     *
     *      compile: function(token, stack, output) called when this token is being compiled.
     *                   Should return an object with stack and output set.
     *
     *      parse:   function(token, stack, context) called when this token is being parsed.
     *                   Should return an object with stack and context set.
     *  }
     *
     * @param {Object} definition A token definition.
     */

    extend(definition) {
        if (!definition.type) {
            throw new TwigError('Unable to extend logic definition. No type provided for ' + definition);
        }

        this.handler[definition.type] = definition;
    };


    /**
     * Break an expression into tokens defined in this.definitions.
     *
     * @param {string} expression The string to tokenize.
     *
     * @return {Array} An array of tokens.
     */

    tokenize(expression) {
        const tokens = [];
        // Keep an offset of the location in the expression for error messages.
        let expOffset = 0;
        // The valid next tokens of the previous token
        let next = null;
        // Match information
        let type;
        let regex;
        let regexI;
        // The possible next token for the match
        let tokenNext;
        // Has a match been found from the definitions
        let matchFound;
        let invalidMatches = [];

        const matchFunction = function (...args) {
            // Don't pass arguments to `Array.slice`, that is a performance killer
            let matchI = arguments.length - 2;
            const match = new Array(matchI);
            while (matchI-- > 0) {
                match[matchI] = args[matchI];
            }

            TwigCore.log.trace('this.tokenize',
                'Matched a ', type, ' regular expression of ', match);

            if (next && !next.includes(type)) {
                invalidMatches.push(
                    type + ' cannot follow a ' + tokens[tokens.length - 1].type +
                    ' at template:' + expOffset + ' near \'' + match[0].slice(0, 20) +
                    '...\''
                );

                // Not a match, don't change the expression
                return match[0];
            }

            const handler = twigExpression.handler[type];

            // Validate the token if a validation function is provided
            if (handler.validate && !handler.validate(match, tokens)) {
                return match[0];
            }

            invalidMatches = [];

            tokens.push({
                type,
                value: match[0],
                match
            });

            matchFound = true;
            next = tokenNext;
            expOffset += match[0].length;

            // Does the token need to return output back to the expression string
            // e.g. a function match of cycle( might return the '(' back to the expression
            // This allows look-ahead to differentiate between token types (e.g. functions and variable names)
            if (handler.transform) {
                return handler.transform(match, tokens);
            }

            return '';
        };
        TwigCore.log.debug('this.tokenize', 'Tokenizing expression ', expression);

        while (expression.length > 0) {
            expression = expression.trim();
            for (type in twigExpression.handler) {
                if (Object.hasOwnProperty.call(twigExpression.handler, type)) {
                    tokenNext = twigExpression.handler[type].next;
                    regex = twigExpression.handler[type].regex;
                    TwigCore.log.trace('Checking type ', type, ' on ', expression);
                    matchFound = false;
                    if (Array.isArray(regex)) {
                        regexI = regex.length;
                        while (regexI-- > 0) {
                            expression = expression.replace(regex[regexI], matchFunction);
                        }
                    } else {
                        expression = expression.replace(regex, matchFunction);
                    }

                    // An expression token has been matched. Break the for loop and start trying to
                    //  match the next template (if expression isn't empty.)
                    if (matchFound) {
                        break;
                    }
                }
            }
            if (!matchFound) {
                if (invalidMatches.length > 0) {
                    throw new TwigError(invalidMatches.join(' OR '));
                } else {
                    throw new TwigError('Unable to parse \'' + expression + '\' at template position' + expOffset);
                }
            }
        }

        TwigCore.log.trace('this.tokenize', 'Tokenized to ', tokens);
        return tokens;
    };


    /**
     * Compile an expression token.
     *
     * @param {Object} rawToken The uncompiled token.
     *
     * @return {Object} The compiled token.
     */
    compile(rawToken) {
        const expression = rawToken.value;
        // Tokenize expression
        const tokens = twigExpression.tokenize(expression);
        let token = null;
        const output = [];
        const stack = [];
        let tokenTemplate = null;

        TwigCore.log.trace('this.compile: ', 'Compiling ', expression);

        // Push tokens into RPN stack using the Shunting-yard algorithm
        // See http://en.wikipedia.org/wiki/Shunting_yard_algorithm

        while (tokens.length > 0) {
            token = tokens.shift();
            tokenTemplate = twigExpression.handler[token.type];
            TwigCore.log.trace('this.compile: ', 'Compiling ', token);

            // Compile the template
            tokenTemplate.compile(token, stack, output);

            TwigCore.log.trace('this.compile: ', 'Stack is', stack);
            TwigCore.log.trace('this.compile: ', 'Output is', output);
        }

        while (stack.length > 0) {
            output.push(stack.pop());
        }

        TwigCore.log.trace('this.compile: ', 'Final output is', output);

        rawToken.stack = output;
        delete rawToken.value;

        return rawToken;
    };


    /**
     * Parse an RPN expression stack within a context.
     *
     * @param {Array} tokens An array of compiled expression tokens.
     * @param {Object} context The render context to parse the tokens with.
     *
     * @return {Object} The result of parsing all the tokens. The result
     *                  can be anything, String, Array, Object, etc... based on
     *                  the given expression.
     */
    parse(tokens, context, tokensAreParameters, allowAsync) {
        const state = this;

        // If the token isn't an array, make it one.
        if (!Array.isArray(tokens)) {
            tokens = [tokens];
        }

        // The output stack
        const stack = [];
        const loopTokenFixups = [];
        const binaryOperator = twigExpression.type.operator.binary;

        return AsyncTwig.potentiallyAsync(state, allowAsync, () => {
            return AsyncTwig.forEach(tokens, (token, index) => {
                let tokenTemplate = null;
                let nextToken = null;
                let result;

                // If the token is marked for cleanup, we don't need to parse it
                if (token.cleanup) {
                    return;
                }

                // Determine the token that follows this one so that we can pass it to the parser
                if (tokens.length > index + 1) {
                    nextToken = tokens[index + 1];
                }

                tokenTemplate = twigExpression.handler[token.type];

                if (tokenTemplate.parse) {
                    result = tokenTemplate.parse.call(state, token, stack, context, nextToken);
                }

                // Store any binary tokens for later if we are in a loop.
                if (token.type === binaryOperator && context.loop) {
                    loopTokenFixups.push(token);
                }

                return result;
            })
                .then(() => {
                    // Check every fixup and remove "key" as long as they still have "params". This covers the use case where
                    // a ":" operator is used in a loop with a "(expression):" statement. We need to be able to evaluate the expression
                    let len = loopTokenFixups.length;
                    let loopTokenFixup = null;

                    while (len-- > 0) {
                        loopTokenFixup = loopTokenFixups[len];
                        if (loopTokenFixup.params && loopTokenFixup.key) {
                            delete loopTokenFixup.key;
                        }
                    }

                    // If parse has been called with a set of tokens that are parameters, we need to return the whole stack,
                    // wrapped in an Array.
                    if (tokensAreParameters) {
                        const params = stack.splice(0);

                        stack.push(params);
                    }

                    // Pop the final value off the stack
                    return stack.pop();
                });
        });
    };

    parseAsync (tokens, context, tokensAreParameters) {
        const state = this;
        return twigExpression.parse.call(state, tokens, context, tokensAreParameters, true);
    };
}

const twigExpression = new TwigExpression();
export{twigExpression}
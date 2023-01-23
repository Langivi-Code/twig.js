import TwigError from "./TwigError.js";
import {TwigCore} from "./twig.core.js";
import {twig} from "./twig.js";
import { AsyncTwig } from "./async/twig.async.js";

function handleException(state, ex) {
    if (state.template.options.rethrow) {
        if (typeof ex === 'string') {
            ex = new TwigError(ex);
        }

        if (ex.type === 'TwigException' && !ex.file) {
            ex.file = state.template.id;
        }

        throw ex;
    } else {
        TwigCore.log.error('Error parsing twig template ' + state.template.id + ': ');
        if (ex.stack) {
            TwigCore.log.error(ex.stack);
        } else {
            TwigCore.log.error(ex.toString());
        }

        if (TwigCore.debug) {
            return ex.toString();
        }
    }
}


/**
 * Holds the state needed to parse a template.
 *
 * @param {TwigTemplate} template The template that the tokens being parsed are associated with.
 * @param {Object} blockOverrides Any blocks that should override those defined in the associated template.
 */
export default class TwigParseState {
    constructor(template, blockOverrides) {
        this.renderedBlocks = {};
        this.overrideBlocks = blockOverrides === undefined ? {} : blockOverrides;
        this.context = {};
        this.macros = {};
        this.nestingStack = [];
        this.template = template;
    }

    /**
     * Get a block by its name, resolving in the following order:
     *     - override blocks specified when initialized (except when excluded)
     *     - blocks resolved from the associated template
     *     - blocks resolved from the parent template when extending
     *
     * @param {String} name The name of the block to return.
     * @param {Boolean} checkOnlyInheritedBlocks Whether to skip checking the overrides and associated template, will not skip by default.
     *
     * @return {TwigCore.Block|undefined}
     */
    getBlock(name, checkOnlyInheritedBlocks) {
        let block;

        if (checkOnlyInheritedBlocks !== true) {
            // Blocks specified when initialized
            block = this.overrideBlocks[name];
        }

        if (block === undefined) {
            // Block defined by the associated template
            block = this.template.getBlock(name, checkOnlyInheritedBlocks);
        }

        if (block === undefined && this.template.parentTemplate !== null) {
            // Block defined in the parent template when extending
            block = this.template.parentTemplate.getBlock(name);
        }

        return block;
    };

    /**
     * Get all the available blocks, resolving in the following order:
     *     - override blocks specified when initialized
     *     - blocks resolved from the associated template
     *     - blocks resolved from the parent template when extending (except when excluded)
     *
     * @param {Boolean} includeParentBlocks Whether to get blocks from the parent template when extending, will always do so by default.
     *
     * @return {Object}
     */
    getBlocks(includeParentBlocks) {
        let blocks = {};

        if (includeParentBlocks !== false &&
            this.template.parentTemplate !== null &&
            // Prevent infinite loop
            this.template.parentTemplate !== this.template
        ) {
            // Blocks from the parent template when extending
            blocks = this.template.parentTemplate.getBlocks();
        }

        blocks = {
            ...blocks,
            // Override with any blocks defined within the associated template
            ...this.template.getBlocks(),
            // Override with any blocks specified when initialized
            ...this.overrideBlocks
        };

        return blocks;
    };

    /**
     * Get the closest token of a specific type to the current nest level.
     *
     * @param  {String} type  The logic token type
     *
     * @return {Object}
     */
    getNestingStackToken(type) {
        let matchingToken;

        this.nestingStack.forEach(token => {
            if (matchingToken === undefined && token.type === type) {
                matchingToken = token;
            }
        });

        return matchingToken;
    };

    /**
     * Parse a set of tokens using the current state.
     *
     * @param {Array} tokens The compiled tokens.
     * @param {Object} context The context to set the state to while parsing.
     * @param {Boolean} allowAsync Whether to parse asynchronously.
     *
     * @return {String} The rendered tokens.
     *
     */
    parse(tokens, context, allowAsync) {
        const state = this;
        let output = [];

        // Store any error that might be thrown by the promise chain.
        let err = null;

        // This will be set to isAsync if template renders synchronously
        let isAsync = true;
        let promise = null;
        // Track logic chains
        let chain = true;

        if (context) {
            state.context = context;
        }

        /*
         * Extracted into it's own function such that the function
         * does not get recreated over and over again in the `forEach`
         * loop below. This method can be compiled and optimized
         * a single time instead of being recreated on each iteration.
         */
        function outputPush(o) {
            output.push(o);
        }

        function parseTokenLogic(logic) {
            if (typeof logic.chain !== 'undefined') {
                chain = logic.chain;
            }

            if (typeof logic.context !== 'undefined') {
                state.context = logic.context;
            }

            if (typeof logic.output !== 'undefined') {
                output.push(logic.output);
            }
        }

        promise = AsyncTwig.forEach(tokens, token => {
            TwigCore.log.debug('Twig.ParseState.parse: ', 'Parsing token: ', token);

            switch (token.type) {
                case TwigCore.token.type.raw:
                    output.push(twig.filters.raw(token.value));
                    break;

                case TwigCore.token.type.logic:
                    return twig.logic.parseAsync.call(state, token.token /* logicToken */, state.context, chain)
                        .then(parseTokenLogic);
                case TwigCore.token.type.comment:
                    // Do nothing, comments should be ignored
                    break;

                // Fall through whitespace to output
                case TwigCore.token.type.outputWhitespacePre:
                case TwigCore.token.type.outputWhitespacePost:
                case TwigCore.token.type.outputWhitespaceBoth:
                case TwigCore.token.type.output:
                    TwigCore.log.debug('Twig.ParseState.parse: ', 'Output token: ', token.stack);
                    // Parse the given expression in the given context
                    return twig.expression.parseAsync.call(state, token.stack, state.context)
                        .then(outputPush);
                default:
                    break;
            }
        }).then(() => {
            output = twig.output.call(state.template, output);
            isAsync = false;
            return output;
        }).catch(error => {
            if (allowAsync) {
                handleException(state, error);
            }

            err = error;
        });

        // If `allowAsync` we will always return a promise since we do not
        // know in advance if we are going to run asynchronously or not.
        if (allowAsync) {
            return promise;
        }

        // Handle errors here if we fail synchronously.
        if (err !== null) {
            return handleException(state, err);
        }

        // If `allowAsync` is not true we should not allow the user
        // to use asynchronous functions or filters.
        if (isAsync) {
            throw new TwigError('You are using Twig.js in sync mode in combination with async extensions.');
        }

        return output;
    };

    parseAsync (tokens, context) {
        return this.parse(tokens, context, true);
    };
}
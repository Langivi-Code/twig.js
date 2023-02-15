import {TwigCore} from "./twig.core.js";
import {twig} from "./twig.js";
export default class TwigBlock {
    /**
     * A wrapper for template blocks.
     *
     * @param  {TwigCore.Template}template that the block was originally defined in.
     * @param  {Object} token The compiled block token.
     */
    constructor(template, token) {
        this.template = template;
        this.token = token;
    };

    /**
     * Render the block using a specific parse state and context.
     *
     * @param  {TwigCore.ParseState} parseState
     * @param  {Object} context
     *
     * @return {Promise}
     */
    render(parseState, context) {
        const originalTemplate = parseState.template;
        let promise;

        parseState.template = this.template;

        if (this.token.expression) {
            promise = twig.expression.parseAsync.call(parseState, this.token.output, context);
        } else {
            promise = parseState.parseAsync(this.token.output, context);
        }

        return promise
            .then(value => {
                return twig.expression.parseAsync.call(
                    parseState,
                    {
                        type: twig.expression.type.string,
                        value
                    },
                    context
                );
            })
            .then(output => {
                parseState.template = originalTemplate;

                return output;
            });
    };
}

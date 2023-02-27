import { assertEquals, assertObjectMatch } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";
import { twigExpression } from "../src/TwigExpression.js";
import TwigExpression from "../src/TwigExpression.js";

Deno.test('Twig.js Extensions ->', async (t) => {

    await t.step('should be able to extend a meta-type tag', async () => {
        const flags = {};

        twig.extend(Twig => {
            Twig.extendTag({
                type: 'flag',
                regex: /^flag\s+(.+)$/,
                next: [],
                open: true,
                compile(token) {
                    const expression = token.match[1];

                    // Compile the expression.
                    token.stack = Reflect.apply(twigExpression.compile, this, [{
                        type: TwigExpression.type.expression,
                        value: expression
                    }]).stack;

                    delete token.match;
                    return token;
                },
                parse(token, context, _) {
                    const name = Reflect.apply(twigExpression.parse, this, [token.stack, context]);
                    const output = '';

                    flags[name] = true;

                    return {
                        chain: false,
                        output
                    };
                }
            });
        });

        const testTemplate = await twig.twig({data: '{% flag \'enabled\' %}'});
        testTemplate.render();
        assertObjectMatch( flags, { enabled: true, });
    });

    await t.step('should be able to extend paired tags', async () => {
        // Demo data
        const App = {
            user: 'john',
            users: {
                john: {level: 'admin'},
                tom: {level: 'user'}
            }
        };

        twig.extend(Twig => {
            // Example of extending a tag type that would
            // restrict content to the specified "level"
            Twig.extendTag({
                type: 'auth',
                regex: /^auth\s+(.+)$/,
                next: ['endauth'], // Match the type of the end tag
                open: true,
                compile(token) {
                    const expression = token.match[1];

                    // Turn the string expression into tokens.
                    token.stack = Reflect.apply(twigExpression.compile, this, [{
                        type: TwigExpression.type.expression,
                        value: expression
                    }]).stack;

                    delete token.match;
                    return token;
                },
                parse(token, context, chain) {
                    const level = Reflect.apply(twigExpression.parse, this, [token.stack, context]);
                    let output = '';

                    if (App.users[App.currentUser].level === level) {
                        output = this.parse(token.output, context);
                    }

                    return {
                        chain,
                        output
                    };
                }
            });
            Twig.extendTag({
                type: 'endauth',
                regex: /^endauth$/,
                next: [],
                open: false
            });
        });

        const template = await twig.twig({data: 'Welcome{% auth \'admin\' %} ADMIN{% endauth %}!'});

        App.currentUser = 'john';
        assertEquals(template.render(), 'Welcome ADMIN!');

        App.currentUser = 'tom';
        assertEquals(template.render(), 'Welcome!');
    });

    await t.step('should be able to extend the same tag twice, replacing it', async () => {
        let result;

        twig.extend(Twig => {
            Twig.extendTag({
                type: 'noop',
                regex: /^noop$/,
                next: [],
                open: true,
                parse(_) {
                    return {
                        chain: false,
                        output: 'noop1'
                    };
                }
            });
        });

        result = await twig.twig({data: '{% noop %}'});
        assertEquals(result.render(), 'noop1');

        twig.extend(Twig => {
            Twig.extendTag({
                type: 'noop',
                regex: /^noop$/,
                next: [],
                open: true,
                parse(_) {
                    return {
                        chain: false,
                        output: 'noop2'
                    };
                }
            });
        });

        result = await twig.twig({data: '{% noop %}'});
        assertEquals(result.render(), 'noop2');
    });

    await t.step('should extend the parent context when extending', async () => {
        const testTemplate = await new Promise((res,rej) => {
            twig.twig({
                path: './deno_test/templates/extender.twig',
                async: false,
                load(tem){
                    res(tem);
                },
                error(e){
                    rej(e);
                }
            });
        });
        assertEquals(testTemplate.render().trim(), 'ok!')
    });
});

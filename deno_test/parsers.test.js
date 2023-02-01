import { assertEquals } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";
import { twigTemplates } from "../src/twig.templates.js";

Deno.test('Twig.js Parsers ->', async (t) => {
    await t.step('custom parser -> should define a custom parser', () => {
        twig.extend(Twig => {
            const parser = function (params) {
                return '[CUSTOM PARSER] ' + params.data;
            };

            twigTemplates.registerParser('custom', parser);
            assertEquals(twigTemplates.parsers.hasOwnProperty('custom'),true);
        });
    });

    await t.step('should run the data through the custom parser', () => {
        twig.extend(Twig => {
            const params = {
                data: 'This is a test template.'
            };
            const template = twigTemplates.parsers.custom(params);

            assertEquals(template,'[CUSTOM PARSER] This is a test template.');
        });
    });

    await t.step('should remove a registered parser', () => {
        twig.extend(Twig => {
            twigTemplates.unRegisterParser('custom');
            assertEquals(twigTemplates.parsers.hasOwnProperty('custom'), false);
        });
    });
});

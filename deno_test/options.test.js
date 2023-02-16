import { assertEquals } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test('Twig.js Optional Functionality ->', async (t) => {
    await t.step('should support inline includes by ID', async () => {
        await twig.twig({
            id: 'other',
            data: 'another template'
        });

        const template = await twig.twig({
            allowInlineIncludes: true,
            data: 'template with {% include "other" %}'
        });
        const output = await template.render();

        assertEquals(output, 'template with another template');
    });

    const variable = await twig.twig({
        rethrow: true,
        strict_variables: true,
        data: '{{ test }}'
    });

    const object = await twig.twig({
        rethrow: true,
        strict_variables: true,
        data: '{{ test.10 }}'
    });

    const array = await twig.twig({
        rethrow: true,
        strict_variables: true,
        data: '{{ test[10] }}'
    });

        
    await t.step(' should throw an error when `strict_variables` set to `true` For undefined variables', async () => {
        try {
            variable.render();
            throw new Error('should have thrown an error.');
        } catch (error) {
            assertEquals(error.message, 'Variable "test" does not exist.');
        }
    });

    await t.step('For empty objects', async () => {
        try {
            object.render({test: {}});
            throw new Error('should have thrown an error.');
        } catch (error) {
            assertEquals(error.message, 'Key "10" does not exist as the object is empty.');
        }
    });

    await t.step('For undefined object keys', async () => {
        try {
            object.render({test: {1: 'value', 2: 'value', 3: 'value'}});
            throw new Error('should have thrown an error.');
        } catch (error) {
            assertEquals(error.message, 'Key "10" for object with keys "1, 2, 3" does not exist.');
        }
    });

    await t.step('For empty arrays', async () => {
        try {
            array.render({test: []});
            throw new Error('should have thrown an error.');
        } catch (error) {
            assertEquals(error.message, 'Key "10" does not exist as the array is empty.');
        }
    });

    await t.step('For undefined array keys', async () => {
        try {
            await array.render({test: [1, 2, 3]});
            throw new Error('should have thrown an error.');
        } catch (error) {
            assertEquals(error.message, 'Key "10" for array with keys "0, 1, 2" does not exist.');
        }
    });
});

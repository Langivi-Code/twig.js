import { assertEquals, assertThrows } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test('Twig.js Expression Operators ->  Precedence ->', async (t) => {

    await t.step('should correctly order \'in\'', async () => {
        const testTemplate = await twig.twig({data: '{% if true or "anything" in ["a","b","c"] %}OK!{% endif %}'});
        const output = testTemplate.render({});

        assertEquals(output, 'OK!');
    });
});

Deno.test('// ->', async (t) => {
    await t.step('should handle positive values', async (t) => {
        const testTemplate = await twig.twig({data: '{{ 20 // 7 }}'});
        const output = testTemplate.render({});

        assertEquals(output, '2');
    });

    await t.step('should handle negative values', async (t) => {
        const testTemplate = await twig.twig({data: '{{ -20 // -7 }}'});
        const output = testTemplate.render({});

        assertEquals(output, '2');
    });

    await t.step('should handle mixed sign values', async (t) => {
        const testTemplate = await twig.twig({data: '{{ -20 // 7 }}'});
        const output = testTemplate.render({});

        assertEquals(output,'-3');
    });
});

Deno.test('?: ->', async (t) => {
    await t.step('should support the extended ternary operator for true conditions', async () => {
        const testTemplate = await twig.twig({data: '{{ a ? b }}'});
        const outputT = testTemplate.render({a: true, b: 'one'});
        const outputF = testTemplate.render({a: false, b: 'one'});

        assertEquals(outputT, 'one');
        assertEquals(outputF, '');
    });

    await t.step('should support the extended ternary operator for false conditions', async () => {
        const testTemplate = await twig.twig({data: '{{ a ?: b }}'});
        const outputT = testTemplate.render({a: 'one', b: 'two'});
        const outputF = testTemplate.render({a: false, b: 'two'});

        assertEquals(outputT, 'one');
        assertEquals(outputF, 'two');
    });

});

Deno.test('?? ->', async (t) => {

    await t.step('should support the null-coalescing operator for true conditions', async () => {
        const testTemplate = await twig.twig({data: '{{ a ?? b }}'});
        const outputT = testTemplate.render({a: 'one', b: 'two'});
        const outputF = testTemplate.render({a: false, b: 'two'});

        assertEquals(outputT, 'one');
        assertEquals(outputF, 'false');
    });

    await t.step('should support the null-coalescing operator for false conditions', async () => {
        const testTemplate = await twig.twig({data: '{{ a ?? b }}'});
        const outputT = testTemplate.render({a: undefined, b: 'two'});
        const outputF = testTemplate.render({a: null, b: 'two'});

        assertEquals(outputT, 'two');
        assertEquals(outputF, 'two');
    });

    await t.step('should support the null-coalescing operator for true conditions on objects or arrays', async () => {
        const testTemplate = await twig.twig({data: '{% set b = a ?? "nope" %}{{ b | join("") }}'});
        const outputArr = testTemplate.render({a: [1, 2]});
        const outputObj = testTemplate.render({a: {b: 3, c: 4}});
        const outputNull = testTemplate.render();

        assertEquals(outputArr, '12');
        assertEquals(outputObj, '34');
        assertEquals(outputNull, 'nope');
    });
});

Deno.test('b-and ->', async (t) => {
        
    await t.step('should return correct value if needed bit is set or 0 if not', async () => {
        const testTemplate = await twig.twig({data: '{{ a b-and b }}'});
        const output0 = testTemplate.render({a: 25, b: 1});
        const output1 = testTemplate.render({a: 25, b: 2});
        const output2 = testTemplate.render({a: 25, b: 4});
        const output3 = testTemplate.render({a: 25, b: 8});
        const output4 = testTemplate.render({a: 25, b: 16});

        assertEquals(output0, '1');
        assertEquals(output1, '0');
        assertEquals(output2, '0');
        assertEquals(output3, '8');
        assertEquals(output4, '16');
    });
});

Deno.test('b-or ->', async (t) => {
    
    await t.step('should return initial value if needed bit is set or sum of bits if not', async () => {
        const testTemplate = await twig.twig({data: '{{ a b-or b }}'});
        const output0 = testTemplate.render({a: 25, b: 1});
        const output1 = testTemplate.render({a: 25, b: 2});
        const output2 = testTemplate.render({a: 25, b: 4});
        const output3 = testTemplate.render({a: 25, b: 8});
        const output4 = testTemplate.render({a: 25, b: 16});

        assertEquals(output0, '25');
        assertEquals(output1, '27');
        assertEquals(output2, '29');
        assertEquals(output3, '25');
        assertEquals(output4, '25');
    });
});

Deno.test('b-xor ->', async (t) => {

    await t.step('should subtract bit if it\'s already set or add it if it\'s not', async () => {
        const testTemplate = await twig.twig({data: '{{ a b-xor b }}'});
        const output0 = testTemplate.render({a: 25, b: 1});
        const output1 = testTemplate.render({a: 25, b: 2});
        const output2 = testTemplate.render({a: 25, b: 4});
        const output3 = testTemplate.render({a: 25, b: 8});
        const output4 = testTemplate.render({a: 25, b: 16});

        assertEquals(output0, '24');
        assertEquals(output1, '27');
        assertEquals(output2, '29');
        assertEquals(output3, '17');
        assertEquals(output4, '9');
    });
});


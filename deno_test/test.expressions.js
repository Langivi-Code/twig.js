import { assertEquals, assertThrows } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";
const numericTestData = [
    {a: 10, b: 15},
    {a: 0, b: 0},
    {a: 1, b: 11},
    {a: 10444, b: 0.5},
    {a: 1034, b: -53},
    {a: -56, b: -1.7},
    {a: 34, b: 0},
    {a: 14, b: 14}
];

Deno.test('Twig.js Expressions ->', async (t) => {

    const stringData = [
        {a: 'test', b: 'string'},
        {a: 'test', b: ''},
        {a: '', b: 'string'},
        {a: '', b: ''}
    ];

    await t.step('Basic Operators ->  should parse parenthesis', async () => {
        const testTemplate = await twig.twig({data: '{{ a - (b + c) }}'});
        const d = {a: 10, b: 4, c: 2};
        const output = testTemplate.render(d);
        assertEquals(output,(d.a - (d.b + d.c)).toString());
    });

    await t.step('should parse nested parenthesis', async () => {
        const testTemplate = await twig.twig({data: '{{ a - ((b) + (1 + c)) }}'});
        const d = {a: 10, b: 4, c: 2};
        const output = testTemplate.render(d);
        assertEquals(output,(d.a - (d.b + 1 + d.c)).toString());
    });

    await t.step('should add numbers', async (t) => {
        const testTemplate = await twig.twig({data: '{{ a + b }}'});
        numericTestData.forEach(pair => {
            const output = testTemplate.render(pair);
            assertEquals(output, (pair.a + pair.b).toString());
        });
    });

    await t.step('should subtract numbers', async (t) => {
            const testTemplate = await twig.twig({data: '{{ a - b }}'});
            numericTestData.forEach(pair => {
                const output = testTemplate.render(pair);
                assertEquals(output, (pair.a - pair.b).toString());
            });
    });

    await t.step('should multiply numbers', async (t) => {
            const testTemplate = await twig.twig({data: '{{ a * b }}'});
            numericTestData.forEach(pair => {
                const output = testTemplate.render(pair);
                assertEquals(output, (pair.a * pair.b).toString());
            });
    });

    await t.step('should divide numbers', async () => {
        const testTemplate = await twig.twig({data: '{{ a / b }}'});
        numericTestData.forEach(pair => {
            const output = testTemplate.render(pair);
            assertEquals(output, (pair.a / pair.b).toString());
        });
    });

    await t.step('should divide numbers and  floored result', async () => {
        const testTemplate = await twig.twig({data: '{{ a // b }}'});
        numericTestData.forEach(pair => {
            const output = testTemplate.render(pair);
            // Get expected truncated result
            const c = Math.floor(pair.a / pair.b);

            assertEquals(output, (c.toString()));
        });
    });

    await t.step('should raise numbers to a power', async () => {
        const testTemplate = await twig.twig({data: '{{ a ** b }}'});
        const powTestData = [
            {a: 2, b: 3, c: 8},
            {a: 4, b: 0.5, c: 2},
            {a: 5, b: 1, c: 5}
        ];
        powTestData.forEach(pair => {
            const output = testTemplate.render(pair);
           assertEquals(output, pair.c.toString());
        });
    });

    await t.step('should concatanate values', async () => {
        let template = await twig.twig({data: '{{ "test" ~ a }}'});
        assertEquals(template.render({a: 1234}), 'test1234');
        template = await twig.twig({data: '{{ a ~ "test" ~ a }}'});
        assertEquals(template.render({a: 1234}), '1234test1234');
        template = await twig.twig({data: '{{ "this" ~ "test" }}'});
        assertEquals(template.render({a: 1234}), 'thistest');

        // Test numbers
        template = await twig.twig({data: '{{ a ~ b }}'});
        numericTestData.forEach(pair => {
            const output = template.render(pair);
            assertEquals(output, (pair.a.toString() + pair.b.toString()));
        });
        // Test strings
        template = await twig.twig({data: '{{ a ~ b }}'});
        stringData.forEach(pair => {
            const output = template.render(pair);
            assertEquals(output, (pair.a.toString() + pair.b.toString()));
        });
    });

    await t.step('should concatenate null and undefined values and not throw an exception', async () => {
        let template = await twig.twig({data: '{{ a ~ b }}'});
        assertEquals(template.render(), '');
        template = await twig.twig({data: '{{ a ~ b }}'});
        assertEquals(template.render({
            a: null,
            b: null
        }),'');
    });

    await t.step('should handle multiple chained operations', async () => {
        const data = {a: 4.5, b: 10, c: 12, d: -0.25, e: 0, f: 65, g: 21, h: -0.0002};
        const testTemplate = await twig.twig({data: '{{a/b+c*d-e+f/g*h}}'});
        const output = testTemplate.render(data);
        const expected = (data.a / data.b) + (data.c * data.d) - data.e + ((data.f / data.g) * data.h);
        assertEquals(output, expected.toString());
    });

    await t.step('should handle parenthesis in chained operations', async () => {
        const data = {a: 4.5, b: 10, c: 12, d: -0.25, e: 0, f: 65, g: 21, h: -0.0002};
        const testTemplate = await twig.twig({data: '{{a   /(b+c )*d-(e+f)/(g*h)}}'});
        const output = testTemplate.render(data);
        const expected = ((data.a / (data.b + data.c)) * data.d) - ((data.e + data.f) / (data.g * data.h));
        assertEquals(output, expected.toString());
    });

    await t.step('should handle positive numbers', async () => {
        const testTemplate = await twig.twig({data: '{{ 100 }}'});
        const output = testTemplate.render();
        assertEquals(output, '100');
    });

    await t.step('should handle negative numbers', async () => {
        const testTemplate = await twig.twig({data: '{{ -100 }}'});
        const output = testTemplate.render();
        assertEquals(output, '-100');
    });

    await t.step('should allow expressions after period accessors', async () => {
        let testTemplate;
        let output;

        testTemplate = await twig.twig({data: '{{ app.id and (true) }}'});
        output = testTemplate.render({app: {id: 1}});
        assertEquals(output, 'true');

        // Check that parenless data works as well
        testTemplate = await twig.twig({data: '{{ app.id and true }}'});
        output = testTemplate.render({app: {id: 1}});
        assertEquals(output, 'true');
    });
});

Deno.test('Comparison Operators ->', async (t) => {

    const equalityData = [
        {a: true, b: 'true'},
        {a: 1, b: '1'},
        {a: 1, b: 1},
        {a: 1, b: 1},
        {a: 'str', b: 'str'},
        {a: false, b: 'false'}
    ];

    const booleanData = [
        {a: true, b: true},
        {a: true, b: false},
        {a: false, b: true},
        {a: false, b: false}
    ];

    await t.step('should support less then', async (t) => {
        const testTemplate = await twig.twig({data: '{{ a < b }}'});
        numericTestData.forEach(pair => {
            const output = testTemplate.render(pair);
            assertEquals(output, (pair.a < pair.b).toString());
        });
    });

    await t.step('should support less then or equal', async () => {
        const testTemplate = await twig.twig({data: '{{ a <= b }}'});
        numericTestData.forEach(pair => {
            const output = testTemplate.render(pair);
            assertEquals(output, (pair.a <= pair.b).toString());
        });
    });

    await t.step('should support greater then', async () => {
        const testTemplate = await twig.twig({data: '{{ a > b }}'});
        numericTestData.forEach(pair => {
            const output = testTemplate.render(pair);
            assertEquals(output, (pair.a > pair.b).toString());
        });
    });

    await t.step('should support greater then or equal', async () => {
        const testTemplate = await twig.twig({data: '{{ a >= b }}'});
        numericTestData.forEach(pair => {
            const output = testTemplate.render(pair);
            assertEquals(output, (pair.a >= pair.b).toString());
        });
    });

    await t.step('should support equals', async () => {
        const testTemplate = await twig.twig({data: '{{ a == b }}'});
        booleanData.forEach(pair => {
            const output = testTemplate.render(pair);
            assertEquals(output, (pair.a === pair.b).toString());
        });

        equalityData.forEach(pair => {
            const output = testTemplate.render(pair);
            /* eslint-disable-next-line eqeqeq */
            assertEquals(output, (pair.a == pair.b).toString());
        });
    });
    await t.step('should support not equals', async () => {
        const testTemplate = await twig.twig({data: '{{ a != b }}'});
        booleanData.forEach(pair => {
            const output = testTemplate.render(pair);
            assertEquals(output, (pair.a !== pair.b).toString());
        });
        equalityData.forEach(pair => {
            const output = testTemplate.render(pair);
            /* eslint-disable-next-line eqeqeq */
            assertEquals(output, (pair.a != pair.b).toString());
        });
    });

    await t.step('should support boolean or', async () => {
        const testTemplate = await twig.twig({data: '{{ a or b }}'});
        booleanData.forEach(pair => {
            const output = testTemplate.render(pair);
            assertEquals(output, (pair.a || pair.b).toString());
        });

        assertEquals(testTemplate.render({a: 0, b: 1}), 'true');
        assertEquals(testTemplate.render({a: '0', b: 1}), 'true');
        assertEquals(testTemplate.render({a: '0', b: '0'}), 'false');
    });

    await t.step('should support boolean and', async () => {
        const testTemplate = await twig.twig({data: '{{ a and b }}'});
        booleanData.forEach(pair => {
            const output = testTemplate.render(pair);
            assertEquals(output, (pair.a && pair.b).toString());
        });

        assertEquals(testTemplate.render({a: 0, b: 1}), 'false');
        assertEquals(testTemplate.render({a: '0', b: 1}), 'false');
        assertEquals(testTemplate.render({a: '0', b: '0'}), 'false');
    });
    await t.step('should support boolean not', async () => {
        let testTemplate = await twig.twig({data: '{{ not a }}'});
        assertEquals(testTemplate.render({a: false}), 'true');
        assertEquals(testTemplate.render({a: true}),'false');
        assertEquals(testTemplate.render({a: '0'}),'true');

        testTemplate = await twig.twig({data: '{{ a and not b }}'});
        assertEquals(testTemplate.render({a: true, b: false}), 'true');
        assertEquals(testTemplate.render({a: true, b: true}), 'false');

        testTemplate = await twig.twig({data: '{{ a or not b }}'});
        assertEquals(testTemplate.render({a: false, b: false}),'true');
        assertEquals(testTemplate.render({a: false, b: true}), 'false');

        testTemplate = await twig.twig({data: '{{ a or not not b }}'});
        assertEquals(testTemplate.render({a: false, b: true}), 'true');
        assertEquals(testTemplate.render({a: false, b: false}),'false');
    });

    await t.step('should support boolean not in parentheses', async () => {
        let testTemplate;

        testTemplate = await twig.twig({data: '{{ (test1 or test2) and test3 }}'});
        assertEquals(testTemplate.render({test1: true, test2: false, test3: true}), 'true');
        assertEquals(testTemplate.render({test1: false, test2: false, test3: true}), 'false');
        assertEquals(testTemplate.render({test1: true, test2: false, test3: false}), 'false');

        testTemplate = await twig.twig({data: '{{ (test1 or test2) and not test3 }}'});
        assertEquals(testTemplate.render({test1: true, test2: false, test3: false}), 'true');
        assertEquals(testTemplate.render({test1: false, test2: false, test3: false}), 'false');
        assertEquals(testTemplate.render({test1: true, test2: false, test3: true}), 'false');

        testTemplate = await twig.twig({data: '{{ (not test1 or test2) and test3 }}'});
        assertEquals(testTemplate.render({test1: false, test2: false, test3: true}), 'true');
        assertEquals(testTemplate.render({test1: true, test2: false, test3: true}), 'false');
        assertEquals(testTemplate.render({test1: false, test2: false, test3: false}), 'false');

        testTemplate = await twig.twig({data: '{{ (test1 or not test2) and test3 }}'});
        assertEquals(testTemplate.render({test1: true, test2: true, test3: true}), 'true');
        assertEquals(testTemplate.render({test1: false, test2: true, test3: true}), 'false');
        assertEquals(testTemplate.render({test1: true, test2: true, test3: false}), 'false');

        testTemplate = await twig.twig({data: '{{ (not test1 or not test2) and test3 }}'});
        assertEquals(testTemplate.render({test1: false, test2: true, test3: true}), 'true');
        assertEquals(testTemplate.render({test1: true, test2: true, test3: true}), 'false');
        assertEquals(testTemplate.render({test1: false, test2: true, test3: false}), 'false');
    });

    await t.step('should support regular expressions', async () => {
        const testTemplate = await twig.twig({data: '{{ a matches "/^[\\d\\.]+$/" }}'});
        assertEquals(testTemplate.render({a: '123'}),'true');
        assertEquals(testTemplate.render({a: '1ab'}),'false');
    });

    await t.step('should support starts with', async () => {
        const testTemplate = await twig.twig({data: '{{ a starts with "f" }}'});
        assertEquals(testTemplate.render({a: 'foo'}),'true');
        assertEquals(testTemplate.render({a: 'bar'}), 'false');
        assertEquals(testTemplate.render({}), 'false');
    });

    await t.step('should support ends with', async () => {
        const testTemplate = await twig.twig({data: '{{ a ends with "o" }}'});
        assertEquals(testTemplate.render({a: 'foo'}), 'true');
        assertEquals(testTemplate.render({a: 'bar'}), 'false');
        assertEquals(testTemplate.render({}), 'false');
    });

    await t.step('should correctly cast arrays', async () => {
        const testTemplate = await twig.twig({data: '{{ a == true }}'});
        assertEquals(testTemplate.render({a: ['value']}), 'true');
        assertEquals(testTemplate.render({a: []}), 'false');
    });

    await t.step('should correctly cast arrays in control structures', async () => {
        const testTemplate = await twig.twig({data: '{% if a is defined and a %}true{% else %}false{% endif %}'});
        assertEquals(testTemplate.render({a: ['value']}), 'true');
    });
});

Deno.test('Other Operators ->', async (t) => {

    await t.step('should support the ternary operator', async () => {
        const testTemplate = await twig.twig({data: '{{ a ? b:c }}'});
        const outputT = testTemplate.render({a: true, b: 'one', c: 'two'});
        const outputF = testTemplate.render({a: false, b: 'one', c: 'two'});

        assertEquals(outputT, 'one');
        assertEquals(outputF, 'two');
    });

    await t.step('should support the ternary operator with objects in it', async () => {
        const testTemplate2 = await twig.twig({data: '{{ (a ? {"a":e+f}:{"a":1}).a }}'});
        const output2 = testTemplate2.render({a: true, b: false, e: 1, f: 2});

        assertEquals(output2, '3');
    });

    await t.step('should support the ternary operator inside objects', async () => {
        const testTemplate2 = await twig.twig({data: '{{ {"b" : a or b ? {"a":e+f}:{"a":1} }.b.a }}'});
        const output2 = testTemplate2.render({a: false, b: false, e: 1, f: 2});

        assertEquals(output2, '1');
    });

    await t.step('should support non-boolean values in ternary statement', async () => {
        const testTemplate = await twig.twig({data: '{{ test ? "true" : "false" }}'});

        assertEquals(testTemplate.render({test: 'one'}), 'true');
        assertEquals(testTemplate.render({test: 0}), 'false');
        assertEquals(testTemplate.render({test: 0}), 'false');
        assertEquals(testTemplate.render({test: ''}), 'false');
        assertEquals(testTemplate.render({test: '0'}), 'false');
        assertEquals(testTemplate.render({test: []}), 'false');
        assertEquals(testTemplate.render({test: null}), 'false');
        assertEquals(testTemplate.render({test: undefined}), 'false');
    });

    await t.step('should support in/containment functionality for arrays', async () => {
            let testTemplate;

            testTemplate = await twig.twig({data: '{{ "a" in ["a", "b", "c"] }}'});
            assertEquals(testTemplate.render(), true.toString());

            testTemplate = await twig.twig({data: '{{ "d" in ["a", "b", "c"] }}'});
            assertEquals(testTemplate.render(), false.toString());
    });

    await t.step('should support not in/containment functionality for arrays', async () => {
        let testTemplate;

        testTemplate = await twig.twig({data: '{{ "a" not in ["a", "b", "c"] }}'});
        assertEquals(testTemplate.render(), false.toString());

        testTemplate = await twig.twig({data: '{{ "d" not in ["a", "b", "c"] }}'});
        assertEquals(testTemplate.render(), true.toString());
    });

    await t.step('should support in/containment functionality for strings', async () => {
        let testTemplate;

        testTemplate = await twig.twig({data: '{{ "at" in "hat" }}'});
        assertEquals(testTemplate.render(), true.toString());

        testTemplate = await twig.twig({data: '{{ "d" in "not" }}'});
        assertEquals(testTemplate.render(), false.toString());
    });

    await t.step('should support not in/containment functionality for strings', async () => {
        let testTemplate;

        testTemplate = await twig.twig({data: '{{ "at" not in "hat" }}'});
        assertEquals(testTemplate.render(), false.toString());

        testTemplate = await twig.twig({data: '{{ "d" not in "not" }}'});
        assertEquals(testTemplate.render(), true.toString());
    });

    await t.step('should support in/containment functionality for objects', async () => {
        let testTemplate;

        testTemplate = await twig.twig({data: '{{ "value" in {"key" : "value", "2": "other"} }}'});
        assertEquals(testTemplate.render(), true.toString());

        testTemplate = await twig.twig({data: '{{ "d" in {"key_a" : "no"} }}'});
        assertEquals(testTemplate.render(), false.toString());
    });

    await t.step('should support not in/containment functionality for objects', async () => {
        let testTemplate;
        testTemplate = await twig.twig({data: '{{ "value" not in {"key" : "value", "2": "other"} }}'});
        assertEquals(testTemplate.render(), false.toString());

        testTemplate = await twig.twig({data: '{{ "d" not in {"key_a" : "no"} }}'});
        assertEquals(testTemplate.render(), true.toString());
    });

    await t.step('should support undefined and null for the in operator', async () => {
        const testTemplate = await twig.twig({data: '{{ 0 in undefined }} {{ 0 in null }}'});
        assertEquals(testTemplate.render(), ' ');
    });

    await t.step('should support expressions as object keys', async () => {
        let testTemplate;
        testTemplate = await twig.twig({data: '{% set a = {(foo): "value"} %}{{ a.bar }}'});
        assertEquals(testTemplate.render({foo: 'bar'}), 'value');

        testTemplate = await twig.twig({data: '{{ {(foo): "value"}.bar }}'});
        assertEquals(testTemplate.render({foo: 'bar'}), 'value');

        testTemplate = await twig.twig({data: '{{ {(not foo): "value"}.true }}'});
        assertEquals(testTemplate.render({foo: false}), 'value');
    });

    await t.step('should not corrupt the stack when accessing a property of an undefined object', async () => {
        const testTemplate = await twig.twig({data: '{% if true and somethingUndefined.property is not defined %}ok{% endif %}'});
        const output = testTemplate.render({});
        assertEquals(output, 'ok');
    });

    await t.step('should support keys as expressions', async () => {
        const testTemplate = await twig.twig({data: '{% for val in arr %}{{{(val.value):null}|json_encode}}{% endfor %}'});
        const output = testTemplate.render({arr: [{value: 'one'}, {value: 'two'}]});
        assertEquals(output, '{"one":null}{"two":null}');
    });

    await t.step('should support slice shorthand (full form)', async () => {
        const testTemplate = await twig.twig({data: '{{ "12345"[1:2] }}'});
        const output = testTemplate.render();
        assertEquals(output, '23');
    });

    await t.step('should support slice shorthand (omit first)', async () => {
        const testTemplate = await twig.twig({data: '{{ "12345"[:2] }}'});
        const output = testTemplate.render();
        assertEquals(output, '12');
    });

    await t.step('should support slice shorthand (omit last)', async () => {
        const testTemplate = await twig.twig({data: '{{ "12345"[2:] }}'});
        const output = testTemplate.render();
        assertEquals(output, '345');
    });

    await t.step('should support slice shorthand for arrays (full form)', async () => {
        const testTemplate = await twig.twig({data: '{{ [1, 2, 3, 4, 5][1:2] }}'});
        const output = testTemplate.render();
        assertEquals(output, '2,3');
    });

    await t.step('should support slice shorthand for arrays (omit first)', async () => {
        const testTemplate = await twig.twig({data: '{{ [1, 2, 3, 4, 5][:2] }}'});
        const output = testTemplate.render();
        assertEquals(output, '1,2');
    });

    await t.step('should support slice shorthand for arrays (omit last)', async () => {
        const testTemplate = await twig.twig({data: '{{ [1, 2, 3, 4, 5][2:] }}'});
        const output = testTemplate.render();
        assertEquals(output, '3,4,5');
    });

    await t.step('should support parenthesised expressions after test', async () => {
        const testTemplate = await twig.twig({data: '{% if true is defined and (true) %}ok!{% endif %}'});
        const output = testTemplate.render();
        assertEquals(output, 'ok!');
    });

    await t.step('should support keys as expressions in function parameters', async () => {
        const testTemplate = await twig.twig({data: '{{ func({(foo): \'stuff\'}) }}'});
        const output = testTemplate.render({
            func() {
                return 'ok!';
            },
            foo: 'bar'
        });

        assertEquals(output, 'ok!');
    });
});

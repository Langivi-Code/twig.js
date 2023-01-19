import { assertEquals, assertThrows} from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test('Twig.js Regression Tests ->', async (t) => {
    await t.step('#47 should not match variables starting with not', async () => {
        // Define and save a template
        const testTemplate = await twig.twig({data: '{% for note in notes %}{{note}}{% endfor %}'});
        assertEquals(testTemplate.render({notes: ['a', 'b', 'c']}), 'abc');
    });

    await t.step('#56 functions work inside parentheses', async () => {
        // Define and save a template
        twig.extendFunction('custom', _ => {
            return true;
        });

        const testTemplate = await twig.twig({data: '{% if (custom("val") and custom("val")) %}out{% endif %}'});
        assertEquals(testTemplate.render({}), 'out');
    });

    await t.step('#83 Support for trailing commas in arrays', async () => {
        const testTemplate = await twig.twig({data: '{{ [1,2,3,4,] }}'});
        assertEquals(testTemplate.render(), '1,2,3,4');
    });

    await t.step('#83 Support for trailing commas in objects', async () => {
       const testTemplate = await twig.twig({data: '{{ {a:1, b:2, c:3, } }}'});
       testTemplate.render();
    });

    await t.step('#283 should support quotes between raw tags', async () => {
        let testTemplate = await twig.twig({data: '{% raw %}\n"\n{% endraw %}'});
        assertEquals(testTemplate.render(), '"');
        testTemplate = await twig.twig({data: '{% raw %}\n\'\n{% endraw %}'});
        assertEquals(testTemplate.render(), '\'');
    });

    await t.step('#737 ternary expression should not override context', async () => {
        const str = `{% set classes = ['a', 'b'] %}{% set classes = classes ? classes|merge(['c']) : '' %}{{ dump(classes) }}`;
        const expected = twig.functions.dump(['a', 'b', 'c']);
        const testTemplate = await twig.twig({data: str});
        assertEquals(testTemplate.render(), expected);
    });
});

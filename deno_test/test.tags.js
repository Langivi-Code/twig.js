import { assertEquals, assertThrows} from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test('Twig.js Tags ->', async (t) => {

    await t.step('should support spaceless', async () => {
        const testTemplate = await twig.twig({ data: '{% spaceless %}<div>\n    <b>b</b>   <i>i</i>\n</div>{% endspaceless %}'});
        assertEquals(testTemplate.render(), '<div><b>b</b><i>i</i></div>');
    });

    await t.step('should not escape static values when using spaceless', async () => {
        const testTemplate = await twig.twig({ autoescape: true, data: '{% spaceless %}<div>{% endspaceless %}'});
        assertEquals(testTemplate.render(), '<div>');
    });

    await t.step('should support with', async () => {
        const testTemplate = await twig.twig({ autoescape: true, data: '{% set prefix = "Hello" %}{% with { name: "world" } %}{{prefix}} {{name}}{% endwith %}'});
        assertEquals(testTemplate.render(), 'Hello world');
    });

    await t.step('should limit scope of with only', async () => {
        const testTemplate = await twig.twig({
            autoescape: true,
            data: '{% set prefix = "Hello" %}{% with { name: "world" } only %}{{prefix}} {{name}}{% endwith %}'
        });
        assertEquals(testTemplate.render(), ' world');
    });

    await t.step('should support apply upper', async () => {
        const testTemplate = await twig.twig({
            data: '{% apply upper %}twigjs{% endapply %}'
        });
        assertEquals(testTemplate.render(), 'TWIGJS');
    });

    await t.step('should support apply lower|escape', async () => {
        const testTemplate = await twig.twig({
            data: '{% apply lower|escape %}<strong>Twig.js</strong>{% endapply %}'
        });
        assertEquals(testTemplate.render(), '&lt;strong&gt;twig.js&lt;/strong&gt;');
    });

    await t.step('should support do', async () => {
        let testTemplate = await twig.twig({data: '{% do 1 + 2 %}'});
        assertEquals(testTemplate.render(), '');
        testTemplate = await twig.twig({data: '{% do arr %}'});
        assertEquals(testTemplate.render({arr:[1]}), '');
        testTemplate = await twig.twig({data: `{% do arr.foo("multiline", argument) %}`});
        assertEquals(testTemplate.render(), '');
    });
    
});

import { assertEquals } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test('Twig.js Logic -> set ->', async (t) => {
    
    await t.step('should define variable', async () => {
        const testTemplate = await twig.twig({ data: '{% set list = _context %}{{ list|json_encode }}' });
        assertEquals(testTemplate.render({a: 10, b: 4, c: 2}),JSON.stringify({a: 10, b: 4, c: 2}));
    });
    
    await t.step('if -> should ignore spaces', async () => {
        let testTemplate = await twig.twig({data: '{% if (1 == 1) %}true{% endif %}'});
        assertEquals(testTemplate.render(), 'true');
        testTemplate = await twig.twig({data: '{% if(1 == 1) %}true{% endif %}'});
        assertEquals(testTemplate.render(), 'true');
    });
    
    await t.step('elseif -> should ignore spaces', async () => {
        let testTemplate = await twig.twig({data: '{% if (1 == 2) %}false{% elseif (1 == 1) %}true{% endif %}'});
        assertEquals(testTemplate.render(), 'true');
        testTemplate = await twig.twig({data: '{% if (1 == 2) %}false{% elseif(1 == 1) %}true{% endif %}'});
        assertEquals(testTemplate.render(), 'true');
    });
});

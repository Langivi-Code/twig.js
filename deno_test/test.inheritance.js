import { assertEquals, assertArrayIncludes, assertThrows, assertObjectMatch, assertExists } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test('Twig.js Blocks ->', async (t) => {
    await t.step('"extends" applies recursively to grand-parents', async () => {
            await twig.twig({
                id: 'grand-parent.twig',
                data: '{% block content %}grand-parent.twig{% endblock%}'
            });
            await twig.twig({
                id: 'parent.twig',
                data: '{% extends "grand-parent.twig" %}'
            });

            const testTemplate = await twig.twig({
                allowInlineIncludes: true,
                data: '{% extends "parent.twig" %}{% block content %}main.twig > {{ parent() }}{% endblock %}'
            });

            assertEquals(testTemplate.render(), 'main.twig > grand-parent.twig');
    });
});

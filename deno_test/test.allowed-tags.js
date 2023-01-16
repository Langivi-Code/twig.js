import { assertEquals, assertNotEquals,assertThrows,assertRejects} from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import {twig} from "../src/twig.js";

Deno.test('Twig.js Allowed-Tags', async (t)=>{
    await t.step("Should apply allowed_tags argument", async ()=>{
        const content = '<a href="#">linktest</a> <b>boldtest</b> <p>paragraphtest</p>';
        const template = await twig.twig({
            data: 'template with {{content|striptags("<a>,<b>,<p>")}}'
        });
        const output = template.render({content});
        assertEquals(output,'template with <a href="#">linktest</a> <b>boldtest</b> <p>paragraphtest</p>');
    } );
    await t.step ('should remove tags if no argument passed',async(t)=>{
        const content = '<a href="#">linktest</a> <b>boldtest</b> <p>paragraphtest</p>';

        const template = await twig.twig({
            data: 'template with {{content|striptags}}'
        });
        const output = template.render({content});

        assertEquals(output,'template with linktest boldtest paragraphtest');
    });
})
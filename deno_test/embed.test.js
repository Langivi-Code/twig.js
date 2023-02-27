import { assertEquals } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";
import { twigCache } from "../src/twig.cache.js";

Deno.test('Twig.js Embed ->', async (t)=>{
   await t.step('it should load embed and render', async () => {
        await new Promise((res,rej) => {
            twig.twig({
                id: 'embed',
                path: './deno_test/templates/embed-simple.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        const template = await twig.twig({ref: 'embed'});
        assertEquals(template.render({ }).trim(),[
            'START',
            'A',
            'new header',
            'base footer',
            'B',
            '',
            'A',
            'base header',
            'base footer',
            'extended',
            'B',
            '',
            'A',
            'base header',
            'extended',
            'base footer',
            'extended',
            'B',
            '',
            'A',
            'Super cool new header',
            'Cool footer',
            'B',
            'END'
        ].join('\n'))
    });

   await t.step('should skip non-existent embeds flagged with "ignore missing"', async()=>{
        [
            '',
            ' with {}',
            ' with {} only',
            ' only'
        ].forEach(async options => {
            const template = await twig.twig({
                allowInlineIncludes: true,
                data: 'ignore-{% embed "embed-not-there.twig" ignore missing' + options + ' %}{% endembed %}missing'
            })
            assertEquals(template.render(), 'ignore-missing');
        });

    });

   await t.step('should include the correct context using "with" and "only"', async()=>{
        await twig.twig({
            data: '|{{ foo }}||{{ baz }}|',
            id: 'embed1.twig'
        });

        const testData = [
            {
                expected: '|bar||qux|',
                options: ''
            },
            {
                expected: '|bar||qux|',
                options: ' with {}'
            },
            {
                expected: '|bar||override|',
                options: ' with {"baz": "override"}'
            },
            {
                expected: '||||',
                options: ' only'
            },
            {
                expected: '||||',
                options: ' with {} only'
            },
            {
                expected: '|override|||',
                options: ' with {"foo": "override"} only'
            }
        ];
        for(let i=0; i<testData.length; i++){
            const template = await twig.twig({
                        allowInlineIncludes: true,
                        data: '{% embed "embed1.twig"' + testData[i].options + ' %}{% endembed %}',
                    });
                    assertEquals(template.render({foo: 'bar',baz: 'qux'}),testData[i].expected);
        }
    });

   await t.step('should override blocks in a for loop', async()=>{
        await twig.twig({
            data: '<{% block content %}original{% endblock %}>',
            id: 'embed.twig'
        });
        const template = await twig.twig({
            allowInlineIncludes: true,
            data: '{% for i in 1..3 %}{% embed "embed.twig" %}{% block content %}override{% endblock %}{% endembed %}{% endfor %}'
        });
        assertEquals(template.render(), '<override><override><override>');
    });

   await t.step('should support complex nested embeds', async()=>{
        await twig.twig({
            data: '<{% block header %}outer-header{% endblock %}><{% block footer %}outer-footer{% endblock %}>',
            id: 'embed-outer.twig'
        });
        await twig.twig({
            data: '{% block content %}inner-content{% endblock %}',
            id: 'embed-inner.twig'
        });

        const template = await twig.twig({
            allowInlineIncludes: true,
            data: '{% embed "embed-outer.twig" %}{% block header %}{% embed "embed-inner.twig" %}{% block content %}override-header{% endblock %}{% endembed %}{% endblock %}{% block footer %}{% embed "embed-inner.twig" %}{% block content %}override-footer{% endblock %}{% endembed %}{% endblock %}{% endembed %}'
        });
        assertEquals(template.render(), '<override-header><override-footer>');
    });
    
   await t.step('should support multiple inheritance and embeds', async()=>{
        twigCache.emptyCacheDir();
        await twig.twig({
            data: '<{% block header %}base-header{% endblock %}>{% block body %}<base-body>{% endblock %}<{% block footer %}base-footer{% endblock %}>',
            id: 'base.twig'
        });
        await twig.twig({
            data: '{% extends "base.twig" %}{% block header %}layout-header{% endblock %}{% block body %}<{% block body_header %}layout-body-header{% endblock %}>{% block body_content %}layout-body-content{% endblock %}<{% block body_footer %}layout-body-footer{% endblock %}>{% endblock %}',
            id: 'layout.twig'
        });
        await twig.twig({
            data: '<{% block section_title %}section-title{% endblock %}><{% block section_content %}section-content{% endblock %}>',
            id: 'section.twig'
        });

        const template = await twig.twig({
            allowInlineIncludes: true,
            data: '{% extends "layout.twig" %}{% block body_header %}override-body-header{% endblock %}{% block body_content %}{% embed "section.twig" %}{% block section_content %}override-section-content{% endblock %}{% endembed %}{% endblock %}'
        });

        assertEquals(template.render(), '<layout-header><override-body-header><section-title><override-section-content><layout-body-footer><base-footer>');
    });
})
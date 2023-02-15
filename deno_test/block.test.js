import { assertEquals } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test("Twig.js Blocks ->", async (t) => {
    await t.step(
        "should load a parent template and render from ref",
        async t => {
            const load = template => template;
            const error = error => console.log("ERROR", error);
            const template = await twig.twig({
                id: "remote-no-extends",
                path: "./templates/template.twig",
                async: false,
                load,
                error
            });
            const resultTemp = await twig.twig({ ref: "remote-no-extends" });
            assertEquals(resultTemp.render({}), "Default Title - body");
        }
    );

    await t.step("should understand {% endblock title %} syntax", async t => {
        await new Promise ((res,rej) => {
            twig.twig({
                id: "endblock-extended-syntax",
                path: "./templates/blocks-extended-syntax.twig",
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        const resultTemplate = await twig.twig({ ref: "endblock-extended-syntax" });
        assertEquals(resultTemplate.render({}), "This is the only thing.");
    });

    await t.step(
        "should load a child template and replace the parent block's content",
        async () => {
            const testTemplate = await new Promise ((res,rej) => {
                twig.twig({
                    id: "child-extends",
                    path: "./templates/child.twig",
                    load(template) {
                        res(template);
                    },
                    error(e){
                        rej(e);
                    }
                });
            });
            assertEquals(testTemplate.render({ base: "template.twig" }), "Other Title - child");
    });

    await t.step("should have access to a parent block content", async () => {
        const testTemplate = await new Promise((res,rej) => { 
            twig.twig({
                id: "child-parent",
                path: "./templates/child-parent.twig",
                load(template) {
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        assertEquals(
            testTemplate.render({
                base: "template.twig",
                inner: ":value"
            }),
            "Other Title - body:value:child"
        );
    });

    await t.step("should render nested blocks", async () => {
        const testTemplate = await new Promise ((res, rej) => {
            twig.twig({
                id: "blocks-nested",
                path: "./templates/blocks-nested.twig",
                load(template) {
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        assertEquals(testTemplate.render({}), "parent:child");
    });

    await t.step("should render extended nested blocks", async () => {
        const testTemplate = await new Promise((res,rej) => {
            twig.twig({
                id: "child-blocks-nested",
                path: "./templates/child-blocks-nested.twig",
                load(template) {
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        assertEquals(testTemplate.render({ base: "template.twig" }), "Default Title - parent:child")
    });

    await t.step(
        "should be able to extend to a absolute template path",
        async () => {
            const testTemplate = await new Promise ((res,rej) => {
                twig.twig({
                    base: "./templates",
                    path: "./templates/a/child.twig",
                    load(template) {
                        res(template);
                    },
                    error(e){
                        rej(e);
                    }
                });
            });

            assertEquals(
                testTemplate.render({ base: "b/template.twig" }),
                "Other Title - child"
            );
        }
    );

    await t.step("should extends blocks inline", async t => {
        const result1 = await twig.twig({
            id: "inline-parent-template",
            data: "Title: {% block title %}parent{% endblock %}"
        });
        const result = await twig.twig({
            allowInlineIncludes: true,
            data:
                '{% extends "inline-parent-template" %}{% block title %}child{% endblock %}'
        });
        assertEquals(result.render(), "Title: child");
    });

    await t.step("should override blocks in loop when extending", async () => {
        const result1 = await twig.twig({
            id: "block-loop.twig",
            data:
                '{% for label in ["foo", "bar", "baz"] %}<{% block content %}base-{{ label }}-{{ loop.index }}{% endblock %}>{% endfor %}'
        });
        const result = await twig.twig({
            allowInlineIncludes: true,
            data:
                '{% extends "block-loop.twig" %}{% block content %}overriding-{{ parent() }}-at-index-{{ loop.index0 }}{% endblock %}'
        });
        assertEquals(
            result.render(),
            "<overriding-base-foo-1-at-index-0><overriding-base-bar-2-at-index-1><overriding-base-baz-3-at-index-2>"
        );
    });

    await t.step(
        "should include blocks from another template for horizontal reuse",
        async () => {
            const testTemplate = await new Promise((res,rej) => {
                twig.twig({
                    id: "use",
                    path: "./templates/use.twig",
                    load(template) {
                        res(template);
                    },
                    error(e){
                        rej(e);
                    }
                })
            });
            assertEquals(
                testTemplate.render({ place: "diner" }),
                "Coming soon to a diner near you!"
            );
        }
    );

    await t.step("should allow overriding of included blocks", async () => {
        const testTemplate = await new Promise((res,rej) =>{
            twig.twig({
                id: 'use-override-block',
                path: './templates/use-override-block.twig',
                load(template) {
                  res(template);
                },
                error(e){
                    rej(e)
                }
            });
        });
        assertEquals(testTemplate.render({place: 'diner'}),'Sorry, can\'t come to a diner today.');
    });

    await t.step('should allow "parent()" call when importing blocks', async () => {
        const testTemplate = await new Promise((res,rej) => {
            twig.twig({
                id: 'use-override-nested-block',
                path: './templates/use-override-nested-block.twig',
                load(template) {
                   res(template);
                },
                error(e){
                    rej(e)
                }
            });
        });
        assertEquals(testTemplate.render({}),'parent:new-child1:new-child2');
    });

    await t.step(
        'should allow "parent()" call when importing blocks',
        async t => {
            await twig.twig({
                id: "blocks.twig",
                data: '{% block content "blocks.twig" %}'
            });
            await twig.twig({
                id: "base.twig",
                data:
                    '{% use "blocks.twig" %}{% block content %}base.twig > {{ parent() }}{% endblock %}'
            });

            const result = await twig.twig({
                allowInlineIncludes: true,
                data:
                    '{% extends "base.twig" %}{% block content %}main.twig > {{ parent() }}{% endblock %}'
            });

            assertEquals(
                result.render(),
                "main.twig > base.twig > blocks.twig"
            );
        }
    );

    await t.step(
        'should allow "use" in template with "extends"',
        async t => {
            twig.cacher.emptyCacheDir();
            await twig.twig({
                id: 'blocks.twig',
                data: '{% block content "blocks.twig" %}'
            });
            await twig.twig({
                id: 'base.twig',
                data: '<{% block content %}base.twig{% endblock %}><{% block footer %}footer{% endblock %}>'
            });

            const result = await twig.twig({
                allowInlineIncludes: true,
                data: '{% extends "base.twig" %}{% use "blocks.twig" %}{% block content %}main.twig - {{ parent() }}{% endblock %}'
            });
            assertEquals(result.render(),'<main.twig - blocks.twig><footer>');
        }
    );

    await t.step(
        'should allow "use" in template with "extends" and nested blocks',
        async () => {
            twig.cacher.emptyCacheDir();
            await twig.twig({
                id: 'blocks.twig',
                data: '{% block sidebar %}blocks-sidebar{% endblock %}{% block header %}blocks-header{% endblock %}{% block content %}blocks-content{% endblock %}{% block footer %}blocks-footer{% endblock %}{% block masthead %}<blocks-masthead>{% endblock %}'
            });
            await twig.twig({
                id: 'base.twig',
                data: '<{% block sidebar %}base-sidebar{% endblock %}><{% block header %}base-header{% endblock %}><{% block content %}base-content{% endblock %}><{% block footer "base-footer" %}>'
            });

            const result = await twig.twig({
                allowInlineIncludes: true,
                data: '{% extends "base.twig" %}{% use "blocks.twig" %}{% block sidebar %}main-sidebar{% endblock %}{% block header %}main-header - {{ parent() }}{% endblock %}{% block footer %}main-footer{% block masthead %}{{ parent() }}{% endblock %}{% endblock %}'
            })
            assertEquals(result.render(),'<main-sidebar><main-header - blocks-header><blocks-content><main-footer<blocks-masthead>>');
        }
    );
});


Deno.test("block function ->", async (t)=>{
    await t.step('should render block content from an included block', async ()=>{
        const testTemplate = await new Promise((res,rej) => {
            twig.twig({
                path: './templates/block-function.twig',
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        assertEquals(testTemplate.render({
            base: 'block-function-parent.twig',
            val: 'abcd'
        }),'Child content = abcd / Result: Child content = abcd');
    })

    await t.step('should render block content from a parent block', async ()=>{
        const testTemplate = await new Promise((res,rej) => {
            twig.twig({
                path: './templates/block-parent.twig',
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        assertEquals(testTemplate.render({
            base: 'block-function-parent.twig',
        }),'parent block / Result: parent block');
    })

    await t.step('should render block content with outer context', async ()=>{
        let result;
        const testTemplate = await new Promise((res,rej) => {
            twig.twig({
                path: './templates/block-outer-context.twig',
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        assertEquals(testTemplate.render({
            base: 'block-outer-context.twig',
            items: ['twig', 'js', 'rocks']
        }),'Hello twig!Hello js!Hello rocks!twigjsrocks');
    })

    await t.step('should respect changes of the context made before calling the function', async ()=>{
        const result = await twig.twig({
            data: '{% set foo = "original" %}{% block test %}{{ foo }}{% endblock %} {% set foo = "changed" %}{{ block("test") }}'
        });
        assertEquals(result.render(),'original changed');
    })
})


Deno.test("block shorthand ->", async (t)=>{
    await t.step('should render block content using shorthand syntax', async ()=>{
        const result = await twig.twig({
            data: '{% set prefix = "shorthand" %}{% block title (prefix ~ " - " ~ block_value)|title %}'
        });
        assertEquals(result.render( {block_value: 'test succeeded'}),'Shorthand - Test Succeeded');
    })

    await t.step('should overload blocks from an extended template using shorthand syntax', async ()=>{
        await twig.twig({
            data: '{% block title %}Default Title{% endblock %} - {% block body %}body{{inner}}{% endblock %}',
            id: 'template.twig'
        });
        await twig.twig({
            allowInlineIncludes: true,
            data: '{% extends base %}{% block title %}Other Title{% endblock %}{% block body %}child{% endblock %}',
            id: 'child.twig'
        });

        const result = await twig.twig({
            allowInlineIncludes: true,
            data: '{% extends "child.twig" %}{% block title "New Title" %}{% block body "new body uses the " ~ base ~ " template" %}'
        });

        assertEquals(result.render({ base: 'template.twig' }),'New Title - new body uses the template.twig template' )
    })
})
import { assertEquals } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test('Twig.js Macro ->', async (t) => {
    // Test loading a template from a remote endpoint
    await t.step('it should load macro', async () => {
        await new Promise ( (res,rej) => {
            twig.twig({
                id: 'macro',
                path: './templates/macro.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            })
        });
        // Load the template
        const testTemplate = await twig.twig({ref: 'macro'});
        assertEquals(testTemplate.render({ }), '');
    });

    await t.step('it should import macro', async () => {
        await new Promise ( (res,rej) => {
            twig.twig({
                id: 'import-macro',
                path: './templates/import.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        // Load the template
        const testTemplate = await twig.twig({ref: 'import-macro'});
        assertEquals(testTemplate.render({ }).trim(), 'Hello World');
    });

    await t.step('it should run macro with self reference', async () => {
        await  new Promise ( (res,rej) => {
            twig.twig({
                id: 'import-macro-self',
                path: './templates/macro-self.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        // Load the template
        const testTemplate = await twig.twig({ref: 'import-macro-self'});
        assertEquals(testTemplate.render({ }).trim(), '<p><input type="text" name="username" value="" size="20" /></p>');
    });

    await t.step('it should run macro with self reference twice', async () => {
        await new Promise ((res, rej) => {
            twig.twig({
                id: 'import-macro-self-twice',
                path: './templates/macro-self-twice.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        // Load the template
        const testTemplate = await twig.twig({ref: 'import-macro-self-twice'});
        assertEquals(testTemplate.render({ }).trim(), '<p><input type="text" name="username" value="" size="20" /></p><p><input type="text" name="password" value="" size="20" /></p>');
    });

    await t.step('it should run wrapped macro with self reference', async () => {
        await new Promise ( (res,rej) => {
            twig.twig({
                id: 'import-wrapped-macro-self',
                path: './templates/macro-wrapped.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        // Load the template
        const testTemplate = await twig.twig({ref: 'import-wrapped-macro-self'});
        assertEquals(testTemplate.render({ }).trim(), '<p><div class="field"><input type="text" name="username" value="" size="20" /></div></p>');
    });

    await t.step('it should run wrapped macro with context and self reference', async () => {
        await new Promise( (res,rej) => {
            twig.twig({
                id: 'import-macro-context-self',
                path: './templates/macro-context.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        // Load the template
        const testTemplate = await twig.twig({ref: 'import-macro-context-self'});
        assertEquals(testTemplate.render({greetings: 'Howdy'}).trim(), 'Howdy Twigjs');
    });

    await t.step('it should run wrapped macro with default value for a parameter and self reference', async () => {
        await new Promise ( (res,rej) => {
            twig.twig({
                id: 'import-macro-defaults-self',
                path: './templates/macro-defaults.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        // Load the template
        const testTemplate = await twig.twig({ref: 'import-macro-defaults-self'});
        assertEquals(testTemplate.render({ }).trim(), 'Howdy Twigjs');
    });

    await t.step('it should run wrapped macro inside blocks', async () => {
        await new Promise( (res,rej) => {
            twig.twig({
                id: 'import-macro-inside-block',
                path: './templates/macro-blocks.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        // Load the template
        const testTemplate = await twig.twig({ref: 'import-macro-inside-block'});
        assertEquals(testTemplate.render({ }).trim(), 'Welcome <div class="name">Twig Js</div>');
    });

    await t.step('it should import selected macros from template', async () => {
        await new Promise ( (res,rej) => {
            twig.twig({
                id: 'from-macro-import',
                path: './templates/from.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        // Load the template
        const testTemplate = await twig.twig({ref: 'from-macro-import'});
        assertEquals(testTemplate.render({ }).trim(), 'Hello Twig.js<div class="field"><input type="text" name="text" value="" size="20" /></div><div class="field red"><input type="text" name="password" value="" size="20" /></div>');
    });

    await t.step('should support inline includes by ID', async () => {
      
        await twig.twig({
            id: 'hello',
            data: '{% macro echo(name) %}Hello {{ name }}{% endmacro %}',
        });

        const template = await twig.twig({
            allowInlineIncludes: true,
            data: 'template with {% from "hello" import echo %}{{ echo("Twig.js") }}'
        });
        const output = template.render();

        assertEquals(output, 'template with Hello Twig.js');
    });
});

import { assertEquals, assertThrows, assertObjectMatch, assertExists } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test('Twig.js Loader ->', async (t) => {
    await t.step('should load a template from the filesystem asynchronously', async () => {
        await twig.twig({
            id: 'fs-node-async',
            path: './templates/test.twig',
            load(template) {
                // Render the template
                assertEquals(template.render({
                    test: 'yes',
                    flag: true
                }),'Test template = yes\n\nFlag set!');
            }
        });
    });

    await t.step('should load a template from the filesystem synchronously', async () => {
        const template = await new Promise ((res,rej) => {
            twig.twig({
                id: 'fs-node-sync',
                path: './templates/test.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            })
        });
        // Render the template
        assertEquals(template.render({
            test: 'yes',
            flag: true
        }),'Test template = yes\n\nFlag set!');
    });

    await t.step('source ->  should load the non-compiled template source code', async () => {
        const template = await twig.twig({data: '{{ source("./templates/source.twig") }}'});
        assertEquals(template.render(),'{% if isUserNew == true %}\n    Hello {{ name }}\n{% else %}\n    Welcome back {{ name }}\n{% endif %}\n');
    });

    await t.step('should indicate if there was a problem loading the template if \'ignore_missing\' is false', async () => {
        const testTemplate = await twig.twig({data: '{{ source("./templates/non-existing-source.twig", false) }}'});
        assertEquals(testTemplate.render(), 'Template "./templates/non-existing-source.twig" is not defined.');
    });

    await t.step('should NOT indicate if there was a problem loading the template if \'ignore_missing\' is true', async () => {
        const testTemplate = await twig.twig({data: '{{ source("./templates/non-existing-source.twig", true) }}'});
        assertEquals(testTemplate.render(), '');
    });
});

Deno.test('Twig.js Include ->', async (t) => {
    await t.step('should load an included template with no context', async () => {
        await new Promise ((res,rej) => {
            twig.twig({
                id: 'include',
                path: './templates/include.twig',
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
        const testTemplate = await twig.twig({ref: 'include'});
        assertEquals(testTemplate.render({test: 'tst'}), 'BeforeTest template = tst\n\nAfter');
    });

    await t.step('should load an included template using relative path', async () => {
        await new Promise ((res,rej) => {
            twig.twig({
                id: 'include-relative',
                path: './templates/include/relative.twig',
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
        const testTemplate = await twig.twig({ref: 'include-relative'});
        assertEquals(testTemplate.render(), 'Twig.js!');
    });

    await t.step('should load the first template when passed an array', async () => {
        await new Promise ((res,rej) => {
            twig.twig({
                id: 'include-array',
                path: './templates/include-array.twig',
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
        const template = await twig.twig({ref: 'include-array'});
        assertEquals(template.render({test: 'tst'}), 'BeforeTest template = tst\n\nAfter');
    });

    await t.step('should load the second template when passed an array where the first value does not exist', async () => {
        await new Promise ((res,rej) => {
            twig.twig({
                id: 'include-array-second-exists',
                path: './templates/include-array-second-exists.twig',
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
        const testTemplate = await twig.twig({ref: 'include-array'});
        assertEquals(testTemplate.render({test: 'tst'}), 'BeforeTest template = tst\n\nAfter');
    });

    await t.step('should load an included template with additional context', async () => {
        await new Promise ((res,rej) => {
            twig.twig({
                id: 'include-with',
                path: './templates/include-with.twig',
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
        const testTemplate = await twig.twig({ref: 'include-with'});
        assertEquals(testTemplate.render({test: 'tst'}), 'template: before,tst-mid-template: after,tst');
    });

    await t.step('should load an included template with only additional context', async () => {
        await new Promise ((res,rej) => {
            twig.twig({
                id: 'include-only',
                path: './templates/include-only.twig',
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
        const testTemplate = await twig.twig({ref: 'include-only'});
        assertEquals(testTemplate.render({test: 'tst'}), 'template: before,-mid-template: after,');
    });

    await t.step('should skip a nonexistent included template flagged wth \'ignore missing\'', async () => {
        await new Promise ((res,rej) => {
            twig.twig({
                id: 'include-ignore-missing',
                path: './templates/include-ignore-missing.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            })
        });

        const testTemplate = await twig.twig({ref: 'include-ignore-missing'});
        assertEquals(testTemplate.render(), 'ignore-missing');
    });

    await t.step('should fail including a nonexistent included template not flagged wth \'ignore missing\'', async () => {
        try {
            const testTemplate = await new Promise( (res,rej) => {
                twig.twig({
                    id: 'include-ignore-missing-missing',
                    path: './templates/include-ignore-missing-missing.twig',
                    async: false,
                    rethrow: true,
                    load(template){
                        res(template);
                    },
                    error(e){
                        rej(e);
                    }
                })
            });
            testTemplate.render();
        } catch (error) {
            assertEquals(error.type, 'TwigException');
        }
    });
        //should work in lalest version deno 
    // await t.step('should fail including a nonexistent included template asynchronously', async () => {
    //    await twig.twig({
    //         id: 'include-ignore-missing-missing-async',
    //         path: './templates/include-ignore-missing-missing-async.twig',
    //         async: true,
    //         load(template) {
    //             assertEquals(!!templ,false);
    //         },
    //         error(err) {
    //             assertEquals(err.type,'TwigException')
    //         },
    //         rethrow: true
    //     })
    // });
});

Deno.test('Twig.js Extends ->', async (t) => {
    await t.step('should load the first template when passed an array', async () => {
        const template = await new Promise ((res,rej) => {
            twig.twig({
                path: './templates/extender-array.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            })
        });

        const output = template.render();
        assertEquals(output.trim(), 'Hello, world!');
    });

    await t.step('should load the second template when passed an array where the first value does not exist', async () => {
        const template = await new Promise( (res,rej) => {
            twig.twig({
                path: './templates/extender-array-second-exists.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        }); 

        const output = template.render();
        assertEquals(output.trim(), 'Hello, world!');
    });

    await t.step('should silently fail when passed an array with no templates that exist', async () => {
        const template = await new Promise( (res,rej) => {
            twig.twig({
                path: './templates/extender-array-none-exist.twig',
                async: false,
                load(template){
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });

        const output = template.render();
        assertEquals(output.trim(), 'Nothing to see here');
    });
});
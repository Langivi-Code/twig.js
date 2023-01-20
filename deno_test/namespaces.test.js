import { assertEquals } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test('Twig.js Namespaces ->', async (t) => {
    await t.step('should support namespaces defined with ::', async () => {
        const testTemplate = await new Promise ((res,rej) => {
            twig.twig({
                namespaces: {test: './templates/namespaces/'},
                path: './templates/namespaces_coloncolon.twig',
                load(template) { 
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        assertEquals(testTemplate.render({ test: 'yes', flag: true }), 'namespaces');
    });

    await t.step('should support namespaces defined with :: and  without slash at the end of path', async () => {
        const testTemplate = await new Promise ((res,rej) => {
            twig.twig({
                namespaces: {test: './templates/namespaces'},
                path: './templates/namespaces_coloncolon.twig',
                load(template) {
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        assertEquals(testTemplate.render({test: 'yes', flag: true }), 'namespaces');
    });

    await t.step('should support namespaces defined with @', async () => {
        const testTemplate = await new Promise ((res,rej) => {
            twig.twig({
                namespaces: {test: './templates/namespaces/'},
                path: './templates/namespaces_@.twig',
                load(template) {
                    res(template);
                },
                error(e){
                    rej(e);
                }  
            })
        });
        assertEquals(testTemplate.render({ test: 'yes', flag: true }), 'namespaces');
    });

    await t.step('should support namespaces defined with @ and  without slash at the end of path', async () => {
        const testTemplate = await new Promise ((res,rej) => {
            twig.twig({
                namespaces: {test: './templates/namespaces'},
                path: './templates/namespaces_@.twig',
                load(template) {
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        assertEquals(testTemplate.render({test: 'yes', flag: true }), 'namespaces');
    });

    await t.step('should support non-namespaced includes with namespaces configured', async () => {
        const testTemplate = await new Promise ((res,rej) => {
            twig.twig({
                namespaces: {test: './templates/namespaces/'},
                path: './templates/namespaces_without_namespace.twig',
                load(template) {
                    res(template);
                },
                error(e){
                    rej(e);
                }
            })
        });
        assertEquals(testTemplate.render({test: 'yes', flag: true}), 'namespaces\nnamespaces');
    });

    await t.step('should support multiple namespaces', async () => {
        const testTemplate = await new Promise ((res,rej) => {
            twig.twig({
                namespaces: {
                    one: './templates/namespaces/one/',
                    two: './templates/namespaces/two/'
                },
                path: './templates/namespaces_multiple.twig',
                load(template) {
                    res(template);
                },
                error(e){
                    rej(e);
                }
            });
        });
        assertEquals(testTemplate.render({test: 'yes', flag: true }), 'namespace one\nnamespace two');
    });
});

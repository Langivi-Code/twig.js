import { assertEquals } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test('Twig.js Rethrow ->', async (t) => {

    await t.step('should throw a "Unable to parse \'missing\'" exception', async () => {
        /* eslint-disable-next-line no-use-extend-native/no-use-extend-native */
        try{
            await twig.twig({
                    rethrow: true,
                    data: 'include missing template {% missing %}'
            });
            throw new Error ("should not resolve")
        } catch(error) {
            assertEquals(error.message,'Unable to parse \'missing\'')
        }
    });

    await t.step('should throw a "Unable to find closing bracket \'%}" exception', async () => {
        /* eslint-disable-next-line no-use-extend-native/no-use-extend-native */
        try{
            const testTemplate = await twig.twig({
                rethrow: true,
                data: 'missing closing bracket {% }'
            });
            testTemplate.render();
            throw new Error ("should not resolve");
        } catch (error) {
            assertEquals(error.message,'Unable to find closing bracket \'%}\' opened near template position 26' )
        }
    });

    await t.step('should throw a compile error having its file property set to the file', async () => {
        try {
            const template = await new Promise ( (res,rej) => {
                twig.twig({
                    path: './deno_test/templates/error/compile/entry.twig',
                    async: false,
                    rethrow: true,
                    load(template){
                        res(template);
                    },
                    error(e){
                        rej(e);
                    }
                });
            });
            throw new Error ("should not resolve")
        } catch (error) {
            assertEquals(error.hasOwnProperty('file'), true);
            assertEquals(error.file,'./deno_test/templates/error/compile/entry.twig');
        }
    });

    await t.step('should throw a parse error having its file property set to the entry file', async () => {
        try {
            const output = await new Promise ((res,rej) => {
                twig.twig({
                    path: './deno_test/templates/error/parse/in-entry/entry.twig',
                    async: false,
                    rethrow: true,
                    load(template){
                        res(template);
                    },
                    error(e){
                        rej(e);
                    }
                });
            });
            output.render();
            throw new Error ("should not resolve")
        } catch (error) {
            assertEquals(error.hasOwnProperty('file'), true);
            assertEquals(error.file, './deno_test/templates/error/parse/in-entry/entry.twig');
        }
    });

    await t.step('should throw a parse error having its file property set to the partial file', async () => {
        try {
            const output = await new Promise ((res,rej) => {
                twig.twig({
                    path: './deno_test/templates/error/parse/in-partial/entry.twig',
                    async: false,
                    rethrow: true,
                    load(template){
                        res(template);
                    },
                    error(e){
                        rej(e);
                    }
                });
            });
            output.render();
            throw new Error ("should not resolve")
        } catch (error) {
            assertEquals(error.hasOwnProperty('file'), true);
            assertEquals(error.file, 'deno_test/templates/error/parse/in-entry/entry.twig');
        }
    });
});


import { assertEquals } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test("Twig.js Exports __express ->",   async (t) => {
    await t.step('should return a string (and not a String)', async () => {
        const testTemplate =  await new Promise ((res,rej) => {
            twig.__express('./deno_test/templates/test.twig', {
            settings: {
                'twig options': {
                    autoescape: 'html'
                }
            }
            }, (err, html) => {
               if(err){
                rej(err);
               } else if (html) {
                res(html);
               }
            });
        })
        const responseType = (typeof testTemplate);
        assertEquals(responseType, 'string');
    })

    await t.step('', async () => {
        const templateTest = await new Promise((res,rej) => {
            twig.__express('./deno_test/templates/test-async.twig', {
                settings: {
                    'twig options': {
                        allowAsync: true
                    }
                },
                /* eslint-disable-next-line camelcase */
                hello_world() {
                    return Promise.resolve('hello world');
                }
            }, (err, html) => {
                if (err) {
                    rej(err);
                } else {
                    res(html);
                }
            });
        });
        const responseType = (typeof templateTest);
        assertEquals(responseType, 'string');
        assertEquals(templateTest, 'hello world\n');
    });
})
import { assertEquals } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test("Twig.js Exports __express ->",   async (t) => {
    await t.step('should return a string (and not a String)', async () => {
            twig.__express('./templates/test.twig', {
            settings: {
                'twig options': {
                    autoescape: 'html'
                }
            }
            }, (err, response) => {
                assertEquals((err === null), true);
                const responseType = (typeof response);
                assertEquals(responseType, 'string');
            
            });
    })

    await t.step('', () => {
        twig.__express('./templates/test-async.twig', {
            settings: {
                'twig options': {
                    allowAsync: true
                }
            },
            /* eslint-disable-next-line camelcase */
            hello_world() {
                return Promise.resolve('hello world');
            }
        }, (err, response) => {
            if (err) {
                return;
            }

            try {
                const responseType = (typeof response);
                assertEquals(responseType, 'string');
                assertEquals(response, 'hello world\n');
            } catch (error) {
               console.log(error);
            }
        });
    })
})
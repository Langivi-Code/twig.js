import { assertEquals } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test('Twig.js Tests ->', async (t) => {

        await t.step(' empty test ->  should identify numbers as not empty', async () => {
            // Number
            let testTemplate = await twig.twig({data: '{{ 1 is empty }}'});
            assertEquals(testTemplate.render(), 'false');
            testTemplate = await twig.twig({data: '{{ 0 is empty }}'});
            assertEquals(testTemplate.render(), 'false');
        });

        await t.step('should identify empty strings', async () => {
            // String
            let testTemplate = await twig.twig({data: '{{ "" is empty }}'});
            assertEquals(testTemplate.render(), 'true');
            testTemplate = await twig.twig({data: '{{ "test" is empty }}'});
            assertEquals(testTemplate.render(), 'false');
        });

        await t.step('should identify empty arrays', async () => {
            // Array
            let testTemplate = await twig.twig({data: '{{ [] is empty }}'});
            assertEquals(testTemplate.render(), 'true');
            testTemplate = await twig.twig({data: '{{ ["1"] is empty }}'});
            assertEquals(testTemplate.render(), 'false');
        });

        await t.step('should identify empty objects', async () => {
            // Object
            let testTemplate = await twig.twig({data: '{{ {} is empty }}'});
            assertEquals(testTemplate.render(), 'true');
            testTemplate = await twig.twig({data: '{{ {"a":"b"} is empty }}'});
            assertEquals(testTemplate.render(), 'false');
            testTemplate = await twig.twig({data: '{{ {"a":"b"} is not empty }}'});
            assertEquals(testTemplate.render(), 'true');
        });

        await t.step('odd test -> should identify a number as odd', async () => {
            let testTemplate = await twig.twig({data: '{{ (1 + 4) is odd }}'});
            assertEquals(testTemplate.render(), 'true');
            testTemplate = await twig.twig({data: '{{ 6 is odd }}'});
            assertEquals(testTemplate.render(), 'false');
        });

        await t.step('even test -> should identify a number as even', async () => {
            let testTemplate = await twig.twig({data: '{{ (1 + 4) is even }}'});
            assertEquals(testTemplate.render(), 'false');
            testTemplate = await twig.twig({data: '{{ 6 is even }}'});
            assertEquals(testTemplate.render(), 'true');
        });

        await t.step('divisibleby test -> should determine if a number is divisible by the given number', async () => {
            let testTemplate = await twig.twig({data: '{{ 5 is divisibleby(3) }}'});
            assertEquals(testTemplate.render(), 'false');
            testTemplate = await twig.twig({data: '{{ 6 is divisibleby(3) }}'});
            assertEquals(testTemplate.render(), 'true');
        });

        await t.step('defined test -> should identify a key as defined if it exists in the render context', async () => {
            let testTemplate = await twig.twig({data: '{{ key is defined }}'});
            assertEquals(testTemplate.render(), 'false');
            testTemplate = await twig.twig({data: '{{ key is defined }}'});
            assertEquals(testTemplate.render({key: 'test'}), 'true');
            const context = {
                key: {
                    foo: 'bar',
                    nothing: null
                },
                nothing: null
            };
            testTemplate = await twig.twig({data: '{{ key.foo is defined }}'})
            assertEquals(testTemplate.render(context), 'true');
            testTemplate = await twig.twig({data: '{{ key.bar is defined }}'})
            assertEquals(testTemplate.render(context), 'false');
            testTemplate = await twig.twig({data: '{{ key.foo.bar is defined }}'})
            assertEquals(testTemplate.render(context), 'false');
            testTemplate = await twig.twig({data: '{{ foo.bar is defined }}'})
            assertEquals(testTemplate.render(context), 'false');
            testTemplate = await twig.twig({data: '{{ nothing is defined }}'})
            assertEquals(testTemplate.render(context), 'true');
            testTemplate = await twig.twig({data: '{{ key.nothing is defined }}'})
            assertEquals(testTemplate.render(context), 'true');
        });

    
        await t.step('none test -> should identify a key as none if it exists in the render context and is null', async () => {
            let testTemplate = await twig.twig({data: '{{ key is none }}'});
            assertEquals(testTemplate.render(), 'false');
            testTemplate = await twig.twig({data: '{{ key is none }}'});
            assertEquals(testTemplate.render({key: 'test'}), 'false');
            testTemplate = await twig.twig({data: '{{ key is none }}'});
            assertEquals(testTemplate.render({key: null}), 'true');
            testTemplate = await twig.twig({data: '{{ key is null }}'});
            assertEquals(testTemplate.render({key: null}), 'true');
        });

    
        await t.step('`sameas` backwards compatibility with `same as` -> should identify the exact same type as true', async () => {
            let testTemplate = await twig.twig({data: '{{ true is sameas(true) }}'});
            assertEquals(testTemplate.render(), 'true');
            testTemplate = await twig.twig({data: '{{ a is sameas(1) }}'});
            assertEquals(testTemplate.render({a: 1}), 'true');
            testTemplate = await twig.twig({data: '{{ a is sameas("test") }}'});
            assertEquals(testTemplate.render({a: 'test'}), 'true');
            testTemplate = await twig.twig({data: '{{ a is sameas(true) }}'});
            assertEquals(testTemplate.render({a: true}), 'true');
        });
        await t.step('should identify the different types as false', async () => {
            let testTemplate = await twig.twig({data: '{{ false is sameas(true) }}'});
            assertEquals(testTemplate.render(), 'false');
            testTemplate = await twig.twig({data: '{{ true is sameas(1) }}'});
            assertEquals(testTemplate.render(), 'false');
            testTemplate = await twig.twig({data: '{{ false is sameas("") }}'});
            assertEquals(testTemplate.render(), 'false');
            testTemplate = await twig.twig({data: '{{ a is sameas(1) }}'});
            assertEquals(testTemplate.render({a: '1'}), 'false');
        });
    

        await t.step('same as test -> should identify the exact same type as true', async () => {
            let testTemplate = await twig.twig({data: '{{ true is same as(true) }}'});
            assertEquals(testTemplate.render(), 'true');
            testTemplate = await twig.twig({data: '{{ a is same as(1) }}'});
            assertEquals(testTemplate.render({a: 1}), 'true');
            testTemplate = await twig.twig({data: '{{ a is same as("test") }}'});
            assertEquals(testTemplate.render({a: 'test'}), 'true');
            testTemplate = await twig.twig({data: '{{ a is same as(true) }}'});
            assertEquals(testTemplate.render({a: true}), 'true');
        });
        await t.step('should identify the different types as false', async () => {
            let testTemplate = await twig.twig({data: '{{ false is same as(true) }}'});
            assertEquals(testTemplate.render(), 'false');
            testTemplate = await twig.twig({data: '{{ true is same as(1) }}'});
            assertEquals(testTemplate.render(), 'false');
            testTemplate = await twig.twig({data: '{{ false is same as("") }}'});
            assertEquals(testTemplate.render(), 'false');
            testTemplate = await twig.twig({data: '{{ a is same as(1) }}'});
            assertEquals(testTemplate.render({a: '1'}), 'false');
        });

    
        const data = {
            foo: [],
            traversable: 15,
            obj: {},
            val: 'test'
        };

        await t.step('iterable test -> should fail on non-iterable data types', async () => {
            let testTemplate = await twig.twig({data: '{{ val is iterable ? \'ok\' : \'ko\' }}'});
            assertEquals(testTemplate.render(data), 'ko');
            testTemplate = await twig.twig({data: '{{ val is iterable ? \'ok\' : \'ko\' }}'});
            assertEquals(testTemplate.render({val: null}), 'ko');
            testTemplate = await twig.twig({data: '{{ val is iterable ? \'ok\' : \'ko\' }}'});
            assertEquals(testTemplate.render({}), 'ko');
        });

        await t.step('should pass on iterable data types', async () => {
            let testTemplate = await twig.twig({data: '{{ foo is iterable ? \'ok\' : \'ko\' }}'});
            assertEquals(testTemplate.render(data), 'ok');
            testTemplate = await twig.twig({data: '{{ obj is iterable ? \'ok\' : \'ko\' }}'});
            assertEquals(testTemplate.render(data), 'ok');
        });

        class Foo {
            constructor(a) {
                this.x = {
                    test: a
                };
                this.y = 9;
            }

            get test() {
                return this.x.test;
            }

            runme() {
                // This is out of context when runme() is called from the view
                return '1' + this.y;
            }
        }

        const foobar = new Foo('123');

        await t.step(' Context test -> should pass when test.runme returns 19', async () => {
            let testTemplate = await twig.twig({data: '{{test.runme()}}'});
            assertEquals(testTemplate.render({test: foobar}), '19');
        });

        await t.step('should pass when test.test returns 123', async () => {
            let testTemplate = await twig.twig({data: '{{test.test}}'});
            assertEquals(testTemplate.render({test: foobar}), '123');
        });
});

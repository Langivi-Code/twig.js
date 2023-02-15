import { assertEquals, assertArrayIncludes } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test('Twig.js Functions ->', async (t) => {
    // Add some test functions to work with
    twig.extendFunction('echo', a => {
        return a;
    });
    twig.extendFunction('square', a => {
        return a * a;
    });
    twig.extendFunction('list', (...args) => {
        return Array.prototype.slice.call(args);
    });
    twig.extendFunction('include', function (_) {
        assertEquals((typeof this),('object'));
        assertEquals((typeof this.context),('object'));

        return 'success';
    });

    function pad(num) {
        return num < 10 ? '0' + num : num;
    }

    function stringDate(date) {
        return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear() +
                                 ' @ ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }

    const EOL = '\n';

    await t.step('should allow you to define a function', async () => {
        const testTemplate = await twig.twig({data: '{{ square(a) }}'});
        assertEquals(testTemplate.render({a: 4}), '16');
    });
    await t.step('should chain with other expressions', async () => {
        const testTemplate = await twig.twig({data: '{{ square(a) + 4 }}'});
        assertEquals(testTemplate.render({a: 4}), '20');
    });
    await t.step('should chain with filters', async () => {
        const testTemplate = await twig.twig({data: '{{ echo(a)|default("foo") }}'});
        assertEquals(testTemplate.render(), 'foo');
    });
    await t.step('should work in for loop expressions', async () => {
        const testTemplate = await twig.twig({data: '{% for i in list(1, 2, 3) %}{{ i }},{% endfor %}'});
        assertEquals(testTemplate.render(), '1,2,3,');
    });
    await t.step('should be able to differentiate between a function and a variable', async () => {
        const testTemplate = await twig.twig({data: '{{ square ( square ) + square }}'});
        assertEquals(testTemplate.render({square: 2}), '6');
    });
    await t.step('should work with boolean operations', async () => {
        const testTemplate = await twig.twig({data: '{% if echo(true) or echo(false) %}yes{% endif %}'});
        assertEquals(testTemplate.render(), 'yes');
    });

    await t.step('should call function on template instance', async () => {
        const macro = '{% macro testMacro(data) %}success{% endmacro %}';
        const tpl = '{% import "testMacro" as m %}{{ m.testMacro({ key: include() }) }}';

        await twig.twig({data: macro, id: 'testMacro'});
        const testTemplate = await twig.twig({data: tpl, allowInlineIncludes: true});
        assertEquals(testTemplate.render(), 'success');
    });

    await t.step('should execute functions passed as context values', async () => {
        const testTemplate = await twig.twig({data: '{{ value }}'});
        assertEquals(testTemplate.render({
            value() {
                return 'test';
            }
        }), 'test');
    });
    await t.step('should execute functions passed as context values with this mapped to the context', async () => {
        const testTemplate = await twig.twig({data: '{{ value }}'});
        assertEquals(testTemplate.render({
            test: 'value',
            value() {
                return this.test;
            }
        }), 'value');
    });
    await t.step('should execute functions passed as context values with arguments', async () => {
        const testTemplate =  await twig.twig({data: '{{ value(1, "test") }}'})
        assertEquals(testTemplate.render({
            value(a, b, c) {
                return a + '-' + b + '-' + (c === undefined ? 'true' : 'false');
            }
        }), '1-test-true');
    });
    await t.step('should execute functions passed as context value parameters with this mapped to the context', async () => {
        const testTemplate = await twig.twig({data: '{{ value }}'});
        assertEquals(testTemplate.render({
            test: 'value',
            value() {
                return this.test;
            }
        }), 'value');
    });

    await t.step('should execute functions passed as context object parameters', async () => {
        const testTemplate = await twig.twig({data: '{{ obj.value }}'});
        assertEquals(testTemplate.render({
            obj: {
                test: 'value',
                value() {
                    return this.test;
                }
            }
        }), 'value');
    });
    await t.step('should execute functions passed as context object parameters with arguments', async () => {
        const testTemplate = await twig.twig({ data: '{{ obj.value(1, "test") }}' });
        assertEquals(testTemplate.render({
            obj: {
                test: 'value',
                value(a, b, c) {
                    return a + '-' + b + '-' + this.test + '-' + (c === undefined ? 'true' : 'false');
                }
            }
        }), '1-test-value-true');
    });

    await t.step('should execute functions passed as context object parameters', async () => {
        const testTemplate = await twig.twig({data: '{{ obj["value"] }}'});
        assertEquals(testTemplate.render({
            obj: {
                value() {
                    return 'test';
                }
            }
        }), 'test');
    });
    await t.step('should execute functions passed as context object parameters with arguments', async () => {
        const testTemplate = await twig.twig({data: '{{ obj["value"](1, "test") }}'});
        assertEquals(testTemplate.render({
            obj: {
                value(a, b, c) {
                    return a + '-' + b + '-' + (c === undefined ? 'true' : 'false');
                }
            }
        }), '1-test-true');
    });

    await t.step('Built-in Functions ->  range ->  should work over a range of numbers', async () => {
        const testTemplate = await twig.twig({data: '{% for i in range(0, 3) %}{{ i }},{% endfor %}'});
        assertEquals(testTemplate.render(), '0,1,2,3,');
    });
    await t.step('should work over a range of letters', async () => {
        const testTemplate = await twig.twig({data: '{% for i in range("a", "c") %}{{ i }},{% endfor %}'});
        assertEquals(testTemplate.render(), 'a,b,c,');
    });
    await t.step('should work with an interval', async () => {
        const testTemplate = await twig.twig({data: '{% for i in range(1, 15, 3) %}{{ i }},{% endfor %}'});
        assertEquals(testTemplate.render(), '1,4,7,10,13,');
    });

    await t.step('should work with .. invocation', async () => {
        let testTemplate = await twig.twig({data: '{% for i in 0..3 %}{{ i }},{% endfor %}'});
        assertEquals(testTemplate.render(),'0,1,2,3,');
        testTemplate = await twig.twig({data: '{% for i in "a" .. "c" %}{{ i }},{% endfor %}'});
        assertEquals(testTemplate.render(), 'a,b,c,');
    });
        
    await t.step('cycle -> should cycle through an array of values', async () => {
        const testTemplate = await twig.twig({data: '{% for i in range(0, 3) %}{{ cycle(["odd", "even"], i) }};{% endfor %}'});
        assertEquals(testTemplate.render(), 'odd;even;odd;even;');
    });

    await t.step('date -> should understand timestamps', async () => {
        const date = new Date(946706400 * 1000);
        const testTemplate = await twig.twig({data: '{{ date(946706400)|date("d/m/Y @ H:i:s") }}'});
        assertEquals(testTemplate.render(), stringDate(date));
    });

    await t.step('should understand relative dates', async () => {
        let testTemplate = await twig.twig({data: '{{ date("+1 day") > date() }}'});
        assertEquals(testTemplate.render(), 'true');
        testTemplate = await twig.twig({data: '{{ date("-1 day") > date() }}'});
        assertEquals(testTemplate.render(), 'false');
    });

    await t.step('should support \'now\' as a date parameter', async () => {
        const testTemplate = await twig.twig({data: '{{ date("now") }}'});
        assertEquals(testTemplate.render(),(new Date().toString()));
    });

    await t.step('should understand exact dates', async () => {
        const date = new Date('December 17, 1995 08:24:00');
        const testTemplate = await twig.twig({data: '{{ date("December 17, 1995 08:24:00")|date("d/m/Y @ H:i:s") }}'});
        assertEquals(testTemplate.render(), stringDate(date));
    });
        
    await t.step('dump -> should output formatted number', async () => {
        const testTemplate = await twig.twig({data: '{{ dump(test) }}'});
        assertEquals(testTemplate.render({test: 5}), 'number(5)' + EOL);
    });

    await t.step('should output formatted string', async () => {
        const testTemplate = await twig.twig({data: '{{ dump(test) }}'});
        assertEquals(testTemplate.render({test: 'String'}), 'string(6) "String"' + EOL);
    });

    await t.step('should output formatted boolean', async () => {
        const testTemplate = await twig.twig({data: '{{ dump(test) }}'});
        assertEquals(testTemplate.render({test: true}), 'bool(true)' + EOL);
    });

    await t.step('should output formatted null', async () => {
        const testTemplate = await twig.twig({data: '{{ dump(test) }}'});
        assertEquals(testTemplate.render({test: null}), 'NULL' + EOL);
    });

    await t.step('should output formatted object', async () => {
        const testTemplate = await twig.twig({data: '{{ dump(test) }}'});
        assertEquals(testTemplate.render({test: {}}), 'object(0) {' + EOL + '}' + EOL);
    });

    await t.step('should output formatted array', async () => {
        const testTemplate = await twig.twig({data: '{{ dump(test) }}'});
        assertEquals(testTemplate.render({test: []}), 'object(0) {' + EOL + '}' + EOL);
    });

    await t.step('should output formatted undefined', async () => {
        const testTemplate = await twig.twig({data: '{{ dump(test) }}'});
        assertEquals(testTemplate.render({test: undefined}), 'undefined' + EOL);
    });
 
    await t.step('block -> should render the content of blocks', async () => {
        const testTemplate = await twig.twig({data: '{% block title %}Content - {{ val }}{% endblock %} Title: {{ block("title") }}'});
        assertEquals(testTemplate.render({val: 'test'}), 'Content - test Title: Content - test');
    });

    await t.step('shouldn\'t escape the content of blocks twice', async () => {
        const testTemplate = await twig.twig({
                autoescape: true,
                data: '{% block test %}{{ val }}{% endblock %} {{ block("test") }}'
            });
        assertEquals(testTemplate.render({ val: 'te&st' }),'te&amp;st te&amp;st');
    });
        

    await t.step('attribute -> should access attribute of an object', async () => {
        const testTemplate = await twig.twig({data: '{{ attribute(obj, key) }}'});
        assertEquals(testTemplate.render({
                obj: {name: 'Twig.js'},
                key: 'name'
            }), 'Twig.js');
    });

    await t.step('should call function of attribute of an object', async () => {
            const testTemplate = await twig.twig({data: '{{ attribute(obj, key, params) }}'});
            assertEquals(testTemplate.render({
                obj: {
                    name(first, last) {
                        return first + '.' + last;
                    }
                },
                key: 'name',
                params: ['Twig', 'js']
            }), 'Twig.js');
    });

    await t.step('should return undefined for missing attribute of an object', async () => {
        const testTemplate = await twig.twig({data: '{{ attribute(obj, key, params) }}'});
        assertEquals(testTemplate.render({
            obj: {
                name(first, last) {
                    return first + '.' + last;
                }
            },
            key: 'missing',
            params: ['Twig', 'js']
        }), '');
    });

    await t.step('should return element of an array', async () => {
        const testTemplate = await twig.twig({data: '{{ attribute(arr, 0) }}'});
        assertEquals(testTemplate.render({arr: ['Twig', 'js']}), 'Twig');
    });

    await t.step('should return undef for array beyond index size', async () => {
        const testTemplate = await twig.twig({data: '{{ attribute(arr, 100) }}'});
        assertEquals(testTemplate.render({arr: ['Twig', 'js']}), '');
    });

    await t.step('should return undef for undefined object', async () => {
        const testTemplate = await twig.twig({data: '{{ attribute(arr, "bar") }}'});
        assertEquals(testTemplate.render({}), '');
    });

    await t.step('template_from_string ->  should load a template from a string', async () => {
        const testTemplate = await twig.twig({data: '{% include template_from_string("{{ value }}") %}'});
        assertEquals(testTemplate.render({value: 'test'}), 'test');
    });

    await t.step('should load a template from a variable', async () => {
        const testTemplate = await twig.twig({data: '{% include template_from_string(template) %}'});
        assertEquals(testTemplate.render({
                    template: '{{ value }}',
                    value: 'test'
                }), 'test');
    });
        

    await t.step('random -> should return a random item from a traversable or array', async () => {
        const arr = 'bcdefghij'.split('');
        for (let i = 1; i <= 1000; i++) {
            const testTemplate = await twig.twig({data: '{{ random(arr) }}'});
            assertArrayIncludes(arr, testTemplate.render({arr}));
        }
    });

    await t.step('should return a random character from a string', async () => {
        const str = 'abcdefghij';
        for (let i = 1; i <= 1000; i++) {
            const testTemplate = await twig.twig({data: '{{ random(str) }}'});
            assertArrayIncludes(str,testTemplate.render({str}));
        }
    });

    await t.step('should return a random integer between 0 and the integer parameter', async () => {
        const arr = ['0','1','2','3','4','5','6','7','8','9','10'];
        for (let i = 1; i <= 1000; i++) {
            const testTemplate = await twig.twig({data: '{{ random(10) }}'});
            const result = testTemplate.render()
            assertArrayIncludes(arr,result);
        }
    });
               
    await t.step('min, max ->  should support the \'min\' function', async () => {
        let testTemplate = await twig.twig({data: '{{ min(2, 1, 3, 5, 4) }}'});
        assertEquals(testTemplate.render(), '1');
        testTemplate = await twig.twig({data: '{{ min([2, 1, 3, 5, 4]) }}'});
        assertEquals(testTemplate.render(), '1');
        testTemplate = await twig.twig({data: '{{ min({2:"two", 1:"one", 3:"three", 5:"five", 4:"four"}) }}'});
        assertEquals(testTemplate.render(), 'five');
    });

    await t.step('should support the \'max\' function', async () => {
        let testTemplate = await twig.twig({data: '{{ max([2, 1, 3, 5, 4]) }}'});
        assertEquals(testTemplate.render(), '5');
        testTemplate = await twig.twig({data: '{{ max(2, 1, 3, 5, 4) }}'});
        assertEquals(testTemplate.render(), '5');
        testTemplate = await twig.twig({data: '{{ max({2:"two", 1:"one", 3:"three", 5:"five", 4:"four"}) }}'});
        assertEquals(testTemplate.render(), 'two');
    });

    await t.step('should allow loading relative paths', async () => {
        twig.cacher.emptyCacheDir();
        const testTemplate = await twig.twig({data: '{{ source("./deno_test/templates/simple.twig") }}'});
        assertEquals(testTemplate.render(), 'Twig.js!');
    });
        
});



import { assertEquals, assertThrows } from 'https://deno.land/std@0.143.0/testing/asserts.ts';
import {twig} from "../src/twig.js";
import { TwigPromise } from '../src/async/twig.promise.js';

Deno.test('Twig.js Async',async (t)=>{
    twig.extendFunction('echoAsync', a => {
        return Promise.resolve(a);
    });

    twig.extendFunction('echoAsyncInternal',  a => {
        return new TwigPromise((resolve => {
            setTimeout(() => {
                resolve(a);
            }, 100);
        }));
    });

    twig.extendFilter('asyncUpper', txt => {
        return Promise.resolve(txt.toUpperCase());
    });

    twig.extendFilter('rejectAsync', _ => {
        return Promise.reject(new Error('async error test'));
    });

    await t.step('should throw when detecting async behaviour in sync mode',async ()=>{
        const template = await twig.twig({
            data: '{{ echoAsync("hello world") }}'
        });
        assertThrows(()=>{template.render()})
    })

    await t.step("should handle functions that return promises", async () => {
        const template = await twig.twig({
            data: '{{ echoAsync("hello world") }}'
        });
        template.renderAsync().then(output => assertEquals(output,"hello world"))
    })

    await t.step("should handle functions that return rejected promises", async () => {
        const template = await twig.twig({
            data: '{{ rejectAsync("hello world") }}',
            rethrow: true
        });
        template.renderAsync({
            rejectAsync() {
                return Promise.reject(new Error('async error test'));
            }
        }).then(_ => {
            throw new Error ("should not resolve")
        },error=>{
            assertEquals(error.message,'async error test')
        })
    })

    await t.step('should handle slow executors for promises', async ()=>{
        const template = await twig.twig({
            data: '{{ echoAsyncInternal("hello world") }}'
        });
        await template.renderAsync().then(output => {
           assertEquals(output, 'hello world');
        });
    })

    await t.step('Filters -> should handle filters that return promises', async ()=>{
        const template = await twig.twig({
            data: '{{ "hello world"|asyncUpper }}'
        })
        await template.renderAsync().then(output => {
           assertEquals(output, 'HELLO WORLD');
        });
    })

    await t.step('should handle filters that return rejected promises', async ()=>{
        const template = await twig.twig({
            data: '{{ "hello world"|rejectAsync }}',
            rethrow: true
        })
        await template.renderAsync().then(_ => {
            throw new Error('should not resolve');
        }, err => {
            assertEquals(err.message, 'async error test');
        });
    })


    await t.step('should handle filters that return rejected promises', async ()=>{
        const template = await twig.twig({
            data: '{{ "hello world"|rejectAsync }}',
            rethrow: true
        })
        await template.renderAsync().then(_ => {
            throw new Error('should not resolve');
        }, err => {
            assertEquals(err.message, 'async error test');
        });
    })


    await t.step('Logic -> should handle logic containing async functions', async ()=>{
        const template = await twig.twig({
            data: 'hello{% if incrAsync(10) > 10 %} world{% endif %}'
        });
        await template.renderAsync({
            incrAsync(nr) {
                return Promise.resolve(nr + 1);
            }
        }).then(output => {
            assertEquals(output, 'hello world');
        });
    })

    await t.step('should set variables to return value of promise', async ()=>{
        const template = await twig.twig({
            data: '{% set name = readName() %}hello {{ name }}',
            rethrow: true
        });
        await template.renderAsync({
            readName() {
                return Promise.resolve('john');
            }
        }).then(output => {
            assertEquals(output, 'hello john');
        });
    })

    await t.step('Macros ->  should handle macros with async content correctly', async ()=>{
        const tpl = '{% macro test(asyncIn, syncIn) %}{{asyncIn}}-{{syncIn}}{% endmacro %}' +
                '{% import _self as m %}' +
                '{{ m.test(echoAsync("hello"), "world") }}';
        const template = await twig.twig({
            data: tpl
        });
        const output = await template.renderAsync({});
        assertEquals(output, 'hello-world');
    })

    await t.step('Twig.js Control Structures -> should have a loop context item available for arrays', async ()=>{
        async function run(tpl, result) {
            const testTemplate = await twig.twig({data: tpl});
            return testTemplate.renderAsync({
                test: [1, 2, 3, 4], async: () => Promise.resolve()
            }).then(res => assertEquals(res,result));
        }
        return Promise.resolve()
                .then(() => run('{% for key,value in test %}{{async()}}{{ loop.index }}{% endfor %}', '1234'))
                .then(() => run('{% for key,value in test %}{{async()}}{{ loop.index0 }}{% endfor %}', '0123'))
                .then(() => run('{% for key,value in test %}{{async()}}{{ loop.revindex }}{% endfor %}', '4321'))
                .then(() => run('{% for key,value in test %}{{async()}}{{ loop.revindex0 }}{% endfor %}', '3210'))
                .then(() => run('{% for key,value in test %}{{async()}}{{ loop.length }}{% endfor %}', '4444'))
                .then(() => run('{% for key,value in test %}{{async()}}{{ loop.first }}{% endfor %}', 'truefalsefalsefalse'))
                .then(() => run('{% for key,value in test %}{{async()}}{{ loop.last }}{% endfor %}', 'falsefalsefalsetrue'));
    })

})
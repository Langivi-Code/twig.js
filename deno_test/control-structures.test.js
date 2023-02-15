import { assertEquals } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test("Twig.js Control Structures -> if tag ->", async (t) => {
    await t.step( "should parse the contents of the if block if the expression is true", async () => {
            const testTemplate = await twig.twig({
                data: "{% if test %}true{% endif%}"
            });
            assertEquals(testTemplate.render({ test: true }), "true");
            assertEquals(testTemplate.render({ test: false }), "");
        }
    );

    await t.step( 'should call the if or else blocks based on the expression result', async () => {
            const testTemplate = await twig.twig({
                data: "{% if test %}true{% endif%}"
            });
            assertEquals(testTemplate.render({ test: true }), "true");
            assertEquals(testTemplate.render({ test: false }), "");
        }
    );

    await t.step( 'should support elseif', async () => {
            const testTemplate = await twig.twig({
                data: '{% if test %}1{% elseif other %}2{%else%}3{% endif%}'
            });
            assertEquals(testTemplate.render({test: true, other: false}), '1');
            assertEquals(testTemplate.render({test: true, other: true}), '1');
            assertEquals(testTemplate.render({test: false, other: true}), '2');
            assertEquals(testTemplate.render({test: false, other: false}), '3');
        }
    );

    await t.step( 'should be able to nest', async () => {
            const testTemplate = await twig.twig({
                data: '{% if test %}{% if test2 %}true{% else %}false{% endif%}{% else %}not{% endif%}'
            });
            assertEquals(testTemplate.render({test: true, test2: true}), 'true');
            assertEquals(testTemplate.render({test: true, test2: false}), 'false');
            assertEquals(testTemplate.render({test: false, test2: true}), 'not');
            assertEquals(testTemplate.render({test: false, test2: false}), 'not');
        }
    );

    await t.step( 'should support newlines in if statement', async () => {
            const testTemplate = await twig.twig({
                data: '{% if test or\r\nother %}true{% endif%}'
            });
            assertEquals(testTemplate.render({test: true, other: false}), 'true');
            assertEquals(testTemplate.render({test: false, other: false}), '');
        }
    );

    await t.step( 'should support values which are not booleans', async () => {
            const testTemplate = await twig.twig({
                data: '{% if test %}test_true{% elseif other %}other_true{% else %}all_false{% endif %}'
            });
            assertEquals(testTemplate.render({test: 'true', other: true}), 'test_true');
            assertEquals(testTemplate.render({test: false, other: 'true'}), 'other_true');
            assertEquals(testTemplate.render({test: false, other: false}), 'all_false');

            assertEquals(testTemplate.render({test: 0, other: true}), 'other_true');
            assertEquals(testTemplate.render({test: 0, other: true}), 'other_true');
            assertEquals(testTemplate.render({test: '', other: true}), 'other_true');
            assertEquals(testTemplate.render({test: '0', other: true}), 'other_true');
            assertEquals(testTemplate.render({test: [], other: true}), 'other_true');
            assertEquals(testTemplate.render({test: null, other: true}), 'other_true');
            assertEquals(testTemplate.render({test: undefined, other: true}), 'other_true');
        }
    );

});

Deno.test('for tag ->', async (t)=>{
    await t.step('should provide value only for array input', async () => {
        const testTemplate = await twig.twig({
            data:'{% for value in test %}{{ value }}{% endfor %}'
        });

        assertEquals(testTemplate.render({test: [1, 2, 3, 4]}), '1234');
        assertEquals(testTemplate.render({test: []}), '');
    });

    await t.step('should provide both key and value for array input', async () => {
        const testTemplate = await twig.twig({
            data:'{% for key,value in test %}{{key}}:{{ value }}{% endfor %}'
        });

        assertEquals(testTemplate.render({test: [1, 2, 3, 4]}), '0:11:22:33:4');
        assertEquals(testTemplate.render({test: []}), '');
    })


    await t.step('should provide both key and value for multiline array input', async () => {
        const testTemplate = await twig.twig({
            data:'{% for key,value in [\n"foo",\n"bar\n","baz"] %}{{key}}:{{ value }}{% endfor %}'
        });
        assertEquals(testTemplate.render({}), '0:foo1:bar\n2:baz');
    })


    await t.step('should provide value only for object input', async () => {
        const testTemplate = await twig.twig({
            data:'{% for value in test %}{{ value }}{% endfor %}'
        });
        assertEquals(testTemplate.render({test: {one: 1, two: 2, three: 3}}), '123');
        assertEquals(testTemplate.render({test: {}}), '');
    })

    await t.step('should provide both key and value for object input', async () => {
        const testTemplate = await twig.twig({
            data:'{% for key, value in test %}{{key}}:{{ value }}{% endfor %}'
        });
        assertEquals(testTemplate.render({test: {one: 1, two: 2, three: 3}}), 'one:1two:2three:3');
        assertEquals(testTemplate.render({test: {}}), '');
    })

    await t.step('should provide both key and value for multiline object input', async () => {
        const testTemplate = await twig.twig({
            data:'{% for key,value in {\n"foo":"bar\n",\n"baz":"bar"\n} %}{{key}}:{{ value }}{% endfor %}'
        });
        assertEquals(testTemplate.render({test: {}}), 'foo:bar\nbaz:bar');
    })

    await t.step('should support else if the input is empty', async () => {
        const testTemplate = await twig.twig({
            data: '{% for key,value in test %}{{ value }}{% else %}else{% endfor %}'
        });
        assertEquals(testTemplate.render({test: [1, 2, 3, 4]}), '1234');
        assertEquals(testTemplate.render({test: []}), 'else');
    })

    await t.step('should be able to nest', async ()=>{
        const testTemplate = await twig.twig({
            data: '{% for key,list in test %}{% for val in list %}{{ val }}{%endfor %}.{% else %}else{% endfor %}'
        });
        assertEquals(testTemplate.render({test: [[1, 2], [3, 4], [5, 6]]}), '12.34.56.');
        assertEquals(testTemplate.render({test: []}), 'else');
    })

    await t.step('should have a loop context item available for arrays', async () => {
        let testTemplate = await twig.twig({
            data: '{% for key,value in test %}{{ loop.index }}{% endfor %}'
        });
        assertEquals(testTemplate.render({test: [1, 2, 3, 4]}), '1234');
        testTemplate = await twig.twig({data: '{% for key,value in test %}{{ loop.index0 }}{% endfor %}'});
        assertEquals(testTemplate.render({test: [1, 2, 3, 4]}), '0123');
        testTemplate = await twig.twig({data: '{% for key,value in test %}{{ loop.revindex }}{% endfor %}'});
        assertEquals(testTemplate.render({test: [1, 2, 3, 4]}), '4321');
        testTemplate = await twig.twig({data: '{% for key,value in test %}{{ loop.revindex0 }}{% endfor %}'});
        assertEquals(testTemplate.render({test: [1, 2, 3, 4]}), '3210');
        testTemplate = await twig.twig({data: '{% for key,value in test %}{{ loop.length }}{% endfor %}'});
        assertEquals(testTemplate.render({test: [1, 2, 3, 4]}), '4444');
        testTemplate = await twig.twig({data: '{% for key,value in test %}{{ loop.first }}{% endfor %}'});
        assertEquals(testTemplate.render({test: [1, 2, 3, 4]}), 'truefalsefalsefalse');
        testTemplate = await twig.twig({data: '{% for key,value in test %}{{ loop.last }}{% endfor %}'});
        assertEquals(testTemplate.render({test: [1, 2, 3, 4]}), 'falsefalsefalsetrue');
    })

    await t.step('should have a loop context item available for objects', async () => {
        let testTemplate = await twig.twig({
            data:  '{% for key,value in test %}{{ loop.index }}{% endfor %}'
        });
        assertEquals(testTemplate.render({test: {a: 1, b: 2, c: 3, d: 4}}), '1234');
        testTemplate = await twig.twig({data: '{% for key,value in test %}{{ loop.index0 }}{% endfor %}'});
        assertEquals(testTemplate.render({test: {a: 1, b: 2, c: 3, d: 4}}), '0123');
        testTemplate = await twig.twig({data: '{% for key,value in test %}{{ loop.revindex }}{% endfor %}'});
        assertEquals(testTemplate.render({test: {a: 1, b: 2, c: 3, d: 4}}), '4321');
        testTemplate = await twig.twig({data: '{% for key,value in test %}{{ loop.revindex0 }}{% endfor %}'});
        assertEquals(testTemplate.render({test: {a: 1, b: 2, c: 3, d: 4}}), '3210');
        testTemplate = await twig.twig({data: '{% for key,value in test %}{{ loop.length }}{% endfor %}'});
        assertEquals(testTemplate.render({test: {a: 1, b: 2, c: 3, d: 4}}), '4444');
        testTemplate = await twig.twig({data: '{% for key,value in test %}{{ loop.first }}{% endfor %}'});
        assertEquals(testTemplate.render({test: {a: 1, b: 2, c: 3, d: 4}}), 'truefalsefalsefalse');
        testTemplate = await twig.twig({data: '{% for key,value in test %}{{ loop.last }}{% endfor %}'});
        assertEquals(testTemplate.render({test: {a: 1, b: 2, c: 3, d: 4}}), 'falsefalsefalsetrue');
    })

    await t.step('should have a loop context item available in child loops objects', async () => {
        let testTemplate = await twig.twig({data: '{% for value in test %}{% for value in inner %}({{ loop.parent.loop.index }},{{ loop.index }}){% endfor %}{% endfor %}'});
        assertEquals(testTemplate.render({test: {a: 1, b: 2}, inner: [1, 2, 3]}), '(1,1)(1,2)(1,3)(2,1)(2,2)(2,3)');
    })

    await t.step('should support conditionals on for loops', async () => {
        let testTemplate = await twig.twig({
            data:  '{% for value in test if false %}{{ value }},{% endfor %}'
        });
        assertEquals(testTemplate.render({test: ['one', 'two', 'a', 'b', 'other']}), '');
        testTemplate = await twig.twig({data: '{% for value in test if true %}{{ value }}{% endfor %}'});
        assertEquals(testTemplate.render({test: ['a', 's', 'd', 'f']}), 'asdf');
        testTemplate = await twig.twig({data: '{% for value in test if value|length > 2 %}{{ value }},{% endfor %}'});
        assertEquals(testTemplate.render({test: ['one', 'two', 'a', 'b', 'other']}), 'one,two,other,');
        testTemplate = await twig.twig({data: '{% for key,item in test if item.show %}{{key}}:{{ item.value }},{% endfor %}'});
        assertEquals(testTemplate.render({test: {
            a: {show: true, value: 'one'},
            b: {show: false, value: 'two'},
            c: {show: true, value: 'three'}}
        }), 'a:one,c:three,');

    })
})

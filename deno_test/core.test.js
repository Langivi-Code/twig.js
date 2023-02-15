import { assertEquals, assertThrows } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test("Twig.js Core ->", async (t) => {
    await t.step("should save and load a template by reference", async () => {
        // Define and save a template
        await twig.twig({
            id: "test",
            data: '{{ "test" }}'
        });

        // Load and render the template
        const result = await twig.twig({ ref: "test" });
        assertEquals(result.render(), "test");
    });

    await t.step("should ignore comments", async () => {
        let template = await twig.twig({ data: "good {# comment #}morning" });
        assertEquals(template.render(), "good morning");
        template = await twig.twig({ data: "good{#comment#}morning" });
        assertEquals(template.render(), "goodmorning");
    });

    await t.step("should ignore output tags within comments", async () => {
        let template = await twig.twig({ data: 'good {# {{ "Hello" }} #}morning' });
        assertEquals(template.render(),"good morning");
        template = await twig.twig({ data: "good{#c}}om{{m{{ent#}morning" });
        assertEquals(template.render(), "goodmorning");
    });

    await t.step("should ignore logic tags within comments", async () => {
        let template = await twig.twig({data: "test {# {% bad syntax if not in comment %} #}test"});
        assertEquals(template.render(), "test test");
        template = await twig.twig({ data: "{##}{##}test{# %}}}%}%{%{{% #}pass" });
        assertEquals(template.render(), "testpass");
    });

    // https://github.com/justjohn/twig.js/issues/95
    await t.step("should ignore quotation marks within comments", async () => {
        let template = await twig.twig({ data: "good {# don't stop #}morning" })
        assertEquals(template.render(), "good morning");
        template = await twig.twig({ data: 'good{#"dont stop"#}morning' });
        assertEquals(template.render(), "goodmorning");
        template = await twig.twig({ data: 'good {# "don\'t stop" #}morning' });
        assertEquals(template.render(), "good morning");
        template = await twig.twig({ data: "good{#\"'#}morning" });
        assertEquals(template.render(), "goodmorning");
        template = await twig.twig({ data: "good {#\"'\"'\"'#} day" })
        assertEquals(template.render(), "good  day");
        template = await twig.twig({ data: "a {# ' #}b{# ' #} c" })
        assertEquals(template.render(), "a b c");
    });

    await t.step("should be able to parse output tags with tag ends in strings", async () => {
            // Really all we care about here is not throwing exceptions.
            let template = await twig.twig({ data: '{{ "test" }}' });
            assertEquals(template.render(), "test");
            template = await twig.twig({ data: '{{ " }} " }}' });
            assertEquals(template.render(), " }} ");
            template = await twig.twig({ data: '{{ " \\"}} " }}' });
            assertEquals(template.render(), ' "}} ');
            template = await twig.twig({ data: "{{ ' }} ' }}" });
            assertEquals(template.render(), " }} ");
            template = await twig.twig({ data: "{{ ' \\'}} ' }}" });
            assertEquals(template.render(), " '}} ");
            template = await twig.twig({ data: '{{ " \'}} " }}' });
            assertEquals(template.render(), " '}} ");
            template = await twig.twig({ data: "{{ ' \"}} ' }}" });
            assertEquals(template.render(), ' "}} ');
        }
    );

    await t.step("should be able to parse whitespace control output tags", async () => {
        let template = await twig.twig({ data: ' {{- "test" -}}' })
        assertEquals(template.render(), "test");
        template = await twig.twig({ data: ' {{- "test" -}} ' });
        assertEquals(template.render(), "test");
        template = await twig.twig({ data: '\n{{- "test" -}}' });
        assertEquals(template.render(), "test");
        template = await twig.twig({ data: '{{- "test" -}}\n' });
        assertEquals(template.render(), "test");
        template = await twig.twig({ data: '\n{{- "test" -}}\n' });
        assertEquals(template.render(), "test");
        template = await twig.twig({ data: '\t{{- "test" -}}\t' });
        assertEquals(template.render(), "test");
        template = await twig.twig({ data: '\n\t{{- "test" -}}\n\t' });
        assertEquals(template.render(), "test");
        template = await twig.twig({ data: '123\n\t{{- "test" -}}\n\t456' });
        assertEquals(template.render(), "123test456");
        template = await twig.twig({ data: "\n{{- orp -}}\n" });
        assertEquals(template.render({ orp: "test" }), "test");
        template = await twig.twig({ data: "\n{{- [1,2 ,1+2 ] -}}\n" });
        assertEquals(template.render(), "1,2,3");
        template = await twig.twig({ data: ' {{- "test" -}} {{- "test" -}}' });
        assertEquals( template.render(), "testtest");
        template = await twig.twig({ data: '{{ "test" }} {{- "test" -}}' });
        assertEquals(template.render(), "testtest");
        template = await twig.twig({ data: '{{- "test" -}} {{ "test" }}' });
        assertEquals(template.render(), "testtest");
        template = await twig.twig({ data: '<>{{- "test" -}}<>' });
        assertEquals(template.render(), "<>test<>");
    });

    await t.step("should be able to parse mismatched opening whitespace control output tags", async () => {
        let template = await twig.twig({ data: ' {{- "test" }}' });
        assertEquals(template.render(), "test");
        template = await twig.twig({ data: '{{- "test" }}\n' });
        assertEquals(template.render(), "test\n");
        template = await twig.twig({ data: '\t{{- "test" }}\t' });
        assertEquals(template.render(), "test\t");
        template = await twig.twig({ data: '123\n\t{{- "test" }}\n\t456' });
        assertEquals(template.render(), "123test\n\t456");
        template = await twig.twig({ data: "\n{{- [1,2 ,1+2 ] }}\n" });
        assertEquals(template.render(), "1,2,3\n");
        template = await twig.twig({ data: ' {{- "test" }} {{- "test" }}' });
        assertEquals(template.render(), "testtest");
        template = await twig.twig({ data: '{{ "test" }} {{- "test" }}' });
        assertEquals(template.render(), "testtest");
        template = await twig.twig({ data: ' {{- "test" }} {{ "test" }}' });
        assertEquals(template.render(), "test test");
        template = await twig.twig({ data: ' {{- "test" }} {{- "test" -}}' });
        assertEquals(template.render(), "testtest");
        template = await twig.twig({ data: '<>{{- "test" }}' });
        assertEquals(template.render(), "<>test");
        }
    );

    await t.step("should be able to parse mismatched closing whitespace control output tags", async () => {
        let template = await twig.twig({ data: ' {{ "test" -}}' });
        assertEquals(template.render(), " test");
        template = await twig.twig({ data: '\n{{ "test" -}}\n' });
        assertEquals(template.render(), "\ntest");
        template = await twig.twig({ data: '\t{{ "test" -}}\t' });
        assertEquals(template.render(), "\ttest");
        template = await twig.twig({ data: '123\n\t{{ "test" -}}\n\t456' });
        assertEquals(template.render(), "123\n\ttest456");
        template = await twig.twig({ data: "\n{{ [1,2 ,1+2 ] -}}\n" });
        assertEquals(template.render(), "\n1,2,3");
        template = await twig.twig({ data: ' {{ "test" -}} {{ "test" -}}' });
        assertEquals(template.render(), " testtest");
        template = await twig.twig({ data: '{{ "test" }} {{ "test" -}} ' });
        assertEquals(template.render(), "test test");
        template = await twig.twig({ data: ' {{ "test" -}} {{ "test" }} ' });
        assertEquals(template.render(), " testtest ");
        template = await twig.twig({ data: ' {{ "test" -}} {{- "test" -}}' });
        assertEquals(template.render(), " testtest");
        template = await twig.twig({ data: '{{ "test" -}}<>' });
        assertEquals(template.render(), "test<>");
    });

    await t.step("should be able to parse whitespace control logic tags", async () => {
        // Newlines directly after logic tokens are ignored
        // So use double newlines
        let template = await twig.twig({ data: '{%- if true -%}{{ "test" }}{% endif %}' });
        assertEquals(template.render(), "test");
        template = await twig.twig({ data: '{%- if true -%}{{ "test" }}{%- endif -%}' });
        assertEquals(template.render(), "test");
        template = await twig.twig({ data: ' {%- if true -%} {{ "test" }}{% endif %}' });
        assertEquals(template.render(), "test");
        template = await twig.twig({data: '\n{%- if true -%}\n\n{{ "test" }}{% endif %}'});
        assertEquals(template.render(), "test");
        template = await twig.twig({data: '\n\t{%- if true -%}\n\n\t{{ "test" }}{% endif %}'});
        assertEquals(template.render(), "test");
        template = await twig.twig({data:'123\n\t{%- if true -%}\n\n\t{{ "test" }}{% endif %}456'});
        assertEquals(template.render(), "123test456");
        template = await twig.twig({data:"\n\t{%- if true -%}\n\n\t{{ [1,2 ,1+2 ] }}{% endif %}"});
        assertEquals(template.render(), "1,2,3");
        template = await twig.twig({ data: "<>{%- if true -%}test{% endif %}<>" });
        assertEquals(template.render(), "<>test<>");
        template = await twig.twig({data:'{% if true -%}no_right_trim {{ "test" }}{% endif %}'})
        assertEquals(template.render(), "no_right_trim test");
        template = await twig.twig({data:'{% if true %}{{ "test" }} no_left_trim{%- endif %}'})
        assertEquals(template.render(), "test no_left_trim");
        }
    );

    await t.step("should be able to parse mismatched opening whitespace control logic tags", async () => {
        let template = await twig.twig({ data: '{%- if true %}{{ "test" }}{% endif %}' });
        assertEquals(template.render(), "test");
        template = await twig.twig({ data: '{%- if true %}{{ "test" }}{% endif %}' });
        assertEquals(template.render(), "test");
        template = await twig.twig({ data: ' {% if true %} {{ "test" }}{% endif %}' });
        assertEquals(template.render(),"  test");
        template = await twig.twig({ data: ' {%- if true %} {{ "test" }}{% endif %}' });
        assertEquals(template.render(), " test");
        template = await twig.twig({data: '\n{% if true %}\n\n{{ "test" }}{% endif %}'});
        assertEquals(template.render(), "\n\ntest");
        template = await twig.twig({data: '\n{%- if true %}\n\n{{ "test" }}{% endif %}'});
        assertEquals(template.render(), "\ntest");
        template = await twig.twig({data: '\n\t{%- if true %}\n\n\t{{ "test" }}{% endif %}'});
        assertEquals(template.render(), "\n\ttest");
        template = await twig.twig({data:'123\n\t{%- if true %}\n\n\t{{ "test" }}{% endif %}456'});
        assertEquals(template.render(), "123\n\ttest456");
        template = await twig.twig({data:"\n\t{%- if true %}\n\n\t{{ [1,2 ,1+2 ] }}{% endif %}"});
        assertEquals(template .render(),"\n\t1,2,3");
        template = await twig.twig({ data: "<>{%- if true %}test{% endif %}" });
        assertEquals(template.render(), "<>test");
    });

    await t.step("should be able to parse mismatched closing whitespace control logic tags", async () => {
        let template = await twig.twig({ data: '{% if true %}{{ "test" }}{% endif %}' });
        assertEquals(template.render(), "test");
        template = await twig.twig({ data: '{% if true -%} {{ "test" }}{% endif %}' });
        assertEquals(template.render(), "test");
        template =  await twig.twig({ data: ' {% if true -%} {{ "test" }}{% endif %}' });
        assertEquals(template.render()," test");
        template = await twig.twig({ data: ' {% if true -%} {{ "test" }}{% endif %}' });
        assertEquals(template.render(), " test");
        template = await twig.twig({data: '\n{% if true %}\n\n{{ "test" }}{% endif %}'});
        assertEquals(template.render(), "\n\ntest");
        template = await twig.twig({data: '\n{% if true -%}\n\n{{ "test" }}{% endif %}'});    
        assertEquals(template.render(), "\ntest");
        template = await twig.twig({data: '\n\t{% if true -%}\n\n\t{{ "test" }}{% endif %}'});
        assertEquals(template.render(), "\n\ttest");
        template = await twig.twig({data:'123\n\t{% if true -%}\n\n\t{{ "test" }}{% endif %}456'});
        assertEquals(template.render(), "123\n\ttest456");
        template = await twig.twig({data:"\n\t{% if true -%}\n\n\t{{ [1,2 ,1+2 ] }}{% endif %}"});
        assertEquals( template.render(), "\n\t1,2,3");
        template = await twig.twig({ data: "{% if true -%}<>test{% endif %}" });
        assertEquals( template.render(), "<>test");
    });

    await t.step("should be able to output numbers", async () => {
        let template = await twig.twig({ data: "{{ 12 }}" });
        assertEquals(template.render(), "12");
        template = await twig.twig({ data: "{{ 12.64 }}" });
        assertEquals(template.render(), "12.64");
        template = await twig.twig({ data: "{{ 0.64 }}" });
        assertEquals(template.render(), "0.64");
    });

    await t.step("should be able to output booleans", async () => {
        let template = await twig.twig({ data: "{{ true }}" });
        assertEquals(template.render(), "true");
        template =  await twig.twig({ data: "{{ false }}" });
        assertEquals(template.render(), "false");
    });

    await t.step("should be able to output strings", async () => {
        let template = await twig.twig({ data: '{{ "double" }}' });
        assertEquals(template.render(), "double");
        template = await twig.twig({ data: "{{ 'single' }}" });
        assertEquals(template.render(), "single");
        template = await twig.twig({ data: '{{ "dou\'ble" }}' });
        assertEquals(template.render(), "dou'ble");
        template = await twig.twig({ data: "{{ 'sin\"gle' }}" });
        assertEquals(template.render(), 'sin"gle');
        template = await twig.twig({ data: '{{ "dou\\"ble" }}' });
        assertEquals(template.render(), 'dou"ble');
        template = await twig.twig({ data: "{{ 'sin\\'gle' }}" });
        assertEquals(template.render(), "sin'gle");
    });

    await t.step("should be able to output strings with newlines", async () => {
        const template = await twig.twig({ data: "{{ 'a\nb\rc\r\nd' }}" });
        assertEquals(template.render(), "a\nb\rc\r\nd");
    });
    await t.step("should be able to output arrays", async () => {
        let template = await twig.twig({ data: "{{ [1] }}" });
        assertEquals(template.render(), "1");
        template = await twig.twig({ data: "{{ [1,2 ,3 ] }}" });
        assertEquals(template.render(), "1,2,3");
        template = await twig.twig({ data: "{{ [1,2 ,3 , val ] }}" });
        assertEquals(template.render({ val: 4 }), "1,2,3,4");
        template = await twig.twig({ data: '{{ ["[to",\'the\' ,"string]" ] }}' });
        assertEquals(template.render(), "[to,the,string]");
        template = await twig.twig({ data: '{{ ["[to",\'the\' ,"str\\"ing]" ] }}' });
        assertEquals(template.render(), '[to,the,str"ing]');
    });
    await t.step("should be able to output parse expressions in an array", async () => {
        let template = await twig.twig({ data: "{{ [1,2 ,1+2 ] }}" });
        assertEquals(template.render(), "1,2,3");
        template = await twig.twig({ data: '{{ [1,2 ,3 , "-", [4,5, 6] ] }}' });
        assertEquals(template.render({ val: 4 }),"1,2,3,-,4,5,6");
        template = await twig.twig({ data: "{{ [a,b ,(1+2) * a ] }}" });
        assertEquals(template.render({ a: 1, b: 2 }), "1,2,3");
        template = await twig.twig({ data: "{{ [not a, b] }}" });
        assertEquals(template.render({ a: false, b: true }),"true,true");
        template =  await twig.twig({ data: "{{ [a, not b] }}" });
        assertEquals(template.render({ a: true, b: false }),"true,true");
    });
    await t.step("should be able to output variables", async () => {
        let template = await twig.twig({ data: "{{ orp }}" });
        assertEquals(template.render({orp: 'test'}), "test");
        template = await twig.twig({ data: "{{ val }}" });
        assertEquals(template.render({val() {return "test"}}),"test");
    });

    await t.step("should recognize null", async () => {
        let template = await twig.twig({ data: "{{ null == val }}" });
        assertEquals(template.render({ val: null }), "true");
        template = await twig.twig({ data: "{{ null == val }}" });
        assertEquals(template.render({ val: undefined }), "true");
        template = await twig.twig({ data: "{{ null == val }}" });
        assertEquals(template.render({ val: "test" }), "false");
        template = await twig.twig({ data: "{{ null == val }}" });
        assertEquals(template.render({ val: 0 }), "false");
        template = await twig.twig({ data: "{{ null == val }}" });
        assertEquals(template.render({ val: false }), "false");
    });

    await t.step("should recognize object literals", async () => {
        const template = await twig.twig({data:'{% set at = {"foo": "test", bar: "other", 1:"zip"} %}{{ at.foo ~ at.bar ~ at.1 }}'});
        assertEquals(template.render(), "testotherzip");
    });

    await t.step("should allow newlines in object literals", async () => {
        const template = await twig.twig({data:'{% set at = {\n"foo": "test",\rbar: "other",\r\n1:"zip"\n} %}{{ at.foo ~ at.bar ~ at.1 }}'});
        assertEquals(template.render(), "testotherzip");
    });

    await t.step("should recognize null in an object", async () => {
        const template = await twig.twig({data: '{% set at = {"foo": null} %}{{ at.foo == val }}'});
        assertEquals(template.render({ val: null }), "true");
    });

    await t.step("should allow int 0 as a key in an object", async () => {
        const template = await twig.twig({ data: '{% set at = {0: "value"} %}{{ at.0 }}' });
        assertEquals(template.render(), "value");
    });

    await t.step("should support set capture", async () => {
        const template =  await twig.twig({ data: "{% set foo %}bar{% endset %}{{foo}}" });
        assertEquals(template.render(),"bar");
    });

    await t.step("should support raw data", async () => {
        const template = await twig.twig({data:"before {% raw %}{{ test }} {% test2 %} {{{% endraw %} after"});
        assertEquals(template.render(), "before {{ test }} {% test2 %} {{ after");
    });

    await t.step("should support raw data using 'verbatim' tag", async () => {
        let template = await twig.twig({data:"before {% verbatim %}{{ test }} {% test2 %} {{{% endverbatim %} after"});
        assertEquals(template.render(), "before {{ test }} {% test2 %} {{ after");
    });
});

Deno.test('Key Notation ->', async (t)=>{
    await t.step('should support dot key notation', async(t) => {
        const template = await twig.twig({data: '{{ key.value }} {{ key.sub.test }}'});
        assertEquals(template.render({
            key: {
                value: 'test',
                sub: {
                    test: 'value'
                }
            }
        }), 'test value');
    });
    await t.step('should support square bracket key notation', async(t) => {
        const template = await twig.twig({data: '{{ key["value"] }} {{ key[\'sub\']["test"] }}'});
        assertEquals(template.render({
            key: {
                value: 'test',
                sub: {
                    test: 'value'
                }
            }
        }),'test value');
    });
    await t.step('should support mixed dot and bracket key notation', async(t) => {
        const template = await twig.twig({data: '{{ key["value"] }} {{ key.sub[key.value] }} {{ s.t["u"].v["w"] }}'});
        assertEquals(template.render({
            key: {
                value: 'test',
                sub: {
                    test: 'value'
                }
            },
            s: {t: {u: {v: {w: 'x'}}}}
        }), 'test value x');
    });

    await t.step('should support dot key notation after a function', async(t) => {
        const testTemplate = await twig.twig({data: '{{ key.fn().value }}'});
        const output = testTemplate.render({
            key: {
                fn() {
                    return {
                        value: 'test'
                    };
                }
            }
        });
        assertEquals(output, 'test');
    });

    await t.step('should support bracket key notation after a function', async(t) => {
        const testTemplate = await twig.twig({data: '{{ key.fn()["value"] }}'});
        const output = testTemplate.render({
            key: {
                fn() {
                    return {
                        value: 'test 2'
                    };
                }
            }
        });
        assertEquals(output, 'test 2');
    });

    await t.step('should check for getKey methods if a key doesn\'t exist.', async(t) => {
        const template = await twig.twig({data: '{{ obj.value }}'});
        assertEquals(template.render({
           obj: {
                getValue() {
                    return 'val';
                },
                isValue() {
                    return 'not val';
                }
            }
        }), 'val');
    });

    await t.step('should check for isKey methods if a key doesn\'t exist.', async(t) => {
        const template = await twig.twig({data: '{{ obj.value }}'});
        assertEquals(template.render({
            obj: {
                isValue() {
                    return 'val';
                }
            }
        }), 'val');
    });

    await t.step('should check for getKey methods on prototype objects.', async(t) => {
        const object = {
            getValue() {
                return 'val';
            }
        };
        function Subobj() {}
        Subobj.prototype = object;
        const subobj = new Subobj();
        const template = await twig.twig({data: '{{ obj.value }}'});
        assertEquals(template.render({
            obj: subobj
        }), 'val');
    });

    await t.step('should return null if a period key doesn\'t exist.', async(t) => {
        const template = await twig.twig({data: '{{ obj.value == null }}'});
        assertEquals(template.render({
            obj: {}
        }), 'true');
    });

    await t.step('should return null if a bracket key doesn\'t exist.', async(t) => {
        const template = await twig.twig({data: '{{ obj["value"] == null }}'});
        assertEquals(template.render({
            obj: {}
        }), 'true');
    });
});

Deno.test('Context ->', async (t) => {
    await t.step('should be supported', async(t) => {
        const template = await twig.twig({data: '{{ _context.value }}'});
        assertEquals( template.render({
            value: 'test'
        }), 'test');
    });

    await t.step('should be an object even if it\'s not passed', async(t) => {
        const template = await twig.twig({data: '{{ _context|json_encode }}'});
        assertEquals(template.render(), '{}');
    });

    await t.step('should support {% set %} tag', async(t) => {
        const template = await twig.twig({data: '{% set value = "test" %}{{ _context.value }}'});
        assertEquals(template.render(), 'test');
    });

    await t.step('should work correctly with properties named dynamically', async(t) => {
        const template = await twig.twig({data: '{{ _context[key] }}'});
        assertEquals(template.render({
            key: 'value',
            value: 'test'
        }), 'test');
    });

    await t.step('should not allow to override context using {% set %}', async(t) => {
        let template = await twig.twig({data: '{% set _context = "test" %}{{ _context|json_encode }}'});
        assertEquals(template.render(), '{"_context":"test"}');
        template =  await twig.twig({data: '{% set _context = "test" %}{{ _context._context }}'});
        assertEquals(template.render(), 'test');
    });

    await t.step('should support autoescape option', async(t) => {
        const template = await twig.twig({autoescape: true, data: '&& {{ value }} &&'})
        assertEquals(template.render({
            value: '<test>&</test>'
        }), '&& &lt;test&gt;&amp;&lt;/test&gt; &&');
    });

    await t.step('should not autoescape includes', async(t) => {
        await twig.twig({id: 'included2', data: '& {{ value }} &'});
        const template = await twig.twig({
            allowInlineIncludes: true,
            autoescape: true,
            data: '&& {% include "included2" %} &&'
        });
        assertEquals(template.render({value: '&'}), '&& & &amp; & &&');
    });

    await t.step('should not autoescape includes having a parent', async(t) => {
        await twig.twig({id: 'included3', data: '{% extends "parent2" %}{% block body %}& {{ value }} &{% endblock %}'});
        await twig.twig({id: 'parent2', data: '&& {% block body %}{% endblock body %} &&'});
        const template = await twig.twig({
            allowInlineIncludes: true,
            autoescape: true,
            data: '&&& {% include "included3" %} &&&'
        });
        assertEquals(template.render({value: '&'}), '&&& && & &amp; & && &&&');
    });

    await t.step('should not autoescape embeds having a parent', async(t) => {
        await twig.twig({id: 'included4', data: '{% embed "parent3" %}{% block body %}& {{ value }} &{% endblock %}{% endembed %}'});
        await twig.twig({id: 'parent3', data: '&& {% block body %}{% endblock body %} &&'});
        const template = await twig.twig({
            allowInlineIncludes: true,
            autoescape: true,
            data: '&&& {% include "included4" %} &&&'
        });
        assertEquals(template.render({value: '&'}), '&&& && & &amp; & && &&&');
    });

    await t.step('should support autoescape option with alternative strategy', async(t) => {
        const template = await twig.twig({
            autoescape: 'js',
            data: '{{ value }}'
        });
        assertEquals(template.render({
            value: '<test>&</test>'
        }), '\\u003Ctest\\u003E\\u0026\\u003C\\/test\\u003E');
    });

    await t.step('should not auto escape html_attr within the html strategy', async(t) => {
        const template = await twig.twig({
            autoescape: 'html',
            data: '{{ value|escape(\'html_attr\') }}'
        })
        assertEquals(template.render({
            value: '" onclick="alert(\\"html_attr\\")"'
        }), '&quot;&#x20;onclick&#x3D;&quot;alert&#x28;&#x5C;&quot;html_attr&#x5C;&quot;&#x29;&quot;');
    });

    await t.step('should return a usable string after autoescaping', async(t) => {
        const result = await twig.twig({
            autoescape: true,
            data: '{{ value }}'
        });
        const renderResult = result.render({
            value: '<test>&</test>'
        });
        assertEquals((typeof renderResult),'string');
        assertEquals(renderResult.valueOf(),renderResult);
    });

    await t.step('should autoescape parent() output correctly', async(t) => {
        await twig.twig({id: 'parent1', data: '{% block body %}<p>{{ value }}</p>{% endblock body %}'});
        const template = await twig.twig({
            allowInlineIncludes: true,
            autoescape: true,
            data: '{% extends "parent1" %}{% block body %}{{ parent() }}{% endblock %}'
        });
        assertEquals(template.render({ value: '<test>&</test>'}).valueOf(), "<p>&lt;test&gt;&amp;&lt;/test&gt;</p>");
    });

    await t.step('should autoescape handle empty include', async(t) => {
        await twig.twig({id: 'included-return', data: ''});
        const template =  await twig.twig({
            allowInlineIncludes: true,
            autoescape: true,
            data: '{% include "included-return" %}'
        });
        assertEquals(template.render(), '');
    });

    await t.step('should use a correct context in the extended template', async(t) => {
        await twig.twig({id: 'parent', data: '{% block body %}{{ value }}{% endblock body %}'});
        const template =  await twig.twig({
            allowInlineIncludes: true,
            data: '{% extends "parent" %}{% set value = "test" %}{% block body %}{{ parent() }}{% endblock %}'
        });
        assertEquals(template.render(), 'test');
    });

    await t.step('should use a correct context in the included template', async(t) => {
        await twig.twig({id: 'included', data: '{{ value }}\n{% set value = "inc" %}{{ value }}\n'});
        const template = await twig.twig({
            allowInlineIncludes: true,
            data: '{% set value = "test" %}{% for i in [0, 1] %}{% include "included" %}{% endfor %}{{ value }}'
        });
        assertEquals(template.render(), 'test\ninc\ntest\ninc\ntest');
    });

    await t.step('should use the correct context for variables in the included template name', async(t) => {
        await twig.twig({
            id: 'included-template',
            data: '{{ value }} - {{ prefix }}'
        });
        const template =  await twig.twig({
            allowInlineIncludes: true,
            data: '{% include prefix ~ "-template" with {"value": value} only %}'
        });
        assertEquals(template.render({
            prefix: 'included',
            value: 'test'
        }), 'test - ');
    });
});

Deno.test('Imports ->', async (t)=>{
    await t.step('should load an inline include when the file exists', async(t) => {
        /* eslint-disable-next-line no-use-extend-native/no-use-extend-native */
        const template = await twig.twig({
            allowInlineIncludes: true,
            async: false,
            rethrow: true,
            data: '{% include \'./deno_test/templates/simple.twig\' %}'
        });
        assertEquals(template.render(),"Twig.js!");
    });

    await t.step('should throw when trying to load an inline include and the file does not exist', async()=> {
        /* eslint-disable-next-line no-use-extend-native/no-use-extend-native */
        const template = await twig.twig({
            allowInlineIncludes: true,
            async: false,
            rethrow: true,
            data: '{% include \'./deno_test/templates/doesnt-exist-ever.twig\' %}'
        });
        assertThrows(()=>{template.render({})});
    });
});

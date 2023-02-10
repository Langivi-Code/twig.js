import { assertEquals } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";
import { twigCache } from "../src/twig.cache.js";


Deno.test('Twig.js Filters -> url_encode ->', async (t) => {
    // Encodings

    function pad(num) {
        return num < 10 ? '0' + num : num;
    }

    function stringDate(date) {
        return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear() +
                                 ' @ ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }

    await t.step('should encode URLs', async () => {
        twigCache.emptyCacheDir();
        const testTemplate = await twig.twig({data: '{{ "http://google.com/?q=twig.js"|url_encode() }}'});
        assertEquals(testTemplate.render(), 'http%3A%2F%2Fgoogle.com%2F%3Fq%3Dtwig.js');
    });

    await t.step('should handle undefined', async () => {
        const testTemplate = await twig.twig({data: '{{ undef|url_encode() }}'});
        assertEquals(testTemplate.render(), '');
    });

    await t.step('should handle empty strings', async () => {
        const testTemplate = await twig.twig({data: '{{ ""|url_encode() }}'});
        assertEquals(testTemplate.render(), '');
    });

    await t.step('should handle special characters', async () => {
        const data = {foo: '<foo> \\&"\'.,-_?/Ķä€台北[]{}\t\r\n\b\u0080'};
        const testTemplate = await twig.twig({data: '{{ foo|url_encode() }}'});
        assertEquals(testTemplate.render(data), '%3Cfoo%3E%20%5C%26%22%27.%2C-_%3F%2F%C4%B6%C3%A4%E2%82%AC%E5%8F%B0%E5%8C%97%5B%5D%7B%7D%09%0D%0A%08%C2%80');
    });

    await t.step('should encode objects to url', async () => {
        const testTemplate = await twig.twig({data: '{{ ({ a: "customer@example.com", b: { c: 123, d: [1, 2, 3] } })|url_encode }}'});
        assertEquals(testTemplate.render(), 'a=customer%40example.com&amp;b%5Bc%5D=123&amp;b%5Bd%5D%5B0%5D=1&amp;b%5Bd%5D%5B1%5D=2&amp;b%5Bd%5D%5B2%5D=3');
    });

    await t.step('json_encode ->  should encode strings to json', async () => {
        const testTemplate = await twig.twig({data: '{{ test|json_encode }}'});
        assertEquals(testTemplate.render({test: 'value'}), '"value"');
    });

    await t.step('should encode numbers to json', async () => {
        const testTemplate = await twig.twig({data: '{{ test|json_encode }}'});
        assertEquals(testTemplate.render({test: 21}), '21');
    });

    await t.step('should encode arrays to json', async () => {
        const testTemplate = await twig.twig({data: '{{ [1,"b",3]|json_encode }}'});
        assertEquals(testTemplate.render(), '[1,"b",3]');
    });

    await t.step('should encode objects to json', async () => {
        const testTemplate = await twig.twig({data: '{{ {"a":[1,"b",3]}|json_encode }}'});
        assertEquals(testTemplate.render(), '{"a":[1,"b",3]}');
    });

    await t.step('should retain key order in an object', async () => {
        const testTemplate = await twig.twig({data: '{{ { "foo": 1, "bar": 2, "baz": 3 }|json_encode }}'});
        assertEquals(testTemplate.render(), '{"foo":1,"bar":2,"baz":3}');
    });

    await t.step('should not add additional information to objects', async () => {
        const testTemplate = await twig.twig({data: '{{ { "foo": 1, "bar": [1, 2, 3], "baz": { "a": "a", "b": "b" } }|json_encode }}'});
        assertEquals(testTemplate.render(), '{"foo":1,"bar":[1,2,3],"baz":{"a":"a","b":"b"}}')
    });

    await t.step('should handle undefined', async () => {
        const testTemplate = await twig.twig({data: '{{ undef|json_encode }}'});
        assertEquals(testTemplate.render(), 'null');
    });

    await t.step('should encode dates correctly', async () => {
        const testTemplate = await twig.twig({data: '{{ test|json_encode }}'});
        const data = {a: new Date('2011-10-10')};
        assertEquals(testTemplate.render({test: data}), '{"a":"2011-10-10T00:00:00.000Z"}');
    });

    // String manipulation
    await t.step('upper -> should convert text to uppercase', async () => {
        const testTemplate = await twig.twig({data: '{{ "hello"|upper }}'});
        assertEquals(testTemplate.render(), 'HELLO');
    });
    await t.step('should handle undefined', async () => {
        const testTemplate = await twig.twig({data: '{{ undef|upper }}'});
        assertEquals(testTemplate.render(), '');
    });
    
    await t.step(' lower -> should convert text to lowercase', async () => {
        const testTemplate = await twig.twig({data: '{{ "HELLO"|lower }}'});
        assertEquals(testTemplate.render(), 'hello');
    });

    await t.step('should handle undefined', async () => {
        const testTemplate = await twig.twig({data: '{{ undef|lower }}'});
        assertEquals(testTemplate.render(), '');
    });

    await t.step('capitalize -> should capitalize the first word in a string', async () => {
        const testTemplate = await twig.twig({data: '{{ "hello world"|capitalize }}'});
        assertEquals(testTemplate.render(), 'Hello world');

        const testTemplate2 = await twig.twig({data: '{{ "HELLO WORLD"|capitalize }}'});
        assertEquals(testTemplate2.render(), 'Hello world');
    });

    await t.step('should handle undefined', async () => {
        const testTemplate = await twig.twig({data: '{{ undef|capitalize }}'});
        assertEquals(testTemplate.render(), '');
    });

    await t.step('title -> should capitalize all the words in a string', async () => {
        const testTemplate = await twig.twig({data: '{{ "hello world"|title }}'});
        assertEquals(testTemplate.render(), 'Hello World');

        const testTemplate2 = await twig.twig({data: '{{ "HELLO WORLD"|title }}'});
        assertEquals(testTemplate2.render(), 'Hello World');
    });

    await t.step('should handle undefined', async () => {
        const testTemplate = await twig.twig({data: '{{ undef|title }}'});
        assertEquals(testTemplate.render(), '');
    });

    // String/Object/Array check
    await t.step('length ->  should determine the length of a string', async () => {
        const testTemplate = await twig.twig({data: '{{ "test"|length }}'});
        assertEquals(testTemplate.render(), '4');
    });

    await t.step('should determine the length of an array', async () => {
        const testTemplate = await twig.twig({data: '{{ [1,2,4,76,"tesrt"]|length }}'});
        assertEquals(testTemplate.render(), '5');
    });

    await t.step('should determine the length of an object', async () => {
        const testTemplate = await twig.twig({data: '{{ {"a": "b", "c": "1", "test": "test"}|length }}'});
        assertEquals(testTemplate.render(), '3');
    });

    await t.step('should handle undefined', async () => {
        const testTemplate = await twig.twig({data: '{{ undef|length }}'});
        assertEquals(testTemplate.render(), '0');
    });

    // Array/object manipulation
    await t.step('sort -> should sort an array', async () => {
        let testTemplate = await twig.twig({data: '{{ [1,5,2,7]|sort }}'});
        assertEquals(testTemplate.render(), '1,2,5,7');

        testTemplate = await twig.twig({data: '{{ ["test","abc",2,7]|sort }}'});
        assertEquals(testTemplate.render(), '2,7,abc,test');
    });

    await t.step('should sort an object', async () => {
        let testTemplate = await twig.twig({data: '{% set obj =  {\'c\': 1,\'d\': 5,\'t\': 2,\'e\':7}|sort %}{% for key,value in obj|sort %}{{key}}:{{value}} {%endfor %}'});
        assertEquals(testTemplate.render(), 'c:1 t:2 d:5 e:7 ');

        testTemplate = await twig.twig({data: '{% set obj = {\'m\':\'test\',\'z\':\'abc\',\'a\':2,\'y\':7} %}{% for key,value in obj|sort %}{{key}}:{{value}} {%endfor %}'});
        assertEquals(testTemplate.render(), 'a:2 y:7 z:abc m:test ');

        testTemplate = await twig.twig({data: '{% set obj = {\'z\':\'abc\',\'a\':2,\'y\':7,\'m\':\'test\'} %}{% for key,value in obj|sort %}{{key}}:{{value}} {%endfor %}'});
        assertEquals(testTemplate.render(), 'a:2 y:7 z:abc m:test ');
    });

    await t.step('should handle undefined', async () => {
        const testTemplate = await twig.twig({data: '{% set obj = undef|sort %}{% for key, value in obj|sort %}{{key}}:{{value}}{%endfor%}'});
        assertEquals(testTemplate.render(), '');
    });

    await t.step('reverse -> should reverse an array', async () => {
            const testTemplate = await twig.twig({data: '{{ ["a", "b", "c"]|reverse }}'});
            assertEquals(testTemplate.render(), 'c,b,a');
    });
    
    await t.step('should reverse an object', async () => {
    });

    await t.step('should handle undefined', async () => {
        const testTemplate = await twig.twig({data: '{{ undef|reverse }}'});
        assertEquals(testTemplate.render(), '');
    });

    await t.step('keys -> should return the keys of an array', async () => {
        const testTemplate = await twig.twig({data: '{{ ["a", "b", "c"]|keys }}'});
        assertEquals(testTemplate.render(), '0,1,2');
    });

    await t.step('should return the keys of an object', async () => {
        let testTemplate = await twig.twig({data: '{{ {"a": 1, "b": 4, "c": 5}|keys }}'});
        assertEquals(testTemplate.render(), 'a,b,c');

        testTemplate = await twig.twig({data: '{{ {"0":"a", "1":"b", "2":"c"}|keys }}'});
        assertEquals(testTemplate.render(), '0,1,2');
    });

    await t.step('should handle undefined', async () => {
        const testTemplate = await twig.twig({data: '{{ undef|keys }}'});
        assertEquals(testTemplate.render(), '');
    });

    await t.step('should handle empty strings', async () => {
        const testTemplate = await twig.twig({data: '{{ ""|keys }}'});
        assertEquals(testTemplate.render(), '');
    });

    await t.step('merge -> should merge two objects into an object', async () => {
        // Object merging
        const testTemplate = await twig.twig({data: '{% set obj= {"a":"test", "b":"1"}|merge({"b":2,"c":3}) %}{% for key in obj|keys|sort %}{{key}}:{{obj[key]}} {%endfor %}'});
        assertEquals(testTemplate.render(), 'a:test b:2 c:3 ');
    });
        
    await t.step('should merge two arrays into and array', async () => {
        // Array merging
        const testTemplate = await twig.twig({data: '{% set obj= ["a", "b"]|merge(["c", "d"]) %}{% for key in obj|keys|sort %}{{key}}:{{obj[key]}} {%endfor %}'});
        assertEquals(testTemplate.render(), '0:a 1:b 2:c 3:d ');
    });

    await t.step('should merge an object and an array into an object', async () => {
        // Mixed merging
        let testTemplate = await twig.twig({data: '{% set obj= ["a", "b"]|merge({"a": "c", "3":4}, ["c", "d"]) %}{% for key in obj|keys|sort %}{{key}}:{{obj[key]}} {%endfor %}'});
        assertEquals(testTemplate.render(), '0:a 1:b 3:4 4:c 5:d a:c ');

        // Mixed merging(2)
        testTemplate = await twig.twig({data: '{% set obj= {"1":"a", "a":"b"}|merge(["c", "d"]) %}{% for key in obj|keys %}{{key}}:{{obj[key]}} {%endfor %}'});
        assertEquals(testTemplate.render(), '1:a a:b 2:c 3:d ');
    });

    await t.step('join -> should join all values in an object', async () => {
        const testTemplate = await twig.twig({data: '{{ {"a":"1", "b": "b", "c":test}|join("-") }}'});
        assertEquals(testTemplate.render({test: 't'}), '1-b-t');
    });

    await t.step('should joing all values in an array', async () => {
        let testTemplate = await twig.twig({data: '{{ [1,2,4,76]|join }}'});
        assertEquals(testTemplate.render(), '12476');
        testTemplate = await twig.twig({data: '{{ [1+ 5,2,4,76]|join("-" ~ ".") }}'});
        assertEquals(testTemplate.render(), '6-.2-.4-.76');
    });

    await t.step('should handle undefined', async () => {
        const testTemplate = await twig.twig({data: '{{ undef|join }}'});
        assertEquals(testTemplate.render(), '');
    });

    await t.step('should handle empty strings', async () => {
        const testTemplate = await twig.twig({data: '{{ ""|join }}'});
        assertEquals(testTemplate.render(), '');
    });

    // Other
    await t.step('default -> should not provide the default value if a key is defined and not empty', async () => {
        const testTemplate = await twig.twig({data: '{{ var|default("Not Defined") }}'});
        assertEquals(testTemplate.render({var: 'value'}), 'value');
    });

    await t.step('should provide a default value if a key is not defined', async () => {
        const testTemplate = await twig.twig({data: '{{ var|default("Not Defined") }}'});
        assertEquals(testTemplate.render(), 'Not Defined');
    });

    await t.step('should provide a default value if a value is empty', async () => {
        let testTemplate = await twig.twig({data: '{{ ""|default("Empty String") }}'});
        assertEquals(testTemplate.render(), 'Empty String');

        testTemplate = await twig.twig({data: '{{ var.key|default("Empty Key") }}'});
        assertEquals(testTemplate.render({var: {}}), 'Empty Key');
    });

    await t.step('should provide a default value of \'\' if no parameters are passed and a default key is not defined', async () => {
        const testTemplate = await twig.twig({data: '{{ var|default }}'});
        assertEquals(testTemplate.render(), '');
    });

    await t.step('should provide a default value of \'\' if no parameters are passed and a value is empty', async () => {
        let testTemplate = await twig.twig({data: '{{ ""|default }}'});
        assertEquals(testTemplate.render(), '');

        testTemplate = await twig.twig({data: '{{ var.key|default }}'});
        assertEquals(testTemplate.render({var: {}}), '');
    });


        // NOTE: these tests are currently timezone dependent
    await t.step('date -> should recognize timestamps', async () => {
        const template = await twig.twig({data: '{{ 27571323556|date("d/m/Y @ H:i:s") }}'});
        const date = new Date(27571323556000); // 13/09/2843 @ 08:59:16 EST

        assertEquals(template.render(), stringDate(date));
    });

    await t.step('should recognize timestamps, when they are passed as string', async () => {
        const template = await twig.twig({data: '{{ "27571323556"|date("d/m/Y @ H:i:s") }}'});
        const date = new Date(27571323556000); // 13/09/2843 @ 08:59:16 EST

        assertEquals(template.render(), stringDate(date));
    });

        await t.step('should recognize string date formats', async () => {
            const template = await twig.twig({data: '{{ "December 17, 1995 08:24:00"|date("d/m/Y @ H:i:s") }}'});
            const date = new Date("December 17, 1995 08:24:00");

            assertEquals(template.render(), stringDate(date));
        });

        await t.step('should escape words and characters in the date format (twig:data)]', async () => {
            const template = await twig.twig({data: '{{ "1970-01-01 00:00:00"|date("F jS \\a\\t g:ia") }}'});

            assertEquals(template.render(), 'January 1st at 12:00am');
        });

        await t.step('should escape words and characters in the date format (twig:ref)]', async () => {
            await new Promise((res,rej) => {
                twig.twig({
                    id: 'escape-date-format',
                    path: './deno_test/templates/escape-date-format.twig',
                    async: false,
                    load(template){
                        res(template);
                    },
                    error(e){
                        rej(e);
                    }
                });
            });
            // Load the template
            const testTemplate = await twig.twig({ref: 'escape-date-format'});
            assertEquals(testTemplate.render({}), 'January 1st at 12:00am');
        });

        await t.step('should handle undefined', async () => {
            const testTemplate = await twig.twig({data: '{{ undef|date("d/m/Y @ H:i:s") }}'});
            const date = new Date();
            assertEquals(testTemplate.render(), stringDate(date));
        });

        await t.step('should handle empty strings', async () => {
            const testTemplate = await twig.twig({data: '{{ ""|date("d/m/Y @ H:i:s") }}'});
            const date = new Date();
            assertEquals(testTemplate.render(), stringDate(date));
        });

        await t.step('should work with no parameters', async () => {
            const testTemplate = await twig.twig({data: '{{ 27571323556|date }}'});
            const testTemplate2 = await twig.twig({data: '{{ 27571323556|date("F j, Y H:i") }}'});
            assertEquals(testTemplate.render(), testTemplate2.render());
        });

        await t.step('replace -> should replace strings provided in a map', async () => {
            const template = await twig.twig({data: '{{ "I like %this% and %that%. Seriously, I like %this% and %that%."|replace({"%this%": foo, "%that%": "bar"}) }}'});
            assertEquals(template.render({foo: 'foo'}), 'I like foo and bar. Seriously, I like foo and bar.');
        });

        await t.step('should handle undefined', async () => {
            const testTemplate = await twig.twig({data: '{{ undef|replace }}'});
            assertEquals(testTemplate.render(), '');
        });

        await t.step('should handle empty strings', async () => {
            const testTemplate = await twig.twig({data: '{{ ""|replace }}'});
            assertEquals(testTemplate.render(), '');
        });

        await t.step('format -> should replace formatting tags with parameters', async () => {
            const template = await twig.twig({data: '{{ "I like %s and %s."|format(foo, "bar") }}'});
            assertEquals(template.render({foo: 'foo'}), 'I like foo and bar.');
        });

        await t.step('should handle undefined', async () => {
            const testTemplate = await twig.twig({data: '{{ undef|format }}'});
            assertEquals(testTemplate.render(), '');
        });

        await t.step('should handle empty strings', async () => {
            const testTemplate = await twig.twig({data: '{{ ""|format }}'});
            assertEquals(testTemplate.render(), '');
        });

        await t.step('should handle positive leading sign without padding', async () => {
            const template = await twig.twig({data: '{{ "I like positive numbers like %+d."|format(123) }}'});
            assertEquals(template.render({foo: 'foo'}), 'I like positive numbers like +123.');
        });

        await t.step('should handle negative leading sign without padding', async () => {
            const template = await twig.twig({data: '{{ "I like negative numbers like %+d."|format(-123) }}'});
            assertEquals(template.render({foo: 'foo'}), 'I like negative numbers like -123.');
        });

        await t.step('should handle positive leading sign with padding zero', async () => {
            const template = await twig.twig({data: '{{ "I like positive numbers like %+05d."|format(123) }}'});
            assertEquals(template.render({foo: 'foo'}), 'I like positive numbers like +0123.');
        });

        await t.step('should handle negative leading sign with padding zero', async () => {
            const template = await twig.twig({data: '{{ "I like negative numbers like %+05d."|format(-123) }}'});
            assertEquals(template.render({foo: 'foo'}), 'I like negative numbers like -0123.');
        });

        await t.step('should handle positive leading sign with padding space', async () => {
            const template = await twig.twig({data: '{{ "I like positive numbers like %+5d."|format(123) }}'});
            assertEquals(template.render({foo: 'foo'}), 'I like positive numbers like  +123.');
        });

        await t.step('should handle negative leading sign with padding space', async () => {
            const template = await twig.twig({data: '{{ "I like negative numbers like %+5d."|format(-123) }}'});
            assertEquals(template.render({foo: 'foo'}), 'I like negative numbers like  -123.');
        });

        await t.step('striptags -> should remove tags from a value', async () => {
            const template = await twig.twig({data: '{{ "<p>Test paragraph.</p><!-- Comment --> <a href=\\"#fragment\\">Other text</a>"|striptags }}'});
            assertEquals(template.render(), 'Test paragraph. Other text');
        });

        await t.step('should handle undefined', async () => {
            const testTemplate = await twig.twig({data: '{{ undef|striptags }}'});
            assertEquals(testTemplate.render(), '');
        });

        await t.step('should handle empty strings', async () => {
            const testTemplate = await twig.twig({data: '{{ ""|striptags }}'});
            assertEquals(testTemplate.render(), '');
        });

        await t.step('escape -> should convert unsafe characters to HTML entities', async () => {
            const template = await twig.twig({data: '{{ "<p>Test paragraph.</p><!-- Comment --> <a href=\'#fragment\'>Other text</a>"|escape }}'});
            assertEquals(template.render(), '&lt;p&gt;Test paragraph.&lt;/p&gt;&lt;!-- Comment --&gt; &lt;a href=&#039;#fragment&#039;&gt;Other text&lt;/a&gt;');
        });

        await t.step('should handle undefined', async () => {
            const testTemplate = await twig.twig({data: '{{ undef|escape }}'});
            assertEquals(testTemplate.render(), '');
        });

        await t.step('should handle empty strings', async () => {
            const testTemplate = await twig.twig({data: '{{ ""|escape }}'});
            assertEquals(testTemplate.render(), '');
        });

        await t.step('should not escape twice if autoescape is on', async () => {
            const testTemplate = await twig.twig({
                autoescape: true,
                data: '{{ value|escape }}'
            });
            assertEquals(testTemplate.render({
                value: '<test>&</test>'
            }), '&lt;test&gt;&amp;&lt;/test&gt;');
        });

        await t.step('should handle the strategy parameter', async () => {
            const data = {foo: '<foo> \\&"\'.,-_?/Ķä€台北[]{}\t\r\n\b\u0080'};
            let testTemplate;

            testTemplate = await twig.twig({data: 'Default: {{ foo|escape }}'});
            assertEquals(testTemplate.render(data), 'Default: &lt;foo&gt; \\&amp;&quot;&#039;.,-_?/Ķä€台北[]{}\t\r\n\b\u0080');

            testTemplate = await twig.twig({data: 'html: {{ foo|escape("html") }}'});
            assertEquals(testTemplate.render(data), 'html: &lt;foo&gt; \\&amp;&quot;&#039;.,-_?/Ķä€台北[]{}\t\r\n\b\u0080');

            testTemplate = await twig.twig({data: 'js: {{ foo|escape("js") }}'});
            assertEquals(testTemplate.render(data), 'js: \\u003Cfoo\\u003E\\u0020\\\\\\u0026\\u0022\\u0027.,\\u002D_\\u003F\\/\\u0136\\u00E4\\u20AC\\u53F0\\u5317\\u005B\\u005D\\u007B\\u007D\\t\\r\\n\\b\\u0080');

            testTemplate = await twig.twig({data: 'css: {{ foo|escape("css") }}'});
            assertEquals(testTemplate.render(data), 'css: \\3C foo\\3E \\20 \\5C \\26 \\22 \\27 \\2E \\2C \\2D \\5F \\3F \\2F \\136 \\E4 \\20AC \\53F0 \\5317 \\5B \\5D \\7B \\7D \\9 \\D \\A \\8 \\80 ');

            testTemplate = await twig.twig({data: 'url: {{ foo|escape("url") }}'});
            assertEquals(testTemplate.render(data), 'url: %3Cfoo%3E%20%5C%26%22%27.%2C-_%3F%2F%C4%B6%C3%A4%E2%82%AC%E5%8F%B0%E5%8C%97%5B%5D%7B%7D%09%0D%0A%08%C2%80');

            testTemplate = await twig.twig({data: 'html_attr: {{ foo|escape("html_attr") }}'});
            assertEquals(testTemplate.render(data), 'html_attr: &lt;foo&gt;&#x20;&#x5C;&amp;&quot;&#x27;.,-_&#x3F;&#x2F;&#x0136;&#x00E4;&#x20AC;&#x53F0;&#x5317;&#x5B;&#x5D;&#x7B;&#x7D;&#x09;&#x0D;&#x0A;&#xFFFD;&#x0080;');
        });

        await t.step('should escape strategy != \'html\' if autoescape is on', async () => {
            const template =  await twig.twig({
                autoescape: true,
                data: '{{ value|escape("js") }}'
            })
            assertEquals(template.render({value: '<test>&</test>'}), '\\u003Ctest\\u003E\\u0026\\u003C\\/test\\u003E');
        });

        await t.step('should not escape twice if autoescape is not html', async () => {
            const template = await twig.twig({
                autoescape: 'js',
                data: '{{ value|escape("js") }}'
            });
            assertEquals(template.render({value: '<test>&</test>'}), '\\u003Ctest\\u003E\\u0026\\u003C\\/test\\u003E');
        });

        await t.step('should escape twice if escape strategy is different from autoescape option', async () => {
            const template = await twig.twig({
                autoescape: 'css',
                data: '{{ value|escape("js") }}\n{{ value|escape }}'
            })
            assertEquals(template.render({value: '<test>&</test>'}), '\\5C u003Ctest\\5C u003E\\5C u0026\\5C u003C\\5C \\2F test\\5C u003E\n\\26 lt\\3B test\\26 gt\\3B \\26 amp\\3B \\26 lt\\3B \\2F test\\26 gt\\3B ');
        });

        await t.step('e ->  should alias escape function with e', async () => {
            const template = await twig.twig({data: '{{ "<p>Test paragraph.</p><!-- Comment --> <a href=\'#fragment\'>Other text</a>"|e }}'});
            assertEquals(template.render(), '&lt;p&gt;Test paragraph.&lt;/p&gt;&lt;!-- Comment --&gt; &lt;a href=&#039;#fragment&#039;&gt;Other text&lt;/a&gt;');
        });

        await t.step('should handle undefined', async () => {
            const testTemplate = await twig.twig({data: '{{ undef|e }}'});
            assertEquals(testTemplate.render(), '');
        });

        await t.step('should not escape twice if autoescape is on', async () => {
            const template = await twig.twig({
                autoescape: true,
                data: '{{ value|e }}'
            });
            assertEquals(template.render({value: '<test>&</test>'}), '&lt;test&gt;&amp;&lt;/test&gt;');
        });

        await t.step('nl2br -> should convert newlines into html breaks', async () => {
            const template = await twig.twig({data: '{{ test|nl2br }}'});
            assertEquals(template.render({test: 'Line 1\r\nLine 2\nLine 3\rLine 4\n\n'}), 'Line 1<br />\nLine 2<br />\nLine 3<br />\nLine 4<br />\n<br />\n');
        });

        await t.step('should handle undefined', async () => {
            const testTemplate = await twig.twig({data: '{{ undef|nl2br }}'});
            assertEquals(testTemplate.render(), '');
        });

        await t.step('should handle empty strings', async () => {
            const testTemplate = await twig.twig({data: '{{ ""|nl2br }}'});
            assertEquals(testTemplate.render(), '');
        });

        await t.step('should not escape br tags if autoescape is on', async () => {
            const testTemplate = await twig.twig({
                autoescape: true,
                data: '{{ test|nl2br }}'
            });
            assertEquals(testTemplate.render({test: '<test>Line 1\nLine2</test>'}), '&lt;test&gt;Line 1<br />\nLine2&lt;/test&gt;');
        });

        await t.step('truncate ->  should truncate string to default size(20) and add default separator', async () => {
            const template = await twig.twig({data: '{{ test|truncate }}'});
            assertEquals(template.render({test: '01234567890123456789012345678901234567890123456789'}), '012345678901234567890123456789...');
        });

        await t.step('should truncate string to custom size(10) and add default separator', async () => {
            const template = await twig.twig({data: '{{ test|truncate(10) }}'});
            assertEquals(template.render({test: '01234567890123456789012345678901234567890123456789'}), '0123456789...');
        });

        await t.step('should truncate string to custom size(15) with preserve and add default separator', async () => {
            const template = await twig.twig({data: '{{ test|truncate(15, true) }}'});
            assertEquals(template.render({test: '0123456789 0123456789 0123456789 0123456789 0123456789'}), '0123456789 0123456789...');
        });

        await t.step('should truncate string to custom size(15) with preserve and add custom(*) separator', async () => {
            const template = await twig.twig({data: '{{ test|truncate(15, true, "*") }}'});
            assertEquals(template.render({test: '0123456789 0123456789 0123456789 0123456789 0123456789'}), '0123456789 0123456789*');
        });

        await t.step('trim -> should trim whitespace from strings', async () => {
            const template = await twig.twig({data: '{{ test|trim }}'});
            assertEquals(template.render({test: '\r\n Test\n  '}), 'Test');
        });

        await t.step('should handle undefined', async () => {
            const testTemplate = await twig.twig({data: '{{ undef|trim }}'});
            assertEquals(testTemplate.render(), '');
        });

        await t.step('should handle empty strings', async () => {
            const testTemplate = await twig.twig({data: '{{ ""|trim }}'});
            assertEquals(testTemplate.render(), '');
        });

        await t.step('should not autoescape', async () => {
            const template = await twig.twig({data: '{{ test|trim }}'});
            assertEquals(template.render({test: '\r\n <a href="">Test</a>\n  '}), '<a href="">Test</a>');
        });

        await t.step('number_format -> should round to nearest integer if no parameters', async () => {
            const template = await twig.twig({data: '{{ 1234.56|number_format }}'});
            assertEquals(template.render(), '1,235');
        });
        await t.step('should have customizable precision', async () => {
            const template = await twig.twig({data: '{{ 1234.567890123|number_format(4) }}'});
            assertEquals(template.render(), '1,234.5679');
        });
        await t.step('should have a customizable decimal seperator', async () => {
            const template = await twig.twig({data: '{{ 1234.567890123|number_format(2,",") }}'});
            assertEquals(template.render(), '1,234,57');
        });
        await t.step('should have a customizable thousands seperator', async () => {
            const template = await twig.twig({data: '{{ 1234.5678|number_format(2,","," ") }}'});
            assertEquals(template.render(), '1 234,57');
        });
        await t.step('should handle blank seperators', async () => {
            const template = await twig.twig({data: '{{ 1234.5678|number_format(2,"","") }}'});
            assertEquals(template.render(), '123457');
        });

        await t.step('should handle undefined', async () => {
            const testTemplate = await twig.twig({data: '{{ undef|number_format }}'});
            assertEquals(testTemplate.render(), '0');
        });

        await t.step('slice -> should slice a string', async () => {
            const testTemplate = await twig.twig({data: '{{ \'12345\'|slice(1, 2) }}'});
            assertEquals(testTemplate.render(), '23');
        });
        await t.step('should slice a string to the end', async () => {
            const testTemplate = await twig.twig({data: '{{ \'12345\'|slice(2) }}'});
            assertEquals(testTemplate.render(), '345');
        });
        await t.step('should slice a string from the start', async () => {
            const testTemplate = await twig.twig({data: '{{ \'12345\'|slice(null, 2) }}'});
            assertEquals(testTemplate.render(), '12');
        });
        await t.step('should slice a string from a negative offset', async () => {
            const testTemplate = await twig.twig({data: '{{ \'12345\'|slice(-2, 1) }}'});
            assertEquals(testTemplate.render(), '4');
        });
        await t.step('should slice a string from a negative offset to end of string', async () => {
            const testTemplate = await twig.twig({data: '{{ \'12345\'|slice(-2) }}'});
            assertEquals(testTemplate.render(), '45');
        });

        await t.step('should slice an array', async () => {
            const testTemplate = await twig.twig({data: '{{ [1, 2, 3, 4, 5]|slice(1, 2)|join(\',\') }}'});
            assertEquals(testTemplate.render(), '2,3');
        });
        await t.step('should slice an array to the end', async () => {
            const testTemplate = await twig.twig({data: '{{ [1, 2, 3, 4, 5]|slice(2)|join(\',\') }}'});
            assertEquals(testTemplate.render(), '3,4,5');
        });
        await t.step('should slice an array from the start', async () => {
            const testTemplate = await twig.twig({data: '{{ [1, 2, 3, 4, 5]|slice(null, 2)|join(\',\') }}'});
            assertEquals(testTemplate.render(), '1,2');
        });
        await t.step('should slice an array from a negative offset', async () => {
            const testTemplate = await twig.twig({data: '{{ [1, 2, 3, 4, 5]|slice(-2, 1)|join(\',\') }}'});
            assertEquals(testTemplate.render(), '4');
        });
        await t.step('should slice an array from a negative offset to the end of the array', async () => {
            const testTemplate = await twig.twig({data: '{{ [1, 2, 3, 4, 5]|slice(-4)|join(\',\') }}'});
            assertEquals(testTemplate.render(), '2,3,4,5');
        });

        await t.step('abs -> should convert negative numbers to its absolute value', async () => {
            const testTemplate = await twig.twig({data: '{{ \'-7.365\'|abs }}'});
            assertEquals(testTemplate.render(), '7.365');
        });
        await t.step('should not alter absolute numbers', async () => {
            const testTemplate = await twig.twig({data: '{{ 95|abs }}'});
            assertEquals(testTemplate.render(), '95');
        });

        await t.step('first -> should return first item in array', async () => {
            const testTemplate = await twig.twig({data: '{{ [\'a\', \'b\', \'c\', \'d\']|first }}'});
            assertEquals(testTemplate.render(), 'a');
        });
        await t.step('should return first member of object', async () => {
            const testTemplate = await twig.twig({data: '{{ { item1: \'a\', item2: \'b\', item3: \'c\', item4: \'d\'}|first }}'});
            assertEquals(testTemplate.render(), 'a');
        });
        await t.step('should not fail when passed empty obj, arr or str', async () => {
            let testTemplate;

            testTemplate = await twig.twig({data: '{{ {}|first }}'});
            assertEquals(testTemplate.render(), '');

            testTemplate = await twig.twig({data: '{{ []|first }}'});
            assertEquals(testTemplate.render(), '');

            testTemplate = await twig.twig({data: '{{ myemptystr|first }}'});
            assertEquals(testTemplate.render({myemptystr: ''}), '');
        });
        await t.step('should return first character in string', async () => {
            const testTemplate = await twig.twig({data: '{{ \'abcde\'|first }}'});
            assertEquals(testTemplate.render(), 'a');
        });

        await t.step('split -> should split string with a separator', async () => {
            const testTemplate = await twig.twig({data: '{{ \'one-two-three\'|split(\'-\') }}'});
            assertEquals(testTemplate.render(), 'one,two,three');
        });
        await t.step('should split string with a separator and positive limit', async () => {
            const testTemplate = await twig.twig({data: '{{ \'one-two-three-four-five\'|split(\'-\', 3) }}'});
            assertEquals(testTemplate.render(), 'one,two,three-four-five');
        });
        await t.step('should split string with a separator and negative limit', async () => {
            const testTemplate = await twig.twig({data: '{{ \'one-two-three-four-five\'|split(\'-\', -2) }}'});
            assertEquals(testTemplate.render(), 'one,two,three');
        });
        await t.step('should split with empty separator', async () => {
            const testTemplate = await twig.twig({data: '{{ \'123\'|split(\'\') }}'});
            assertEquals(testTemplate.render(), '1,2,3');
        });
        await t.step('should split with empty separator and limit', async () => {
            const testTemplate = await twig.twig({data: '{{ \'aabbcc\'|split(\'\', 2) }}'});
            assertEquals(testTemplate.render(), 'aa,bb,cc');
        });

        await t.step('batch -> should work with arrays that require filling (with fill specified)', async () => {
            const testTemplate = await twig.twig({data: '{{ [\'a\', \'b\', \'c\', \'d\', \'e\', \'f\', \'g\']|batch(3, \'x\') }}'});
            assertEquals(testTemplate.render(), 'a,b,c,d,e,f,g,x,x');
        });
        await t.step('should work with arrays that require filling (without fill specified)', async () => {
            const testTemplate = await twig.twig({data: '{{ [\'a\', \'b\', \'c\', \'d\', \'e\', \'f\', \'g\']|batch(3) }}'});
            assertEquals(testTemplate.render(), 'a,b,c,d,e,f,g');
        });
        await t.step('should work with arrays that do not require filling (with fill specified)', async () => {
            const testTemplate = await twig.twig({data: '{{ [\'a\', \'b\', \'c\', \'d\', \'e\', \'f\']|batch(3, \'x\') }}'});
            assertEquals(testTemplate.render(), 'a,b,c,d,e,f');
        });
        await t.step('should work with arrays that do not require filling (without fill specified)', async () => {
            const testTemplate = await twig.twig({data: '{{ [\'a\', \'b\', \'c\', \'d\', \'e\', \'f\']|batch(3) }}'});
            assertEquals(testTemplate.render(), 'a,b,c,d,e,f');
        });
        await t.step('should return an empty result for an empty array', async () => {
            const testTemplate = await twig.twig({data: '{{ []|batch(3, \'x\') }}'});
            assertEquals(testTemplate.render(), '');
        });

        await t.step('last -> should return last character in string', async () => {
            const testTemplate = await twig.twig({data: '{{ \'abcd\'|last }}'});
            assertEquals(testTemplate.render(), 'd');
        });
        await t.step('should return last item in array', async () => {
            const testTemplate = await twig.twig({data: '{{ [\'a\', \'b\', \'c\', \'d\']|last }}'});
            assertEquals(testTemplate.render(), 'd');
        });
        await t.step('should return last item in a sorted object', async () => {
            const testTemplate = await twig.twig({data: '{{ {\'m\':1, \'z\':5, \'a\':3}|sort|last }}'});
            assertEquals(testTemplate.render(), '5');
        });
        await t.step('should return the last digit of numbers', async () => {
            const singleDigitTemplate = await twig.twig({data: '{{ 1|last }}'});
            assertEquals(singleDigitTemplate.render(), '1');

            const multiDigitTemplate = await twig.twig({data: '{{ 130|last }}'});
            assertEquals(multiDigitTemplate.render(), '0');

            const floatTemplate = await twig.twig({data: '{{ 142.7|last }}'});
            assertEquals(floatTemplate.render(), '7');
        });

        await t.step('raw -> should output the raw value if autoescape is on', async () => {
            const template = await twig.twig({
                autoescape: true,
                data: '{{ value|raw }}'
            });
            assertEquals(template.render({value: '<test>&</test>'}), '<test>&</test>');
        });

        await t.step('should output the raw value if autoescape is off', async () => {
            const template = await twig.twig({
                autoescape: false,
                data: '{{ value|raw }}'
            });
            assertEquals(template.render({value: '<test>&</test>'}), '<test>&</test>');
        });

        await t.step('should output an empty string', async () => {
            const template = await twig.twig({data: '{{ value|raw }}'});
            assertEquals(template.render({value: ''}), '');
            assertEquals(template.render({}), '');
        });

        await t.step('round -> should round up (common)', async () => {
            const testTemplate = await twig.twig({data: '{{ 2.7|round }}'});
            assertEquals(testTemplate.render(), '3');
        });
        await t.step('should round down (common)', async () => {
            const testTemplate = await twig.twig({data: '{{ 2.1|round }}'});
            assertEquals(testTemplate.render(), '2');
        });
        await t.step('should truncate input when input decimal places exceeds precision (floor)', async () => {
            const testTemplate = await twig.twig({data: '{{ 2.1234|round(3, \'floor\') }}'});
            assertEquals(testTemplate.render(), '2.123');
        });
        await t.step('should round up (ceil)', async () => {
            const testTemplate = await twig.twig({data: '{{ 2.1|round(0, \'ceil\') }}'});
            assertEquals(testTemplate.render(), '3');
        });
        await t.step('should truncate precision when a negative precision is passed (common)', async () => {
            const testTemplate = await twig.twig({data: '{{ 21.3|round(-1)}}'});
            assertEquals(testTemplate.render(), '20');
        });
        await t.step('should round up and truncate precision when a negative precision is passed (ceil)', async () => {
            const testTemplate = await twig.twig({data: '{{ 21.3|round(-1, \'ceil\')}}'});
            assertEquals(testTemplate.render(), '30');
        });
        await t.step('should round down and truncate precision when a negative precision is passed (floor)', async () => {
            const testTemplate = await twig.twig({data: '{{ 21.3|round(-1, \'ceil\')}}'});
            assertEquals(testTemplate.render(), '30');
        });

        await t.step('spaceless -> should spaceless', async () => {
            const testTemplate = await twig.twig({data: '{{ \'<div>\n    <b>b</b>   <i>i</i>\n</div>\'|spaceless }}'});
            assertEquals(testTemplate.render(), '<div><b>b</b><i>i</i></div>');
        });

    await t.step('should chain', async () => {
        const testTemplate = await twig.twig({data: '{{ ["a", "b", "c"]|keys|reverse }}'});
        assertEquals(testTemplate.render(), '2,1,0');
    });

    await t.step('country_name -> should return name country', async () =>{
        const testTemplate = await twig.twig({data:"{{ 'FR'|country_name }}"});
        assertEquals(testTemplate.render(), "France");   
    })

    await t.step('should return name country', async () => {
        const testTemplate = await twig.twig({data:"{{ 'US'|country_name }}"});
        assertEquals(testTemplate.render(), "United States")
    })

    await t.step ('currency_name -> should return name currency', async() => {
        const testTemplate = await twig.twig({data:"{{ 'EUR'|currency_name }}"});
        assertEquals(testTemplate.render(), "euros")
    })

    await t.step ('should return name carrency', async() => {
        const testTemplate = await twig.twig({data:"{{ 'JPY'|currency_name }}"});
        assertEquals(testTemplate.render(), "Japanese yen")
    })

    await t.step ('currency_symbol -> should return symbol carrency', async() => {
        const testTemplate = await twig.twig({data:"{{ 'EUR'|currency_symbol }}"});
        assertEquals(testTemplate.render(), "€")
    })

    await t.step ('should return symbol carrency', async() => {
        const testTemplate = await twig.twig({data:"{{ 'JPY'|currency_symbol }}"});
        assertEquals(testTemplate.render(), "¥")
    })

    await t.step ('convert_encoding -> should converts a string from one encoding to another', async() => {
        const testTemplate = await twig.twig({data:"{{ 'ENCODING STRING'|convert_encoding('UTF-8', 'cesu8')}}"});
        assertEquals(testTemplate.render(), "ENCODING STRING")
    })

    await t.step ('filter -> should filters elements of a sequence or a mapping using an arrow function', async() => {
        const testTemplate = await twig.twig({data:"{{ [34, 36, 38, 40, 42]|filter(v => v > 38)|join(', ') }}"});
        assertEquals(testTemplate.render(), "40, 42")
    })

    await t.step (' should filters elements of a sequence or a mapping using an arrow function', async() => {
        const testTemplate = await twig.twig({data:"{% for v in [34, 36, 38, 40, 42]|filter(v => v > 38) -%} {{ v }} {% endfor %}"});
        assertEquals(testTemplate.render(), "40 42 ")
    })

    await t.step ('map -> should  filter applies an arrow function to the elements of a sequence or a mapping', async() => {
        const testTemplate = await twig.twig({data:"{{ [{first: 'Bob', last: 'Smith'}, {first: 'Alice', last: 'Dupond'} ]|map(p => `${p.first} ${p.last}`)|join(', ') }}"});
        assertEquals(testTemplate.render(), "Bob Smith, Alice Dupond")
    })

    await t.step ('should  filter applies an arrow function to the elements of a sequence or a mapping', async() => {
        const testTemplate = await twig.twig({data:"{{ {'Bob': 'Smith', 'Alice': 'Dupond',}|map(([key, value]) => `${key} ${value}`)|join(', ') }}"});
        assertEquals(testTemplate.render(), "Bob Smith, Alice Dupond")
    })

    await t.step ('format_date -> should  formats a date short', async() => {
        const testTemplate = await twig.twig({data:"{{ '2019-08-07'|format_date('short', 'none', 'fr') }}"});
        assertEquals(testTemplate.render(), "07/08/2019")
    })

    await t.step ('should  formats a date full', async() => {
        const testTemplate = await twig.twig({data:"{{ '2019-08-07 '|format_date('full', 'full', 'fr') }}"});
        assertEquals(testTemplate.render(), "mercredi 7 août 2019")
    })

    await t.step ('format_datetime -> should  formats a date full', async() => {
        const testTemplate = await twig.twig({data:"{{ '2019-08-07 23:39:12'|format_datetime() }}"});
        assertEquals(testTemplate.render(), "Aug 7, 2019, 11:39:12 PM ")
    })

    await t.step ('should  formats a date short', async() => {
        const testTemplate = await twig.twig({data:"{{ '2019-08-07 23:39:12'|format_datetime('none', 'short', 'fr') }}"});
        assertEquals(testTemplate.render(), " 23:39")
    })

    await t.step ('should  formats a date short', async() => {
        const testTemplate = await twig.twig({data:"{{ '2019-08-07 23:39:12'|format_datetime('short', 'none', 'fr') }}"});
        assertEquals(testTemplate.render(), "07/08/2019")
    })

    await t.step ('should  formats a date full', async() => {
        const testTemplate = await twig.twig({data:"{{ '2019-08-07 23:39:12'|format_datetime('full', 'full', 'fr') }}"});
        assertEquals(testTemplate.render(), "mercredi 7 août 201923:39:12 UTC+2")
    })

    await t.step ('markdown_to_html -> should return html from markdown ', async() => {
        const testTemplate = await twig.twig({data:"{% apply markdown_to_html %} # hello, markdown! {% endapply %}"});
        assertEquals(testTemplate.render(), '<h1 id="hellomarkdown">hello, markdown!</h1>')
    })

    await t.step ('markdown_to_html -> should return html from markdown ', async() => {
        const testTemplate = await twig.twig({data:"{% apply html_to_markdown %} <html> <h1>Hello!</h1> </html> {% endapply %}"});
        assertEquals(testTemplate.render(), 'Hello!\n======')
    })

    await t.step ('slug -> transforms a given string into another string that only includes safe ASCII characters. ', async() => {
        const testTemplate = await twig.twig({data:"{{ 'Wôrķšƥáçè-sèťtïñğš'|slug }}"});
        assertEquals(testTemplate.render(), 'Worksace-settings')
    })

    await t.step ('format_currency -> formats a number as a currency ', async() => {
        const testTemplate = await twig.twig({data:"{{ '1000000'|format_currency('EUR') }}"});
        assertEquals(testTemplate.render(), '€1,000,000.00')
    })

    await t.step ('formats a number as a currency ', async() => {
        const testTemplate = await twig.twig({data:"{{ '12.340'|format_currency('EUR', {rounding_mode: 'floor'}) }}"});
        assertEquals(testTemplate.render(), '€12.34')
    })
    await t.step ('format_number -> formats a number ', async() => {
        const testTemplate = await twig.twig({data:"{{ '12.345'|format_number }}"});
        assertEquals(testTemplate.render(), '12.345')
    })
    await t.step ('formats a number ', async() => {
        const testTemplate = await twig.twig({data:"{{ '12.345'|format_number({maximumFractionDigits: 2}) }}"});
        assertEquals(testTemplate.render(), '12.35')
    })
    await t.step ('column ->  returns the values from a single column in the input array ', async() => {
        const testTemplate = await twig.twig({data:"{{ [{ 'fruit' : 'apple'}, {'fruit' : 'orange' }]|column('fruit') }}"});
        assertEquals(testTemplate.render(), "apple,orange")
    })

    await t.step ('language_name ->  returns the language name given its two-letter code ', async() => {
        const testTemplate = await twig.twig({data:"{{ 'de'|language_name }}"});
        assertEquals(testTemplate.render(), "German")
    })

    await t.step ('returns the language name given its two-letter code ', async() => {
        const testTemplate = await twig.twig({data:"{{ 'de'|language_name('fr') }}"});
        assertEquals(testTemplate.render(), "allemand")
    })

    await t.step ('locale_name ->  returns the locale name given its two-letter code ', async() => {
        const testTemplate = await twig.twig({data:"{{ 'de'|locale_name }}"});
        assertEquals(testTemplate.render(), "German")
    })

    await t.step ('timezone_name ->  returns the timezone name given a timezone identifier ', async() => {
        const testTemplate = await twig.twig({data:"{{ 'Europe/Paris'|timezone_name }}"});
        assertEquals(testTemplate.render(), "Central European Time (Paris)")
    })

    await t.step (' returns the timezone name given a timezone identifier ', async() => {
        const testTemplate = await twig.twig({data:"{{ 'America/Los_Angeles'|timezone_name }}"});
        assertEquals(testTemplate.render(), "Pacific  Time (Los Angeles)")
    })
});

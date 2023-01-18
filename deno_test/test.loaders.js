import { assertEquals, assertArrayIncludes, assertThrows, assertObjectMatch, assertExists } from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";
import { TwigTemplate } from "../src/twig.template.js";

Deno.test('Twig.js Loaders ->', async (t) => {
    // Encodings
        await t.step(' custom loader -> should define a custom loader', function () {
            twig.extend(Twig => {
                const obj = {
                    templates: {
                        customLoaderBlock: '{% block main %}This lets you {% block data %}use blocks{% endblock data %}{% endblock main %}',
                        customLoaderSimple: 'the value is: {{ value }}',
                        customLoaderInclude: 'include others from the same loader method - {% include "customLoaderSimple" %}',
                        customLoaderComplex: '{% extends "customLoaderBlock" %} {% block data %}extend other templates and {% include "customLoaderInclude" %}{% endblock data %}'
                    },
                    loader(location, params, callback, _) {
                        params.data = this.templates[location];
                        params.allowInlineIncludes = true;
                        const template = new TwigTemplate(params);
                        if (typeof callback === 'function') {
                            callback(template);
                        }

                        return template;
                    }
                };
                Twig.Templates.registerLoader('custom', obj.loader, obj);
                assertEquals(Twig.Templates.loaders.hasOwnProperty('custom'), true);
            });
        });

        await t.step('should load a simple template from a custom loader', async () => {
            const testTemplate = await new Promise( (res,rej) => {
                twig.twig({
                    method: 'custom',
                    name: 'customLoaderSimple',
                    load(template){
                        res(template);
                    },
                    error(e){
                        rej(e);
                    }
                });
            });
            assertEquals(testTemplate.render({value: 'test succeeded'}), 'the value is: test succeeded');
        });

        await t.step('should load a template that includes another from a custom loader', async () => {
            const testTemplate = await new Promise ( (res,rej) => {
                twig.twig({
                    method: 'custom',
                    name: 'customLoaderInclude',
                    load(template){
                        res(template);
                    },
                    error(e){
                        rej(e);
                    }
                });
            });
            assertEquals(testTemplate.render({value: 'test succeeded'}), 'include others from the same loader method - the value is: test succeeded');
        });

        await t.step('should load a template that extends another from a custom loader', async () => {
            const testTemplate = await new Promise ( (res,rej) => {
                twig.twig({
                    method: 'custom',
                    name: 'customLoaderComplex',
                    load(template){
                        res(template);
                    },
                    error(e){
                        rej(e);
                    }
                });
            });
            assertEquals(testTemplate.render({value: 'test succeeded'}), 'This lets you extend other templates and include others from the same loader method - the value is: test succeeded');
        });

        await t.step('should remove a registered loader', async () => {
            twig.extend(Twig => {
                Twig.Templates.unRegisterLoader('custom');
                assertEquals(Twig.Templates.loaders.hasOwnProperty('custom'),false);
            });
        });
});

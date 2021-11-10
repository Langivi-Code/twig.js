// ## twig.compiler.js
//
// This file handles compiling templates into JS
export default class TwigCompiler {

    constructor() {
        module: {}
    }

    compile(template, options) {
        // Get tokens
        const tokens = JSON.stringify(template.tokens);
        const {id} = template;
        let output = null;

        if (options.module) {
            if (this.Twig.compiler.module[options.module] === undefined) {
                throw new this.Twig.Error('Unable to find module type ' + options.module);
            }

            output = this.module[options.module](id, tokens, options.twig);
        } else {
            output = this.wrap(id, tokens);
        }
        return output;
    }

    module: {
        amd: (id, tokens, pathToTwig) => 'define(["' + pathToTwig + '"], function (Twig) {\n\tvar twig, templates;\ntwig = Twig.twig;\ntemplates = ' + this.Twig.compiler.wrap(id, tokens) + '\n\treturn templates;\n});';

        node: (id, tokens) => 'var twig = require("twig").twig;\nexports.template = ' + this.Twig.compiler.wrap(id, tokens);

        cjs2: (id, tokens, pathToTwig) => 'module.declare([{ twig: "' + pathToTwig + '" }], function (require, exports, module) {\n\tvar twig = require("twig").twig;\n\texports.template = ' + this.Twig.compiler.wrap(id, tokens) + '\n});';
    }

    wrap(id, tokens) {
        return 'twig({id:"' + id.replace('"', '\\"') + '", data:' + tokens + ', precompiled: true});\n';
    }
}
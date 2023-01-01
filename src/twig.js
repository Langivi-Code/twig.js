/**
 * Twig.js
 *
 * @copyright 2011-2020 John Roepke and the Twig.js Contributors
 * @license   Available under the BSD 2-Clause License
 * @link      https://github.com/twigjs/twig.js
 */

// ## twig.factory.js
//
// This file handles creating the Twig library
import core from "./twig.core.js";

import expression from "./twig.expression.js";
import functions from "./twig.functions.js";
import {TwigLib} from "./TwigLib.js";
import loaderajax from "./twig.loader.ajax.js";
import loaderfs from "./twig.loader.fs.js";
import {TwigTests} from "./twig.tests.js";
import logic from "./twig.logic.js";
import async from "./twig.async.js";
import {Twig} from "./twig.exports.js";
import {TwigCompiler} from "./twig.compiler.js";
import {TwigFilters} from "./twig.filters.js";
import {TwigTemplates} from "./twig.templates.js";
import { TwigTemplate } from "./twig.template.js";
import TwigBlock from "./TwigBlock.js";
import TwigParseState from "./TwigParseState.js";
const twig = new Twig('1.16.2');

function factory(twig) {

    twig.Block = TwigBlock;
    twig.ParseState = TwigParseState;

    twig.setCompile((t) => new TwigCompiler(t));
    twig.setFilterClass((t) => new TwigFilters(t));
    twig.setLibClass((t) => new TwigLib(t));
    twig.setTemplateStoreClass((t) => new TwigTemplates(t));
    twig.setTestsClass((t) => new TwigTests(t));
    functions(twig);
    expression(twig);
    logic(twig);
    async(twig);
    loaderajax(twig);
    loaderfs(twig);
    twig.Templates.registerParser('twig', params => {
        return new TwigTemplate(params);
    });

    twig.Templates.registerParser('source', params => {
        return params.data || '';
    });
}

factory(twig);

export {twig};

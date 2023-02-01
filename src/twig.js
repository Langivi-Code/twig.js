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

import loaderajax from "./twig.loader.ajax.js";
import loaderfs from "./twig.loader.fs.js";
import {TwigTests} from "./twig.tests.js";
import {TwigCore} from "./twig.core.js";
import { TwigTemplate } from "./twig.template.js";
import TwigParseState from "./TwigParseState.js";
import { twigTemplates } from "./twig.templates.js";

const twig = new TwigCore('1.16.2');

function factory(twig) {

    twig.ParseState = TwigParseState;
    twig.setTestsClass((t) => new TwigTests(t));
    loaderajax(twig);
    loaderfs(twig);
    twigTemplates.registerParser('twig', params => {
        return new TwigTemplate(params);
    });

    twigTemplates.registerParser('source', params => {
        return params.data || '';
    });
}

factory(twig);
export {twig};

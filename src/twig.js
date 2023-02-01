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

// import loaderajax from "./twig.loader.ajax.js";
// import loaderfs from "./twig.loader.fs.js";
import {TwigCore} from "./twig.core.js";

const twig = new TwigCore('1.16.2');

export {twig};

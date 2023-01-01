
[![Deno](https://img.shields.io/badge/deno.land-twig.js-brightgreen)](https://deno.land/x/twig@1.16.2)

# About

<img align="right" width="120" height="120"
     title="Twig.js"
     src="https://user-images.githubusercontent.com/3282350/29336704-ab1be05c-81dc-11e7-92e5-cf11cca7b344.png">

Twig.js is a pure JavaScript implementation of the Twig PHP templating language
(<http://twig.sensiolabs.org/>)

The goal is to provide a library that is compatible with  server side JavaScript environment such as deno.js.

Twig.js is currently a work in progress and supports a limited subset of the Twig templating language (with more coming).

### Docs

Documentation is available in the [twig.js wiki](https://github.com/twigjs/twig.js/wiki) on Github.

### Feature Support

For a list of supported tags/filters/functions/tests see the [Implementation Notes](https://github.com/LangiviTechnology/twig.js/wiki/Implementation-Notes#feature-support) page on the wiki.

# Install

Download the latest twig.js release from github: https://github.com/LangiviTechnology/twig.js or via deno.land:

```js
import Twig, {renderToString} from 'https://deno.land/x/twig@1.16.2/mod.js'
```

### Usage with Opine

Twig is compatible with Opine. You can create an opine app using the twig.js templating language by setting the view engine to twig.

### app.js

**opine 2.1.3**

```js
import opine from "https://deno.land/x/opine@2.1.3/mod.ts";
import {renderToString} from "../../src/twig.js";

const app = opine();
//specifies a function to process the template
app.engine('twig', renderToString);
//specify the folder with templates
app.set('views',"./view");
app.set('view engine', 'twig');
app.set('view cache', true);

app.get('/',function(req,res){
    res.render("index.twig", {
      message : "Hello World"
  });
});
app.listen(3001);

```

## views/index.twig

```html
Message of the moment: <b>{{ message }}</b>
```


# Alternatives

- [Twing](https://github.com/ericmorand/twing)

# Contributing

If you have a change you want to make to twig.js, feel free to fork this repository and submit a pull request on Github. The source files are located in `src/*.js`.

## Acknowledgments

See the LICENSES.md file for copies of the referenced licenses.

1. The JavaScript Array fills in src/twig.fills.js are from <https://developer.mozilla.org/> and are available under the [MIT License][mit] or are [public domain][mdn-license].

2. The Date.format function in src/twig.lib.js is from <http://jpaq.org/> and used under a [MIT license][mit-jpaq].

3. The sprintf implementation in src/twig.lib.js used for the format filter is from <http://www.diveintojavascript.com/projects/javascript-sprintf> and used under a [BSD 3-Clause License][bsd-3].

4. The strip_tags implementation in src/twig.lib.js used for the striptags filter is from <http://phpjs.org/functions/strip_tags> and used under and [MIT License][mit-phpjs].

[mit-jpaq]:     http://jpaq.org/license/
[mit-phpjs]:    http://phpjs.org/pages/license/#MIT
[mit]:          http://www.opensource.org/licenses/mit-license.php
[mdn-license]:  https://developer.mozilla.org/Project:Copyrights

[bsd-2]:        http://www.opensource.org/licenses/BSD-2-Clause
[bsd-3]:        http://www.opensource.org/licenses/BSD-3-Clause
[cc-by-sa-2.5]: http://creativecommons.org/licenses/by-sa/2.5/ "Creative Commons Attribution-ShareAlike 2.5 License"

[mocha]:        http://mochajs.org/
[qunit]:        http://docs.jquery.com/QUnit

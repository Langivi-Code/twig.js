export default function (Twig) {
    Twig.Templates.registerLoader('fs', function (location, params) {
        let data = null;
        const {precompiled} = params;
        const parser = this.parsers[params.parser] || this.parser.twig;
        const parseTemplateFn = function (data) {
            if (precompiled === true) {
                data = JSON.parse(data);
            }
            params.data = data;
            params.path = params.path || location;

            // Template is in data
            const  template = parser.call(this, params);
            return template;
        };

        params.path = params.path || location;

        if (params.async) {
            return (async function () {
                try {
                    if ((await Deno.stat(params.path)).isFile) {
                        let data = await Deno.readTextFile(params.path);
                        return parseTemplateFn(data);
                    }
                } catch (e) {
                    throw new Twig.Error('Unable to find template file ' + params.path);
                }
            })();
        }

        try {
            if (!Deno.statSync(params.path)) {
                throw new Twig.Error('Unable to find template file ' + params.path);
            }
            data = Deno.readTextFileSync(params.path);
        } catch (error) {
            throw new TwigError('Unable to find template file ' + params.path + '. ' + error);
        }
        return parseTemplateFn(data);
    });
};

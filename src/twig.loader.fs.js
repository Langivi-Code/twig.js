import TwigError from "./TwigError.js";
import { twigLib } from "./TwigLib.js";

export default function (twigTemplates) {
    twigTemplates.registerLoader('fs', function (location, params) {
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
            const  template = parser(params);
            return template;
        };

        params.path = params.path || location;

        if (params.async) {
            return (async function () {
                try {
                    if ((await twigLib.fileStat(params.path))) {
                        let data = await twigLib.readFile(params.path);
                        return parseTemplateFn(data);
                    }
                } catch (e) {
                    throw new TwigError('Unable to find template file ' + params.path);
                }
            })();
        }

        try {
            if (!twigLib.fileStatSync(params.path)) {
                throw new TwigError('Unable to find template file ' + params.path);
            }
            data = twigLib.readFileSync(params.path);
        } catch (error) {
            throw new TwigError('Unable to find template file ' + params.path + '. ' + error);
        }
        return parseTemplateFn(data);
    });
};

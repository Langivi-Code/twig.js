export default function  (Twig) {
    Twig.Templates.registerLoader('fs', function (location, params) {
        let template;
        let data = null;
        const {precompiled} = params;
        const parser = this.parsers[params.parser] || this.parser.twig;
        const loadTemplateFn = function (data) {
            if (precompiled === true) {
                data = JSON.parse(data);
            }
            params.data = data;
            params.path = params.path || location;

            // Template is in data
            template = parser.call(this, params);
        };

        params.path = params.path || location;

        if (params.async) {
            return new Promise(async function (res,rej){
                try{
                    if(await Deno.stat(params.path)){
                        let data = await Deno.readTextFile(params.path);
                        if (precompiled === true) {
                            data = JSON.parse(data);
                        }
                        params.data = data;
                        params.path = params.path || location;
                        const template = parser.call(this, params);
                        res(template);
                    }
                }catch(e){
                    rej(new Twig.Error('Unable to find template file ' + params.path));
                    return;
                }
            })
        }

        try {
            if (!Deno.statSync(params.path)) {
                throw new Twig.Error('Unable to find template file ' + params.path);
            }
        } catch (error) {
            throw new Twig.Error('Unable to find template file ' + params.path + '. ' + error);
        }

        data = Deno.readTextFileSync(params.path);
        loadTemplateFn(data);
        return template;
    });
};

import {twig} from "./twig.js";

export class TwigTemplate{
    base;
    blocks;
    id;
    method;
    name;
    options;
    parentTemplate;
    path;
    url;

    constructor(params){
        const {data, id, base, path, url, name, method, options} = params;

        // # What is stored in a Twig.Template
        //
        // The Twig Template hold several chucks of data.
        //
        //     {
        //          id:     The token ID (if any)
        //          tokens: The list of tokens that makes up this template.
        //          base:   The base template (if any)
        //            options:  {
        //                Compiler/parser options
        //
        //                strict_variables: true/false
        //                    Should missing variable/keys emit an error message. If false, they default to null.
        //            }
        //     }
        //

        this.base = base;
        this.blocks = {
            defined: {},
            imported: {}
        };
        this.id = id;
        this.method = method;
        this.name = name;
        this.options = options;
        this.parentTemplate = null;
        this.path = path;
        this.url = url;

        if (twig.lib.is('String', data)) {
            this.tokens = twig.prepare.call(this, data);
        } else {
            this.tokens = data;
        }

        if (id !== undefined) {
            twig.Templates.save(this);
        }
    }

    /**
     * Get a block by its name, resolving in the following order:
     *     - blocks defined in the template itself
     *     - blocks imported from another template
     *
     * @param {String} name The name of the block to return.
     * @param {Boolean} checkOnlyInheritedBlocks Whether to skip checking the blocks defined in the template itself, will not skip by default.
     *
     * @return {Twig.Block|undefined}
     */
    getBlock(name, checkOnlyInheritedBlocks, checkImports = true){
        let block;

        if (checkOnlyInheritedBlocks !== true) {
            block = this.blocks.defined[name];
        }

        if (checkImports && block === undefined) {
            block = this.blocks.imported[name];
        }

        if (block === undefined && this.parentTemplate !== null) {
            /**
             * Block defined in the parent template when extending.
             * This recursion is useful to inherit from ascendants.
             * But take care of not considering ascendants' {% use %}
             */
            block = this.parentTemplate.getBlock(name, checkOnlyInheritedBlocks, checkImports = false);
        }

        return block;
    }

     /**
     * Get all the available blocks, resolving in the following order:
     *     - blocks defined in the template itself
     *     - blocks imported from other templates
     *
     * @return {Object}
     */
    getBlocks(){
        let blocks = {};

        blocks = {
            ...blocks,
            // Get any blocks imported from other templates
            ...this.blocks.imported,
            // Override with any blocks defined within the template itself
            ...this.blocks.defined
        };

        return blocks;
    }

    render(context, params, allowAsync){
        const template = this;

        params = params || {};

        return twig.async.potentiallyAsync(template, allowAsync, () => {
            const state = new twig.ParseState(template, params.blocks);

            return state.parseAsync(template.tokens, context)
                .then(output => {
                    let parentTemplate;
                    let url;

                    if (template.parentTemplate !== null) {
                        // This template extends another template

                        if (template.options.allowInlineIncludes) {
                            // The template is provided inline
                            parentTemplate = this.Templates.load(template.parentTemplate);

                            if (parentTemplate) {
                                parentTemplate.options = template.options;
                            }
                        }

                        // Check for the template file via include
                        if (!parentTemplate) {
                            url = twig.path.parsePath(template, template.parentTemplate);

                            parentTemplate = twig.Templates.loadRemote(url, {
                                method: template.getLoaderMethod(),
                                base: template.base,
                                async: false,
                                id: url,
                                options: template.options
                            });
                        }

                        template.parentTemplate = parentTemplate;

                        return template.parentTemplate.renderAsync(
                            state.context,
                            {
                                blocks: state.getBlocks(false),
                                isInclude: true
                            }
                        );
                    }

                    if (params.isInclude === true) {
                        return output;
                    }

                    return output.valueOf();
                });
        });
    }

    importFile(file){
        let url = null;
        let subTemplate;
        if (!this.url && this.options.allowInlineIncludes) {
            file = this.path ? twig.path.parsePath(this, file) : file;
            subTemplate = twig.Templates.load(file);

            if (!subTemplate) {
                subTemplate = twig.Templates.loadRemote(url, {
                    id: file,
                    method: this.getLoaderMethod(),
                    async: false,
                    path: file,
                    options: this.options
                });

                if (!subTemplate) {
                    throw new twig.Error('Unable to find the template ' + file);
                }
            }

            subTemplate.options = this.options;

            return subTemplate;
        }

        url = twig.path.parsePath(this, file);

        // Load blocks from an external file
        subTemplate = twig.Templates.loadRemote(url, {
            method: this.getLoaderMethod(),
            base: this.base,
            async: false,
            options: this.options,
            id: url
        });

        return subTemplate;
    }

    getLoaderMethod(){
        if (this.path) {
            return 'fs';
        }

        if (this.url) {
            return 'ajax';
        }

        return this.method || 'fs';
    }

    compile(){
        // Compile the template into raw JS
        return twig.compiler.compile(this, options);
    }

    renderAsync(context, params){
        return this.render(context, params, true);
    }
}

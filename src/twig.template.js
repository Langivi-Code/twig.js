import {twig} from "./twig.js";
import {twigLib} from "./TwigLib.js";
import {twigPath} from "./TwigPath.js";
import TwigError from "./TwigError.js";
import { AsyncTwig } from "./async/twig.async.js";
import { twigTemplates } from "./twig.templates.js";
import { twigCache } from "./twig.cache.js";
import { twigCompiler } from "./twig.compiler.js";
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
    constructor({data, id, base, path, url, name, method, options}){

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

        if (twigLib.is('String', data)) {
            //Problematic place because it is transmitted this and afrer this form template
            this.tokens = twig.prepare(data,this.options,this.id);
        } else {
            this.tokens = data;
        }

        if (id !== undefined) {
            twigTemplates.save(this);
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

        return AsyncTwig.potentiallyAsync(template, allowAsync, () => {
            const state = new twig.ParseState(template, params.blocks);

            return state.parseAsync(template.tokens, context)
                .then(output => {
                    let parentTemplate;
                    let url;

                    if (template.parentTemplate !== null) {
                        // This template extends another template

                        if (template.options.allowInlineIncludes) {
                            // The template is provided inline
                            parentTemplate = twigTemplates.load(template.parentTemplate);
                            if (parentTemplate) {
                                parentTemplate.options = template.options;
                            }
                        }

                        // Check for the template file via include
                        if (!parentTemplate) {
                            if(twigCache.findCacheFile(template.parentTemplate)){
                                parentTemplate = twigCache.buildTemplateForCache(twigCache.getCache(template.parentTemplate))
                            }else{
                                url = twigPath.parsePath(template, template.parentTemplate);

                                parentTemplate = twigTemplates.loadRemote(url, {
                                    method: template.getLoaderMethod(),
                                    base: template.base,
                                    async: false,
                                    id: url,
                                    options: template.options
                                });
                            }
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
            file = this.path ? twigPath.parsePath(this, file) : file;
            subTemplate = twigTemplates.load(file);

            if (!subTemplate) {
                subTemplate = twigTemplates.loadRemote(url, {
                    id: file,
                    method: this.getLoaderMethod(),
                    async: false,
                    path: file,
                    options: this.options
                });

                if (!subTemplate) {
                    throw new TwigError('Unable to find the template ' + file);
                }
            }

            subTemplate.options = this.options;

            return subTemplate;
        }

        url = twigPath.parsePath(this, file);

        // Load blocks from an external file
        subTemplate = twigTemplates.loadRemote(url, {
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
        return twigCompiler.compile(this, options);
    }

    renderAsync(context, params){
        return this.render(context, params, true);
    }
}

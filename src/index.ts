import path from 'path';
import { readFileSync } from 'fs';
import { interpolateName } from 'loader-utils';
import { validate } from 'schema-utils';
import { languages, features } from 'monaco-editor/esm/metadata';
import schema from './schema.json';

import type { Compilation, Compiler, WebpackPluginInstance } from 'webpack';
import type { Schema } from 'schema-utils';
import type { EditorFeature, EditorLanguage, IFeatureDefinition, IWorkerDefinition, NegatedEditorFeature } from 'monaco-editor/esm/metadata';
import type { IMonacoEditorLoaderOptions } from './loaders/include';

interface IWorker extends IWorkerDefinition {
    filename: string;
}

type CompilerCallback = (err: Error | null) => void;

export interface IMonacoEditorPluginOptions {
    features?: (EditorFeature | NegatedEditorFeature)[];
    languages?: EditorLanguage[];
    filename?: string;
    publicPath?: string;
    global?: boolean;
}

export class MonacoEditorPlugin implements WebpackPluginInstance {
    /**
     * The plugin options
     */
    options: Required<IMonacoEditorPluginOptions>;

    /**
     * The feature modules
     */
    featureModules: IFeatureDefinition[];

    /**
     * The language dependencies
     */
    languageDependencies: Map<EditorLanguage, EditorLanguage>;

    /**
     * The language modules
     */
    languageModules: IFeatureDefinition[];

    /**
     * MonacoEditorPlugin constructor
     * @param {IMonacoEditorPluginOptions} opts - The plugin options
     */
    constructor(opts: IMonacoEditorPluginOptions = {}) {
        // Validate options against the schema
        validate(schema as Schema, opts, {
            name: 'Monaco Editor Plugin',
            baseDataPath: 'options',
        });

        // Set default options
        this.options = {
            features: opts.features || [],
            languages: opts.languages || [],
            filename: opts.filename || '[name].[contenthash].js',
            publicPath: opts.publicPath || '',
            global: opts.global || false,
        };

        // Set the language dependencies
        this.languageDependencies = new Map<EditorLanguage, EditorLanguage>([
            ['javascript', 'typescript'],
            ['less', 'css'],
            ['scss', 'css'],
            ['handlebars', 'html'],
            ['razor', 'html'],
        ]);

        // Resolve the features and languages based on the provided options
        this.featureModules = this.resolveFeatures();
        this.languageModules = this.resolveLanguages();
    }

    /**
     * Apply the plugin to the webpack compiler
     * @param {Compiler} compiler - The webpack compiler instance
     */
    apply(compiler: Compiler): void {
        const { context, webpack } = compiler;

        // Collect the workers data from the supported features and languages
        const workers = new Map<string, IWorker>();
        const modules: IFeatureDefinition[] = [
            {
                label: 'editorWorkerService',
                entry: undefined,
                worker: {
                    id: 'vs/editor/editor',
                    entry: 'vs/editor/editor.worker',
                },
            },
            ...this.featureModules,
            ...this.languageModules,
        ];

        for (const { label, worker } of modules) {
            if (label && worker) {
                workers.set(label, {
                    ...worker,
                    filename: this.getOutputFilename(worker.entry),
                });
            }
        }

        // Add entry points for the worker modules
        workers.forEach((worker: IWorker, label: string) => {
            compiler.hooks.make.tapAsync('MonacoEditorPlugin', (compilation: Compilation, callback: CompilerCallback) => {
                const { id, entry, filename } = worker;
                const path = this.resolve(entry);

                const childCompiler = compilation.createChildCompiler(id, { filename }, [
                    new webpack.webworker.WebWorkerTemplatePlugin(),
                    new webpack.LoaderTargetPlugin('webworker')
                ]);

                new webpack.EntryPlugin(context, path, id).apply(childCompiler);
                new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }).apply(childCompiler);

                childCompiler.runAsChild(callback);
            });
        });

        // Add the loader rules and configure the monaco editor module
        const loaderOptions: IMonacoEditorLoaderOptions = {
            workers: this.getWorkersPaths(workers),
            features: this.getModulesPaths(this.featureModules),
            languages: this.getModulesPaths(this.languageModules),
            publicPath: this.options.publicPath,
            global: this.options.global,
        };

        compiler.options.module.rules.push({
            test: /esm[/\\]vs[/\\]editor[/\\]editor.(api|main).js/,
            use: {
                loader: require.resolve('./loaders/include'),
                options: loaderOptions,
            },
        });
    }

    /**
     * Resolve the entry point for the monaco editor
     * @param {string} entry - The entry point to resolve
     * @param {boolean} resolve - Whether to resolve the path or not
     * @returns {string} - The resolved entry point
     */
    resolve(entry: string, resolve: boolean = false): string {
        const entryPath = path.posix.join('monaco-editor/esm', entry);
        return resolve ? require.resolve(entryPath) : entryPath;
    }

    /**
     * Resolve the features and languages based on the provided options
     * @returns {IFeatureDefinition[]} - The resolved features and languages
     */
    resolveFeatures(): IFeatureDefinition[] {
        const selectors: string[] = this.options.features;

        // Return all features if no selectors are provided
        if (!selectors.length) return features;

        // Prepare the include and exclude sets
        const include = new Set<string>();
        const exclude = new Set<string>();

        for (const label of selectors) {
            if (label.startsWith('!')) {
                exclude.add(label.slice(1));
            } else {
                include.add(label);
            }
        }

        // Filter the features based on the include and exclude sets
        return features.filter(({ label }) => {
            if (exclude.has(label)) return false;
            if (include.size === 0) return true;

            return include.has(label);
        });
    }

    /**
     * Resolve the languages based on the provided options
     * @returns {IFeatureDefinition[]} - The resolved languages
     */
    resolveLanguages(): IFeatureDefinition[] {
        const selectors: string[] = this.options.languages;

        // Return all languages if no selectors are provided
        if (!selectors.length) return languages;

        // Prepare the include set
        const include = new Set<string>(selectors);

        for (const [language, dependency] of this.languageDependencies) {
            if (include.has(language) && !include.has(dependency)) {
                include.add(dependency);
            }
        }

        // Filter the languages based on the include set
        return languages.filter(({ label }) => {
            return include.has(label);
        });
    }

    /**
     * Get the output filename for a given entry point
     * @param {string} entry - The entry point to resolve
     * @returns {string} - The resolved output filename
     */
    getOutputFilename(entry: string): string {
        // Resolve the entry point to its absolute path
        const resourcePath = this.resolve(entry, true);

        // Use the loader-utils to interpolate the filename
        return interpolateName({ resourcePath }, this.options.filename, {
            content: readFileSync(resourcePath, 'utf8'),
        });
    }

    /**
     * Get the paths for the workers based on the provided options
     * @param {Map<string, IWorker>} workers - The workers to resolve
     * @returns {Record<string, string>} - The resolved worker paths
     */
    getWorkersPaths(workers: Map<string, IWorker>): Record<string, string> {
        const paths: Record<string, string> = {};

        // First, map each worker label to its output path
        for (const [label, worker] of workers.entries()) {
            paths[label] = worker.filename;
        }

        // Then, assign each language its dependency worker path
        for (const [language, dependency] of this.languageDependencies) {
            if (this.options.languages.includes(language) && paths[dependency] && !paths[language]) {
                paths[language] = paths[dependency];
            }
        }

        return paths;
    }

    /**
     * Get the paths for the modules based on the provided options
     * @param {IFeatureDefinition[]} modules - The modules to resolve
     * @returns {string[]} - The resolved module paths
     */
    getModulesPaths(modules: IFeatureDefinition[]): string[] {
        // Extract the entry points from the modules
        const entries = modules.flatMap(({ entry }) => entry || []);

        // Resolve the entry points to their absolute paths
        return entries.map((entry) => this.resolve(entry, true));
    }
}

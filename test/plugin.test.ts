import type { AssetInfo, Stats } from 'webpack';

import { describe, it, expect, beforeAll } from '@jest/globals';
import { MonacoEditorPlugin } from '../src/index';
import { features, languages } from 'monaco-editor/esm/metadata';
import { compile } from './helpers';

/**
 * Testing the plugin options
 */
describe('MonacoEditorPlugin option variants', () => {
    it('should include all features and languages by default', () => {
        const plugin = new MonacoEditorPlugin();

        expect(plugin.featureModules.length).toBe(features.length);
        expect(plugin.languageModules.length).toBe(languages.length);
    });

    it('should include features correctly', () => {
        const plugin = new MonacoEditorPlugin({
            features: ['diffEditor'],
        });
        const labels = plugin.featureModules.map(f => f.label);

        expect(labels.length).toBe(1);
        expect(labels).toContain('diffEditor');
        expect(labels).not.toContain('diffEditorBreadcrumbs');
    });

    it('should exclude features correctly', () => {
        const plugin = new MonacoEditorPlugin({
            features: ['!diffEditor', '!diffEditorBreadcrumbs'],
        });
        const labels = plugin.featureModules.map(f => f.label);

        expect(labels.length).toBe(features.length - 2);
        expect(labels).not.toContain('diffEditor');
        expect(labels).not.toContain('diffEditorBreadcrumbs');
    });

    it('should add language dependencies', () => {
        const plugin = new MonacoEditorPlugin({
            languages: ['javascript'],
        });
        const labels = plugin.languageModules.map(l => l.label);

        expect(labels).toContain('javascript');
        expect(labels).toContain('typescript');
    });
});

/**
 * Testing the plugin methods
 */
describe('MonacoEditorPlugin.getModulesPaths', () => {
    const plugin = new MonacoEditorPlugin();

    it('should return the correct paths for given modules', () => {
        const paths = plugin.getModulesPaths([
            {
                label: 'anchorSelect',
                entry: 'vs/editor/contrib/anchorSelect/browser/anchorSelect',
            },
            {
                label: 'caretOperations',
                entry: [
                    'vs/editor/contrib/caretOperations/browser/caretOperations',
                    'vs/editor/contrib/caretOperations/browser/transpose',
                ],
            },
            {
                label: 'editorWorkerService',
                entry: undefined,
            },
        ]);

        expect(paths).toEqual(
            [
                'vs/editor/contrib/anchorSelect/browser/anchorSelect',
                'vs/editor/contrib/caretOperations/browser/caretOperations',
                'vs/editor/contrib/caretOperations/browser/transpose',
            ].map(p => plugin.resolve(p, true)),
        );
    });
});

/**
 * Testing the plugin compilation
 */
describe('MonacoEditorPlugin Compilation', () => {
    let stats: Stats;
    let assets: Map<string, AssetInfo>;

    beforeAll(async () => {
        stats = await compile({
            webpack: {
                module: {
                    rules: [
                        {
                            test: /\.css$/,
                            use: ['style-loader', 'css-loader'],
                        },
                        {
                            test: /\.ttf$/,
                            type: 'asset/resource',
                        },
                    ],
                },
            },
        });

        assets = stats.compilation.assetsInfo;
    }, 10000);

    it('should compile without errors', () => {
        expect(stats).toBeDefined();
    });

    it('should generates editor worker file', () => {
        expect(assets.has('editor.worker.js')).toBe(true);
    });

    it('should generates typescript worker file', () => {
        expect(assets.has('ts.worker.js')).toBe(true);
    });

    it('should generates css worker file', () => {
        expect(assets.has('css.worker.js')).toBe(true);
    });

    it('should generates json worker file', () => {
        expect(assets.has('json.worker.js')).toBe(true);
    });

    it('should generates html worker file', () => {
        expect(assets.has('html.worker.js')).toBe(true);
    });
});

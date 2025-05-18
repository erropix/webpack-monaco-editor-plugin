import type { Stats, StatsModule } from 'webpack';
import type { IMonacoEditorPluginOptions } from '../src/index';

import { describe, it, expect, beforeAll } from '@jest/globals';
import { pitch } from '../src/loaders/include';
import { compile } from './helpers';

function mockLoaderContext(options: any): any {
    return {
        getOptions: () => options,
        context: '/project',
        utils: {
            contextify: (_context: string, entry: string) => entry,
        },
    };
}

describe('MonacoEditorLoader pitch function', () => {
    it('should use default publicPath and global when not provided', () => {
        const ctx = mockLoaderContext({
            workers: {},
            features: [],
            languages: [],
            // publicPath and global omitted
        });
        const result = pitch.call(ctx, 'monaco-editor/esm/vs/editor/editor.api', '', {});

        expect(result).toContain('const base = "" || __webpack_public_path__');
        expect(result).toContain('globalAPI: false');
    });

    it('should use provided publicPath and global', () => {
        const ctx = mockLoaderContext({
            workers: {},
            features: [],
            languages: [],
            publicPath: '/static/',
            global: true,
        });
        const result = pitch.call(ctx, 'monaco-editor/esm/vs/editor/editor.api', '', {});

        expect(result).toContain('const base = "/static/" || __webpack_public_path__');
        expect(result).toContain('globalAPI: true');
    });
});

describe('MonacoEditorLoader', () => {
    let stats: Stats;
    let modules: StatsModule[];

    beforeAll(async () => {
        stats = await compile({
            webpack: {
                module: {
                    noParse: /[\\/]monaco-editor[\\/]esm[\\/]vs/,
                },
            },
        });

        modules = stats.toJson({ source: true }).modules || [];
    }, 10000);

    it('should generate correct Monaco entry source', () => {
        const module = modules[0];
        expect(module.source).toMatchSnapshot('monaco-editor-api-javascript-css-json-html-php');
    });
});

import { webpack } from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';
import { MonacoEditorPlugin } from '../src/index';

import type { Configuration, OutputFileSystem, Stats } from 'webpack';
import type { IMonacoEditorPluginOptions } from '../src/index';

interface CompileOptions {
    webpack?: Configuration;
    plugin?: Partial<IMonacoEditorPluginOptions>;
}

/**
 * Compiles using webpack with MonacoEditorPlugin in a virtual filesystem.
 */
export function compile(options: CompileOptions = {}): Promise<Stats> {
    const compiler = webpack({
        devtool: false,
        mode: 'development',
        entry: 'monaco-editor/esm/vs/editor/editor.api',
        ...options.webpack,
    });

    compiler.outputFileSystem = createFsFromVolume(new Volume()) as OutputFileSystem;

    const plugin = new MonacoEditorPlugin({
        languages: ['javascript', 'css', 'json', 'html', 'php'],
        filename: '[name].js',
        ...options.plugin,
    });

    plugin.apply(compiler);

    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            compiler.close(() => {});

            if (err) return reject(err);
            if (!stats) return reject(new Error('No stats returned from webpack'));
            if (stats.hasErrors()) return reject(stats.toJson().errors);

            resolve(stats);
        });
    });
}

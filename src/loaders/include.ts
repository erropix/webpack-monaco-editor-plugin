import schema from './schema.json';

import type { PitchLoaderDefinitionFunction } from 'webpack';
import type { Schema } from 'schema-utils';

export interface IMonacoEditorLoaderOptions {
    workers: Record<string, string>;
    features: string[];
    languages: string[];
    publicPath?: string;
    global?: boolean;
}

export const pitch: PitchLoaderDefinitionFunction<IMonacoEditorLoaderOptions> = function pitch(request: string) {
    const { workers, features, languages, publicPath = '', global = false } = this.getOptions(schema as Schema);

    const contextify = (entry: string) => {
        return this.utils.contextify(this.context, entry);
    };

    const buffer: string[] = [];

    buffer.push(`// Setup Monaco Environment to load workers
const base = ${JSON.stringify(publicPath)} || __webpack_public_path__;
const paths = ${JSON.stringify(workers, null, 4)};

function getWorkerUrl(id, label) {
    if (!paths.hasOwnProperty(label))
        throw new Error(\`The \${label} worker was not found. Supported workers: \${Object.keys(paths).join(', ')}\`);
    const path = paths[label];
    const url = new URL(path, new URL(base, location.origin));
    if (url.origin === location.origin)
        return url;
    return URL.createObjectURL(new Blob([\`import '\${url}';\`], { type: 'text/javascript' }));
}

self.MonacoEnvironment = {
    globalAPI: ${global},
    getWorkerUrl,
};`);
    buffer.push('');
    buffer.push('// Import feature modules');
    buffer.push(...features.map((entry) => `import "${contextify(entry)}";`));
    buffer.push('');
    buffer.push(`// Import Monaco Editor core`);
    buffer.push(`import * as monaco from "${contextify(`!!${request}`)}";`);
    buffer.push('');
    buffer.push('// Import language modules');
    buffer.push(...languages.map((entry) => `import "${contextify(entry)}";`));
    buffer.push('');
    buffer.push('// Export Monaco Editor API');
    buffer.push(`export * from "${contextify(`!!${request}`)}";`);
    buffer.push(`export default monaco;`);

    return buffer.join('\n');
};

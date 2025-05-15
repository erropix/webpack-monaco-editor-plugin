# Webpack Monaco Editor Plugin

`webpack-monaco-editor-plugin` is a Webpack plugin designed to simplify the integration of the Monaco Editor into your Webpack projects. It provides a seamless way to load and configure Monaco Editor's ESM modules, including support for workers, features, and languages.

## Features

- Automatically configures Monaco Editor workers.
- Supports custom features and languages.
- Allows specifying public paths for assets.
- Compatible with Webpack 5 and above.

## Installation

To install the plugin, use npm or yarn:

```bash
npm install webpack-monaco-editor-plugin --save-dev
```

or

```bash
yarn add webpack-monaco-editor-plugin --dev
```

## Usage Example

Add the plugin to your Webpack configuration file:

```javascript
const { MonacoEditorPlugin } = require('webpack-monaco-editor-plugin');

module.exports = {
    // ...existing Webpack configuration...
    plugins: [
        new MonacoEditorPlugin({
            features: ['!gotoSymbol'], // Exclude specific features by prefixing their IDs with '!'
            languages: ['javascript'], // Include specific languages, 'javascript' depends on 'typescript', it will be included by the plugin
            filename: '[name].[contenthash].js', // Workers output filename template
            publicPath: '', // Public path for assets
            global: true, // Enable global API
        }),
    ],
};
```

Then, use the monaco editor in your app

```javascript
import monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

const code = `function greet(name) {
    console.log(\`Hello, \${name}!\`);
}

greet('Monaco Editor');

function add(a, b) {
    return a + b;
}

console.log('Sum:', add(5, 10));

const multiply = (x, y) => x * y;
console.log('Product:', multiply(4, 7));
`;

monaco.editor.create(document.getElementById('container'), {
    value: code,
    language: 'javascript',
});
```

## Options

The plugin accepts the following options:

| Option       | Type      | Default                   | Description                                                                     |
|--------------|-----------|---------------------------|---------------------------------------------------------------------------------|
| `features`   | `string[]`| `[]`                      | List of features to include or exclude (e.g., `['!gotoSymbol']`).               |
| `languages`  | `string[]`| `[]`                      | List of languages to include (e.g., `['javascript', 'html']`).                  |
| `filename`   | `string`  | `[name].[contenthash].js` | Output filename pattern for generated files.                                    |
| `publicPath` | `string`  | `''`                      | Public path for assets.                                                         |
| `global`     | `boolean` | `false`                   | Whether to enable the global API.                                               |

## Development

### Build

To build the plugin, run:

```bash
npm run build
```

### Watch

To enable watch mode for development:

```bash
npm run watch
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

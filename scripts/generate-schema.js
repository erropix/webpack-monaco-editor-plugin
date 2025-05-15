const fs = require('fs');
const path = require('path');
const { languages, features } = require('monaco-editor/esm/metadata');

// Prepare plugin options schema enums
const featureEnum = features.map((feature) => feature.label);
const negatedFeatureEnum = featureEnum.map((feature) => `!${feature}`);
const languageEnum = languages.map((language) => language.label);

const pluginOptionsSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        features: {
            type: 'array',
            description: 'Array of Monaco editor features to include.',
            items: {
                type: 'string',
                enum: [...featureEnum, ...negatedFeatureEnum],
            },
        },
        languages: {
            type: 'array',
            description: 'Array of Monaco editor languages to include.',
            items: {
                type: 'string',
                enum: languageEnum,
            },
        },
        filename: {
            type: 'string',
            description: 'The output filename template for generated worker files.',
        },
        publicPath: {
            type: 'string',
            description: 'The public path to prepend to the generated worker URLs.',
        },
        global: {
            type: 'boolean',
            description: 'Enable the global Monaco API.',
        },
    },
};

fs.writeFile(path.posix.join(__dirname, '../src/schema.json'), JSON.stringify(pluginOptionsSchema, null, 4), 'utf-8', (err) => {
    if (err) {
        throw err;
    }

    console.log('Plugin options schema generated successfully!');
});

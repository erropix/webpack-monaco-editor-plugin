/**
 * @type {import('jest').Config}
 */
module.exports = {
    preset: 'ts-jest',
    roots: ["<rootDir>/test/"],
    collectCoverage: true,
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/test/"
    ]
};

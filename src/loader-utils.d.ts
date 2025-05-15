declare module 'loader-utils' {
    export interface ILoaderUtilsContext {
        resourcePath: string;
        resourceQuery?: string;
    }
    
    export interface ILoaderUtilsOptions {
        context?: string;
        content?: string;
        regExp?: RegExp;
    }

    /**
     * Interpolates a filename template using multiple placeholders and/or a regular expression.
     * The template and regular expression are set as query params called name and regExp on the current loader's context.
     * {@link https://github.com/webpack/loader-utils#interpolatename}
     */
    export function interpolateName(
        loaderContext: ILoaderUtilsContext, 
        name: string | ((resourcePath: string, resourceQuery ?: string) => string), 
        options?: ILoaderUtilsOptions
    ): string;
}

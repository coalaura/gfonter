import { generateGoogleFontsCss } from "./builder.js";

export function gFonterVitePlugin(pluginOptions = {}) {
    let config;

    return {
        name: "gfonter",

        configResolved(resolvedConfig) {
            config = resolvedConfig;
        },

        async writeBundle(buildOptions, bundle) {
            for (const file in bundle) {
                const chunk = bundle[file],
                    viteMetadata = chunk.viteMetadata,
                    importedCss = viteMetadata?.importedCss;

                if (!importedCss) continue;

                for (const css of importedCss) {
                    const fonts = await generateGoogleFontsCss(css, buildOptions.dir, pluginOptions);

                    if (fonts && fonts > 0) {
                        config.logger.info(`\x1b[96m[gfonter]\x1b[90m Found \x1b[32m${fonts}\x1b[90m Google Fonts in \x1b[35m${css}\x1b[0m`);
                    } else {
                        config.logger.info(`\x1b[96m[gfonter]\x1b[90m Found \x1b[32mno\x1b[90m Google Fonts in \x1b[35m${css}\x1b[0m`);
                    }
                }
            }

            return;
        }
    }
}
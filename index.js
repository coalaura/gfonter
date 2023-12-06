import { basename } from "path";

import { generateGoogleFontsCss } from "./builder.js";

async function transformCssFile(file, config, pluginOptions) {
    const fonts = await generateGoogleFontsCss(file, pluginOptions);

    if (fonts && fonts > 0) {
        config.logger.info(`\x1b[96m[gfonter]\x1b[90m Found \x1b[32m${fonts}\x1b[90m Google Fonts in \x1b[35m${basename(file)}\x1b[0m`);
    } else {
        config.logger.info(`\x1b[96m[gfonter]\x1b[90m Found \x1b[32mno\x1b[90m Google Fonts in \x1b[35m${basename(file)}\x1b[0m`);
    }
}

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
                    const file = `${buildOptions.dir}/${css}`.replace(/\\/g, "/");

                    await transformCssFile(file, config, pluginOptions);
                }
            }

            return;
        },

        async handleHotUpdate(ctx) {
            const file = ctx.file;

            if (!file || !file.endsWith(".css")) return;

            await transformCssFile(file, config, pluginOptions);
        }
    }
}
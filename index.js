import { basename } from "path";

import { updateGoogleFontsCssFile, generateGoogleFontsCss } from "./builder.js";

async function transformCssFile(file, config, pluginOptions) {
    const fonts = await updateGoogleFontsCssFile(file, pluginOptions);

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

        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (req.url.includes(".scss") || req.url.includes(".css")) {
                    const result = await server.transformRequest(req.url);

                    if (result && result.code) {
                        const { css } = await generateGoogleFontsCss(result.code, pluginOptions);

                        if (!css) return next();

                        const finalized = result.code.replace(/(?<=const __vite__css = ")/, css);

                        res.setHeader("Content-Type", "text/css");
                        res.end(finalized);

                        return;
                    }
                }

                next();
            });
        }
    }
}
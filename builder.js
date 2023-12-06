import { readFile, writeFile } from "fs/promises";

import { extractGoogleFonts } from "./parser.js";
import { filterValidGoogleFontsList } from "./api.js";

let cachedFonts = false;

function buildGoogleFontsUrl(fonts) {
    const families = fonts.map(font => {
        const { family, weights, italic } = font;

        const weightsString = weights.map(weight => `${italic ? "0," : ""}${weight}`).join(";"),
            italicString = italic.map(weight => `1,${weight}`).join(";");

        return [
            `family=${family.replace(/\s+/g, "+")}:`,
            italic ? "ital,wght@" : "wght@",
            [weightsString, italicString].filter(Boolean).join(";")
        ].join("");
    });

    if (!families.length) return false;

    return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

async function buildAndCleanupGoogleFonts(fonts, pluginOptions) {
    const whitelist = pluginOptions.whitelist || false,
        blacklist = pluginOptions.blacklist || false;

    fonts = fonts.filter(font => {
        const { family } = font;

        // Not in whitelist
        if (whitelist && !whitelist.includes(family)) return false;

        // In blacklist
        if (blacklist && blacklist.includes(family)) return false;

        return true;
    });

    if (!fonts.length) return false;

    fonts = await filterValidGoogleFontsList(fonts);

    const shouldRevalidateFonts = !cachedFonts || fonts.some(font => !cachedFonts.includes(font.family));

    let url = buildGoogleFontsUrl(fonts);

    if (!url) return false;

    if (shouldRevalidateFonts) {
        const css = await fetch(url).then(res => res.text());

        if (!css) {
            throw new Error("Failed to fetch Google Fonts CSS");
        }

        fonts = fonts.filter(font => css.includes(`font-family: '${font.family}'`));

        url = buildGoogleFontsUrl(fonts);
    }

    if (!fonts.length) return false;

    cachedFonts = fonts.map(font => font.family);

    return {
        url: url,
        fonts: fonts.length
    };
}

export async function generateGoogleFontsCss(content, pluginOptions) {
    const fonts = await extractGoogleFonts(content),
        build = await buildAndCleanupGoogleFonts(fonts, pluginOptions);

    if (!build) return false;

    // Remove standard imports
    content = content.replace(/@import url\((["'])https:\/\/fonts\.googleapis\.com.+?\1\);?(\r?\n)?/g, "");

    // Remove shortened imports
    content = content.replace(/@import(["'])https:\/\/fonts\.googleapis\.com.+?\1;?(\r?\n)?/g, "");

    // Add new import
    const css = `@import"${build.url}";`;

    content = css + content;

    return {
        css: css,
        content: content,
        fonts: build.fonts
    };
}

export async function updateGoogleFontsCssFile(path, pluginOptions) {
    const oldContent = await readFile(path, "utf-8");

    const {content, fonts} = await generateGoogleFontsCss(oldContent, pluginOptions);

    if (!content) return false;

    await writeFile(path, content, "utf-8");

    return fonts;
}
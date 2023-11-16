let knownGoogleFonts = false;

async function ensureGoogleFonts() {
    if (knownGoogleFonts) return;

    try {
        const response = await fetch("https://fonts.google.com/metadata/fonts"),
            json = await response.json();

        knownGoogleFonts = json.familyMetadataList.map(font => {
            const styles = Object.keys(font.fonts),
                weights = styles.filter(style => !style.endsWith("i")).map(style => parseInt(style)),
                italic = styles.filter(style => style.endsWith("i")).map(style => parseInt(style));

            return {
                family: font.family,
                weights: weights,
                italic: italic
            };
        });
    } catch (e) { }
}

export async function filterValidGoogleFontsList(fonts) {
    await ensureGoogleFonts();

    return fonts.filter(font => {
        return knownGoogleFonts.find(known => known.family === font.family);
    }).map(font => {
        const known = knownGoogleFonts.find(known => known.family === font.family);

        font.weights = font.weights.filter(weight => known.weights.includes(weight));
        font.italic = font.italic.filter(weight => known.italic.includes(weight));

        return font;
    });
}

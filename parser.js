import knownFonts from "./known_fonts.js";

function isValidFont(family) {
	if (!family) return false;

	// No web-safe or known fonts
	if (knownFonts.includes(family)) return false;

	// Google only allows letters, numbers and spaces
	if (family.match(/[^a-zA-Z0-9 ]/)) return false;

	return true;
}

export async function extractGoogleFonts(content) {
	const regex = /font-(family|weight|style):\s*(.+?)([;`]|$)/gm;

	let families = [],
		weights = [],
		italic = false;

	let m;

	while ((m = regex.exec(content)) !== null) {
		if (m.index === regex.lastIndex) regex.lastIndex++;

		const [, type, value] = m;

		switch (type) {
			case "family":
				const values = value.split(",")
					.map(family => family.replace(/['"]/g, "").trim())
					.filter(isValidFont);

				families.push(...values);

				break;
			case "weight":
				let weight = value.replace(/['"]/g, "").trim();

				switch (weight) {
					case "normal":
						weight = "400";

						break;
					case "lighter":
						weight = "100";

						break;
					case "bold":
						weight = "700";

						break;
					case "bolder":
						weight = "900";

						break;
					case "100":
					case "200":
					case "300":
					case "400":
					case "500":
					case "600":
					case "700":
					case "800":
					case "900":
						break;
					default:
						weight = "400";

						break;
				}

				weight = parseInt(weight);

				if (!weights.includes(weight)) weights.push(parseInt(weight));

				break;
			case "style":
				if (value === "italic") {
					italic = true;
				}

				break;
		}
	}

	if (!weights.length) weights.push(400);

	return combineFonts(families.map(family => {
		return {
			family,
			weights,
			italic
		};
	}));
}

function combineFonts(fonts) {
	const families = {};

	for (const font of fonts) {
		const { family, weights, italic } = font;

		if (!families[family]) {
			families[family] = {
				family,
				weights: [],
				italic: false
			};
		}

		const f = families[family];

		f.weights.push(...weights);
		f.italic = f.italic || italic;
	}

	return Object.values(families).map(family => {
		family.weights = [...new Set(family.weights)].sort((a, b) => a - b);

		return family;
	});
}
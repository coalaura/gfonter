# G-Fonter

Automatically extract and replace your google fonts.

### Usage

```javascript
import { gFonterVitePlugin } from "@coalaura/gfonter";

export default defineConfig({
	plugins: [
		...,
		gFonterVitePlugin({
			inlineCss: false, // Will not import the css from google but download it and inline it
			whitelist: ["Roboto"], // Will only download and replace Roboto
			blacklist: ["Roboto"], // Will download and replace all fonts except Roboto
		})
	],
	...
});
```

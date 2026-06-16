// uno.config.ts

import transformerDirectives from "@unocss/transformer-directives";
import transformerVariantGroup from "@unocss/transformer-variant-group";
import { defineConfig, presetUno } from "unocss";

export default defineConfig({
	presets: [presetUno()],
	transformers: [transformerVariantGroup(), transformerDirectives()],
	theme: {
		breakpoints: {
			sm: "640px",
			md: "768px",
			lg: "1024px",
			xl: "1280px",
			"2xl": "1536px",
			"3xl": "1920px",
		},
	},
});

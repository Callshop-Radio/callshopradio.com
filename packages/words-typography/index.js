import manifest from "./words-typography.json" with { type: "json" };

/**
 * The raw manifest, as shipped in `words-typography.json`.
 * `hash` is a `sha256:` digest over the `styles` array only.
 */
export const WORDS_TYPOGRAPHY = manifest;

/**
 * The non-default styles the editor offers, `normal` included.
 */
export const CUSTOM_STYLES = manifest.styles;

const HEADINGS = ["h1", "h2", "h3", "h4", "h5", "h6"];

const NORMAL = CUSTOM_STYLES.find((style) => style.key === "normal");

/**
 * Styles for the Sanity block editor: `normal`, `h1`-`h6`, then the
 * custom styles. `normal` appears exactly once.
 *
 * @returns {{ title: string, value: string }[]}
 */
export function styleList() {
	const headings = HEADINGS.map((key) => ({
		title: key.toUpperCase(),
		value: key,
	}));

	const custom = CUSTOM_STYLES.filter((style) => style.key !== "normal").map(
		(style) => ({ title: style.label, value: style.key }),
	);

	return [{ title: NORMAL.label, value: NORMAL.key }, ...headings, ...custom];
}

/**
 * Resolve any key offered by {@link styleList}. Headings render as their own
 * element without a class; unknown keys resolve to `null`.
 *
 * @param {string} key
 * @returns {{ element: string, className: string | null, css: Record<string, string> } | null}
 */
export function resolveStyle(key) {
	const custom = CUSTOM_STYLES.find((style) => style.key === key);

	if (custom) {
		return {
			element: custom.element,
			className: custom.className,
			css: { ...custom.css },
		};
	}

	if (HEADINGS.includes(key)) {
		return { element: key, className: null, css: {} };
	}

	return null;
}

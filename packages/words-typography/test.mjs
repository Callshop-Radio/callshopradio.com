import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
	CUSTOM_STYLES,
	resolveStyle,
	styleList,
	WORDS_TYPOGRAPHY,
} from "./index.js";

/**
 * Recursive stable-key stringify: sorts object keys, emits no whitespace.
 * @param {unknown} value
 * @returns {string}
 */
function stableStringify(value) {
	if (Array.isArray(value)) {
		return `[${value.map((item) => stableStringify(item)).join(",")}]`;
	}
	if (value && typeof value === "object") {
		const entries = Object.keys(value)
			.sort()
			.map(
				(key) =>
					`${JSON.stringify(key)}:${stableStringify(
						/** @type {Record<string, unknown>} */ (value)[key],
					)}`,
			);
		return `{${entries.join(",")}}`;
	}
	return JSON.stringify(value);
}

/**
 * Manifest hash: sha256 over the stable stringify of the styles array.
 * @param {unknown} styles
 * @returns {string}
 */
function computeHash(styles) {
	const digest = createHash("sha256")
		.update(stableStringify(styles), "utf8")
		.digest("hex");
	return `sha256:${digest}`;
}

test("custom styles keep the agreed order and keys", () => {
	assert.deepEqual(
		CUSTOM_STYLES.map((s) => s.key),
		["normal", "lead", "small", "quote", "italic", "kicker"],
	);
});

test("normal carries no css of its own", () => {
	assert.deepEqual(CUSTOM_STYLES.find((s) => s.key === "normal").css, {});
});

test("resolveStyle maps keys to elements and classes", () => {
	assert.equal(resolveStyle("lead").element, "p");
	assert.equal(resolveStyle("quote").element, "blockquote");
	assert.equal(resolveStyle("lead").className, "rt-lead");
	assert.equal(resolveStyle("nope"), null);
});

test("styleList starts with normal and the six headings", () => {
	assert.deepEqual(
		styleList()
			.map((s) => s.value)
			.slice(0, 6),
		["normal", "h1", "h2", "h3", "h4", "h5"],
	);
});

test("styleList order is exactly the agreed vocabulary", () => {
	assert.deepEqual(
		styleList().map((s) => s.value),
		[
			"normal",
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			"lead",
			"small",
			"quote",
			"italic",
			"kicker",
		],
	);
});

test("styleList never repeats a value", () => {
	assert.equal(
		new Set(styleList().map((s) => s.value)).size,
		styleList().length,
	);
});

test("manifest hash matches the styles array", () => {
	assert.equal(computeHash(CUSTOM_STYLES), WORDS_TYPOGRAPHY.hash);
});

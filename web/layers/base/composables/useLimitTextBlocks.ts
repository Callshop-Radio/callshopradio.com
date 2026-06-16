import type { RichTextBlock } from "~/types/sanity";

/**
 * Limitiert die Textlänge in Rich Text Blöcken und fügt ein Auslassungszeichen hinzu
 *
 * @param blocks - Die Rich Text Blöcke, die verarbeitet werden sollen
 * @param maxLength - Die maximale Anzahl der Zeichen (Standard: 100)
 * @returns Die gekürzten Rich Text Blöcke
 */
export const limitTextBlocks = (blocks: unknown, maxLength = 100): unknown => {
	if (!blocks || !Array.isArray(blocks)) return blocks;

	// Kopie der Blöcke erstellen, um das Original nicht zu verändern
	const limitedBlocks = JSON.parse(JSON.stringify(blocks)) as RichTextBlock[];
	// Für jeden Block mit Text
	for (const block of limitedBlocks) {
		if (block.children && Array.isArray(block.children)) {
			for (const child of block.children) {
				// Wenn der Text länger als maxLength ist, kürzen und "…" hinzufügen
				if (child.text && child.text.length > maxLength) {
					child.text = `${child.text.substring(0, maxLength)}…`;
				}
			}
		}
	}

	return limitedBlocks;
};

/**
 * Limitiert Rich-Text auf eine maximale Wortanzahl und fügt „…“ hinzu.
 */
export const limitTextBlocksByWords = (
	blocks: unknown,
	maxWords = 40,
): RichTextBlock[] => {
	if (!blocks || !Array.isArray(blocks)) return [];

	const limitedBlocks = JSON.parse(JSON.stringify(blocks)) as RichTextBlock[];
	let wordsRemaining = maxWords;
	let done = false;

	for (let blockIndex = 0; blockIndex < limitedBlocks.length; blockIndex++) {
		const block = limitedBlocks[blockIndex];
		if (!block.children?.length) continue;

		for (let childIndex = 0; childIndex < block.children.length; childIndex++) {
			const child = block.children[childIndex];
			if (!child.text) continue;

			const words = child.text.trim().split(/\s+/).filter(Boolean);

			if (words.length <= wordsRemaining) {
				wordsRemaining -= words.length;
				continue;
			}

			if (wordsRemaining > 0) {
				child.text = `${words.slice(0, wordsRemaining).join(" ")}…`;
			} else {
				child.text = "";
			}

			block.children = block.children.slice(0, childIndex + 1);
			done = true;
			break;
		}

		if (done) {
			return limitedBlocks.slice(0, blockIndex + 1);
		}
	}

	return limitedBlocks;
};

/**
 * Composable-Hook zum Limitieren von Text in Rich Text Blöcken
 *
 * @returns Eine Funktion zum Limitieren der Textlänge
 */
export const useLimitTextBlocks = () => {
	return {
		limitTextBlocks,
	};
};

export default useLimitTextBlocks;

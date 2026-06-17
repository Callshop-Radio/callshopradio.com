import type { RichTextBlock } from "~/types/sanity";

/**
 * Limits the text length in rich text blocks and appends an ellipsis
 *
 * @param blocks - The rich text blocks to be processed
 * @param maxLength - The maximum number of characters (default: 100)
 * @returns The truncated rich text blocks
 */
export const limitTextBlocks = (blocks: unknown, maxLength = 100): unknown => {
	if (!blocks || !Array.isArray(blocks)) return blocks;

	// Create a copy of the blocks so the original is not modified
	const limitedBlocks = JSON.parse(JSON.stringify(blocks)) as RichTextBlock[];
	// For each block with text
	for (const block of limitedBlocks) {
		if (block.children && Array.isArray(block.children)) {
			for (const child of block.children) {
				// If the text is longer than maxLength, truncate and append "…"
				if (child.text && child.text.length > maxLength) {
					child.text = `${child.text.substring(0, maxLength)}…`;
				}
			}
		}
	}

	return limitedBlocks;
};

/**
 * Limits rich text to a maximum number of words and appends „…“.
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
 * Composable hook for limiting text in rich text blocks
 *
 * @returns A function for limiting the text length
 */
export const useLimitTextBlocks = () => {
	return {
		limitTextBlocks,
	};
};

export default useLimitTextBlocks;

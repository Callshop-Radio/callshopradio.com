export type WordsStyleKey =
	| "normal"
	| "lead"
	| "small"
	| "quote"
	| "italic"
	| "kicker";

export type WordsHeading = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type WordsStyleName = WordsStyleKey | WordsHeading;

export interface WordsStyle {
	key: WordsStyleKey;
	label: string;
	element: string;
	className: string;
	css: Record<string, string>;
}

export interface WordsTypographyManifest {
	version: string;
	styles: WordsStyle[];
	hash: string;
}

export declare const WORDS_TYPOGRAPHY: WordsTypographyManifest;

export declare const CUSTOM_STYLES: WordsStyle[];

export interface WordsStyleListEntry {
	title: string;
	value: WordsStyleName;
}

export interface ResolvedWordsStyle {
	element: string;
	className: string | null;
	css: Record<string, string>;
}

export declare function styleList(): WordsStyleListEntry[];

export declare function resolveStyle(key: string): ResolvedWordsStyle | null;

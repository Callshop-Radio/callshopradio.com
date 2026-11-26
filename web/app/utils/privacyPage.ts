/**
 * Privacy page copy that is not in Sanity: the Umami note, and the cleanup of
 * the legacy Google Analytics section the CMS text still carries. Kept here so
 * the privacy page and the combined legal page render exactly the same
 * Portable Text.
 */

type TextChild = { text?: string };
type TextBlock = { children?: TextChild[]; [key: string]: unknown };

export const PRIVACY_SLUGS = ["privacy", "datenschutz", "privacy-policy"];

function blockText(block: TextBlock | undefined): string {
	return (block?.children ?? []).map((child) => child?.text ?? "").join("");
}

function paragraph(key: string, text: string, style = "normal"): TextBlock {
	return {
		_type: "block",
		_key: key,
		style,
		markDefs: [],
		children: [{ _type: "span", _key: `${key}-span`, marks: [], text }],
	};
}

function isHeading(block: TextBlock): boolean {
	return block?.style === "h2" || block?.style === "h3";
}

/**
 * Google Analytics is gone from the site. The Sanity text still has a "Google
 * Analytics:" section (and the odd inline mention), so the renderer drops it:
 * the heading, the paragraphs that belong to it, and any standalone paragraph
 * that still names the service.
 */
function stripGoogleAnalytics(blocks: TextBlock[]): TextBlock[] {
	const kept: TextBlock[] = [];
	let insideGaSection = false;

	for (const block of blocks) {
		const text = blockText(block).trim();
		const namesGa = /google\s+analytics/i.test(text);

		if (isHeading(block)) {
			insideGaSection = namesGa;
			if (insideGaSection) continue;
			kept.push(block);
			continue;
		}

		if (insideGaSection) {
			if (!text) continue;
			if (namesGa) continue;
			// The first paragraph after the heading belongs to that section.
			insideGaSection = false;
			continue;
		}

		if (namesGa) continue;
		kept.push(block);
	}

	return kept;
}

function umamiPrivacyBlocks(lang: string): TextBlock[] {
	const isDe = lang === "de";
	const heading = isDe ? "Analyse mit Umami" : "Analytics with Umami";
	const body = isDe
		? "Wir nutzen Umami, ein datenschutzfreundliches Analyse-Tool auf unserem eigenen Server (stats.bitmancer.net), um die Nutzung der Website zu verstehen und unser Programm zu verbessern. Umami erfasst Seitenaufrufe und Interaktionen wie Wiedergaben, Suchen, Filterauswahlen und Hörminuten. Es verwendet keine Cookies und erstellt keine Nutzerprofile. Erfasst werden außerdem Referrer sowie Browser-, Betriebssystem- und Länderinformationen. Analyse-Daten werden nur erhoben, wenn du der Kategorie „Analyse“ in den Cookie-Einstellungen zustimmst. Die Verarbeitung erfolgt auf Grundlage deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO); du kannst sie jederzeit über die Cookie-Einstellungen widerrufen."
		: 'We use Umami, a privacy-friendly analytics tool hosted on our own server (stats.bitmancer.net), to understand how the website is used and to improve our programme. Umami records page views and interactions such as plays, searches, filter selections and listening minutes. It does not use cookies and does not create user profiles. It also records referrer as well as browser, operating system and country information. Analytics data is only collected if you consent to the "Analytics" category in the cookie settings. The processing is based on your consent (Art. 6(1)(a) GDPR); you can withdraw it at any time via the cookie settings.';

	return [
		paragraph("umami-note-heading", heading, "h2"),
		paragraph("umami-note-body", body),
	];
}

/** Privacy blocks without Google Analytics, with the Umami note appended. */
export function privacyContentBlocks(
	blocks: TextBlock[],
	lang: string,
): TextBlock[] {
	return [...stripGoogleAnalytics(blocks), ...umamiPrivacyBlocks(lang)];
}

/**
 * Privacy page copy that is not (yet) in Sanity: the consent-gated Google
 * Analytics paragraph and the Umami note. Kept here so the privacy page and the
 * combined legal page render exactly the same Portable Text.
 */

type TextChild = { text?: string };
type TextBlock = { children?: TextChild[]; [key: string]: unknown };

export const PRIVACY_SLUGS = ["privacy", "datenschutz", "privacy-policy"];

function blockText(block: TextBlock | undefined): string {
	return (block?.children ?? []).map((child) => child?.text ?? "").join("");
}

function privacyGaBody(lang: string): string {
	return lang === "de"
		? "Google Analytics 4 wird ausschließlich nach deiner Einwilligung geladen. Erst dann werden Nutzungsdaten wie aufgerufene Seiten, Interaktionen, Geräte- und Browserinformationen sowie die ungefähre Region an Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Irland) übermittelt. Ohne deine Einwilligung findet keine Übertragung an Google statt. Wir haben mit Google einen Vertrag zur Auftragsverarbeitung geschlossen. Die Einwilligung ist freiwillig und kann jederzeit über die Cookie-Einstellungen mit Wirkung für die Zukunft widerrufen werden; die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung bleibt unberührt. Die Aufbewahrungsdauer richtet sich nach den Einstellungen in Google Analytics 4 (standardmäßig zwei Monate für nutzerbezogene Daten, maximal 14 Monate). Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO sowie § 25 Abs. 1 TDDDG."
		: "Google Analytics 4 is loaded only after you give your consent. Only then are usage data such as pages visited, interactions, device and browser information and the approximate region transmitted to Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Ireland). Without your consent, no data is transmitted to Google. We have concluded a data processing agreement with Google. Consent is voluntary and can be withdrawn at any time via the cookie settings with effect for the future; the lawfulness of processing carried out until then remains unaffected. The retention period depends on the settings in Google Analytics 4 (two months for user-level data by default, up to 14 months). The legal basis is Art. 6(1)(a) GDPR and § 25(1) TDDDG.";
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

// The Sanity privacy text still says Google Analytics runs on legitimate
// interest. That is not compatible with the consent-gated setup, so replace the
// body of the existing "Google Analytics:" section at render time. Once the CMS
// text is updated, this function simply rewrites it with the same wording.
function replaceLegacyGaText(blocks: TextBlock[], lang: string): TextBlock[] {
	const body = privacyGaBody(lang);
	let replaced = false;

	const headingIndex = blocks.findIndex(
		(block) => blockText(block).trim() === "Google Analytics:",
	);

	let bodyIndex = -1;
	if (headingIndex >= 0) {
		for (let index = headingIndex + 1; index < blocks.length; index += 1) {
			if (blockText(blocks[index]).trim()) {
				bodyIndex = index;
				break;
			}
		}
	}

	const rewritten = blocks.map((block, index) => {
		const isLegacyBody =
			bodyIndex >= 0
				? index === bodyIndex
				: blockText(block)
						.trim()
						.startsWith("We use Google Analytics based on legitimate interest");

		if (!replaced && isLegacyBody) {
			replaced = true;
			return {
				...block,
				children: [
					{
						_type: "span",
						_key: `${block._key ?? "ga"}-consent`,
						marks: [],
						text: body,
					},
				],
			};
		}

		return block;
	});

	if (replaced) return rewritten;

	return [
		...rewritten,
		paragraph("ga-consent-heading", "Google Analytics 4", "h2"),
		paragraph("ga-consent-body", body),
	];
}

/** Privacy blocks including the analytics notes, ready for RichText. */
export function privacyContentBlocks(
	blocks: TextBlock[],
	lang: string,
): TextBlock[] {
	return [...replaceLegacyGaText(blocks, lang), ...umamiPrivacyBlocks(lang)];
}

import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Bakes the standalone Label Index into the Nuxt app.
 *
 *   node web/scripts/bake-label-index.mjs "<source folder>"
 *
 * Reads labels.json + logos/ from the source, normalizes the data, converts
 * the logos to 512px WebP (ImageMagick required) and writes:
 *   web/app/data/label-index/labels.json
 *   web/app/data/label-index/about.ts
 *   web/public/index/logos/*.webp
 *
 * No network access, no Sanity writes.
 */

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");
const repoRoot = resolve(webRoot, "..");

const sourceDir = resolve(
	process.argv[2] ??
		"P:/Recent Projects/CallshopRadio/Label_Index/Label_Index_0.0.3",
);
const labelsFile = join(sourceDir, "labels.json");
const logosDir = join(sourceDir, "logos");
const htmlFile = join(sourceDir, "index.html");

const outDataDir = join(webRoot, "app", "data", "label-index");
const outJson = join(outDataDir, "labels.json");
const outAbout = join(outDataDir, "about.ts");
const outLogosDir = join(webRoot, "public", "index", "logos");

const MAX_LOGO_SIZE = 512;
const WEBP_QUALITY = 85;

function fail(message) {
	console.error(`\n✖ ${message}`);
	process.exit(1);
}

function slugify(value) {
	return String(value)
		.toLowerCase()
		.trim()
		.replace(/ä/g, "ae")
		.replace(/ö/g, "oe")
		.replace(/ü/g, "ue")
		.replace(/ß/g, "ss")
		.replace(/&/g, " and ")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function text(value) {
	return value == null ? "" : String(value).trim();
}

function decodeEntities(value) {
	return value
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">");
}

function stripTags(value) {
	return decodeEntities(
		value
			.replace(/<[^>]+>/g, " ")
			.replace(/\s+/g, " ")
			.trim(),
	);
}

function parseAbout() {
	if (!existsSync(htmlFile)) fail(`index.html not found: ${htmlFile}`);
	const html = readFileSync(htmlFile, "utf8");
	const block = html.match(/<div class="about-text">([\s\S]*?)<\/div>/);
	if (!block) fail("About text block not found in index.html");
	const paragraphs = [...block[1].matchAll(/<p>([\s\S]*?)<\/p>/g)]
		.map((match) => stripTags(match[1]))
		.filter(Boolean);
	if (!paragraphs.length) fail("About text has no paragraphs");
	return paragraphs;
}

function readDimensions(file) {
	const output = execFileSync(
		"magick",
		["identify", "-format", "%w %h", file],
		{ encoding: "utf8" },
	).trim();
	const [width, height] = output.split(/\s+/).map(Number);
	if (!width || !height) fail(`Could not read dimensions for ${file}`);
	return { width, height };
}

function convertLogo(source, target) {
	execFileSync(
		"magick",
		[
			source,
			"-auto-orient",
			"-background",
			"none",
			"-resize",
			`${MAX_LOGO_SIZE}x${MAX_LOGO_SIZE}>`,
			"-strip",
			"-define",
			"webp:method=6",
			"-quality",
			String(WEBP_QUALITY),
			target,
		],
		{ stdio: "pipe" },
	);
	return readDimensions(target);
}

function main() {
	if (!existsSync(labelsFile)) fail(`labels.json not found: ${labelsFile}`);
	if (!existsSync(logosDir)) fail(`logos folder not found: ${logosDir}`);

	const rows = JSON.parse(readFileSync(labelsFile, "utf8"));
	if (!Array.isArray(rows) || rows.length === 0) fail("labels.json is empty");
	if (!existsSync(outDataDir)) mkdirSync(outDataDir, { recursive: true });
	if (!existsSync(outLogosDir)) mkdirSync(outLogosDir, { recursive: true });

	const sourceLogos = new Set(readdirSync(logosDir));
	const usedSlugs = new Map();
	const labels = [];
	const missing = [];
	let converted = 0;

	for (const row of rows) {
		const name = text(row.Name);
		if (!name) fail("Label without a name found");

		let slug = slugify(name) || "label";
		const seen = usedSlugs.get(slug) ?? 0;
		usedSlugs.set(slug, seen + 1);
		if (seen > 0) slug = `${slug}-${seen + 1}`;

		const imageLink = text(row["Image-Link"]);
		const sourceLogo = join(sourceDir, imageLink);
		if (!imageLink || !sourceLogos.has(imageLink.replace(/^logos\//, ""))) {
			missing.push(`${name} (${imageLink || "no image"})`);
			continue;
		}
		if (!existsSync(sourceLogo)) {
			missing.push(`${name} (${imageLink})`);
			continue;
		}

		const targetLogo = join(outLogosDir, `${slug}.webp`);
		const { width, height } = convertLogo(sourceLogo, targetLogo);
		converted += 1;

		labels.push({
			slug,
			name,
			founded: text(row.Gründungsdatum),
			location: text(row.Ort),
			releases: text(row.Releases),
			members: text(row.Gründungsmitglieder),
			discogs: text(row["Discogs-Link"]),
			youtube: text(row["Youtube-Link"]),
			soundcloud: text(row["Soundcloud-Link"]),
			logo: `/index/logos/${slug}.webp`,
			logoWidth: width,
			logoHeight: height,
		});

		if (converted % 25 === 0) {
			console.log(`  ${converted}/${rows.length} logos converted`);
		}
	}

	if (missing.length) {
		fail(`Missing logos (${missing.length}):\n- ${missing.join("\n- ")}`);
	}

	labels.sort((a, b) =>
		a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
	);

	const about = parseAbout();
	writeFileSync(outJson, `${JSON.stringify(labels, null, 2)}\n`);
	writeFileSync(
		outAbout,
		`// Generated by web/scripts/bake-label-index.mjs. Do not edit by hand.\nexport const about: string[] = ${JSON.stringify(about, null, 2)};\n`,
	);

	const totalBytes = labels.reduce(
		(sum, label) =>
			sum + statSync(join(outLogosDir, `${label.slug}.webp`)).size,
		0,
	);

	console.log(`\n✔ ${labels.length} labels`);
	console.log(`✔ ${converted} logos -> ${outLogosDir}`);
	console.log(`✔ ${about.length} about paragraphs`);
	console.log(`✔ data: ${outJson}`);
	console.log(`✔ total logo size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
	console.log(`\nSource: ${sourceDir}`);
	console.log(`Repo:   ${repoRoot}`);
}

main();

import { migrateToLanguageField } from "sanity-plugin-internationalized-array/migrations";

/**
 * Moves language identifiers from `_key` to `language` on all
 * internationalizedArray*Value objects (v4 → v5).
 *
 * Covered fields (by document type):
 * - article: text, textTeaser
 * - page: content
 * - person, venue: description
 * - tag.city: title, short
 * - fallbackGlobal: fallbackArticle/Person/Venue (title, description)
 *
 * Dry run:  cd studio && pnpm sanity migration run migrate-internationalized-array-to-v5
 * Apply:    cd studio && pnpm sanity migration run migrate-internationalized-array-to-v5 --no-dry-run --no-confirm
 */
const DOCUMENT_TYPES = [
  "person",
  "venue",
  "article",
  "page",
  "tag.city",
  "fallbackGlobal",
];

export default migrateToLanguageField(DOCUMENT_TYPES);

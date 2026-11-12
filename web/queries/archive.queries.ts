import { defineQuery } from "groq";
import { SET_PROJECTION } from "./module.queries";
import { IMAGE_QUERY, SITE_PATH_FRAGMENT } from "./sanity.snippets";

/**
 * Data for the advanced archive search (nav search → advanced panel).
 * Mirrors the Air station's "Bibliothek" search: sets filtered by show,
 * genre/subgenre, city and length, then grouped by show.
 *
 * The parent show of a set is not stored on the set; shows keep a `sets`
 * reference list. Loading that list once with the filter options lets the
 * panel map every set to its show without a per-set subquery.
 */
export const ARCHIVE_FILTER_OPTIONS_QUERY = defineQuery(`{
  "shows": *[_type == "show" && slug.current != "no-show"] | order(lower(title)) {
    _id,
    _type,
    title,
    "slug": slug.current,
    "setIds": sets[]._ref,
    image {
      asset->{
        url
      }
    }
  },
  "genres": *[_type == "tag.genre"] | order(lower(title)) {
    _id,
    title,
    "subGenres": subGenres[]->{
      _id,
      title
    } | order(lower(title))
  },
  "cities": *[_type == "tag.city"] | order(lower(title)) {
    _id,
    title,
    short
  }
}`);

export type ArchiveSort = "newest" | "oldest" | "title" | "show";

export const ARCHIVE_SORTS: Array<{ key: ArchiveSort; label: string }> = [
	{ key: "newest", label: "Newest first" },
	{ key: "oldest", label: "Oldest first" },
	{ key: "title", label: "Title A–Z" },
	{ key: "show", label: "Show A–Z" },
];

export const ARCHIVE_DURATIONS = [
	{ key: "", label: "Any length" },
	{ key: "short", label: "Under 30 min" },
	{ key: "medium", label: "30–60 min" },
	{ key: "long", label: "1–2 h" },
	{ key: "epic", label: "Over 2 h" },
];

const SORT_CLAUSES: Record<ArchiveSort, string> = {
	newest: "order(datetime desc)",
	oldest: "order(datetime asc)",
	title: "order(lower(title) asc)",
	show: `order(lower(*[_type == "show" && references(^._id)][0].title) asc, datetime desc)`,
};

/**
 * Builds the filtered set query. SoundCloud track durations are milliseconds,
 * so the length buckets compare against 30/60/120 minutes in ms.
 */
export function buildArchiveSearchQuery(sort: ArchiveSort = "newest") {
	const order = SORT_CLAUSES[sort] ?? SORT_CLAUSES.newest;

	return `*[
  _type == "set" && datetime != null && defined(slug.current)
  && ($show == "" || _id in *[_type == "show" && _id == $show][0].sets[]._ref)
  && (count($genreIds) == 0 || references($genreIds))
  && ($subgenre == "" || $subgenre in tags[]->_id)
  && ($city == "" || $city in tags[]->_id)
  && ($q == "" || title match "*" + $q + "*" || count(persons[_ref in *[_type == "person" && title match "*" + $q + "*"]._id]) > 0 || count(tags[_ref in *[_type in ["tag.genre", "tag.subGenre", "tag.global", "tag.mood"] && title match "*" + $q + "*"]._id]) > 0)
  && ($duration == "" || (
    ($duration == "short" && coalesce(math::sum(soundcloud.tracks[].duration), 0) < 1800000) ||
    ($duration == "medium" && coalesce(math::sum(soundcloud.tracks[].duration), 0) >= 1800000 && coalesce(math::sum(soundcloud.tracks[].duration), 0) < 3600000) ||
    ($duration == "long" && coalesce(math::sum(soundcloud.tracks[].duration), 0) >= 3600000 && coalesce(math::sum(soundcloud.tracks[].duration), 0) < 7200000) ||
    ($duration == "epic" && coalesce(math::sum(soundcloud.tracks[].duration), 0) >= 7200000)
  ))
] | ${order}[0...$limit] {
  _id,
  _type,
  title,
  slug,
  datetime,
  image {
    asset->{
      url
    }
  },
  "tags": tags[]->{
    _id,
    _type,
    title,
    short
  } | order(lower(title)),
  "durationMs": coalesce(math::sum(soundcloud.tracks[].duration), 0)
}`;
}

/** Shows, pool and words that match the free-text query. */
export const ARCHIVE_OTHER_RESULTS_QUERY = defineQuery(`*[
  _type in ["show", "person", "venue", "article"] &&
  title match "*" + $q + "*" &&
  !(_type in ["person", "venue"] && poolVisibility != true) &&
  !(_type == "show" && title == "no-show")
] | order(_updatedAt desc)[0...$limit] {
  _id,
  _type,
  title,
  "slug": slug,
  image ${IMAGE_QUERY},
  "tags": tags[]->{
    _id,
    _type,
    title,
    short
  } | order(lower(title)),
  ${SITE_PATH_FRAGMENT}
}`);

/** One set with everything the player row needs to start playback. */
export const SET_PLAY_QUERY = defineQuery(
	`*[_type == "set" && _id == $id][0]${SET_PROJECTION}`,
);

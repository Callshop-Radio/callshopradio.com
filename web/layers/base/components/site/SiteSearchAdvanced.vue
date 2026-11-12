<script setup>
import {
	ARCHIVE_DURATIONS,
	ARCHIVE_FILTER_OPTIONS_QUERY,
	ARCHIVE_OTHER_RESULTS_QUERY,
	ARCHIVE_SORTS,
	buildArchiveSearchQuery,
	SET_PLAY_QUERY,
} from "~~/queries/archive.queries";

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
	},
	// Search term passed in from the header field. When set, the panel opens
	// with that query applied instead of only showing the cached result list.
	initialQuery: {
		type: String,
		default: "",
	},
});

const emit = defineEmits(["update:modelValue"]);

const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

const localePath = useLocalePath();
const { getItemImage } = useContentImage();
const { playTrack } = useSoundcloudArtwork();

const blankFilters = () => ({
	q: "",
	show: "",
	genre: "",
	subgenre: "",
	city: "",
	duration: "",
	sort: "newest",
});

const options = ref({ shows: [], genres: [], cities: [] });
const optionsLoaded = ref(false);
const draft = ref(blankFilters());
const applied = ref(blankFilters());
const results = ref([]);
const otherResults = ref([]);
const playingId = ref(null);
const isLoading = ref(false);
const hasLoadedResults = ref(false);
const error = ref(null);
const searchRef = ref(null);

const RESULT_LIMIT = 2000;

const label = (value) => getI18nLabel(value) || "";

const activeGenreSubs = computed(() => {
	const genre = options.value.genres.find(
		(entry) => entry._id === draft.value.genre,
	);
	return genre?.subGenres || [];
});

const cities = computed(() =>
	[...options.value.cities].sort((a, b) =>
		label(a.title).localeCompare(label(b.title)),
	),
);

function imageUrl(item, width = 160) {
	const image = getItemImage(item);
	return sanityImageUrl(image?.asset?.url, width);
}

// Sets carry no show reference; shows list their sets. Map once per options
// load so grouping needs no per-set subquery.
const showBySetId = computed(() => {
	const map = new Map();
	for (const show of options.value.shows) {
		for (const id of show.setIds || []) map.set(id, show);
	}
	return map;
});

const openGroups = ref(new Set());

function isGroupOpen(key) {
	return openGroups.value.has(key);
}

function toggleGroup(key) {
	const next = new Set(openGroups.value);
	if (next.has(key)) next.delete(key);
	else next.add(key);
	openGroups.value = next;
}

const groups = computed(() => {
	const map = new Map();

	for (const item of results.value) {
		const show = showBySetId.value.get(item._id);
		const key = show?._id || "none";
		let group = map.get(key);
		if (!group) {
			group = {
				key,
				title: show?.title || "No show",
				showSlug: show?.slug || "no-show",
				imageUrl: show ? imageUrl(show, 120) : undefined,
				sets: [],
				durationMs: 0,
			};
			map.set(key, group);
		}
		group.sets.push(item);
		group.durationMs += Number(item.durationMs) || 0;
	}

	return [...map.values()];
});

const showHits = computed(() =>
	otherResults.value.filter((item) => item._type === "show"),
);
const poolHits = computed(() =>
	otherResults.value.filter(
		(item) => item._type === "person" || item._type === "venue",
	),
);
const wordHits = computed(() =>
	otherResults.value.filter((item) => item._type === "article"),
);
const hasAnyResults = computed(
	() =>
		groups.value.length > 0 ||
		showHits.value.length > 0 ||
		poolHits.value.length > 0 ||
		wordHits.value.length > 0,
);

function formatDuration(ms) {
	const minutes = Math.round(Number(ms) / 60000);
	if (!minutes) return "";
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	return hours
		? `${hours} h ${String(rest).padStart(2, "0")} min`
		: `${rest} min`;
}

function formatDate(value) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	return `${day}.${month}.${date.getFullYear()}`;
}

function setTags(item) {
	const seen = new Set();
	const tags = [];
	for (const tag of item.tags || []) {
		const title = label(tag.title) || label(tag.short) || "";
		if (!title || seen.has(title)) continue;
		seen.add(title);
		tags.push(title);
		if (tags.length === 3) break;
	}
	return tags;
}

async function loadOptions() {
	if (optionsLoaded.value) return;
	try {
		const sanity = useSanity();
		const data = await sanity.fetch(ARCHIVE_FILTER_OPTIONS_QUERY);
		options.value = {
			shows: data?.shows || [],
			genres: data?.genres || [],
			cities: data?.cities || [],
		};
		optionsLoaded.value = true;
	} catch (err) {
		console.error("[SiteSearchAdvanced] Could not load filters:", err);
	}
}

async function loadResults() {
	isLoading.value = true;
	error.value = null;

	try {
		const sanity = useSanity();
		const genre = options.value.genres.find(
			(entry) => entry._id === applied.value.genre,
		);
		const genreIds = genre
			? [genre._id, ...(genre.subGenres || []).map((sub) => sub._id)]
			: [];

		const q = applied.value.q.trim();
		const otherPromise = q
			? sanity
					.fetch(ARCHIVE_OTHER_RESULTS_QUERY, { q, limit: 18 })
					.catch(() => [])
			: Promise.resolve([]);

		const [data, other] = await Promise.all([
			sanity.fetch(buildArchiveSearchQuery(applied.value.sort), {
				show: applied.value.show,
				genreIds,
				subgenre: applied.value.subgenre,
				city: applied.value.city,
				q,
				duration: applied.value.duration,
				limit: RESULT_LIMIT,
			}),
			otherPromise,
		]);
		results.value = data || [];
		otherResults.value = other || [];
	} catch (err) {
		console.error("[SiteSearchAdvanced] Search failed:", err);
		error.value = "The archive could not be searched.";
		results.value = [];
		otherResults.value = [];
	} finally {
		isLoading.value = false;
		hasLoadedResults.value = true;
	}
}

function apply() {
	applied.value = { ...draft.value };
	openGroups.value = new Set();
	loadResults();
}

function reset() {
	draft.value = blankFilters();
	applied.value = blankFilters();
	openGroups.value = new Set();
	loadResults();
}

function close() {
	isOpen.value = false;
}

function openSet(item) {
	const slug = item?.slug?.current;
	if (!slug) return;
	const show = showBySetId.value.get(item._id);
	close();
	navigateTo(localePath(`/shows/${show?.slug || "no-show"}/${slug}`));
}

function openResult(item) {
	if (!item?.path) return;
	close();
	navigateTo(localePath(item.path));
}

async function playSetResult(item) {
	if (!item?._id || playingId.value) return;
	playingId.value = item._id;
	try {
		const sanity = useSanity();
		const full = await sanity.fetch(SET_PLAY_QUERY, { id: item._id });
		if (full) playTrack(full);
	} catch (err) {
		console.error("[SiteSearchAdvanced] Could not play set:", err);
		error.value = "Set konnte nicht geladen werden.";
	} finally {
		playingId.value = null;
	}
}

function resultTypeLabel(type) {
	if (type === "show") return "Show";
	if (type === "set") return "Set";
	if (type === "article") return "Words";
	return "Pool";
}

function resultTypeClass(type) {
	if (type === "show" || type === "set") return "type-show";
	if (type === "article") return "type-words";
	return "type-pool";
}

// Narrow searches (or a specific show) open their groups right away; a broad
// archive list stays collapsed like the library panel. Wait for the show map,
// otherwise the first paint has every set in a single "No show" group.
watch(groups, (list) => {
	if (!optionsLoaded.value) return;
	openGroups.value =
		list.length && list.length <= 5
			? new Set(list.map((group) => group.key))
			: new Set();
});

// Keep the subgenre inside the chosen genre.
watch(
	() => draft.value.genre,
	() => {
		if (
			draft.value.subgenre &&
			!activeGenreSubs.value.some((sub) => sub._id === draft.value.subgenre)
		) {
			draft.value.subgenre = "";
		}
	},
);

watch(
	() => [props.modelValue, props.initialQuery],
	([open, initial]) => {
		if (!open) return;
		loadOptions();

		const term = String(initial || "").trim();
		if (term) {
			draft.value = { ...blankFilters(), q: term };
			applied.value = { ...draft.value };
			openGroups.value = new Set();
			loadResults();
		} else if (!hasLoadedResults.value) {
			loadResults();
		}

		nextTick(() => searchRef.value?.focus());
	},
	{ deep: true },
);

const handleKeydown = (event) => {
	if (event.key === "Escape" && isOpen.value) {
		event.preventDefault();
		close();
	}
};

watch(isOpen, (open) => {
	if (open) {
		document.addEventListener("keydown", handleKeydown);
		document.body.style.overflow = "hidden";
	} else {
		document.removeEventListener("keydown", handleKeydown);
		document.body.style.overflow = "";
	}
});

onUnmounted(() => {
	document.removeEventListener("keydown", handleKeydown);
	document.body.style.overflow = "";
});
</script>

<template>
	<Teleport to="body">
		<Transition name="advanced-search">
			<div v-if="isOpen" class="advanced-search__overlay" @click.self="close">
				<section
					class="advanced-search"
					role="dialog"
					aria-modal="true"
					aria-label="Archive search"
				>
					<header class="advanced-search__head">
						<div class="advanced-search__titles">
							<span class="advanced-search__eyebrow">Advanced search</span>
							<h2 class="advanced-search__title">Browse the archive</h2>
						</div>
						<button
							type="button"
							class="advanced-search__close"
							aria-label="Close advanced search"
							@click="close"
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M3 3L13 13M13 3L3 13"
									stroke="currentColor"
									stroke-width="1.4"
									stroke-linecap="round"
								/>
							</svg>
						</button>
					</header>

					<form class="advanced-search__form" @submit.prevent="apply">
						<label class="advanced-search__field advanced-search__search">
							<span class="advanced-search__label">Search</span>
							<span class="advanced-search__search-box">
								<svg
									width="12"
									height="12"
									viewBox="0 0 10 10"
									fill="none"
									aria-hidden="true"
								>
									<circle
										cx="5.33765"
										cy="4.59622"
										r="2.75002"
										transform="rotate(45 5.33765 4.59622)"
									/>
									<path
										d="M0.159881 8.71358C-0.0425288 8.90142 -0.0543383 9.21779 0.133504 9.4202C0.321346 9.62261 0.637709 9.63442 0.840119 9.44657L0.159881 8.71358ZM3.08151 7.3665L3.44801 7.02638L2.76777 6.29339L2.40128 6.6335L3.08151 7.3665ZM0.840119 9.44657L3.08151 7.3665L2.40128 6.6335L0.159881 8.71358L0.840119 9.44657Z"
									/>
								</svg>
								<input
									ref="searchRef"
									v-model="draft.q"
									type="search"
									placeholder="Title, show, artist, genre"
									autocomplete="off"
								>
							</span>
						</label>

						<div class="advanced-search__fields">
							<label class="advanced-search__field">
								<span class="advanced-search__label">Show</span>
								<select v-model="draft.show">
									<option value="">All shows</option>
									<option
										v-for="show in options.shows"
										:key="show._id"
										:value="show._id"
									>
										{{ show.title }}
									</option>
								</select>
							</label>

							<label class="advanced-search__field">
								<span class="advanced-search__label">Genre</span>
								<select v-model="draft.genre">
									<option value="">All genres</option>
									<option
										v-for="genre in options.genres"
										:key="genre._id"
										:value="genre._id"
									>
										{{ label(genre.title) }}
									</option>
								</select>
							</label>

							<label class="advanced-search__field">
								<span class="advanced-search__label">Subgenre</span>
								<select v-model="draft.subgenre">
									<option value="">All subgenres</option>
									<template v-if="draft.genre">
										<option
											v-for="sub in activeGenreSubs"
											:key="sub._id"
											:value="sub._id"
										>
											{{ label(sub.title) }}
										</option>
									</template>
									<template v-else>
										<optgroup
											v-for="genre in options.genres"
											:key="genre._id"
											:label="label(genre.title)"
										>
											<option
												v-for="sub in genre.subGenres || []"
												:key="sub._id"
												:value="sub._id"
											>
												{{ label(sub.title) }}
											</option>
										</optgroup>
									</template>
								</select>
							</label>

							<label class="advanced-search__field">
								<span class="advanced-search__label">City / Tag</span>
								<select v-model="draft.city">
									<option value="">All cities</option>
									<option
										v-for="city in cities"
										:key="city._id"
										:value="city._id"
									>
										{{ label(city.title) }}
									</option>
								</select>
							</label>

							<label class="advanced-search__field">
								<span class="advanced-search__label">Length</span>
								<select v-model="draft.duration">
									<option
										v-for="bucket in ARCHIVE_DURATIONS"
										:key="bucket.key"
										:value="bucket.key"
									>
										{{ bucket.label }}
									</option>
								</select>
							</label>

							<label class="advanced-search__field">
								<span class="advanced-search__label">Sort</span>
								<select v-model="draft.sort">
									<option
										v-for="sort in ARCHIVE_SORTS"
										:key="sort.key"
										:value="sort.key"
									>
										{{ sort.label }}
									</option>
								</select>
							</label>
						</div>

						<div class="advanced-search__actions">
							<button type="submit" class="advanced-search__apply">
								Apply filters
							</button>
							<button
								type="button"
								class="advanced-search__reset"
								@click="reset"
							>
								Reset
							</button>
							<span class="advanced-search__count">
								<b>{{ results.length }}</b>
								{{ results.length === 1 ? "set" : "sets" }} ·
								<b>{{ groups.length }}</b>
								{{ groups.length === 1 ? "show" : "shows" }}
							</span>
						</div>
					</form>

					<div class="advanced-search__results">
						<p v-if="isLoading" class="advanced-search__empty">Loading results…</p>
						<p v-else-if="error" class="advanced-search__empty">
							{{ error }}
						</p>
						<div v-else-if="!hasAnyResults" class="advanced-search__empty">
							<p>No results for these filters.</p>
							<button type="button" @click="reset">Reset filters</button>
						</div>

						<template v-else>
							<section
								v-if="showHits.length"
								class="advanced-other advanced-other--show"
							>
								<h3 class="advanced-other__heading">
									Shows <span>{{ showHits.length }}</span>
								</h3>
								<button
									v-for="item in showHits"
									:key="item._id"
									type="button"
									class="advanced-other__item"
									@click="openResult(item)"
								>
									<img
										v-if="imageUrl(item, 120)"
										class="advanced-other__thumb"
										:src="imageUrl(item, 120)"
										alt=""
										loading="lazy"
									>
									<span class="advanced-other__copy">
										<span class="advanced-other__title">
											{{ item.title }}
										</span>
										<span class="advanced-other__tags">
											<span
												v-for="tag in setTags(item)"
												:key="tag"
												class="advanced-tag"
											>
												{{ tag }}
											</span>
										</span>
									</span>
									<span class="advanced-type advanced-type--show">
										Show
									</span>
								</button>
							</section>

							<section
								v-if="poolHits.length"
								class="advanced-other advanced-other--pool"
							>
								<h3 class="advanced-other__heading">
									Pool <span>{{ poolHits.length }}</span>
								</h3>
								<button
									v-for="item in poolHits"
									:key="item._id"
									type="button"
									class="advanced-other__item"
									@click="openResult(item)"
								>
									<img
										v-if="imageUrl(item, 120)"
										class="advanced-other__thumb"
										:src="imageUrl(item, 120)"
										alt=""
										loading="lazy"
									>
									<span class="advanced-other__copy">
										<span class="advanced-other__title">
											{{ item.title }}
										</span>
										<span class="advanced-other__tags">
											<span
												v-for="tag in setTags(item)"
												:key="tag"
												class="advanced-tag"
											>
												{{ tag }}
											</span>
										</span>
									</span>
									<span class="advanced-type advanced-type--pool">
										Pool
									</span>
								</button>
							</section>

							<section
								v-if="wordHits.length"
								class="advanced-other advanced-other--words"
							>
								<h3 class="advanced-other__heading">
									Words <span>{{ wordHits.length }}</span>
								</h3>
								<button
									v-for="item in wordHits"
									:key="item._id"
									type="button"
									class="advanced-other__item"
									@click="openResult(item)"
								>
									<img
										v-if="imageUrl(item, 120)"
										class="advanced-other__thumb"
										:src="imageUrl(item, 120)"
										alt=""
										loading="lazy"
									>
									<span class="advanced-other__copy">
										<span class="advanced-other__title">
											{{ item.title }}
										</span>
										<span class="advanced-other__tags">
											<span
												v-for="tag in setTags(item)"
												:key="tag"
												class="advanced-tag"
											>
												{{ tag }}
											</span>
										</span>
									</span>
									<span class="advanced-type advanced-type--words">
										Words
									</span>
								</button>
							</section>

							<template v-if="groups.length">
								<h3 class="advanced-other__heading advanced-other__heading--sets">
									Sets <span>{{ results.length }}</span>
								</h3>

								<div
									v-for="group in groups"
									:key="group.key"
									class="advanced-group"
									:class="{ 'is-open': isGroupOpen(group.key) }"
								>
									<button
										type="button"
										class="advanced-group__summary"
										:aria-expanded="isGroupOpen(group.key)"
										@click="toggleGroup(group.key)"
									>
										<img
											v-if="group.imageUrl"
											class="advanced-group__thumb"
											:src="group.imageUrl"
											alt=""
											loading="lazy"
										>
										<span class="advanced-group__copy">
											<b class="advanced-group__title">{{ group.title }}</b>
											<span class="advanced-group__meta">
												{{ formatDuration(group.durationMs) }}
											</span>
										</span>
										<span class="advanced-type advanced-type--show">
											Show
										</span>
										<span class="advanced-group__count">
											<b>{{ group.sets.length }}</b>
											{{ group.sets.length === 1 ? "set" : "sets" }}
										</span>
										<span class="advanced-group__toggle" aria-hidden="true">
											{{ isGroupOpen(group.key) ? "−" : "+" }}
										</span>
									</button>

									<ul
										v-if="isGroupOpen(group.key)"
										class="advanced-group__sets"
									>
										<li
											v-for="item in group.sets"
											:key="item._id"
										>
											<div class="advanced-set">
												<button
													type="button"
													class="advanced-set__play"
													:aria-label="`Play ${item.title}`"
													:disabled="playingId === item._id"
													@click.stop="playSetResult(item)"
												>
													<span
														v-if="playingId === item._id"
														class="advanced-set__loading"
													/>
													<svg
														v-else
														width="11"
														height="11"
														viewBox="0 0 16 16"
														aria-hidden="true"
													>
														<path
															d="M5 3.5v9l8-4.5z"
															fill="currentColor"
														/>
													</svg>
												</button>
												<button
													type="button"
													class="advanced-set__open"
													@click="openSet(item)"
												>
													<img
														v-if="imageUrl(item, 120)"
														class="advanced-set__thumb"
														:src="imageUrl(item, 120)"
														alt=""
														loading="lazy"
													>
													<span class="advanced-set__copy">
														<span class="advanced-set__title">
															{{ item.title }}
														</span>
														<span class="advanced-set__tags">
															<span class="advanced-type advanced-type--set">
																Set
															</span>
															<span
																v-for="tag in setTags(item)"
																:key="tag"
																class="advanced-tag"
															>
																{{ tag }}
															</span>
														</span>
													</span>
													<span class="advanced-set__meta">
														<span>{{ formatDate(item.datetime) }}</span>
														<span>{{ formatDuration(item.durationMs) }}</span>
													</span>
												</button>
											</div>
										</li>
									</ul>
								</div>

								<p
									v-if="results.length >= RESULT_LIMIT"
									class="advanced-search__hint"
								>
									Showing the first {{ results.length }} sets. Narrow the
									filters to see more.
								</p>
							</template>
						</template>
					</div>
				</section>
			</div>
		</Transition>
	</Teleport>
</template>

<style lang="postcss" scoped>
.advanced-search__overlay {
  position: fixed;
  top: var(--nav-bar-height);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 999998;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: var(--mid-padding);
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);

  @media (max-width: 900px) {
    padding: var(--small-padding);
  }
}

.advanced-search {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 66rem;
  max-height: calc(100svh - var(--nav-bar-height) - var(--player-bar-height) - 2rem);
  overflow: hidden;
  background: var(--color-bg);
  border: 1px solid var(--color-text);
  border-radius: var(--pill-radius);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--mid-padding);
    padding: var(--big-padding) var(--big-padding) var(--base-padding);
  }

  &__titles {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__eyebrow {
    font-family: var(--font-text-semibold);
    font-size: var(--mini-font-size);
    letter-spacing: var(--button-letter-spacing);
    text-transform: uppercase;
    color: var(--color-text-light, var(--color-dark-grey));
  }

  &__title {
    margin: 0;
    font-family: var(--font-headline);
    font-size: clamp(1.25rem, 2.2vw, 1.75rem);
    line-height: 1.1;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: 1px solid var(--color-text);
    border-radius: 50%;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);

    &:hover {
      background: var(--color-text);
      color: var(--color-bg);
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--base-padding);
    padding: var(--base-padding) var(--big-padding) var(--mid-padding);
    border-top: 1px solid var(--color-grey);
  }

  &__label {
    font-family: var(--font-text-semibold);
    font-size: var(--mini-font-size);
    letter-spacing: var(--button-letter-spacing);
    text-transform: uppercase;
    color: var(--color-text-light, var(--color-dark-grey));
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;

    input,
    select {
      width: 100%;
      height: 2.75rem;
      padding: 0 0.875rem;
      border: 1px solid var(--color-text);
      border-radius: var(--pill-radius);
      background: var(--color-bg);
      color: var(--color-text);
      font-family: var(--font-text-semibold);
      font-size: var(--small-font-size);
      outline: none;

      &:focus-visible {
        border-color: var(--color-pink);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-pink) 45%, transparent);
      }
    }

    select {
      appearance: none;
      padding-right: 1.75rem;
      background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
        linear-gradient(135deg, currentColor 50%, transparent 50%);
      background-position:
        calc(100% - 1rem) 1.15rem,
        calc(100% - 0.7rem) 1.15rem;
      background-size:
        0.3rem 0.3rem,
        0.3rem 0.3rem;
      background-repeat: no-repeat;
      cursor: pointer;
    }
  }

  &__search {
    grid-column: 1 / -1;
  }

  &__search-box {
    display: flex;
    align-items: center;
    gap: var(--base-padding);
    height: 3rem;
    padding: 0 1rem;
    border: 1px solid var(--color-text);
    border-radius: var(--pill-radius);
    background: var(--color-bg);
    color: var(--color-text);

    &:focus-within {
      border-color: var(--color-pink);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-pink) 45%, transparent);
    }

    svg {
      flex: none;

      circle {
        stroke: currentColor;
        fill: none;
      }

      path {
        fill: currentColor;
      }
    }

    input {
      flex: 1;
      height: 100%;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: inherit;
      font-family: var(--font-text-semibold);
      font-size: var(--base-font-size);
      outline: none;
      box-shadow: none;

      &::placeholder {
        color: var(--color-text-light, var(--color-dark-grey));
      }

      &::-webkit-search-cancel-button {
        display: none;
      }

      &:focus-visible {
        border: 0;
        box-shadow: none;
      }
    }
  }

  &__fields {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: var(--base-padding) var(--mid-padding);

    @media (max-width: 1100px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--base-padding);
    padding-top: var(--small-padding);
  }

  &__apply,
  &__reset {
    height: 2.5rem;
    padding: 0 var(--mid-padding);
    border-radius: var(--pill-radius);
    font-family: var(--font-text-semibold);
    font-size: var(--small-font-size);
    letter-spacing: var(--button-letter-spacing);
    text-transform: uppercase;
    cursor: pointer;
    transition:
      background var(--transition-fast),
      color var(--transition-fast),
      border-color var(--transition-fast);
  }

  &__apply {
    border: 1px solid var(--color-pink);
    background: var(--color-pink);
    color: var(--color-white);

    &:hover {
      background: var(--color-text);
      border-color: var(--color-text);
      color: var(--color-bg);
    }
  }

  &__reset {
    border: 1px solid var(--color-text);
    background: transparent;
    color: var(--color-text);

    &:hover {
      background: var(--color-text);
      color: var(--color-bg);
    }
  }

  &__count {
    margin-left: auto;
    font-family: var(--font-text);
    font-size: var(--small-font-size);
    color: var(--color-text-light, var(--color-dark-grey));
  }

  &__results {
    flex: 1;
    min-height: 6rem;
    overflow-y: auto;
    padding: var(--small-padding) var(--big-padding) var(--big-padding);
    border-top: 1px solid var(--color-grey);
  }

  &__empty {
    padding: var(--big-padding) 0;
    font-family: var(--font-text);
    color: var(--color-text-light, var(--color-dark-grey));

    p {
      margin: 0 0 var(--small-padding);
    }

    button {
      border: 0;
      background: transparent;
      color: var(--color-text);
      font-family: var(--font-text-semibold);
      text-decoration: underline;
      cursor: pointer;
    }
  }

  &__hint {
    padding: var(--small-padding) 0 0;
    font-family: var(--font-text);
    font-size: var(--small-font-size);
    color: var(--color-text-light, var(--color-dark-grey));
  }
}

.advanced-other {
  --row-accent: var(--color-pink);
  padding: 0.25rem 0 0.55rem;
  border-bottom: 1px solid var(--color-grey);

  &--pool {
    --row-accent: var(--color-blue);
  }

  &--words {
    --row-accent: var(--color-green);
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin: 0.75rem 0 0.35rem;
    font-family: var(--font-text-semibold);
    font-size: var(--mini-font-size);
    letter-spacing: var(--button-letter-spacing);
    text-transform: uppercase;
    color: var(--color-text-light, var(--color-dark-grey));

    span {
      color: var(--color-text);
    }

    &--sets {
      margin-top: 0.9rem;
    }
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--base-padding);
    width: 100%;
    padding: 0.45rem 0.5rem;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: var(--color-text);
    text-align: left;
    cursor: pointer;
    transition:
      border-color var(--transition-fast),
      background var(--transition-fast);

    &:hover,
    &:focus-visible {
      border-color: var(--row-accent);
      background: var(--color-grey-transparent);
      outline: none;
    }
  }

  &__thumb {
    width: 2.25rem;
    height: 2.25rem;
    object-fit: cover;
    border-radius: 0.25rem;
    flex: none;
  }

  &__copy {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    flex: 1;
  }

  &__title {
    font-family: var(--font-text-semibold);
    font-size: var(--small-font-size);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
}

.advanced-type {
  display: inline-flex;
  align-items: center;
  flex: none;
  padding: 0.05rem 0.35rem;
  border: 1px solid currentColor;
  border-radius: var(--pill-radius);
  font-family: var(--font-text-semibold);
  font-size: var(--mini-font-size);
  letter-spacing: var(--button-letter-spacing);
  line-height: 1.25;
  text-transform: uppercase;

  &--show,
  &--set {
    color: var(--color-pink);
  }

  &--pool {
    color: var(--color-blue);
  }

  &--words {
    color: var(--color-green);
  }
}

.advanced-tag {
  padding: 0.0625rem 0.375rem;
  border: 1px solid var(--color-text);
  border-radius: var(--pill-radius);
  font-family: var(--font-text-semibold);
  font-size: var(--mini-font-size);
  line-height: 1.2;
  color: var(--color-text-light, var(--color-dark-grey));
  white-space: nowrap;
}

.advanced-group {
  border-bottom: 1px solid var(--color-grey);

  &:last-child {
    border-bottom: 0;
  }

  &__summary {
    display: flex;
    align-items: center;
    gap: var(--base-padding);
    width: calc(100% + 0.8rem);
    margin: 0 -0.4rem;
    padding: var(--base-padding) 0.4rem;
    border: 1px solid transparent;
    border-radius: 5px;
    background: var(--color-bg);
    color: var(--color-text);
    text-align: left;
    font: inherit;
    cursor: pointer;
    position: sticky;
    top: 0;
    z-index: 1;
    transition:
      border-color var(--transition-fast),
      background var(--transition-fast);

    &:hover {
      border-color: var(--color-pink);
      background: color-mix(in srgb, var(--color-text) 4%, var(--color-bg));
    }
  }

  &__toggle {
    flex: none;
    margin-left: 0.4rem;
    font-family: var(--font-text-semibold);
    font-size: var(--base-font-size);
    line-height: 1;
  }

  &__thumb {
    width: 2.5rem;
    height: 2.5rem;
    object-fit: cover;
    border-radius: 0.25rem;
    flex: none;
  }

  &__copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
    flex: 1;
  }

  &__title {
    font-family: var(--font-text-semibold);
    font-size: var(--small-font-size);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    font-family: var(--font-text);
    font-size: var(--mini-font-size);
    color: var(--color-text-light, var(--color-dark-grey));
  }

  &__count {
    flex: none;
    font-family: var(--font-text);
    font-size: var(--small-font-size);
    color: var(--color-text-light, var(--color-dark-grey));

    b {
      font-family: var(--font-text-semibold);
      color: var(--color-text);
    }
  }

  &__sets {
    margin: 0 0 var(--base-padding);
    padding: 0;
    list-style: none;
  }
}

.advanced-set {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  padding: 0.25rem;
  border: 1px solid transparent;
  border-radius: 5px;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast);

  &:hover {
    border-color: var(--color-pink);
    background: var(--color-grey-transparent);
  }

  &__play {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    flex: none;
    padding: 0;
    border: 1px solid var(--color-text);
    border-radius: 50%;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    transition:
      border-color var(--transition-fast),
      background var(--transition-fast),
      color var(--transition-fast);

    &:hover {
      border-color: var(--color-pink);
      background: var(--color-pink);
      color: var(--color-white);
    }

    &:disabled {
      cursor: default;
      opacity: 0.6;
    }
  }

  &__loading {
    width: 0.75rem;
    height: 0.75rem;
    border: 1.5px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: advanced-spin 0.7s linear infinite;
  }

  &__open {
    display: flex;
    align-items: center;
    gap: var(--base-padding);
    flex: 1;
    min-width: 0;
    padding: 0.25rem;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
    font: inherit;
  }

  &__thumb {
    width: 2.75rem;
    height: 2.75rem;
    object-fit: cover;
    border-radius: 0.25rem;
    flex: none;
  }

  &__copy {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    flex: 1;
  }

  &__title {
    font-family: var(--font-text-semibold);
    font-size: var(--small-font-size);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.125rem;
    flex: none;
    font-family: var(--font-text);
    font-size: var(--mini-font-size);
    color: var(--color-text-light, var(--color-dark-grey));
    white-space: nowrap;
  }
}

@keyframes advanced-spin {
  to {
    transform: rotate(360deg);
  }
}

.advanced-search-enter-active,
.advanced-search-leave-active {
  transition: opacity var(--transition-fast);
}

.advanced-search-enter-from,
.advanced-search-leave-to {
  opacity: 0;
}

.advanced-search-enter-active .advanced-search,
.advanced-search-leave-active .advanced-search {
  transition: transform var(--transition-fast);
}

.advanced-search-enter-from .advanced-search,
.advanced-search-leave-to .advanced-search {
  transform: translateY(-0.75rem);
}

@media (max-width: 640px) {
  .advanced-search__results {
    padding: 0 var(--base-padding) var(--base-padding);
  }

  .advanced-search__form {
    padding: var(--small-padding) var(--base-padding);
  }

  .advanced-set__meta {
    display: none;
  }

  .advanced-set__thumb {
    width: 2.25rem;
    height: 2.25rem;
  }
}
</style>


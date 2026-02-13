<script setup lang="ts">
import type { ContentItem, Tag } from '~/types/sanity'
import { computed, onMounted, ref, watch } from 'vue'
import { useMainStore } from '~/stores/mainStore'
const { locale: _locale } = useI18n()
const localePath = useLocalePath()
const router = useRouter()

const mainStore = useMainStore()

const props = defineProps({
	// Daten-Array (z.B. data?.parentShow?.sets)
	items: {
		type: Array,
		default: () => []
	},
	// Inhaltstyp (sets, shows, persons, venues, words)
	type: {
		type: String,
		required: true,
		validator: (value) => {
			return [
				'sets',
				'shows',
				'words',
				'persons',
				'venues',
				'pool',
				'article',
				'primary',
				'secondary',
				'accent',
				'blue',
				'green',
				'yellow'
			].includes(value)
		}
	},
	// Optionaler Titel
	title: {
		type: String,
		default: ''
	},
	// Anzahl der ANFÄNGLICH anzuzeigenden Items pro Reihe
	limit: {
		type: Number,
		default: 3
	},
	// Anzahl der Items pro Reihe (Standard: 3)
	itemsPerRow: {
		type: Number,
		default: 3
	},
	// Anzeige-Stil
	style: {
		type: String,
		default: 'default'
	}
})

// State für sichtbare Items
const itemsPerPage = props.itemsPerRow || 3
const visibleItemCount = ref(props.limit || itemsPerPage)

// Computeds und Hooks
const typeClassMap = {
	sets: 'sets',
	shows: 'shows',
	words: 'words',
	persons: 'pool',
	venues: 'pool',
	pool: 'pool',
	article: 'words',
	primary: 'sets',
	secondary: 'shows',
	accent: 'pool',
	blue: 'pool',
	green: 'words',
	yellow: 'sets'
}

// CSS-Klasse entsprechend dem Typ
const typeClass = computed(() => {
	return typeClassMap[props.type] || 'default'
})

// Gefilterte Items basierend auf visibleItemCount
const visibleItems = computed(() => {
	if (!props.items || !Array.isArray(props.items)) return []
	return props.items.slice(0, visibleItemCount.value)
})

// Funktion zum Laden weiterer Items
function loadMoreItems() {
	visibleItemCount.value += itemsPerPage

	// Wichtig: Nach dem Laden neuer Items müssen wir die Artwork-URLs für die neuen Items laden
	nextTick(() => {
		if (props.type === 'sets') {
			// Lade alle neu hinzugekommenen Items
			const newItems = props.items.slice(
				visibleItemCount.value - itemsPerPage,
				visibleItemCount.value
			)
			newItems.forEach((item) => {
				if (!artworkUrls.value.has(item?._id)) {
					loadArtworkUrl(item)
				}
			})
		}
	})
}

// Bestimmen, ob mehr Items zum Laden verfügbar sind
const hasMoreItems = computed(() => {
	return props.items && props.items.length > visibleItemCount.value
})

// Artwork-URLs für SoundCloud-Tracks
const artworkUrls = ref(new Map())

// Hilfsfunktion zur Formatierung von Datum/Zeit
function formatDate(dateString) {
	if (!dateString) return ''
	const date = new Date(dateString)
	if (isNaN(date.getTime())) return ''
	return date.toLocaleDateString('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	})
}

// Funktionen für Bild-Handling
function getItemImage(item) {
	// Wenn kein Item existiert, sofort ein Fallback-Bild zurückgeben
	if (!item) return mainStore?.siteFallbacks?.fallbackSet?.image

	// Fallbacks je nach Content-Typ
	const itemType = item?._type || ''
	let image = null

	// Bild aus dem Item selbst
	if (item?.image && item?.image.asset) {
		image = item?.image
	} else if (item?.mainImage && item?.mainImage.asset) {
		image = item?.mainImage
	} else {
		// Fallback-Bilder je nach Typ
		switch (itemType) {
		case 'person':
			image = mainStore?.siteFallbacks?.fallbackPerson?.image
			break
		case 'venue':
			image = mainStore?.siteFallbacks?.fallbackVenue?.image
			break
		case 'show':
			image = mainStore?.siteFallbacks?.fallbackShow?.image
			break
		case 'set':
			// Versuche zuerst das parentShow Bild
			if (item?.parentShow?.image?.asset?.url) {
				image = item?.parentShow?.image
			} else {
				image = mainStore?.siteFallbacks?.fallbackSet?.image
			}
			break
		case 'word':
		case 'article':
			image = mainStore?.siteFallbacks?.fallbackArticle?.image
			break
		default:
			// Allgemeines Fallback-Bild
			image = mainStore?.siteFallbacks?.fallbackSet?.image
		}
	}

	return image
}

// SoundCloud-Artwork laden (synchron ohne checkImage)
function loadArtworkUrl(item) {
	if (!item) return
	// Prüfen, ob die URL bereits im Cache ist
	if (artworkUrls.value.has(item?._id)) return
	const url = getSoundcloudArtwork(item)
	artworkUrls.value.set(item?._id, url)
}

function _checkImage(url) {
	return new Promise((resolve) => {
		const img = new Image()
		img.onload = () => resolve(true)
		img.onerror = () => resolve(false)
		img.src = url
	})
}

// Non-blocking artwork URL resolution - returns URL directly, browser handles 404s
function getSoundcloudArtwork(item) {
	// Try SoundCloud artwork first (use -t500x500 for better quality)
	const artworkUrl = item?.soundcloud?.tracks?.[0]?.artwork_url
	if (artworkUrl) {
		return artworkUrl.replace('-large', '-t500x500')
	}
	// Fallback chain
	const parentShowImageUrl = item?.parentShow?.image?.asset?.url
	const storeFallbackUrl =
    mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url
	return parentShowImageUrl || storeFallbackUrl || ''
}

// Funktion zum Bestimmen der passenden Route für verschiedene Content-Typen
function getItemRoute(item) {
	if (!item || !item?.slug) return '/'

	switch (item?._type) {
	case 'person':
	case 'venue':
		return localePath(`/pool/${item?.slug?.current}`)

	case 'set':
		// Prüfe, ob parentShow vorhanden ist
		if (item?.parentShow?.slug?.current) {
			return localePath(
				`/shows/${item?.parentShow?.slug?.current}/${item?.slug?.current}`
			)
		}
		// Fallback falls parentShow nicht verfügbar ist
		return localePath(`/shows/${item?.slug?.current}`)

	case 'article':
		return localePath(`/words/${item?.slug?.current}`)

	case 'show':
		return localePath(`/shows/${item?.slug?.current}`)

		// Standard-Fallback
	default:
		return localePath(`/${item?._type}/${item?.slug?.current}`)
	}
}

// SoundCloud-Track abspielen
function playTrack(item) {
	if (item?.soundcloud?.tracks?.[0]) {
		const track = item?.soundcloud.tracks[0]
		if (!track.permalink_url && track.id) {
			track.permalink_url = `https://api.soundcloud.com/tracks/${track.id}`
		}
		mainStore.currentTrack = track
	}
}

// Stadt-Tags abrufen (used in template)
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in template
function getItemCityTags(item) {
	const cityTags = []

	// Direkte City-Tags
	if (item?.tags && Array.isArray(item?.tags)) {
		item?.tags.forEach((tag) => {
			if (tag._type === 'tag.city') {
				cityTags.push(tag)
			}
		})
	}

	// City-Tags aus parentShow
	if (item?.parentShow?.tags && Array.isArray(item?.parentShow?.tags)) {
		item?.parentShow?.tags.forEach((tag) => {
			if (tag._type === 'tag.city') {
				if (!cityTags.some((existingTag) => existingTag._id === tag._id)) {
					cityTags.push(tag)
				}
			}
		})
	}

	return cityTags
}

// Nicht-Stadt-Tags abrufen
function getItemNonCityTags(item) {
	if (!item?.tags || !Array.isArray(item?.tags)) return []
	return item?.tags.filter((tag) => tag._type !== 'tag.city')
}

// Watcher für visibleItems, um Artwork-URLs für neue Items zu laden
watch(
	visibleItems,
	(newItems) => {
		if (props.type === 'sets') {
			newItems.forEach((item) => {
				if (!artworkUrls.value.has(item?._id)) {
					loadArtworkUrl(item)
				}
			})
		}
	},
	{ deep: true }
)

// Lifecycle Hooks
onMounted(() => {
	// Beim ersten Laden die Artworks für sichtbare Items laden
	if (props.type === 'sets') {
		visibleItems.value.forEach((item) => {
			loadArtworkUrl(item)
		})
	}
	// Note: Watcher handles additional items when loadMore is called
})

function navigateToTagSearch(tag: Tag, item: ContentItem | { _type?: string }, isGenre = false) {
	// Determine search term
	let tagName = ''

	if (isGenre) {
		tagName = tag.name || tag.title
	} else {
		// For standard tags, prefer title for searching as it matches the search index
		// If title implies an object/array (i18n), we need to extract the string
		const titleVal = tag.title || tag.name

		if (Array.isArray(titleVal)) {
			// Assume portable text / i18n array, take first element value
			tagName = titleVal[0]?.value || ''
		} else if (typeof titleVal === 'object') {
			// Fallback for object without array
			tagName = ''
		} else {
			tagName = titleVal || ''
		}
	}

	if (!tagName) return

	// Determine Category
	let category = 'all'
	const itemType = item?._type

	if (['show', 'set'].includes(itemType)) category = 'shows'
	else if (['person', 'venue'].includes(itemType)) category = 'pool'
	else if (['article'].includes(itemType)) category = 'article'

	// Navigate
	router.push({
		path: localePath('/search'),
		query: {
			q: tagName,
			type: category
		}
	})
}
</script>

<template>
	<div
		v-if="items && items.length > 0"
		class="related-content"
		:class="type">
		<h2 v-if="title" class="related-content__title">{{ title }}</h2>

		<div class="related-content__grid">
			<!-- Grid-Items -->
			<div
				v-for="item in visibleItems"
				:key="item?._id"
				:class="`related-item related-item--${style} ${typeClass}`"
			>
				<!-- Stadt-Tags falls vorhanden -->
				<!-- <div class="related-item__tags city-tags">
          <span
            v-for="tag in getItemCityTags(item)"
            :key="tag._id"
            class="tag city"
          >
            {{ parseI18nObj(tag?.short) }}
          </span>
        </div> -->

				<!-- Bild -->
				<NuxtLink
					v-if="item?.slug"
					:to="getItemRoute(item)"
					class="related-item__link"
				>
					<div v-if="type === 'sets'" class="related-item__image">
						<img
							v-if="item?.image && item?.image.asset && item?.image.asset.url"
							:src="item?.image.asset.url"
							:alt="item?.title || ''"
							loading="lazy"
						>
						<div v-else-if="item?.soundcloud" class="track-artwork">
							<img
								v-if="artworkUrls.get(item?._id)"
								:src="artworkUrls.get(item?._id)"
								alt="Track Artwork"
								class="track-image"
							>
							<div v-else class="track-artwork-placeholder"/>
						</div>
						<!-- Zusätzlicher Fallback für Sets ohne Artwork -->
						<div v-else class="image-placeholder">
							<img
								v-if="mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url"
								:src="mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url"
								alt="Fallback Image"
								class="fallback-image"
							>
						</div>
					</div>
					<div v-else class="related-item__image">
						<img
							v-if="
								getItemImage(item) &&
									getItemImage(item).asset &&
									getItemImage(item).asset.url
							"
							:src="getItemImage(item).asset.url"
							:alt="item?.title || ''"
						>
						<div v-else class="image-placeholder">
							<img
								v-if="mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url"
								:src="mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url"
								alt="Fallback Image"
								class="fallback-image"
							>
						</div>
					</div>
				</NuxtLink>

				<!-- Inhalt -->
				<div class="related-item__content">
					<!-- Interaktiver Bereich mit Datum und Play-Button -->
					<section
						v-if="type !== 'pool'"
						class="related-item__content__interactive"
					>
						<!-- Datum (falls vorhanden) -->
						<div
							v-if="
								item?.datetime ||
									item?.publishedAt ||
									item?._updatedAt ||
									item?._createdAt
							"
							class="related-item__date"
						>
							{{
								formatDate(
									item?.datetime ||
										item?.publishedAt ||
										item?._updatedAt ||
										item?._createdAt
								)
							}}
						</div>

						<!-- Play-Button für Sets -->
						<button
							v-if="type === 'sets' && item?.soundcloud"
							class="play-button"
							@click.prevent="playTrack(item)"
						>
							<span class="sr-only">Play</span>
							<svg
								width="9"
								height="12"
								viewBox="0 0 9 12"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path d="M9 6L0 11.1962L0 0.803847L9 6Z" fill="currentColor" />
							</svg>
						</button>
					</section>

					<!-- Show-Informationen für Sets -->
					<div
						v-if="item?.parentShow && type === 'sets'"
						class="related-item__content__show"
					>
						<!-- Show-Titel (nur anzeigen wenn NICHT no-show) -->
						<NuxtLink
							v-if="
								item?.parentShow?.title?.toLowerCase() !== 'no-show' &&
									item?.parentShow?.slug
							"
							:to="localePath(`/shows/${item?.parentShow?.slug.current}`)"
							class="related-item__link"
						>
							<h3 class="related-item__title show-title">
								{{ item?.parentShow?.title }}
							</h3>
						</NuxtLink>
						<!-- Wenn no-show: nur Set-Titel anzeigen -->
						<h3
							v-else-if="
								item?.parentShow?.title?.toLowerCase() === 'no-show' &&
									item?.title
							"
							class="related-item__title show-title"
						>
							{{ item?.title }}
						</h3>
						<!-- Fallback für andere Fälle -->
						<h3 v-else-if="item?.title" class="related-item__title show-title">
							{{ item?.title }}
						</h3>

						<!-- Künstler (für Sets) -->
						<div
							v-if="item?.persons && item?.persons.length > 0"
							class="show-artists"
						>
							<h3
								v-for="(artist, index) in item?.persons"
								:key="artist._id"
								class="related-item__artist"
							>
								<NuxtLink
									v-if="artist?.poolVisibility"
									:to="localePath(`/pool/${artist?.slug?.current}`)"
									class="related-item__link"
								>
									{{ artist?.title
									}}{{ index < item?.persons?.length - 1 ? "," : "" }}&nbsp;
								</NuxtLink>
								<span v-else>
									{{ artist.title
									}}{{ index < item?.persons?.length - 1 ? "," : "" }}&nbsp;
								</span>
							</h3>
						</div>
					</div>

					<!-- Titel für alle anderen Content-Typen -->
					<NuxtLink
						v-if="type !== 'sets'"
						:to="getItemRoute(item)"
						class="related-item__link"
					>
						<h3 class="related-item__title">
							{{ item?.title || item?.name }}
						</h3>
					</NuxtLink>
					<RichText
						v-if="item?.useTeaserText && item?.textTeaser"
						:blocks="parseI18nObj(item?.textTeaser)"
					/>
					<RichText
						v-else-if="
							!item?.useTeaserText && item?.text && item?.text.length > 0
						"
						:blocks="parseI18nObj(item?.text)?.slice(0, 1)"
					/>
					<RichText
						v-else-if="
							!item?.text &&
								item?.description &&
								item?.description.length > 0 &&
								(item?.description[0]?.value || item?.description[1]?.value)
						"
						:blocks="
							limitTextBlocks(parseI18nObj(item?.description)?.slice(0, 1), 100)
						"
					/>

					<!-- Nicht-City Tags anzeigen -->
					<div
						v-if="getItemNonCityTags(item).length > 0"
						class="related-item__tags tags"
					>
						<button
							v-for="tag in getItemNonCityTags(item)"
							:key="tag._id"
							class="tag clickable"
							@click.prevent="navigateToTagSearch(tag, item)"
						>
							{{ tag.title }}
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Load More Button -->
		<div v-if="hasMoreItems" class="related-content__load-more">
			<button class="load-more-button" @click="loadMoreItems">
				<svg
					width="15"
					height="15"
					viewBox="0 0 15 15"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M7.67578 0.541016V14.8113" stroke-width="5" />
					<path d="M14.8105 7.67578L0.540276 7.67578" stroke-width="5" />
				</svg>
			</button>
		</div>
	</div>
</template>
<style lang="postcss" scoped>
.page--article-detail {
  .related-content {
    margin: var(--mid-margin) 0 0;
  }
}

.related-content {
  width: 100%;
  max-width: var(--page-max-width);
  margin: var(--mid-margin) 0;

  &__title {
    font-size: var(--heading-font-size);
    margin-bottom: var(--mid-margin);
  }

  &__grid {
    min-width: calc(var(--page-max-width) + var(--big-margin));
    margin: 0 0 0 calc(var(--big-margin) * -0.5);
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: stretch;
    padding: 0 calc(var(--big-margin) / 2);
    gap: calc(var(--big-margin) / 2) calc(var(--big-margin) * 1.9875);
  }

  &__load-more {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--mid-margin);

    .load-more-button {
      display: flex;
      align-items: center;
      gap: var(--small-padding);
      padding: var(--small-padding) var(--big-padding);
      background-color: transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: var(--font-text-semibold);
      background-color: var(--color-bg);
      border-radius: 100px;

      &:hover {
        @media (min-width: 1024px) {
          color: var(--color-bg);
        }
      }

      svg {
        width: var(--base-font-size);
        height: var(--base-font-size);
      }

      .plus-icon {
        font-size: 1.2rem;
      }
    }
  }

  .related-item__content__show {
    min-height: calc(
      var(--base-font-size) * 1.15 + var(--base-font-size) + var(--mid-padding)
    );
  }

  .related-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    max-width: calc(100% / 3 - var(--big-margin) * 1.325);
    width: 100%;
    /* border-bottom: 0.09325rem solid var(--color-text); */
    padding: 0 0 calc(var(--big-margin) / 2) 0;

    &:last-of-type {
      justify-self: flex-start;
      margin: 0 auto 0 0;
    }

    /* Stellen Sie sicher, dass nach jedem dritten Item ein Zeilenumbruch erfolgt */
    &:nth-child(3n) {
      margin-right: 0;
    }

    &:nth-child(3n + 1):nth-last-child(-n + 3),
    &:nth-child(3n + 1):nth-last-child(-n + 3) ~ .related-item {
      margin-bottom: 0;
    }

    &__link {
      display: contents;
      text-decoration: none;
      color: inherit;
    }

    &__image {
      position: relative;
      overflow: hidden;
      width: 100%;

      img {
        width: 100%;
        height: auto;
        aspect-ratio: 1/1 !important;
        object-fit: cover;
        transition: transform 0.2s ease;
      }

      &:hover img {
        @media (min-width: 1024px) {
          transform: scale(1.05);
        }
      }

      .track-artwork-placeholder,
      .image-placeholder {
        width: 100%;
        aspect-ratio: 1/1;
        background-color: var(--color-grey);
      }
    }

    &__content {
      width: 100%;
      display: flex;
      flex-flow: column wrap;
      justify-content: flex-start;
      align-items: stretch;
      flex-grow: 1;
      margin: var(--mid-padding) 0 0 0;
      gap: var(--mid-padding);

      &__interactive {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .related-item__date {
          font-size: var(--small-font-size);
          text-transform: uppercase;
        }

        .play-button {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-left: auto;
          background-color: var(--color-text);
          border-radius: 100px;
          border: none;
          padding: 4px;
          width: calc(var(--base-font-size) + 4px);
          height: calc(var(--base-font-size) + 4px);

          svg {
            height: var(--base-font-size);
            transform: translate(1px, 0);
            path {
              fill: var(--color-bg);
            }
          }
        }
      }

      .related-item__title {
        font-size: var(--base-font-size);
        text-transform: uppercase;
        font-family: var(--font-text-semibold);
        margin: 0;
      }

      .related-item__artist {
        font-size: var(--base-font-size);
        text-transform: uppercase;
        font-family: var(--font-text-semibold);
        margin: 0;
      }

      .show-artists {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
        align-items: center;
        margin-bottom: var(--mid-padding);
      }

      .related-item__tags {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
        align-items: flex-start;
        align-content: flex-start;
        gap: var(--small-margin);
        flex-grow: 1;
      }
    }

    &__tags {
      &.city-tags {
        left: var(--small-margin);
        z-index: 2;
      }
    }
  }

  /* Content-Type Styling */
  &.sets,
  &.shows {
    .tag {
      &.city {
        background-color: var(--color-pink);
        color: var(--color-white);
      }
    }
    .play-button {
      &:hover {
        @media (min-width: 1024px) {
          background-color: var(--color-pink);
        }
      }
    }
  }

  &.words {
    .tag {
      &.city {
        background-color: var(--color-green);
        color: var(--color-white);
      }
    }
  }

  &.pool {
    .tag {
      &.city {
        background-color: var(--color-blue);
        color: var(--color-white);
      }
    }
    .related-content__grid {
      .related-item {
        &__image {
          position: relative;
          overflow: hidden;
          width: 100%;

          img {
            width: 100%;
            height: auto;
            aspect-ratio: 3/4 !important;
            object-fit: cover;
            transition: transform 0.2s ease;
          }

          &:hover img {
            @media (min-width: 1024px) {
              transform: scale(1.05);
            }
          }

          .track-artwork-placeholder,
          .image-placeholder {
            width: 100%;
            aspect-ratio: 1/1;
            background-color: var(--color-grey);
          }
        }
      }
    }
  }
}

/* Responsive Anpassungen */
@media (max-width: 900px) {
  .related-content {
    .related-item {
      max-width: 100%;
      width: 100%;

      /* Anpassungen für 2er-Grid */
      &:nth-child(3n) {
        margin-right: var(--small-margin);
      }

      &:nth-child(2n) {
        margin-right: 0;
      }

      &:nth-child(2n + 1):nth-last-child(-n + 2),
      &:nth-child(2n + 1):nth-last-child(-n + 2) ~ .related-item {
        margin-bottom: 0;
      }
    }
  }
}
</style>
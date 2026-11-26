<script setup lang="ts">
import { computed } from "vue";
import { useMainStore } from "~/stores/mainStore";
import type { Image, Tag } from "~~/types/sanity";

interface ProfileLink {
	_id?: string;
	_type?: string;
	title?: string;
	slug?: { current?: string };
	path?: string;
}

interface ProfileShow {
	_id?: string;
	_type?: string;
	title?: string;
	slug?: { current?: string };
	path?: string;
}

interface PoolItem {
	_id?: string;
	_type?: string;
	title?: string;
	name?: string;
	description?: unknown[];
	slug?: { current?: string };
	image?: Image;
	mainImage?: Image;
	location?: string;
	tags?: Tag[];
	cityTags?: Tag[];
	otherTags?: Tag[];
	contact?: string;
	socials?: Record<string, string>;
	shows?: ProfileShow[];
	persons?: ProfileLink[];
	venues?: ProfileLink[];
}

const props = defineProps<{
	poolItem: PoolItem;
}>();

const mainStore = useMainStore();
const { navigateToTagSearch } = useTagNavigation();

const fallbacks = computed(
	() =>
		mainStore?.siteFallbacks as
			| {
					fallbackPerson?: { image?: Image };
					fallbackVenue?: { image?: Image };
			  }
			| undefined,
);

const itemImage = computed<Record<string, unknown> | undefined>(() => {
	const image =
		props.poolItem?.image ||
		props.poolItem?.mainImage ||
		(props.poolItem?._type === "venue"
			? fallbacks.value?.fallbackVenue?.image
			: fallbacks.value?.fallbackPerson?.image);
	return (image as Record<string, unknown> | undefined) ?? undefined;
});

const itemTitle = computed(
	() => props.poolItem?.title || props.poolItem?.name || "",
);

const typeLabel = computed(() =>
	props.poolItem?._type === "venue" ? "Venue" : "Person",
);

const cityTags = computed(() => props.poolItem?.cityTags ?? []);
const otherTags = computed(() => props.poolItem?.otherTags ?? []);
const shows = computed(() => props.poolItem?.shows ?? []);
const persons = computed(() => props.poolItem?.persons ?? []);
const venues = computed(() => props.poolItem?.venues ?? []);

const descriptionBlocks = computed<unknown[] | undefined>(() => {
	const parsed = parseI18nObj(props.poolItem?.description);
	return Array.isArray(parsed) ? parsed : undefined;
});

const contactLink = computed(() => {
	const contact = props.poolItem?.contact;
	if (!contact) return "#";
	if (contact.includes("@")) return `mailto:${contact}`;
	if (/^\+?[0-9\s()-]+$/.test(contact))
		return `tel:${contact.replace(/\s/g, "")}`;
	return contact;
});

function tagLabel(tag: Tag): string {
	return getI18nLabel(tag.title);
}

function openTag(tag: Tag) {
	navigateToTagSearch(
		tag,
		props.poolItem as Parameters<typeof navigateToTagSearch>[1],
	);
}
</script>

<template>
	<article v-if="poolItem" class="pool-profile">
		<header class="pool-profile__top">
			<span class="pool-profile__tab">
				<span class="pool-profile__tab-dot" aria-hidden="true" />
				Pool / {{ typeLabel }}
			</span>
			<span class="pool-profile__index">Profile</span>
		</header>

		<div class="pool-profile__grid">
			<div class="pool-profile__content">
				<h1 class="pool-profile__name">{{ itemTitle }}</h1>

				<div
					v-if="cityTags.length || otherTags.length"
					class="tags pool-profile__tags"
				>
					<button
						v-for="tag in cityTags"
						:key="tag._id || String(tag.title)"
						type="button"
						class="tag pool-profile__tag pool-profile__tag--city"
						@click="openTag(tag)"
					>
						{{ tagLabel(tag) }}
					</button>
					<button
						v-for="tag in otherTags"
						:key="tag._id || String(tag.title)"
						type="button"
						class="tag pool-profile__tag"
						@click="openTag(tag)"
					>
						{{ tagLabel(tag) }}
					</button>
				</div>

				<dl class="pool-profile__fields">
					<div v-if="shows.length" class="pool-profile__field">
						<dt>Shows</dt>
						<dd class="pool-profile__shows">
							<ElementsContentLink
								v-for="show in shows"
								:key="show._id || show.title"
								:item="show"
								class="pool-profile__show"
							>
								<span class="pool-profile__play" aria-hidden="true" />
								{{ show.title }}
							</ElementsContentLink>
						</dd>
					</div>

					<div
						v-if="descriptionBlocks"
						class="pool-profile__field"
					>
						<dt>About</dt>
						<dd class="pool-profile__bio">
							<RichText :blocks="descriptionBlocks" />
						</dd>
					</div>

					<div v-if="persons.length" class="pool-profile__field">
						<dt>People</dt>
						<dd class="pool-profile__refs">
							<template
								v-for="person in persons"
								:key="person._id || person.title"
							>
								<ElementsContentLink
									v-if="person.path"
									:pool="person"
									class="pool-profile__ref"
								>
									{{ person.title }}
								</ElementsContentLink>
								<span v-else class="pool-profile__ref is-muted">
									{{ person.title }}
								</span>
							</template>
						</dd>
					</div>

					<div v-if="venues.length" class="pool-profile__field">
						<dt>Venues</dt>
						<dd class="pool-profile__refs">
							<ElementsContentLink
								v-for="venue in venues"
								:key="venue._id || venue.title"
								:item="venue"
								class="pool-profile__ref"
							>
								{{ venue.title }}
							</ElementsContentLink>
						</dd>
					</div>

					<div
						v-if="poolItem.socials || poolItem.contact"
						class="pool-profile__field"
					>
						<dt>Contact</dt>
						<dd>
							<IntroSocialLinks
								class="pool-profile__socials"
								:socials="poolItem.socials"
								:contact="poolItem.contact"
								:contact-href="contactLink"
							/>
						</dd>
					</div>
				</dl>
			</div>

			<figure class="pool-profile__photo">
				<MediaImage
					:image="itemImage"
					:alt="itemTitle"
					class="pool-profile__image"
					:eager="true"
				/>
			</figure>
		</div>
	</article>
</template>

<style lang="postcss" scoped>
.pool-profile {
  width: var(--page-max-width);
  max-width: 100%;
  margin: var(--big-margin) auto 0;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-text) 16%, transparent);
  border-radius: var(--radius-media);
  background: var(--color-bg);
  color: var(--color-text);
}

.pool-profile__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mid-padding);
  padding: 0.65rem 1rem;
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-text) 12%, transparent);
}

.pool-profile__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.7rem;
  border-radius: var(--radius-media);
  background: var(--color-blue);
  color: var(--color-white);
  font-family: var(--font-text-semibold);
  font-size: var(--text-xs);
  letter-spacing: var(--label-letter-spacing);
  text-transform: uppercase;
}

.pool-profile__tab-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--color-white);
  flex: none;
}

.pool-profile__index {
  font-family: var(--font-text-semibold);
  font-size: var(--text-xs);
  letter-spacing: var(--kicker-letter-spacing);
  color: color-mix(in srgb, var(--color-text) 40%, transparent);
  text-transform: uppercase;
}

.pool-profile__grid {
  display: grid;
  grid-template-columns: minmax(14rem, 0.65fr) minmax(0, 1.35fr);
  gap: var(--big-margin);
  align-items: start;
  padding: 1.25rem 1.5rem 1.5rem;
}

.pool-profile__content {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
}

.pool-profile__name {
  margin: 0;
  font-family: var(--font-text-semibold);
  font-size: clamp(2rem, 3.4vw, 3rem);
  line-height: 0.94;
  letter-spacing: -0.015em;
  text-transform: uppercase;
}

.pool-profile__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 1rem;
}

.pool-profile__tag {
  padding: calc(var(--small-padding) / 2) var(--small-padding);
  border: 1px solid
    color-mix(in srgb, var(--color-blue) 45%, transparent);
  border-radius: var(--radius-media);
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-text);
  font-size: var(--text-xs);
  line-height: 1.1;
  letter-spacing: var(--button-letter-spacing);
  text-transform: uppercase;
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast),
    background-color var(--transition-fast);

  &:hover {
    border-color: var(--color-blue);
    color: var(--color-blue);
  }
}

.pool-profile__tag--city {
  border-color: var(--color-blue);
  background: var(--color-blue);
  color: var(--color-white);

  &:hover {
    border-color: color-mix(in srgb, var(--color-blue) 82%, #000);
    background: color-mix(in srgb, var(--color-blue) 82%, #000);
    color: var(--color-white);
  }
}

.pool-profile__fields {
  margin: 1.35rem 0 0;
}

.pool-profile__field {
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr);
  gap: 1rem;
  padding: 0.85rem 0;
  border-top: 1px solid
    color-mix(in srgb, var(--color-text) 12%, transparent);

  dt {
    margin: 0;
    color: var(--color-blue);
    font-family: var(--font-text-semibold);
    font-size: var(--text-xs);
    letter-spacing: var(--label-letter-spacing);
    text-transform: uppercase;
  }

  dd {
    min-width: 0;
    margin: 0;
  }
}

.pool-profile__shows {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.pool-profile__show {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.55rem;
  border: 1px solid
    color-mix(in srgb, var(--color-text) 18%, transparent);
  border-radius: var(--radius-media);
  color: var(--color-text);
  font-family: var(--font-text-semibold);
  font-size: var(--text-xs);
  line-height: 1.1;
  text-decoration: none;
  text-transform: uppercase;
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast);

  &:hover {
    border-color: var(--color-blue);
    color: var(--color-blue);
  }
}

.pool-profile__play {
  position: relative;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
  background: var(--color-pink);
  flex: none;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-40%, -50%);
    border-top: 0.2rem solid transparent;
    border-bottom: 0.2rem solid transparent;
    border-left: 0.28rem solid var(--color-ink);
  }
}

.pool-profile__bio {
  max-width: 52ch;
  font-size: var(--text-lg);
  line-height: 1.55;
  color: color-mix(in srgb, var(--color-text) 72%, transparent);

  :deep(p) {
    margin: 0 0 var(--small-padding);
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }
}

.pool-profile__refs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.pool-profile__ref {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.55rem;
  border: 1px solid
    color-mix(in srgb, var(--color-text) 18%, transparent);
  border-radius: var(--radius-media);
  color: var(--color-text);
  font-family: var(--font-text-semibold);
  font-size: var(--text-xs);
  line-height: 1.1;
  text-decoration: none;
  text-transform: uppercase;

  &::before {
    content: "";
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 50%;
    background: var(--color-blue);
    flex: none;
  }

  &.is-muted {
    opacity: 0.55;

    &::before {
      background: var(--color-dark-grey);
    }
  }

  &:hover {
    border-color: var(--color-blue);
    color: var(--color-blue);
  }
}

.pool-profile__socials {
  margin-top: 0.1rem;
}

.pool-profile__photo {
  grid-column: 1;
  grid-row: 1;
  width: 100%;
  aspect-ratio: 3 / 4;
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-media);
  background: var(--color-grey);
}

.pool-profile__image,
.pool-profile__photo :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-media) !important;
}

@media screen and (max-width: 900px) {
  .pool-profile {
    margin-top: var(--base-margin);
  }

  .pool-profile__grid {
    grid-template-columns: 1fr;
    gap: var(--mid-padding);
  }

  .pool-profile__photo {
    order: -1;
    grid-column: auto;
    grid-row: auto;
    width: min(100%, 24rem);
    margin-inline: auto;
  }

  .pool-profile__content {
    grid-column: auto;
    grid-row: auto;
  }

  .pool-profile__name {
    font-size: clamp(1.7rem, 9vw, 2.5rem);
  }
}

@media screen and (max-width: 560px) {
  .pool-profile__field {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }
}
</style>

<script setup lang="ts">
import { computed } from "vue";
import { useMainStore } from "~/stores/mainStore";
import type { Image, Tag } from "~~/types/sanity";

interface PersonLink {
	_id?: string;
	_type?: string;
	title?: string;
	slug?: { current?: string };
	poolVisibility?: boolean;
}

interface VenueLink {
	_id?: string;
	_type?: string;
	title?: string;
	slug?: { current?: string };
}

interface ShowItem {
	_id?: string;
	_type?: string;
	title?: string;
	name?: string;
	content?: unknown[];
	slug?: { current?: string };
	image?: Image;
	mainImage?: Image;
	location?: string;
	tags?: Tag[];
	bio?: unknown[];
	socials?: Record<string, string>;
	contact?: string;
	persons?: PersonLink[];
	venues?: VenueLink[];
}

const props = defineProps<{
	showItem: ShowItem;
}>();

const mainStore = useMainStore();

const fallbacks = computed(
	() =>
		mainStore?.siteFallbacks as
			| {
					fallbackShow?: { image?: Image };
					fallbackPerson?: { image?: Image };
			  }
			| undefined,
);

const itemImage = computed<Record<string, unknown> | undefined>(() => {
	const image =
		props.showItem?.image ||
		props.showItem?.mainImage ||
		fallbacks.value?.fallbackShow?.image;
	return (image as Record<string, unknown> | undefined) ?? undefined;
});

const itemTitle = computed(
	() => props.showItem?.title || props.showItem?.name || "",
);

const titleClass = computed(() => {
	const length = itemTitle.value.length;
	return {
		"is-long": length > 20 && length <= 32,
		"is-very-long": length > 32,
	};
});

const cityTags = computed(() =>
	(props.showItem?.tags ?? []).filter((tag) => tag._type === "tag.city"),
);

const otherTags = computed(() =>
	(props.showItem?.tags ?? []).filter((tag) => tag._type !== "tag.city"),
);

const persons = computed(() => props.showItem?.persons ?? []);
const venues = computed(() => props.showItem?.venues ?? []);

const contactLink = computed(() => {
	const contact = props.showItem?.contact;
	if (!contact) return "#";
	if (contact.includes("@")) return `mailto:${contact}`;
	if (/^\+?[0-9\s()-]+$/.test(contact))
		return `tel:${contact.replace(/\s/g, "")}`;
	return contact;
});

function tagLabel(tag: Tag): string {
	return getI18nLabel(tag.title);
}
</script>

<template>
	<article v-if="showItem" class="show-project">
		<div class="show-project__poster">
			<figure class="show-project__media">
				<MediaImage
					:image="itemImage"
					:alt="itemTitle"
					class="show-project__image"
					:eager="true"
				/>
			</figure>

			<div class="show-project__titlecard">
				<p class="show-project__eyebrow">
					<span class="show-project__accent-dot" aria-hidden="true" />
					Show profile
					<template v-if="cityTags.length">
						<span class="show-project__sep" aria-hidden="true">·</span>
						{{ cityTags.map(tagLabel).join(" / ") }}
					</template>
				</p>

				<h1 class="show-project__title" :class="titleClass">
					{{ itemTitle }}
				</h1>

				<div v-if="otherTags.length" class="tags show-project__tags">
					<span
						v-for="tag in otherTags"
						:key="tag._id || String(tag.title)"
						class="tag show-project__tag"
					>
						{{ tagLabel(tag) }}
					</span>
				</div>
			</div>
		</div>

		<div class="show-project__body">
			<section v-if="showItem.content" class="show-project__about">
				<h2 class="show-project__label">About the show</h2>
				<RichText :blocks="showItem.content" class="show-project__rich" />
			</section>

			<aside class="show-project__aside">
				<section v-if="persons.length" class="show-project__section">
					<h2 class="show-project__label">Residents</h2>
					<div class="show-project__refs">
						<template
							v-for="person in persons"
							:key="person._id || person.title"
						>
							<ElementsContentLink
								v-if="person.poolVisibility"
								:pool="person"
								class="show-project__ref show-project__ref--person"
							>
								{{ person.title }}
							</ElementsContentLink>
							<span
								v-else
								class="show-project__ref show-project__ref--person show-project__ref--muted"
							>
								{{ person.title }}
							</span>
						</template>
					</div>
				</section>

				<section v-if="venues.length" class="show-project__section">
					<h2 class="show-project__label">Venues</h2>
					<div class="show-project__refs">
						<ElementsContentLink
							v-for="venue in venues"
							:key="venue._id || venue.title"
							:item="venue"
							class="show-project__ref show-project__ref--venue"
						>
							{{ venue.title }}
						</ElementsContentLink>
					</div>
				</section>

				<IntroSocialLinks
					v-if="showItem.socials || showItem.contact"
					class="show-project__socials"
					:socials="showItem.socials"
					:contact="showItem.contact"
					:contact-href="contactLink"
				/>
			</aside>
		</div>
	</article>
</template>

<style lang="postcss" scoped>
.show-project {
  position: relative;
  isolation: isolate;
  width: var(--page-max-width);
  max-width: 100%;
  margin: var(--big-margin) auto 0;
}

.show-project__poster {
  position: relative;
}

.show-project__media {
  width: 100%;
  aspect-ratio: 2.35 / 1;
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-media);
  background: var(--color-grey);
}

.show-project__image,
.show-project__media :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* A show is a broadcast identity, not a set spread: landscape banner with a
   pink title card instead of a floating headline and square cover. */
.show-project__titlecard {
  position: absolute;
  left: var(--base-margin);
  bottom: var(--base-margin);
  z-index: 1;
  max-width: min(62%, 46rem);
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius-media);
  background: var(--color-pink);
  color: var(--color-ink);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.18);
}

.show-project__eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  color: color-mix(in srgb, var(--color-ink) 68%, transparent);
  font-size: var(--text-sm);
  line-height: 1.2;
  letter-spacing: var(--button-letter-spacing);
  text-transform: uppercase;
}

.show-project__accent-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--color-ink);
  flex: none;
}

.show-project__sep {
  opacity: 0.4;
}

.show-project__title {
  margin: 0.5rem 0 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  color: var(--color-ink);
  font-family: var(--font-text-semibold);
  font-weight: 500;
  font-size: clamp(2.2rem, 5.6vw, 4.2rem);
  line-height: 0.92;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  text-wrap: balance;

  &.is-long {
    font-size: clamp(1.9rem, 4.2vw, 3.2rem);
  }

  &.is-very-long {
    font-size: clamp(1.6rem, 3.2vw, 2.5rem);
  }
}

.show-project__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.75rem;
}

.show-project__tag {
  padding: calc(var(--small-padding) / 2) var(--small-padding);
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-media);
  background: var(--color-ink);
  color: var(--color-white);
  font-size: var(--text-xs);
  line-height: 1.1;
  letter-spacing: var(--button-letter-spacing);
  text-transform: uppercase;
}

.show-project__body {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(15rem, 0.75fr);
  gap: var(--big-margin);
  align-items: start;
  margin-top: var(--base-margin);
}

.show-project__about {
  min-width: 0;
}

.show-project__aside {
  display: flex;
  flex-direction: column;
  gap: var(--base-margin);
  min-width: 0;
}

.show-project__section {
  width: 100%;
}

.show-project__label {
  margin: 0 0 var(--mid-padding);
  font-family: var(--font-text-semibold);
  font-weight: 500;
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: var(--button-letter-spacing);
  opacity: 0.6;
}

.show-project__rich {
  :deep(p) {
    margin: 0 0 var(--mid-padding);
    font-size: var(--text-md);
    line-height: 1.6;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }
}

.show-project__refs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.show-project__ref {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  border: 1px solid color-mix(in srgb, var(--color-text) 20%, transparent);
  border-radius: var(--radius-media);
  color: var(--color-text);
  font-family: var(--font-text-semibold);
  font-size: var(--text-sm);
  line-height: 1.1;
  text-transform: uppercase;
  text-decoration: none;
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast);

  &::before {
    content: "";
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 50%;
    background: var(--color-blue);
    flex: none;
  }

  &--venue::before {
    background: var(--color-pink);
  }

  &--muted {
    opacity: 0.55;

    &::before {
      background: var(--color-dark-grey);
    }
  }

  &:hover {
    border-color: var(--color-pink);
    color: var(--color-pink);
  }
}

.show-project__socials {
  margin-top: var(--small-padding);
}

@media screen and (max-width: 900px) {
  .show-project {
    margin-top: var(--base-margin);
  }

  .show-project__media {
    aspect-ratio: 16 / 9;
  }

  .show-project__titlecard {
    position: relative;
    left: auto;
    bottom: auto;
    max-width: none;
    margin: -2rem var(--mid-padding) 0;
    padding: 1rem 1.25rem;
  }

  .show-project__title {
    font-size: clamp(2rem, 10vw, 3.2rem);
  }

  .show-project__body {
    grid-template-columns: 1fr;
    gap: var(--base-margin);
    margin-top: var(--base-margin);
  }
}
</style>

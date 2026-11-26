<script setup lang="ts">
import { computed } from "vue";

type LabTag = {
	_id?: string;
	_type?: string;
	title?: string | Array<{ value?: string }> | null;
	short?: string;
};

type LabProfile = {
	_id?: string;
	_type?: string;
	name?: string;
	title?: string;
	image?: Record<string, unknown>;
	tags?: LabTag[];
	description?: unknown;
	textTeaser?: unknown;
	text?: unknown;
	useTeaserText?: boolean;
	location?: string;
};

const props = withDefaults(
	defineProps<{
		profile?: LabProfile | null;
		variant: "card" | "sheet";
		index?: string;
	}>(),
	{
		index: "P-01",
	},
);

const displayName = computed(
	() => props.profile?.name || props.profile?.title || "Pool profile",
);

const typeLabel = computed(() =>
	props.profile?._type === "venue" ? "Venue" : "Person",
);

const cityTag = computed(() =>
	props.profile?.tags?.find((tag) => tag._type === "tag.city"),
);

const roleTags = computed(
	() => props.profile?.tags?.filter((tag) => tag._type !== "tag.city") ?? [],
);

function tagLabel(tag: LabTag): string {
	return getI18nLabel(tag.title);
}

function tagHref(tag: LabTag): string {
	return `/search?q=${encodeURIComponent(tagLabel(tag))}&type=pool`;
}

function richTextToPlain(value: unknown): string {
	const parsed = parseI18nObj(value as never) ?? value;
	if (typeof parsed === "string") return parsed;
	if (!Array.isArray(parsed)) return "";
	return parsed
		.map((block: unknown) => {
			const children = (block as { children?: Array<{ text?: string }> })
				?.children;
			return (children ?? []).map((child) => child.text ?? "").join("");
		})
		.filter(Boolean)
		.join(" ")
		.replace(/\s+/g, " ")
		.trim();
}

const bioText = computed(() => {
	const source = props.profile?.useTeaserText
		? props.profile?.textTeaser
		: props.profile?.description;
	return (
		richTextToPlain(source) ||
		richTextToPlain(props.profile?.text) ||
		richTextToPlain(props.profile?.textTeaser)
	);
});

// Sample rows: the cover-flow payload has the portrait/tags/bio, not the
// profile's show and contact references. The lab is about layout, not data.
const sampleShows = [
	{ title: "Rice & Beans", href: "/shows/rice-and-beans" },
	{ title: "Bamme Morning Show", href: "/shows/baemme-morning-show" },
];
const sampleSocials = {
	instagram: "#",
	soundcloud: "#",
	web: "#",
};
</script>

<template>
	<article v-if="profile" class="pool-variant" :class="`pool-variant--${variant}`">
		<template v-if="variant === 'card'">
			<header class="pool-card__top">
				<span class="pool-card__tab">
					<span class="pool-card__tab-dot" aria-hidden="true" />
					Pool / {{ typeLabel }}
				</span>
				<span class="pool-card__index">{{ index }}</span>
			</header>

			<div class="pool-card__grid">
				<div class="pool-card__content">
					<h3 class="pool-card__name">{{ displayName }}</h3>

					<div class="pool-card__tags">
						<a
							v-if="cityTag"
							:href="tagHref(cityTag)"
							class="tag pool-card__tag pool-card__tag--city"
						>
							{{ tagLabel(cityTag) }}
						</a>
						<a
							v-for="tag in roleTags"
							:key="tag._id || String(tag.title)"
							:href="tagHref(tag)"
							class="tag pool-card__tag"
						>
							{{ tagLabel(tag) }}
						</a>
					</div>

					<dl class="pool-card__fields">
						<div class="pool-card__field">
							<dt>Shows</dt>
							<dd class="pool-card__shows">
								<a
									v-for="show in sampleShows"
									:key="show.href"
									:href="show.href"
									class="pool-card__show"
								>
									<span class="pool-card__play" aria-hidden="true" />
									{{ show.title }}
								</a>
							</dd>
						</div>

						<div class="pool-card__field">
							<dt>About</dt>
							<dd class="pool-card__bio">{{ bioText }}</dd>
						</div>

						<div class="pool-card__field">
							<dt>Contact</dt>
							<dd>
								<IntroSocialLinks
									class="pool-card__socials"
									:socials="sampleSocials"
								/>
							</dd>
						</div>
					</dl>
				</div>

				<figure class="pool-card__photo">
					<MediaImage
						:image="profile.image"
						:alt="displayName"
						class="pool-card__image"
						:eager="true"
					/>
				</figure>
			</div>
		</template>

		<template v-else>
			<header class="pool-sheet__header">
				<div class="pool-sheet__heading">
					<span class="pool-sheet__kicker">Pool / {{ typeLabel }}</span>
					<h3 class="pool-sheet__name">{{ displayName }}</h3>
				</div>
				<span class="pool-sheet__index">{{ index }}</span>
			</header>

			<div class="pool-sheet__main">
				<figure class="pool-sheet__photo">
					<MediaImage
						:image="profile.image"
						:alt="displayName"
						class="pool-sheet__image"
						:eager="true"
					/>
				</figure>

				<div class="pool-sheet__fields">
					<div class="pool-sheet__field">
						<span>City</span>
						<strong>
							<a
								v-if="cityTag"
								:href="tagHref(cityTag)"
								class="pool-sheet__tag-link"
							>
								{{ tagLabel(cityTag) }}
							</a>
							<span v-else>—</span>
						</strong>
					</div>
					<div class="pool-sheet__field">
						<span>Roles</span>
						<strong>
							<span
								v-if="roleTags.length"
								class="pool-sheet__tag-links"
							>
								<a
									v-for="tag in roleTags"
									:key="tag._id || String(tag.title)"
									:href="tagHref(tag)"
									class="pool-sheet__tag-link"
								>
									{{ tagLabel(tag) }}
								</a>
							</span>
							<span v-else>—</span>
						</strong>
					</div>
					<div class="pool-sheet__field pool-sheet__field--wide">
						<span>Shows</span>
						<div class="pool-sheet__shows">
							<a
								v-for="show in sampleShows"
								:key="show.href"
								:href="show.href"
								class="pool-sheet__show"
							>
								<span class="pool-sheet__play" aria-hidden="true" />
								{{ show.title }}
							</a>
						</div>
					</div>
					<div class="pool-sheet__field">
						<span>Contact</span>
						<IntroSocialLinks
							class="pool-sheet__socials"
							:socials="sampleSocials"
						/>
					</div>
				</div>
			</div>

			<div class="pool-sheet__about">
				<span class="pool-sheet__about-label">About</span>
				<p>{{ bioText }}</p>
			</div>
		</template>
	</article>
</template>

<style lang="postcss" scoped>
.pool-variant {
  position: relative;
  width: 100%;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-text) 16%, transparent);
  border-radius: var(--radius-media);
  background: var(--color-bg);
  color: var(--color-text);
}

/* ------------------------------------------------------------- variant A */

.pool-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mid-padding);
  padding: 0.65rem 1rem;
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-text) 12%, transparent);
}

.pool-card__tab {
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

.pool-card__tab-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--color-white);
  flex: none;
}

.pool-card__index {
  font-family: var(--font-text-semibold);
  font-size: var(--text-xs);
  letter-spacing: var(--kicker-letter-spacing);
  color: color-mix(in srgb, var(--color-text) 40%, transparent);
}

.pool-card__grid {
  display: grid;
  grid-template-columns: minmax(12rem, 0.65fr) minmax(0, 1.35fr);
  gap: var(--big-margin);
  align-items: stretch;
  padding: 1.25rem 1.5rem 1.5rem;
}

.pool-card__content {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
}

.pool-card__name {
  margin: 0;
  font-family: var(--font-text-semibold);
  font-size: clamp(1.9rem, 3.4vw, 3rem);
  font-weight: 500;
  line-height: 0.94;
  letter-spacing: -0.015em;
  text-transform: uppercase;
}

.pool-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 1rem;
}

.pool-card__tag {
  padding: calc(var(--small-padding) / 2) var(--small-padding);
  border: 1px solid color-mix(in srgb, var(--color-blue) 45%, transparent);
  border-radius: var(--radius-media);
  background: transparent;
  color: var(--color-text);
  font-size: var(--text-xs);
  line-height: 1.1;
  letter-spacing: var(--button-letter-spacing);
  text-transform: uppercase;
  text-decoration: none;

  &:hover {
    border-color: var(--color-blue);
    color: var(--color-blue);
  }
}

.pool-card__tag--city {
  border-color: var(--color-blue);
  background: var(--color-blue);
  color: var(--color-white);

  &:hover {
    border-color: color-mix(in srgb, var(--color-blue) 82%, #000);
    background: color-mix(in srgb, var(--color-blue) 82%, #000);
    color: var(--color-white);
  }
}

.pool-card__fields {
  margin: 1.35rem 0 0;
}

.pool-card__field {
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
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

.pool-card__shows {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.pool-card__show {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.55rem;
  border: 1px solid
    color-mix(in srgb, var(--color-text) 18%, transparent);
  border-radius: var(--radius-media);
  color: inherit;
  font-family: var(--font-text-semibold);
  font-size: var(--text-xs);
  line-height: 1.1;
  text-decoration: none;
  text-transform: uppercase;

  &:hover {
    border-color: var(--color-blue);
    color: var(--color-blue);
  }
}

.pool-card__play,
.pool-sheet__play {
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

.pool-card__bio {
  display: -webkit-box;
  max-width: 52ch;
  overflow: hidden;
  font-size: var(--text-lg);
  line-height: 1.55;
  color: color-mix(in srgb, var(--color-text) 72%, transparent);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
}

.pool-card__socials {
  margin-top: 0.1rem;
}

.pool-card__photo {
  grid-column: 1;
  grid-row: 1;
  min-height: 100%;
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-media);
  background: var(--color-grey);
  aspect-ratio: 3 / 4;
}

.pool-card__image,
.pool-card__photo :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-media) !important;
}

/* ------------------------------------------------------------- variant C */

.pool-sheet__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--mid-padding);
  padding: 1.25rem 1.5rem;
  background: var(--color-blue);
  color: var(--color-white);
}

.pool-sheet__heading {
  min-width: 0;
}

.pool-sheet__kicker {
  display: block;
  margin-bottom: 0.45rem;
  font-family: var(--font-text-semibold);
  font-size: var(--text-xs);
  letter-spacing: var(--kicker-letter-spacing);
  text-transform: uppercase;
  opacity: 0.7;
}

.pool-sheet__name {
  margin: 0;
  font-family: var(--font-text-semibold);
  font-size: clamp(1.9rem, 3.2vw, 2.9rem);
  font-weight: 500;
  line-height: 0.94;
  letter-spacing: -0.015em;
  text-transform: uppercase;
}

.pool-sheet__index {
  font-family: var(--font-text-semibold);
  font-size: var(--text-xs);
  letter-spacing: var(--kicker-letter-spacing);
  opacity: 0.6;
  flex: none;
}

.pool-sheet__main {
  display: grid;
  grid-template-columns: minmax(11rem, 0.5fr) minmax(0, 1fr);
  gap: var(--big-margin);
  align-items: stretch;
  padding: 1.5rem;
}

.pool-sheet__photo {
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-media);
  background: var(--color-grey);
  aspect-ratio: 3 / 4;
}

.pool-sheet__image,
.pool-sheet__photo :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-media) !important;
}

.pool-sheet__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
  gap: 0;
}

.pool-sheet__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  padding: 0.8rem 0;
  border-top: 1px solid
    color-mix(in srgb, var(--color-text) 12%, transparent);

  > span {
    color: var(--color-blue);
    font-family: var(--font-text-semibold);
    font-size: var(--text-xs);
    letter-spacing: var(--label-letter-spacing);
    text-transform: uppercase;
  }

  strong {
    font-family: var(--font-text-semibold);
    font-size: var(--text-sm);
    font-weight: 500;
    text-transform: uppercase;
  }

  &--wide {
    grid-column: span 2;
  }
}

.pool-sheet__shows {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.pool-sheet__tag-links {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.5rem;
}

.pool-sheet__tag-link {
  color: inherit;
  text-decoration: none;

  &:hover {
    color: var(--color-blue);
  }
}

.pool-sheet__show {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.55rem;
  border: 1px solid
    color-mix(in srgb, var(--color-text) 18%, transparent);
  border-radius: var(--radius-media);
  color: inherit;
  font-family: var(--font-text-semibold);
  font-size: var(--text-xs);
  line-height: 1.1;
  text-decoration: none;
  text-transform: uppercase;

  &:hover {
    border-color: var(--color-blue);
    color: var(--color-blue);
  }
}

.pool-sheet__socials {
  margin-top: 0.1rem;
}

.pool-sheet__about {
  padding: 1.2rem 1.5rem 1.5rem;
  border-top: 1px solid
    color-mix(in srgb, var(--color-text) 12%, transparent);

  p {
    max-width: 78ch;
    margin: 0;
    font-size: var(--text-md);
    line-height: 1.55;
    color: color-mix(in srgb, var(--color-text) 72%, transparent);
  }
}

.pool-sheet__about-label {
  display: block;
  margin-bottom: 0.55rem;
  color: var(--color-blue);
  font-family: var(--font-text-semibold);
  font-size: var(--text-xs);
  letter-spacing: var(--label-letter-spacing);
  text-transform: uppercase;
}

@media screen and (max-width: 900px) {
  .pool-card__grid,
  .pool-sheet__main {
    grid-template-columns: 1fr;
    gap: var(--mid-padding);
  }

  .pool-card__photo,
  .pool-sheet__photo {
    order: -1;
    grid-column: auto;
    grid-row: auto;
    width: min(100%, 24rem);
    margin-inline: auto;
  }

  .pool-card__content {
    grid-column: auto;
    grid-row: auto;
  }

  .pool-card__name,
  .pool-sheet__name {
    font-size: clamp(1.7rem, 9vw, 2.5rem);
  }

  .pool-sheet__fields {
    grid-template-columns: 1fr;
  }

  .pool-sheet__field--wide {
    grid-column: auto;
  }
}

@media screen and (max-width: 560px) {
  .pool-card__field {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }
}
</style>

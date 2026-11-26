<script setup lang="ts">
import { computed } from "vue";

// biome-ignore lint/suspicious/noExplicitAny: design lab prototypes read loose Sanity docs
type LabItem = Record<string, any>;
type I18nLabel = Parameters<typeof getI18nLabel>[0];
type LabTag = { _id?: string; _type?: string; title?: I18nLabel };

const props = withDefaults(
	defineProps<{
		item: LabItem;
		page: "shows" | "pool" | "words";
		variant?: "stack" | "column" | "split" | "band" | "cover" | "overlay";
		index?: string;
	}>(),
	{
		variant: "stack",
		index: "",
	},
);

defineEmits<{
	play: [];
	read: [];
	open: [];
}>();

const itemTags = computed<LabTag[]>(() =>
	Array.isArray(props.item?.tags) ? props.item.tags : [],
);

const cityTags = computed(() =>
	itemTags.value.filter((tag) => tag._type === "tag.city"),
);

const otherTags = computed(() =>
	itemTags.value.filter((tag) => tag._type !== "tag.city"),
);

const visibleTags = computed(() => {
	if (props.page === "pool") return otherTags.value.slice(0, 3);
	return itemTags.value.slice(0, 3);
});

const title = computed(() => {
	const item = props.item;
	if (props.page === "shows") {
		const showTitle =
			item?.parentShow?.title && item.parentShow.title !== "No Show"
				? item.parentShow.title
				: "";
		return showTitle || item?.title || "Untitled set";
	}
	if (props.page === "pool") {
		return item?.title || item?.name || "Untitled";
	}
	return item?.title || "Untitled article";
});

const eyebrow = computed(() => {
	const item = props.item;
	if (props.page === "pool") {
		return item?._type === "person" ? "Person" : "Venue";
	}
	const date = item?.datetime || item?._updatedAt;
	return date ? formatDate(date) : "";
});

const meta = computed(() => {
	const item = props.item;
	if (props.page === "shows") {
		const people = Array.isArray(item?.persons)
			? item.persons
					.map((person: { title?: string }) => person?.title)
					.filter(Boolean)
			: [];
		return people.join(", ");
	}
	if (props.page === "pool") {
		const city = cityTags.value[0]?.title;
		return city ? getI18nLabel(city) : item?.location || "";
	}
	return "";
});

const teaserSource = computed(() => {
	const item = props.item;
	if (Array.isArray(item?.textTeaser) && item.textTeaser.length) {
		return item.textTeaser;
	}
	if (Array.isArray(item?.text) && item.text.length) {
		return item.text;
	}
	if (Array.isArray(item?.description) && item.description.length) {
		return item.description;
	}
	return [];
});

const teaserBlocks = computed(() => {
	if (!teaserSource.value.length) return [];
	const parsed = parseI18nObj(teaserSource.value);
	if (!Array.isArray(parsed)) return [];
	return limitTextBlocksByWords(parsed, props.page === "pool" ? 22 : 34);
});
</script>

<template>
	<div class="lab-caption" :class="`lab-caption--${variant}`">
		<div class="lab-caption__head">
			<span class="lab-caption__eyebrow">{{ eyebrow }}</span>
			<span v-if="index" class="lab-caption__index">{{ index }}</span>
		</div>

		<h3 class="lab-caption__title">{{ title }}</h3>
		<p v-if="meta" class="lab-caption__meta">{{ meta }}</p>

		<div v-if="visibleTags.length" class="lab-caption__tags tags">
			<span
				v-for="tag in visibleTags"
				:key="tag._id || String(tag.title)"
				class="tag"
			>
				{{ getI18nLabel(tag.title) }}
			</span>
		</div>

		<div v-if="teaserBlocks.length" class="lab-caption__teaser">
			<RichText :blocks="teaserBlocks" />
		</div>

		<div class="lab-caption__actions">
			<button
				v-if="page === 'shows'"
				type="button"
				class="lab-caption__action lab-caption__action--play"
				aria-label="Play set"
				@click="$emit('play')"
			>
				<svg
					class="lab-caption__play-icon"
					viewBox="0 0 65 65"
					aria-hidden="true"
				>
					<circle
						class="lab-caption__play-disc"
						cx="32.17"
						cy="32.17"
						r="32.17"
					/>
					<path
						class="lab-caption__play-triangle"
						d="M50.56 32.17L22.98 48.09V16.25L50.56 32.17Z"
					/>
				</svg>
			</button>
			<button
				v-if="page === 'shows'"
				type="button"
				class="lab-caption__action lab-caption__action--open"
				@click="$emit('open')"
			>
				Open set
				<span aria-hidden="true">→</span>
			</button>
			<button
				v-if="page === 'pool'"
				type="button"
				class="lab-caption__action lab-caption__action--open"
				@click="$emit('open')"
			>
				More
				<span aria-hidden="true">→</span>
			</button>
			<button
				v-if="page === 'words'"
				type="button"
				class="lab-caption__action lab-caption__action--read"
				@click="$emit('read')"
			>
				Read more
				<span aria-hidden="true">→</span>
			</button>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.lab-caption {
  --lab-caption-gap: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: var(--lab-caption-gap);
  width: 100%;
  color: var(--color-text);
  text-align: left;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--mid-padding);
    font-size: var(--text-s);
    line-height: 1.1;
    text-transform: uppercase;
    letter-spacing: var(--button-letter-spacing);
  }

  &__eyebrow {
    color: var(--color-dark-grey);
  }

  &__index {
    font-variant-numeric: tabular-nums;
    color: var(--accent, var(--color-text));
  }

  &__title {
    margin: 0;
    font-family: var(--font-text-semibold);
    font-size: var(--text-l);
    line-height: 1.08;
    text-transform: uppercase;
    letter-spacing: 0.01em;
    text-wrap: balance;
  }

  &__meta {
    margin: 0;
    font-size: var(--text-s);
    line-height: 1.25;
    text-transform: uppercase;
    letter-spacing: var(--button-letter-spacing);
    color: var(--color-dark-grey);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--small-padding);

    .tag {
      font-size: var(--text-s);
      padding: calc(var(--small-padding) / 2) var(--small-padding);
    }
  }

  &__teaser {
    margin: 0;
    max-width: 44ch;
    font-size: var(--text-s);
    line-height: 1.45;
    color: var(--color-text);

    :deep(p),
    :deep(.rich-text),
    :deep(span) {
      margin: 0;
      font-size: inherit;
      line-height: inherit;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--small-padding);
    margin-top: 0.25rem;
  }

  &__action {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    width: fit-content;
    padding: 0.45rem 0.8rem;
    border: 1px solid
      color-mix(in srgb, var(--color-text) 22%, transparent);
    border-radius: var(--radius-media);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-text-medium);
    font-size: var(--text-s);
    text-transform: uppercase;
    letter-spacing: var(--button-letter-spacing);
    cursor: pointer;
    transition:
      color var(--transition-fast),
      border-color var(--transition-fast),
      background-color var(--transition-fast);

    &:hover {
      border-color: var(--accent, var(--color-text));
      color: var(--accent, var(--color-text));
    }

    &:focus-visible {
      outline: 2px solid var(--accent, var(--color-text));
      outline-offset: 2px;
    }

    &--play {
      border-color: var(--accent, var(--color-text));
    }
  }

  &__play-icon {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  &__play-disc {
    fill: var(--color-grey);
  }

  &__play-triangle {
    fill: var(--color-bg);
  }

  &__action--play {
    justify-content: center;
    width: 2.6rem;
    height: 2.6rem;
    padding: 0;
    border: 0;
    border-radius: 50%;

    &:hover {
      border: 0;
      background: transparent;
      transform: scale(1.06);
    }
  }

  &--stack {
    padding-top: 0.7rem;
  }

  &--column {
    justify-content: flex-start;
    max-width: 25rem;
    padding-left: var(--mid-padding);
    border-left: 1px solid
      color-mix(in srgb, var(--color-text) 14%, transparent);
  }

  &--split {
    justify-content: center;
    height: 100%;
    padding-left: var(--mid-margin);
    border-left: 1px solid
      color-mix(in srgb, var(--color-text) 14%, transparent);
  }

  &--band {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
    grid-template-areas:
      "head head"
      "title teaser"
      "tags teaser"
      "actions actions";
    grid-template-rows: auto auto auto 1fr;
    column-gap: var(--big-margin);
    row-gap: var(--small-padding);
    min-height: var(--lab-band-min-height, 9.5rem);
    padding-top: var(--mid-padding);

    .lab-caption__head {
      grid-area: head;
    }

    .lab-caption__title {
      grid-area: title;
    }

    .lab-caption__meta {
      grid-area: meta;
    }

    .lab-caption__tags {
      grid-area: tags;
      justify-content: flex-start;
      align-self: start;
    }

    .lab-caption__teaser {
      grid-area: teaser;
      max-width: 38ch;
    }

    .lab-caption__actions {
      grid-area: actions;
      align-self: end;
    }
  }

  &--cover {
    justify-content: center;
    height: 100%;
    padding-left: var(--base-margin);
    border-left: 1px solid
      color-mix(in srgb, var(--color-text) 18%, transparent);  }

  &--overlay {
    width: min(22rem, 86%);
    padding: var(--mid-padding);
    border: 1px solid
      color-mix(in srgb, var(--color-text) 18%, transparent);
    border-radius: var(--radius-media);
    background-color: var(--color-bg);
    box-shadow: 0 1rem 2.5rem rgba(0, 0, 0, 0.16);
  }

  @media screen and (max-width: 900px) {
    --lab-caption-gap: 0.4rem;

    &__teaser :deep(p) {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    &--band {
      display: flex;
      gap: var(--small-padding);
    }

    &--cover,
    &--split {
      height: auto;
      padding-left: 0;
      padding-top: var(--small-padding);
      border-left: none;
    }

    &--column {
      max-width: none;
      padding-left: 0;
      border-left: none;
    }

    &--overlay {
      width: 100%;
      max-width: none;
    }
  }
}
</style>

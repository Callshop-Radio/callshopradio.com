<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import labelData from "~/data/label-index/labels.json";
import type { Label } from "~/data/label-index/types";

const labels = labelData as Label[];
const { locale } = useI18n();
const localePath = useLocalePath();

// Start with a deterministic set for SSR/hydration, then replace it with a
// fresh random sample after mount. This keeps the markup stable during
// hydration while showing different labels on every visit.
const featured = ref<Label[]>(labels.slice(0, 8));

function sampleLabels(source: Label[], count: number) {
	const list = [...source];
	for (let index = list.length - 1; index > 0; index -= 1) {
		const swap = Math.floor(Math.random() * (index + 1));
		const current = list[index];
		const other = list[swap];
		if (current && other) {
			list[index] = other;
			list[swap] = current;
		}
	}
	return list.slice(0, count);
}

onMounted(() => {
	featured.value = sampleLabels(labels, 8);
});

const copy = computed(() => {
	const de = locale.value === "de";
	return {
		eyebrow: "Index",
		title: de ? "Unabhängiges Label-Archiv" : "Independent label archive",
		text: de
			? `${labels.length} Labels aus der deutschen House- und Techno-Szene — gegründet, verortet, dokumentiert.`
			: `${labels.length} labels from the German house and techno scene — founded, located and documented.`,
		cta: de ? "Zum Index" : "Browse the Index",
	};
});
</script>

<template>
	<section class="index-teaser" aria-labelledby="index-teaser-title">
		<div class="index-teaser__copy">
			<p class="index-teaser__eyebrow">{{ copy.eyebrow }}</p>
			<h2 id="index-teaser-title" class="index-teaser__title">
				{{ copy.title }}
			</h2>
			<p class="index-teaser__text">{{ copy.text }}</p>
			<NuxtLink :to="localePath('/index')" class="index-teaser__cta">
				{{ copy.cta }}
				<span aria-hidden="true">→</span>
			</NuxtLink>
		</div>

		<ul class="index-teaser__logos" aria-label="Featured labels">
			<li v-for="label in featured" :key="label.slug">
				<NuxtLink
					:to="{
						path: localePath('/index'),
						query: { label: label.slug },
					}"
					class="index-teaser__logo"
					:aria-label="`Open ${label.name} in the Index`"
				>
					<img
						:src="label.logo"
						alt=""
						:width="label.logoWidth"
						:height="label.logoHeight"
						decoding="sync"
					/>
				</NuxtLink>
			</li>
		</ul>
	</section>
</template>

<style lang="postcss" scoped>
.index-teaser {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  align-items: center;
  gap: clamp(2rem, 5vw, 5rem);
  width: 100%;
  max-width: var(--page-max-width);
  margin: clamp(3rem, 7vw, 6rem) auto clamp(4rem, 10vw, 8rem);
  padding: clamp(2rem, 5vw, 3.5rem) 0 clamp(2.5rem, 5vw, 4rem);
  border-top: 1px solid
    color-mix(in srgb, var(--color-text) 16%, transparent);
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-text) 16%, transparent);
}

.index-teaser__copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  /* The teaser reads as artwork, not copy: dragging over it must not leave a
     blue text selection on the landing page. */
  -webkit-user-select: none;
  user-select: none;
}

.index-teaser__eyebrow {
  margin: 0;
  color: var(--color-purple);
  font-size: var(--small-font-size);
  letter-spacing: var(--menu-letter-spacing);
  text-transform: uppercase;
}

.index-teaser__title {
  margin: 0;
  font-family: var(--font-text-medium);
  font-size: var(--h2-size);
  font-weight: 550;
  line-height: 1.1;
  text-transform: uppercase;
}

.index-teaser__text {
  max-width: 46ch;
  margin: 0;
  font-size: var(--base-font-size);
  line-height: 1.5;
}

.index-teaser__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.5rem;
  padding: 0.45rem 0.9rem;
  border: 1px solid
    color-mix(in srgb, var(--color-text) 22%, transparent);
  border-radius: var(--pill-radius);
  color: var(--color-text);
  font-family: var(--font-text-medium);
  font-size: var(--small-font-size);
  letter-spacing: var(--button-letter-spacing);
  text-decoration: none;
  text-transform: uppercase;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background-color var(--transition-fast);

  &:hover {
    border-color: var(--color-purple);
    color: var(--color-purple);
  }

  &:focus-visible {
    outline: 2px solid var(--color-purple);
    outline-offset: 2px;
  }
}

.index-teaser__logos {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(0.4rem, 1vw, 0.75rem);
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    padding: 18%;
    border: 1px solid
      color-mix(in srgb, var(--color-text) 14%, transparent);
    border-radius: var(--radius-media);
    background-color: #fff;
    transition: border-color var(--transition-fast);

    &:hover {
      border-color: var(--color-purple);
    }
  }

  a {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: var(--radius-xs);
  }

  a:focus-visible {
    outline: 2px solid var(--color-purple);
    outline-offset: 2px;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

@media screen and (max-width: 900px) {
  .index-teaser {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.75rem;
  }
}
</style>

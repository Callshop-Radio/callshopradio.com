<script setup>
import { computed } from "vue";
import { WORDS_QUERY } from "~~/queries/sanity.queries.ts";

definePageMeta({
	bodyClass: "words-archive",
});

const query = groq`${WORDS_QUERY}`;
const { data } = await useCachedSanityQuery(query);

function hasTeaserText(article) {
	return Boolean(article?.useTeaserText && article?.textTeaser?.length);
}

const slider = computed(() => data.value?.slider);
const { featured: featuredArticles } = await useCoverFlowSliderItems(
	slider,
	"articles",
	{
		contentType: "articles",
		filter: hasTeaserText,
	},
);

usePageSeo(data?.value?.seo);
</script>

<template>
	<div class="words">
		<SiteArchiveMasthead
			title="Words"
			lede="Essays, interviews and writing from the community."
			accent="var(--color-green)"
		/>
		<section v-if="featuredArticles.length > 0" class="intro-section">
			<SiteHeroSlider
				:items="featuredArticles"
				page="words"
				accent="var(--color-green)"
			/>
		</section>
		<section
			v-if="data?.modules && data.modules.length > 0"
			class="module-section"
		>
			<h2 class="archive-sr-only">All words</h2>
			<ModuleRenderer :modules="data?.modules" />
		</section>
	</div>
</template>

<style scoped lang="postcss">
.words {
  display: flex;
  align-items: center;
  flex-flow: column wrap;
  justify-content: flex-start;
  width: 100%;
  overflow-x: clip;

  .intro-section {
    width: 100%;
    max-width: 100%;
    margin-top: 0.75rem;
  }

  .module-section {
    width: 100%;
  }

  /* The active story starts on the WORDS headline line and gets a little more
     room than the centred salon wall. */
  :deep(.lab-slider--words) {
    --lab-start-offset: calc(var(--lab-inset) + var(--base-margin));
  }

  :deep(.lab-viewport--words) {
    scroll-padding-left: var(--lab-start-offset);
  }

  /* The worm belongs on the story image, not behind it: the active card sits
     at z-index 20 inside the slider, so the foreground worm needs to clear
     that. The caption band keeps its own z-index above it. */
  :deep(.hero-worm) {
    z-index: 25;
  }

  @media (min-width: 901px) {
    /* The cover story runs edge to edge; the next one only arrives after a
       wide breath of space instead of a peeking neighbour card. */
    :deep(.lab-slider--words) {
      --lab-start-offset: 0px;
    }

    :deep(.lab-slider--words.lab-slider--aperture) {
      --lab-item-width: 100vw;
      --lab-gap: clamp(3rem, 6vw, 7rem);
      /* Edge to edge means no rounded corner notch at the viewport border. */
      --lab-media-radius: 0px;
    }

    /* A 21:9 crop at 100vw would push the caption and the transport below the
       fold. The band keeps the full width and caps its height instead, so the
       story still reads as a full-bleed cover. */
    :deep(.lab-slider--words .lab-media--words) {
      max-height: 40svh;
    }

    /* A full-bleed cover must not shrink and blur while it slides in; the
       depth effect would show black bars on both edges on every change. */
    :deep(.lab-slider--words .lab-item__body) {
      transform: none !important;
      filter: none !important;
      opacity: 1 !important;
    }

    /* The image is edge to edge, the copy stays on the page grid. */
    :deep(.lab-slider--words .lab-caption--band) {
      padding-inline: calc(var(--lab-inset) + var(--base-margin));
    }
  }

  @media (max-width: 900px) {
    :deep(.lab-slider--words) {
      --lab-start-offset: calc(
        var(--page-gutter) + var(--base-margin) + 5px
      );
    }
  }

  .archive-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
}
</style>

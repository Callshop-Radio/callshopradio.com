<script setup lang="ts">
import { privacyContentBlocks } from "~/utils/privacyPage";
import { LEGAL_QUERY } from "~~/queries/sanity.queries";

definePageMeta({
	bodyClass: "page--default",
});

const query = groq`${LEGAL_QUERY}`;
const { data } = await useCachedSanityQuery(query);
const { locale } = useI18n();

const isDe = computed(() => locale.value === "de");

const pages = computed(() =>
	Array.isArray(data.value)
		? (data.value as Array<Record<string, unknown>>)
		: [],
);

type LegalDoc = {
	slug?: { current?: string };
	content?: unknown;
	seo?: unknown;
};

const legalDoc = computed(
	() =>
		pages.value.find(
			(page) => (page as LegalDoc)?.slug?.current === "legal-notice",
		) as LegalDoc | undefined,
);

const privacyDoc = computed(
	() =>
		pages.value.find(
			(page) => (page as LegalDoc)?.slug?.current === "privacy",
		) as LegalDoc | undefined,
);

const legalBlocks = computed(
	() => parseI18nObj(legalDoc.value?.content as never) ?? [],
);

const privacyBlocks = computed(() =>
	privacyContentBlocks(
		(parseI18nObj(privacyDoc.value?.content as never) ?? []) as never,
		locale.value,
	),
);

const title = computed(() => (isDe.value ? "Rechtliches" : "Legal"));

usePageSeo(legalDoc.value?.seo ?? privacyDoc.value?.seo);
</script>

<template>
	<div class="legal-page">
		<header class="legal-page__head">
			<h1>{{ title }}</h1>
			<p>
				{{
					isDe
						? "Impressum und Datenschutz an einem Ort."
						: "Legal notice and privacy in one place."
				}}
			</p>
		</header>

		<div class="legal-page__grid">
			<section id="legal-notice" class="legal-page__section">
				<RichText v-if="legalBlocks.length" :blocks="legalBlocks" />
			</section>

			<section id="privacy" class="legal-page__section">
				<RichText v-if="privacyBlocks.length" :blocks="privacyBlocks" />
			</section>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.legal-page {
  width: var(--page-max-width);
  max-width: 100%;
  margin: 0 auto;
  padding: var(--first-content-distance) 0 var(--content-gap);
}

.legal-page__head {
  display: flex;
  flex-flow: column;
  gap: var(--base-padding);
  margin-bottom: var(--base-margin);

  h1 {
    margin: 0;
    font-family: var(--font-text-semibold);
    font-size: clamp(2.2rem, 4.6vw, 4rem);
    line-height: 0.95;
    text-transform: uppercase;
  }

  p {
    margin: 0;
    max-width: 60ch;
    color: color-mix(in srgb, var(--color-text) 62%, transparent);
  }
}

.legal-page__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: var(--big-margin);
  align-items: start;

  @media screen and (max-width: 1000px) {
    grid-template-columns: 1fr;
    gap: var(--base-margin);
  }
}

.legal-page__section {
  scroll-margin-top: calc(var(--nav-height) + var(--mid-padding));

  :deep(.rich-text) {
    font-size: var(--base-font-size);
    line-height: 1.65;
  }

  :deep(h2) {
    margin-top: var(--base-margin);
    font-size: var(--base-font-size);
    text-transform: uppercase;
  }

  :deep(h2:first-child) {
    margin-top: 0;
  }

  :deep(p) {
    margin: 0 0 var(--mid-padding);
  }

  :deep(ul) {
    margin: 0 0 var(--mid-padding);
    padding-left: 1.1rem;
  }
}
</style>

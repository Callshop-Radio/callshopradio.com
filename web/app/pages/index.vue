<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { HOMEPAGE_QUERY } from "~~/queries/sanity.queries.ts";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();

const query = groq`${HOMEPAGE_QUERY}`;
const { data } = await useSanityQuery(query);

usePageSeo(data?.value?.seo);
</script>

<template>
  <section
    class="module-section"
    v-if="data?.modules && data.modules.length > 0"
  >
    <div
      class="module"
      v-for="module in data.modules"
      :key="module._key || index"
    >
      <ModuleContentSlider
        v-if="module._type == 'module.contentReferenceSlider'"
        :module="module"
      />
    </div>
  </section>
  <section v-else class="module-section" >
    <!-- Fallback-Inhalt für den Fall, dass keine Module vorhanden sind -->
    <p>Keine Module gefunden.</p>
  </section>
</template>

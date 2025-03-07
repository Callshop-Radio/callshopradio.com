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
    <section class="module-section">
      <div class="module" v-for="module in data?.modules" :key="module._key">
        <ModuleContentSlider v-if="module._type == 'module.contentReferenceSlider'" :module="module"/>
      </div>
    </section>
</template>

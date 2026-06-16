<script setup lang="ts">
const { favicon } = useUtils();
favicon();
</script>

<template>
  <div class="site">
    <SiteHead />
    <main>
      <div class="page-content">
        <NuxtPage :key="$route.fullPath" />
      </div>
    </main>
    <SiteFoot class="footer" />
    <ElementsPreviewMode />
  </div>
</template>

<style lang="postcss" scoped>
.site {
  @apply min-h-[100svh] flex flex-col items-stretch;
  max-width: 100svw;
  overflow-x: clip;

  main {
    @apply flex-grow-1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    padding: 0 var(--page-gutter);
    box-sizing: border-box;
  }

  .page-content {
    width: 100%;
    min-height: calc(100svh - var(--nav-height));
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .menu,
  main,
  .footer {
    @apply flex-shrink-0;
  }
}
</style>

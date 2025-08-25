<script setup>
const { creditLog, favicon } = useUtils();
favicon();
// creditLog()
</script>

<template>
  <div class="site">
    <SiteHead />
    <main>
      <NuxtPage />
    </main>
    <SiteFoot class="footer" />
    <ElementsPreviewMode />
  </div>
</template>

<style lang="postcss" scoped>
.site {
  @apply min-h-[100svh] flex flex-col items-stretch;
  max-width: 100vw;

  main {
    @apply flex-grow-1;
    padding: 0 var(--big-margin);
    display: flex;
    flex-direction: column wrap;
    justify-content: center;
    align-items: flex-start;
    @media screen and (max-width: 900px) {
      padding: 0 var(--mid-padding);
    }
  }

  .menu,
  main,
  .footer {
    @apply flex-shrink-0;
  }
}

.schedule .site,
.shows-archive .site {
  main {
    padding: 0;
  }
  @media screen and (max-width: 900px) {
    padding: 0 var(--mid-padding);
  }
}
</style>

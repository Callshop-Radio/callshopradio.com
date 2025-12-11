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
  max-width: 100svw;

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

.shows-archive .site,
.pool-archive .site,
.words-archive .site {
  main {
    padding: 0 var(--big-margin);
  }
  @media screen and (max-width: 900px) {
    padding: 0 var(--mid-padding);
  }
}

.schedule .site {
  main {
    padding: 0;
  }
}
.page--article-detail .site {
  main {
    padding: 0;
  }
}

</style>

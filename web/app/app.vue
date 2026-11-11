<script setup lang="ts">
const { favicon } = useUtils();
favicon();

const route = useRoute();
const mainStore = useMainStore();

// The landing hero gradient now lives on a fixed layer behind the whole page,
// so the content scrolls over it.
const isHome = computed(() => String(route.name ?? "").startsWith("index"));
const backdropType = computed(
	() => mainStore?.currentHeroContentType ?? "sets",
);

await usePlayerFeed();
</script>

<template>
  <!-- Top progress bar that runs during route changes (incl. the Suspense
       wait for detail-page Sanity fetches). Rendered as a sibling of the
       site root so no ancestor containment can affect its fixed position.
       throttle=50 keeps it visible even on quick cache-hit navigations. -->
  <NuxtLoadingIndicator color="var(--color-pink)" :height="3" :throttle="50" />
  <div class="site">
    <div
      v-if="isHome"
      class="hero-backdrop"
      :class="{ 'is-dark': mainStore?.isDarkMode }"
      aria-hidden="true"
    >
      <AnimatedGradient
        class="hero-backdrop__blob hero-backdrop__blob--a"
        :type="backdropType"
      />
      <AnimatedGradient
        class="hero-backdrop__blob hero-backdrop__blob--b"
        :type="backdropType"
      />
    </div>
    <SiteHead />
    <main>
      <div class="page-content">
        <!-- page-key keys the inner page (inside Nuxt's Transition+Suspense),
             so same-route param changes (e.g. /shows/a → /shows/b via related
             links) animate the page transition instead of swapping instantly.
             Keying NuxtPage directly would remount the whole wrapper, killing
             the transition. -->
        <NuxtPage :page-key="(route) => route.fullPath" />
      </div>
    </main>
    <SiteFoot class="footer" />
    <SiteChatPopup />
    <SiteLoginPopup />
    <SiteVideoPlayer />
    <ElementsPreviewMode />
  </div>
</template>

<style lang="postcss">
/* SiteHead sets z-index: 999999, same as NuxtLoadingIndicator's default —
   without this override the indicator renders correctly but stays hidden
   underneath the sticky header. */
.nuxt-loading-indicator {
  z-index: 1000000;
}
</style>

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

  /* Content scrolls over the fixed landing gradient. */
  main,
  .footer {
    position: relative;
    z-index: 1;
  }

  .hero-backdrop {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .hero-backdrop__blob {
    position: absolute;
    opacity: 0.62;
    filter: blur(34px);
  }

  .hero-backdrop__blob :deep(svg path) {
    opacity: 1;
  }

  .hero-backdrop__blob--a {
    top: -18vh;
    left: -24vw;
    width: 88vw;
    height: 92vh;
  }

  .hero-backdrop__blob--b {
    right: -22vw;
    bottom: -26vh;
    width: 64vw;
    height: 74vh;
    opacity: 0.4;
    filter: blur(50px);
  }

  .hero-backdrop.is-dark .hero-backdrop__blob {
    opacity: 1;
    filter: blur(30px);

    &--b {
      opacity: 0.78;
    }
  }

  .menu,
  main,
  .footer {
    @apply flex-shrink-0;
  }
}
</style>

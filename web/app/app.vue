<script setup lang="ts">
const { favicon } = useUtils();
favicon();
</script>

<template>
  <!-- Top progress bar that runs during route changes (incl. the Suspense
       wait for detail-page Sanity fetches). Rendered as a sibling of the
       site root so no ancestor containment can affect its fixed position.
       throttle=50 keeps it visible even on quick cache-hit navigations. -->
  <NuxtLoadingIndicator color="var(--color-pink)" :height="3" :throttle="50" />
  <div class="site">
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
    /* Positioning context for the absolutely-pinned leaving page during a
       crossfade transition (see transitions.postcss .page-leave-active). */
    position: relative;
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

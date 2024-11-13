<script setup>
const { creditLog, favicon } = useUtils()
// favicon()
// creditLog()
</script>

<template>
	<div class="site">
		<SiteMenu class="menu" />
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

  main {
    @apply p-4 flex-grow-1;

  }

  .menu,
  main,
  .footer {
    @apply flex-shrink-0;
  }
}
</style>

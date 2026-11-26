<script setup lang="ts">
withDefaults(
	defineProps<{
		title: string;
		lede: string;
		accent: string;
		meta?: string;
	}>(),
	{
		meta: "Düsseldorf · Leipzig · Vienna",
	},
);
</script>

<template>
	<section
		class="archive-masthead"
		:style="{ '--accent': accent }"
	>
		<div class="archive-masthead__glow" aria-hidden="true" />

		<div class="archive-masthead__top">
			<span class="archive-masthead__meta">{{ meta }}</span>
		</div>

		<div class="archive-masthead__main">
			<h1 class="archive-masthead__title">{{ title }}</h1>
			<p class="archive-masthead__lede">{{ lede }}</p>
		</div>

		<div class="archive-masthead__rule" aria-hidden="true" />
	</section>
</template>

<style lang="postcss" scoped>
.archive-masthead {
  position: relative;
  isolation: isolate;
  width: var(--page-max-width);
  max-width: 100%;
  margin: 0 auto;
  padding: var(--first-content-distance) var(--base-margin) 0;
}

.archive-masthead__glow {
  position: absolute;
  top: -8rem;
  right: 4%;
  z-index: -1;
  width: 46vw;
  height: 26rem;
  pointer-events: none;
  background: radial-gradient(
    circle at center,
    var(--accent, var(--color-text)) 0%,
    transparent 68%
  );
  opacity: 0.16;
  filter: blur(40px);
}

.archive-masthead__top {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--mid-padding);
  font-size: var(--text-sm);
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: var(--button-letter-spacing);
}

.archive-masthead__meta {
  color: var(--color-dark-grey);
}

.archive-masthead__main {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--big-margin);
  margin-top: 1.25rem;
}

.archive-masthead__title {
  margin: 0;
  font-family: var(--font-text-semibold);
  font-size: clamp(3.2rem, 8.2vw, 7.4rem);
  line-height: 0.82;
  letter-spacing: -0.025em;
  text-transform: uppercase;
}

.archive-masthead__lede {
  max-width: 32ch;
  margin: 0 0 0.35rem;
  font-size: var(--text-md);
  line-height: 1.45;
  color: color-mix(in srgb, var(--color-text) 68%, transparent);
  text-wrap: balance;
}

.archive-masthead__rule {
  height: 2px;
  margin-top: 1.5rem;
  background: var(--accent, var(--color-text));
}

@media screen and (max-width: 900px) {
  .archive-masthead {
    padding-top: var(--base-margin);
  }

  .archive-masthead__meta {
    display: none;
  }

  .archive-masthead__main {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--mid-padding);
    margin-top: 1rem;
  }

  .archive-masthead__title {
    font-size: clamp(2.8rem, 15vw, 4.4rem);
  }

  .archive-masthead__lede {
    max-width: 42ch;
    margin-bottom: 0;
  }

  .archive-masthead__rule {
    margin-top: var(--mid-padding);
  }
}
</style>

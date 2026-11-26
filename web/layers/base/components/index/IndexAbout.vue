<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{ paragraphs: string[] }>();

const EXCERPT_LENGTH = 200;
const open = ref(false);

const excerpt = computed(() => {
	const source = props.paragraphs[0]?.trim() ?? "";
	if (source.length <= EXCERPT_LENGTH) return source;
	const cut = source.slice(0, EXCERPT_LENGTH);
	const lastSpace = cut.lastIndexOf(" ");
	const end = lastSpace > 0 ? lastSpace : EXCERPT_LENGTH;
	return `${cut.slice(0, end).trimEnd()}...`;
});
</script>

<template>
	<section class="index-about">
		<button
			type="button"
			class="index-about__toggle"
			:aria-expanded="open"
			aria-controls="index-about-body"
			@click="open = !open"
		>
			<span>About the Index</span>
			<span class="index-about__sign" aria-hidden="true">
				{{ open ? "–" : "+" }}
			</span>
		</button>

		<p v-if="!open" class="index-about__excerpt">
			{{ excerpt }}
		</p>

		<div v-if="open" id="index-about-body" class="index-about__body">
			<p v-for="(paragraph, index) in paragraphs" :key="index">
				{{ paragraph }}
			</p>
		</div>
	</section>
</template>

<style lang="postcss" scoped>
.index-about {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid
    color-mix(in srgb, var(--color-text) 16%, transparent);
}

.index-about__toggle {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-text);
  font-family: var(--font-text-medium);
  font-size: var(--text-sm);
  letter-spacing: var(--button-letter-spacing);
  text-align: left;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    color: var(--accent, var(--color-purple));
  }

  &:focus-visible {
    outline: 2px solid var(--accent, var(--color-purple));
    outline-offset: 3px;
  }
}

.index-about__sign {
  font-size: var(--text-md);
  color: var(--accent, var(--color-purple));
}

.index-about__excerpt {
  max-width: 82ch;
  margin: 0.9rem 0 0;
  color: var(--color-dark-grey);
  font-size: var(--text-sm);
  line-height: 1.55;
}

.index-about__body {
  margin-top: 1.5rem;
  columns: 2;
  column-gap: clamp(2rem, 4vw, 4rem);
  color: var(--color-text);
  font-size: var(--text-sm);
  line-height: 1.65;

  p {
    margin: 0 0 0.9rem;
    break-inside: avoid;
  }

  p:first-child {
    font-family: var(--font-text-medium);
  }

  p:last-child {
    margin-bottom: 0;
  }
}

@media screen and (max-width: 900px) {
  .index-about__body {
    columns: 1;
    font-size: var(--text-md);
  }
}
</style>

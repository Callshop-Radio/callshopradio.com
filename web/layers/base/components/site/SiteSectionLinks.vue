<script setup lang="ts">
const localePath = useLocalePath();
</script>

<template>
	<nav class="section-links" aria-label="Sections">
		<NuxtLink
			:to="localePath('/shows')"
			class="section-links__link section-links__link--shows"
			aria-label="Shows"
		>
			<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<circle cx="12" cy="12" r="11.5" />
				<path class="section-links__glyph" d="M9.4 7.6 16.4 12l-7 4.4Z" />
			</svg>
		</NuxtLink>

		<NuxtLink
			:to="localePath('/pool')"
			class="section-links__link section-links__link--pool"
			aria-label="Pool"
		>
			<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<circle cx="12" cy="12" r="11.5" />
				<rect
					class="section-links__outline"
					x="5.6"
					y="7.2"
					width="12.8"
					height="9.6"
					rx="1.6"
				/>
				<circle class="section-links__glyph" cx="9.2" cy="10.8" r="1.25" />
				<path class="section-links__outline" d="M11.6 10.2h4.2M11.6 13.2h4.2" />
			</svg>
		</NuxtLink>

		<NuxtLink
			:to="localePath('/words')"
			class="section-links__link section-links__link--words"
			aria-label="Words"
		>
			<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<circle cx="12" cy="12" r="11.5" />
				<path class="section-links__outline" d="M6.6 8.6h10.8M6.6 12h10.8M6.6 15.4h6.8" />
			</svg>
		</NuxtLink>

		<NuxtLink
			:to="localePath('/index')"
			class="section-links__link section-links__link--index"
			aria-label="Index"
		>
			<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<circle cx="12" cy="12" r="11.5" />
				<rect
					class="section-links__outline"
					x="7"
					y="7"
					width="4"
					height="4"
					rx="0.8"
				/>
				<rect
					class="section-links__outline"
					x="13"
					y="7"
					width="4"
					height="4"
					rx="0.8"
				/>
				<rect
					class="section-links__outline"
					x="7"
					y="13"
					width="4"
					height="4"
					rx="0.8"
				/>
				<rect
					class="section-links__outline"
					x="13"
					y="13"
					width="4"
					height="4"
					rx="0.8"
				/>
			</svg>
		</NuxtLink>
		<NuxtLink
			:to="localePath('/merch')"
			class="section-links__link section-links__link--merch"
			aria-label="Merch"
		>
			<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<circle cx="12" cy="12" r="11.5" />
				<path
					class="section-links__outline"
					d="M11.4 6.4h5a1.4 1.4 0 0 1 1.4 1.4v5l-5.9 5.9a1.7 1.7 0 0 1-2.4 0l-4-4a1.7 1.7 0 0 1 0-2.4z"
				/>
				<circle class="section-links__glyph" cx="14.6" cy="9.4" r="0.95" />
			</svg>
		</NuxtLink>
	</nav>
</template>

<style lang="postcss" scoped>
.section-links {
  display: none;
  align-items: center;
  gap: 0.35rem;

  &__link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text);
    transition: color var(--transition-fast);

    svg {
      display: block;
      width: calc(var(--text-m) + var(--small-padding) * 2);
      height: calc(var(--text-m) + var(--small-padding) * 2);
      overflow: visible;
    }

    circle {
      fill: transparent;
      stroke: currentColor;
      transition: fill var(--transition-fast);
    }

    .section-links__outline {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.4;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: stroke var(--transition-fast);
    }

    .section-links__glyph {
      fill: currentColor;
      transition: fill var(--transition-fast);
    }

    &--shows {
      color: var(--color-pink);
    }

    &--pool {
      color: var(--color-blue);

      .section-links__glyph {
        stroke: none;
      }
    }

    &--words {
      color: var(--color-green);
    }

    &--index {
      color: var(--color-purple);
    }

    &--merch {
      color: var(--color-merch-ink);
    }

    &:hover,
    &:focus-visible {
      svg > circle:first-of-type {
        fill: currentColor;
      }

      .section-links__outline {
        stroke: var(--color-bg);
      }

      .section-links__glyph {
        fill: var(--color-bg);
      }
    }

    &:focus-visible {
      border-radius: 50%;
      outline: 2px solid currentColor;
      outline-offset: 3px;
    }
  }
}

@media screen and (max-width: 900px) {
  .section-links {
    display: flex;
  }
}
</style>

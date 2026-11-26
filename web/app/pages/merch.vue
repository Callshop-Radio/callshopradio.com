<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import type { MerchProduct } from "~/data/merch";

definePageMeta({
	bodyClass: "page--merch",
});

const { products } = useMerchProducts();
const { locale } = useI18n();
const de = computed(() => locale.value === "de");

const copy = computed(() => ({
	eyebrow: "Callshop Radio",
	buy: de.value ? "Kaufen" : "Buy",
	soldOut: de.value ? "Ausverkauft" : "Sold out",
	open: de.value ? "Produkt öffnen" : "Open product",
	close: de.value ? "Schließen" : "Close",
}));

useSeoMeta({
	title: () => (de.value ? "Merch — Callshop Radio" : "Merch — Callshop Radio"),
	description: () =>
		de.value
			? "Merch von Callshop Radio: Wearables und Objekte aus dem Katalog des Senders."
			: "Merch by Callshop Radio: wearables and objects from the station's catalogue.",
});

function pad(index: number) {
	return String(index + 1).padStart(2, "0");
}

// --- product dialog -------------------------------------------------------
const dialogRef = ref<HTMLDialogElement | null>(null);
const activeProduct = ref<MerchProduct | null>(null);
const activeImageIndex = ref(0);

const activeIndex = computed(() =>
	activeProduct.value
		? products.findIndex((product) => product.id === activeProduct.value?.id)
		: -1,
);

const activeImage = computed(
	() => activeProduct.value?.images[activeImageIndex.value] ?? "",
);

const totalLabel = computed(() => String(products.length).padStart(2, "0"));

/** Multi-image sets get their position appended, single images stay plain. */
function imageAlt(product: MerchProduct, index: number) {
	return product.images.length > 1
		? `${product.imageAlt} (${index + 1}/${product.images.length})`
		: product.imageAlt;
}

function openProduct(product: MerchProduct, imageIndex = 0) {
	activeProduct.value = product;
	activeImageIndex.value = imageIndex;
	nextTick(() => dialogRef.value?.showModal());
}

function closeProduct() {
	dialogRef.value?.close();
}

/** A click on the dialog itself (not the panel) is a backdrop click. */
function onDialogClick(event: MouseEvent) {
	if (event.target === dialogRef.value) closeProduct();
}

function onDialogClose() {
	activeProduct.value = null;
	activeImageIndex.value = 0;
}
</script>

<template>
	<div class="merch">
		<header class="merch-intro">
			<p class="merch-intro__eyebrow">{{ copy.eyebrow }}</p>
			<h1 class="merch-intro__title">Merch</h1>
		</header>

		<ul class="merch-grid">
			<li
				v-for="(product, index) in products"
				:key="product.id"
				class="merch-card"
				:class="{ 'is-sold-out': product.soldOut }"
			>
				<button
					type="button"
					class="merch-card__media"
					:aria-label="`${copy.open}: ${product.title}`"
					@click="openProduct(product)"
				>
					<img
						:src="product.images[0]"
						:alt="imageAlt(product, 0)"
						loading="lazy"
						decoding="async"
					>
					<span class="merch-card__index">{{ pad(index) }}</span>
					<span v-if="product.soldOut" class="merch-card__badge">
						Sold out
					</span>
				</button>

				<div v-if="product.images.length > 1" class="merch-card__thumbs">
					<button
						v-for="(src, imageIndex) in product.images"
						:key="src"
						type="button"
						class="merch-card__thumb"
						:aria-label="`${copy.open}: ${product.title} (${imageIndex + 1}/${product.images.length})`"
						@click="openProduct(product, imageIndex)"
					>
						<img
							:src="src"
							:alt="imageAlt(product, imageIndex)"
							loading="lazy"
							decoding="async"
						>
					</button>
				</div>

				<div class="merch-card__body">
					<h2 class="merch-card__title">
						<button
							type="button"
							class="merch-card__title-button"
							@click="openProduct(product)"
						>
							{{ product.title }}
						</button>
					</h2>

					<a
						v-if="product.buyUrl && !product.soldOut"
						class="merch-card__buy"
						:href="product.buyUrl"
						target="_blank"
						rel="noopener noreferrer"
					>
						{{ copy.buy }}
						<svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
							<path
								d="M3 9 9 3M4.2 3H9v4.8"
								stroke="currentColor"
								stroke-width="1.3"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</a>
				</div>
			</li>
		</ul>

		<dialog
			ref="dialogRef"
			class="merch-dialog"
			@click="onDialogClick"
			@close="onDialogClose"
		>
			<article v-if="activeProduct" class="merch-dialog__panel">
				<button
					type="button"
					class="merch-dialog__close"
					:aria-label="copy.close"
					@click="closeProduct"
				>
					×
				</button>

				<div class="merch-dialog__media">
					<img
						:src="activeImage"
						:alt="imageAlt(activeProduct, activeImageIndex)"
					>
				</div>

				<div
					v-if="activeProduct.images.length > 1"
					class="merch-dialog__thumbs"
				>
					<button
						v-for="(src, imageIndex) in activeProduct.images"
						:key="src"
						type="button"
						class="merch-dialog__thumb"
						:class="{ 'is-active': imageIndex === activeImageIndex }"
						:aria-label="`${copy.open}: ${activeProduct.title} (${imageIndex + 1}/${activeProduct.images.length})`"
						@click="activeImageIndex = imageIndex"
					>
						<img
							:src="src"
							:alt="imageAlt(activeProduct, imageIndex)"
							loading="lazy"
							decoding="async"
						>
					</button>
				</div>

				<div class="merch-dialog__body">
					<p class="merch-dialog__eyebrow">
						No. {{ pad(activeIndex) }} / {{ totalLabel }}
						<span v-if="activeProduct.soldOut" class="merch-dialog__state">
							{{ copy.soldOut }}
						</span>
					</p>
					<h2 class="merch-dialog__title">{{ activeProduct.title }}</h2>
					<p v-if="activeProduct.meta" class="merch-dialog__meta">
						{{ activeProduct.meta }}
					</p>
					<p v-if="activeProduct.description" class="merch-dialog__text">
						{{ activeProduct.description }}
					</p>

					<div
						v-if="activeProduct.buyUrl && !activeProduct.soldOut"
						class="merch-dialog__actions"
					>
						<a
							class="merch-card__buy"
							:href="activeProduct.buyUrl"
							target="_blank"
							rel="noopener noreferrer"
						>
							{{ copy.buy }}
							<svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
								<path
									d="M3 9 9 3M4.2 3H9v4.8"
									stroke="currentColor"
									stroke-width="1.3"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</a>
					</div>
				</div>
			</article>
		</dialog>
	</div>
</template>

<style lang="postcss" scoped>
.merch {
  --merch-accent: var(--color-merch);

  width: 100%;
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: clamp(2rem, 6vw, 5rem) 0 clamp(3rem, 8vw, 6rem);
}

.merch-intro {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.merch-intro__eyebrow {
  margin: 0;
  color: var(--color-merch-ink);
  font-size: var(--small-font-size);
  letter-spacing: var(--menu-letter-spacing);
  text-transform: uppercase;
}

.merch-intro__title {
  margin: 0;
  font-family: var(--font-text-medium);
  font-size: clamp(2.75rem, 7vw, 5rem);
  font-weight: 500;
  letter-spacing: -0.045em;
  line-height: 0.9;
  text-transform: uppercase;
}

.merch-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(2.25rem, 5vw, 4.5rem) clamp(1rem, 2.4vw, 2rem);
  margin: clamp(2rem, 5vw, 3.5rem) 0 0;
  padding: 0;
  list-style: none;
}

.merch-card {
  border-top: 1px solid
    color-mix(in srgb, var(--color-text) 16%, transparent);
  padding-top: 0.85rem;
  transition: border-color var(--transition-fast);

  &:hover {
    border-top-color: var(--color-merch-ink);
  }
}

.merch-card__media {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-media);
  background-color: var(--color-grey);
  aspect-ratio: 16 / 9;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition:
      transform 700ms cubic-bezier(0.22, 1, 0.36, 1),
      filter 400ms ease,
      opacity 400ms ease;
  }
}

.merch-card:hover .merch-card__media img {
  transform: scale(1.03);
}

.merch-card__index {
  position: absolute;
  top: 0.6rem;
  left: 0.7rem;
  padding: 0.1rem 0.45rem;
  border-radius: var(--radius-circle);
  background: color-mix(in srgb, var(--color-bg) 78%, transparent);
  backdrop-filter: blur(6px);
  color: var(--color-text);
  font-family: var(--font-text-semibold);
  font-size: var(--small-font-size);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--label-letter-spacing);
}

.merch-card__badge {
  position: absolute;
  top: 0.6rem;
  right: 0.7rem;
  padding: 0.18rem 0.5rem;
  border-radius: var(--radius-pill-sm);
  background-color: var(--merch-accent);
  color: var(--color-black);
  font-family: var(--font-text-semibold);
  font-size: var(--small-font-size);
  letter-spacing: var(--button-letter-spacing);
  text-transform: uppercase;
}

.merch-card__body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 0.1rem 0;
}

.merch-card__title {
  max-width: 34ch;
  margin: 0;
  font-family: var(--font-text-semibold);
  font-size: var(--h4-size);
  font-weight: 500;
  letter-spacing: 0.015em;
  line-height: 1.25;
  text-transform: uppercase;
}

/* Card image and title open the product dialog; they are real buttons, so the
   browser's button chrome has to go. */
.merch-card__media,
.merch-card__title-button {
  padding: 0;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.merch-card__media {
  display: block;
  width: 100%;
  background-color: var(--color-grey);
}

.merch-card__title-button {
  background: none;
  letter-spacing: inherit;
  /* UA button styles reset text-transform; the title is uppercase by design. */
  text-transform: inherit;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--color-merch-ink);
  }
}

.merch-card__media:focus-visible,
.merch-card__title-button:focus-visible {
  outline: 2px solid var(--color-merch-ink);
  outline-offset: 3px;
}

/* Extra views of the same piece sit under the cover as a thumbnail strip. */
.merch-card__thumbs {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.45rem;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.merch-card__thumb {
  flex: 0 0 2.5rem;
  aspect-ratio: 4 / 5;
  padding: 0;
  border: 0;
  border-radius: var(--radius-xs);
  overflow: hidden;
  background-color: color-mix(in srgb, var(--color-text) 7%, var(--color-bg));
  cursor: pointer;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:focus-visible {
    outline: 2px solid var(--color-merch-ink);
    outline-offset: 2px;
  }
}

.merch-card__buy {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: var(--radius-pill);
  background-color: var(--merch-accent);
  color: var(--color-black);
  font-family: var(--font-text-semibold);
  font-size: var(--small-font-size);
  letter-spacing: var(--button-letter-spacing);
  text-decoration: none;
  text-transform: uppercase;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);

  svg {
    width: 0.7rem;
    height: 0.7rem;
    transition: transform var(--transition-fast);
  }

  &:hover {
    background-color: var(--color-text);
    color: var(--color-bg);

    svg {
      transform: translate(1px, -1px);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--color-merch-ink);
    outline-offset: 2px;
  }
}

.merch-card__sold {
  flex: none;
  padding-top: 0.5rem;
  color: var(--color-dark-grey);
  font-family: var(--font-text-medium);
  font-size: var(--small-font-size);
  letter-spacing: var(--button-letter-spacing);
  text-transform: uppercase;
}

.merch-card.is-sold-out {
  .merch-card__title {
    color: color-mix(in srgb, var(--color-text) 62%, transparent);
  }
}

/* ---------- product dialog ---------- */
.merch-dialog {
  position: fixed;
  inset: 0;
  width: min(44rem, calc(100vw - 2rem));
  max-width: calc(100vw - 2rem);
  max-height: min(88vh, 58rem);
  /* The global reset zeroes every margin, which also kills the native modal
     centring: restore it here. */
  margin: auto;
  padding: 0;
  border: 0;
  border-radius: var(--radius-surface);
  background-color: var(--color-bg);
  color: var(--color-text);
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.45);
  overflow: hidden;

  &::backdrop {
    background-color: color-mix(in srgb, #000 72%, transparent);
    backdrop-filter: blur(3px);
  }

  &[open] {
    animation: merch-dialog-in 220ms cubic-bezier(0.22, 1, 0.36, 1);
  }
}

.merch-dialog__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: min(88vh, 58rem);
  overflow-y: auto;
}

.merch-dialog__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  border-radius: var(--radius-circle);
  background-color: color-mix(in srgb, var(--color-bg) 82%, transparent);
  backdrop-filter: blur(6px);
  color: var(--color-text);
  font-size: var(--h4-size);
  line-height: 1;
  cursor: pointer;

  &:hover {
    background-color: var(--color-merch);
    color: var(--color-black);
  }

  &:focus-visible {
    outline: 2px solid var(--color-merch-ink);
    outline-offset: 2px;
  }
}

.merch-dialog__media {
  overflow: hidden;
  aspect-ratio: 16 / 10;
  background-color: color-mix(in srgb, var(--color-text) 7%, var(--color-bg));

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
}

.merch-dialog__thumbs {
  display: flex;
  gap: 0.4rem;
  padding: 0.6rem 1.35rem 0;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.merch-dialog__thumb {
  flex: 0 0 2.9rem;
  aspect-ratio: 4 / 5;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  overflow: hidden;
  background-color: color-mix(in srgb, var(--color-text) 7%, var(--color-bg));
  cursor: pointer;
  opacity: 0.6;
  transition:
    opacity var(--transition-fast),
    border-color var(--transition-fast);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover,
  &.is-active {
    opacity: 1;
  }

  &.is-active {
    border-color: var(--color-merch-ink);
  }

  &:focus-visible {
    outline: 2px solid var(--color-merch-ink);
    outline-offset: 2px;
  }
}

.merch-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.35rem 1.35rem 1.5rem;
}

.merch-dialog__eyebrow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
  color: var(--color-dark-grey);
  font-size: var(--small-font-size);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--menu-letter-spacing);
  text-transform: uppercase;
}

.merch-dialog__state {
  padding: 0.1rem 0.45rem;
  border-radius: var(--radius-pill-sm);
  background-color: var(--merch-accent);
  color: var(--color-black);
  font-family: var(--font-text-semibold);
  letter-spacing: var(--button-letter-spacing);
}

.merch-dialog__title {
  max-width: 30ch;
  margin: 0;
  font-family: var(--font-text-semibold);
  font-size: clamp(1.2rem, 1rem + 0.8vw, 1.6rem);
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1.2;
  text-transform: uppercase;
}

.merch-dialog__meta {
  margin: 0;
  color: var(--color-dark-grey);
  font-size: var(--small-font-size);
  letter-spacing: var(--button-letter-spacing);
  text-transform: uppercase;
}

.merch-dialog__text {
  max-width: 56ch;
  margin: 0;
  font-size: var(--base-font-size);
  line-height: 1.55;
}

.merch-dialog__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.4rem;
}

@keyframes merch-dialog-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .merch-dialog[open] {
    animation: none;
  }
}

@media screen and (max-width: 900px) {
  .merch-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media screen and (max-width: 600px) {
  .merch-card__body {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
  }

  .merch-card__sold {
    padding-top: 0;
  }

  .merch-dialog__body {
    padding: 1.1rem 1rem 1.25rem;
  }
}
</style>

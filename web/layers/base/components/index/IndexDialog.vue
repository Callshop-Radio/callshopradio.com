<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import type { Label } from "~/data/label-index/types";

defineProps<{ label: Label }>();

const emit = defineEmits<{ close: [] }>();

const dialog = ref<HTMLDialogElement | null>(null);

function open() {
	if (typeof document !== "undefined") {
		document.documentElement.classList.add("index-dialog-open");
	}
	dialog.value?.showModal();
}

function close() {
	dialog.value?.close();
}

defineExpose({ open, close });

onBeforeUnmount(() => {
	if (typeof document !== "undefined") {
		document.documentElement.classList.remove("index-dialog-open");
	}
});

function onBackdrop(event: MouseEvent) {
	if (event.target === dialog.value) close();
}

function onClose() {
	if (typeof document !== "undefined") {
		document.documentElement.classList.remove("index-dialog-open");
	}
	emit("close");
}

function orDash(value: string) {
	return value?.trim() || "—";
}
</script>

<template>
	<dialog
		ref="dialog"
		class="index-dialog"
		aria-labelledby="index-dialog-title"
		@click="onBackdrop"
		@close="onClose"
	>
		<div class="index-dialog__panel">
			<button
				type="button"
				class="index-dialog__close"
				aria-label="Close"
				@click="close"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M3 3l10 10M13 3 3 13"
						stroke="currentColor"
						stroke-width="1.4"
						stroke-linecap="round"
					/>
				</svg>
			</button>

			<div class="index-dialog__media">
				<img
					:src="label.logo"
					:alt="label.name"
					:width="label.logoWidth"
					:height="label.logoHeight"
				/>
			</div>

			<div class="index-dialog__body">
				<h2 id="index-dialog-title" class="index-dialog__title">
					{{ label.name }}
				</h2>

				<dl class="index-dialog__facts">
					<div>
						<dt>Founded</dt>
						<dd>{{ orDash(label.founded) }}</dd>
					</div>
					<div>
						<dt>Location</dt>
						<dd>{{ orDash(label.location) }}</dd>
					</div>
					<div>
						<dt>Releases</dt>
						<dd>{{ orDash(label.releases) }}</dd>
					</div>
					<div>
						<dt>Founding Members</dt>
						<dd>{{ orDash(label.members) }}</dd>
					</div>
				</dl>

				<div
					v-if="label.discogs || label.soundcloud || label.youtube"
					class="index-dialog__links"
				>
					<a
						v-if="label.discogs"
						:href="label.discogs"
						target="_blank"
						rel="noopener noreferrer"
					>
						<IndexLinkIcon name="discogs" />
						Discogs
						<svg
							class="index-dialog__external"
							width="10"
							height="10"
							viewBox="0 0 10 10"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M2 8L8 2M3.2 2H8V6.8"
								stroke="currentColor"
								stroke-width="1.1"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</a>
					<a
						v-if="label.soundcloud"
						:href="label.soundcloud"
						target="_blank"
						rel="noopener noreferrer"
					>
						<IndexLinkIcon name="soundcloud" />
						SoundCloud
						<svg
							class="index-dialog__external"
							width="10"
							height="10"
							viewBox="0 0 10 10"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M2 8L8 2M3.2 2H8V6.8"
								stroke="currentColor"
								stroke-width="1.1"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</a>
					<a
						v-if="label.youtube"
						:href="label.youtube"
						target="_blank"
						rel="noopener noreferrer"
					>
						<IndexLinkIcon name="youtube" />
						YouTube
						<svg
							class="index-dialog__external"
							width="10"
							height="10"
							viewBox="0 0 10 10"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M2 8L8 2M3.2 2H8V6.8"
								stroke="currentColor"
								stroke-width="1.1"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</a>
				</div>
			</div>
		</div>
	</dialog>
</template>

<style lang="postcss" scoped>
:global(html.index-dialog-open) {
  overflow: hidden;
}

.index-dialog {
  position: fixed;
  inset: 0;
  width: 100vw;
  max-width: none;
  height: 100svh;
  max-height: none;
  margin: 0;
  padding: 1rem;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--color-text);
  overflow: hidden;

  &:not([open]) {
    display: none;
  }

  &[open] {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &::backdrop {
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(10px);
  }
}

.index-dialog__panel {
  position: relative;
  display: grid;
  width: min(52rem, 100%);
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  max-height: calc(100svh - 2rem);
  margin: auto;
  border: 1px solid color-mix(in srgb, var(--color-text) 16%, transparent);
  border-radius: var(--radius-media);
  background-color: var(--color-bg);
  overflow: hidden;
}

.index-dialog__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--color-text) 22%, transparent);
  border-radius: 50%;
  background-color: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);

  &:hover {
    border-color: var(--accent, var(--color-purple));
    color: var(--accent, var(--color-purple));
  }

  &:focus-visible {
    outline: 2px solid var(--accent, var(--color-purple));
    outline-offset: 2px;
  }
}

.index-dialog__media {
  display: grid;
  place-items: center;
  padding: clamp(2rem, 5vw, 3.5rem);
  background-color: #fff;

  img {
    display: block;
    width: 100%;
    height: auto;
    max-height: min(24rem, 46vh);
    object-fit: contain;
  }
}

.index-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  padding: clamp(1.5rem, 4vw, 2.75rem);
  overflow-y: auto;
  background-color: color-mix(in srgb, var(--color-text) 4%, var(--color-bg));
}

.index-dialog__title {
  margin: 0;
  padding-right: 2.5rem;
  font-family: var(--font-text-medium);
  font-size: var(--text-xl);
  line-height: 1.2;
  text-transform: uppercase;
}

.index-dialog__facts {
  display: grid;
  gap: 0.9rem;
  margin: 0;

  div {
    display: grid;
    gap: 0.2rem;
  }

  dt {
    color: var(--color-dark-grey);
    font-size: var(--text-sm);
    letter-spacing: var(--button-letter-spacing);
    text-transform: uppercase;
  }

  dd {
    margin: 0;
    font-size: var(--text-md);
    line-height: 1.4;
  }
}

.index-dialog__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: auto;

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    border: 1px solid color-mix(in srgb, var(--color-text) 22%, transparent);
    border-radius: var(--radius-circle);
    color: var(--color-text);
    font-size: var(--text-sm);
    letter-spacing: var(--button-letter-spacing);
    text-transform: uppercase;
    text-decoration: none;
    transition:
      color var(--transition-fast),
      border-color var(--transition-fast);

    &:hover {
      border-color: var(--accent, var(--color-purple));
      color: var(--accent, var(--color-purple));
    }

    &:focus-visible {
      outline: 2px solid var(--accent, var(--color-purple));
      outline-offset: 2px;
    }
  }
}

.index-dialog__external {
  flex: none;
  width: 0.6rem;
  height: 0.6rem;
  opacity: 0.5;
}

@media screen and (max-width: 700px) {
  .index-dialog__panel {
    grid-template-columns: minmax(0, 1fr);
    overflow-y: auto;
  }

  .index-dialog__media {
    padding: 1.75rem;
  }

  .index-dialog__media img {
    max-height: 32vh;
  }

  .index-dialog__body {
    overflow: visible;
  }
}
</style>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";

const { loginOpen, closeLogin } = useAccountUi();

const onKeydown = (event: KeyboardEvent) => {
	if (event.key === "Escape" && loginOpen.value) closeLogin();
};

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
	<Transition name="login-pop">
		<div
			v-if="loginOpen"
			class="login-overlay"
			role="presentation"
			@click.self="closeLogin"
		>
			<section
				class="login-modal"
				role="dialog"
				aria-modal="true"
				aria-label="Anmelden"
			>
				<button
					type="button"
					class="login-modal__close"
					aria-label="Schließen"
					@click="closeLogin"
				>
					<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
						<path
							d="M1 1l10 10M11 1L1 11"
							stroke="currentColor"
							stroke-width="1.5"
							fill="none"
						/>
					</svg>
				</button>
				<AccountLogin embedded @success="closeLogin" />
			</section>
		</div>
	</Transition>
</template>

<style lang="postcss" scoped>
.login-overlay {
  position: fixed;
  inset: 0;
  z-index: 9500;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.login-modal {
  position: relative;
  width: min(440px, 100%);
  max-height: calc(100svh - 2.5rem);
  overflow-y: auto;
  padding: 1.75rem 1.75rem 1.5rem;
  border: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent);
  border-radius: 5px;
  background: var(--color-bg);
  color: var(--color-text);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
}

.login-modal__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: color-mix(in srgb, var(--color-text) 55%, transparent);
  cursor: pointer;

  &:hover {
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-text) 7%, transparent);
  }
}

.login-pop-enter-active,
.login-pop-leave-active {
  transition: opacity var(--transition-fast);
}

.login-pop-enter-from,
.login-pop-leave-to {
  opacity: 0;
}
</style>

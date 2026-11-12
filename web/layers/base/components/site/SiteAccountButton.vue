<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useAccountStore } from "~/stores/accountStore";

const localePath = useLocalePath();
const account = useAccountStore();
const { openLogin } = useAccountUi();

const authenticated = computed(() => account.sessionState === "authenticated");

// Always visible: guests open the sign-in popup, signed-in listeners go to
// their account page.
onMounted(async () => {
	if (account.sessionState === "unknown") {
		await account.loadSession().catch(() => {});
	}
});
</script>

<template>
	<span class="account-trigger">
		<NuxtLink
			v-if="authenticated"
			class="account-trigger__link"
			:to="localePath('/konto')"
			aria-label="Konto"
		>
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle cx="12" cy="12" r="11.5" stroke="currentColor" />
				<circle
					cx="12"
					cy="9.2"
					r="2.9"
					fill="none"
					stroke="currentColor"
					stroke-width="1.25"
				/>
				<path
					d="M6.7 17.4c.5-2.5 2.7-4.1 5.3-4.1s4.8 1.6 5.3 4.1"
					fill="none"
					stroke="currentColor"
					stroke-width="1.25"
					stroke-linecap="round"
				/>
			</svg>
		</NuxtLink>
		<button
			v-else
			type="button"
			class="account-trigger__button"
			aria-label="Anmelden"
			@click="openLogin"
		>
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle cx="12" cy="12" r="11.5" stroke="currentColor" />
				<circle
					cx="12"
					cy="9.2"
					r="2.9"
					fill="none"
					stroke="currentColor"
					stroke-width="1.25"
				/>
				<path
					d="M6.7 17.4c.5-2.5 2.7-4.1 5.3-4.1s4.8 1.6 5.3 4.1"
					fill="none"
					stroke="currentColor"
					stroke-width="1.25"
					stroke-linecap="round"
				/>
			</svg>
		</button>
	</span>
</template>

<style lang="postcss" scoped>
.account-trigger {
  display: inline-flex;

  &__link,
  &__button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: none;
    color: var(--color-text);
    cursor: pointer;
  }

  svg {
    overflow: visible;
    width: calc(var(--base-font-size) + var(--small-padding) * 2);
    height: calc(var(--base-font-size) + var(--small-padding) * 2);
    cursor: pointer;
    color: inherit;
  }

  &__link:hover,
  &__button:hover {
    @media (min-width: 1024px) {
      color: var(--color-pink);
    }
  }
}
</style>

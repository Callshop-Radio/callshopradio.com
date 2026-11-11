<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { roleLabel } from "~/utils/accountRole";

// Fallback page: the account entry point now lives at /konto with tabs. This
// overview is kept for direct links but is no longer referenced anywhere.
definePageMeta({ middleware: "account" });

const copy = useAccountCopy();
const request = useAccountRequest();
const account = useAccountStore();
const localePath = useLocalePath();
const { locale } = useI18n();

const profile = ref<{
	id: number;
	displayName: string | null;
	email: string | null;
	role: string;
	counts: { savedSets: number; lists: number };
} | null>(null);
const state = ref<"loading" | "ready" | "error">("loading");
const badge = computed(() => roleLabel(profile.value?.role, locale.value));

async function load() {
	try {
		const response = await request<{ user: typeof profile.value }>("me");
		profile.value = response.user;
		state.value = "ready";
	} catch {
		state.value = "error";
	}
}

async function logout() {
	let revoked = true;
	try {
		const result = await request<{ revoked?: boolean }>("auth/logout", {
			method: "POST",
		});
		revoked = result?.revoked !== false;
	} catch {
		revoked = false;
	} finally {
		account.reset();
		await navigateTo(
			revoked
				? localePath("/")
				: localePath({ path: "/konto/anmelden", query: { revoked: "0" } }),
		);
	}
}

onMounted(load);
</script>

<template>
	<AccountShell
		:title="copy.account"
		:subtitle="profile?.displayName || profile?.email || ''"
	>
		<p v-if="state === 'error'">{{ copy.unavailable }}</p>
		<template v-else>
			<p v-if="badge" class="account-role">
				<span class="account-role__label">{{ copy.role }}</span>
				<span class="account-role__value">{{ badge }}</span>
			</p>
			<div class="account-cards">
				<NuxtLink :to="localePath('/konto/listen')" class="account-card">
					<span class="account-card__value">{{ profile?.counts.lists ?? "–" }}</span>
					<span>{{ copy.openLists }}</span>
				</NuxtLink>
				<NuxtLink :to="localePath('/konto')" class="account-card">
					<span class="account-card__value">{{ profile?.counts.savedSets ?? "–" }}</span>
					<span>{{ copy.savedSets }}</span>
				</NuxtLink>
			</div>
			<button type="button" class="account-secondary" @click="logout">
				{{ copy.logout }}
			</button>
		</template>
	</AccountShell>
</template>

<style scoped>
.account-role {
	display: inline-flex;
	align-items: center;
	gap: 0.6rem;
	margin: 0;
	padding: 0.4rem 0.9rem;
	border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
	border-radius: 999px;
	font-size: 0.85rem;
}

.account-role__label {
	opacity: 0.6;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	font-size: 0.7rem;
}

.account-role__value {
	font-weight: 600;
}

.account-cards {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
}

.account-card {
	display: grid;
	gap: 0.35rem;
	padding: 1.25rem;
	border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
	border-radius: 5px;
	text-decoration: none;
	color: inherit;
}

.account-card__value {
	font-size: 2rem;
	font-weight: 600;
}

.account-secondary {
	justify-self: start;
	border: 0;
	background: none;
	color: inherit;
	opacity: 0.75;
	text-decoration: underline;
	cursor: pointer;
	font: inherit;
}
</style>

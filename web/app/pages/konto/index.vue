<script setup lang="ts">
import { onMounted, ref } from "vue";

definePageMeta({ middleware: "account" });

const copy = useAccountCopy();
const request = useAccountRequest();
const account = useAccountStore();
const localePath = useLocalePath();

const profile = ref<{
	displayName: string | null;
	email: string | null;
	counts: { savedSets: number; lists: number };
} | null>(null);
const state = ref<"loading" | "ready" | "error">("loading");

async function load() {
	try {
		const response = await request<{ listener: typeof profile.value }>("me");
		profile.value = response.listener;
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
		// The cookie is cleared locally even when the manager cannot revoke the
		// token; say so instead of pretending the logout was clean.
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
			<div class="account-cards">
				<NuxtLink :to="localePath('/konto/listen')" class="account-card">
					<span class="account-card__value">{{ profile?.counts.lists ?? "â€“" }}</span>
					<span>{{ copy.openLists }}</span>
				</NuxtLink>
				<NuxtLink :to="localePath('/konto/profil')" class="account-card">
					<span class="account-card__value">{{ profile?.counts.savedSets ?? "â€“" }}</span>
					<span>{{ copy.savedSets }}</span>
				</NuxtLink>
			</div>
			<button type="button" class="account-secondary" @click="logout">{{ copy.logout }}</button>
		</template>
	</AccountShell>
</template>

<style scoped>
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
	border-radius: 14px;
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


<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

definePageMeta({ middleware: "account" });

const copy = useAccountCopy();
const request = useAccountRequest();
const account = useAccountStore();
const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();

type Tab = "saves" | "profile";

const activeTab = computed<Tab>(() =>
	route.query.tab === "profile" ? "profile" : "saves",
);

function selectTab(tab: Tab) {
	router.replace({
		query: tab === "profile" ? { tab: "profile" } : {},
	});
}

const displayName = ref("");

async function loadName() {
	try {
		const response = await request<{
			user: { displayName: string | null; email: string | null };
		}>("me");
		displayName.value = response.user.displayName || response.user.email || "";
	} catch {
		// The tabs already render their own error state.
	}
}

async function logout() {
	try {
		await request("auth/logout", { method: "POST" });
	} catch {
		// The local session is dropped regardless.
	}
	account.reset();
	await navigateTo(localePath("/"));
}

onMounted(loadName);
</script>

<template>
	<AccountShell :title="copy.account" :subtitle="displayName">
		<div class="account-tabs" role="tablist" aria-label="Konto">
			<button
				type="button"
				role="tab"
				class="account-tab"
				:class="{ 'is-active': activeTab === 'saves' }"
				:aria-selected="activeTab === 'saves'"
				@click="selectTab('saves')"
			>
				{{ copy.savedSets }}
			</button>
			<button
				type="button"
				role="tab"
				class="account-tab"
				:class="{ 'is-active': activeTab === 'profile' }"
				:aria-selected="activeTab === 'profile'"
				@click="selectTab('profile')"
			>
				{{ copy.profile }}
			</button>
		</div>

		<section v-if="activeTab === 'saves'" class="account-tab-panel">
			<AccountSaves />
		</section>
		<section v-else class="account-tab-panel">
			<AccountProfile />
		</section>

		<button type="button" class="account-signout" @click="logout">
			{{ copy.logout }}
		</button>
	</AccountShell>
</template>

<style scoped>
.account-tabs {
	display: flex;
	flex-flow: row wrap;
	gap: 0.4rem;
	max-width: 46rem;
	padding-bottom: var(--mid-padding);
	border-bottom: 1px solid color-mix(in srgb, currentColor 14%, transparent);
}

.account-tab {
	padding: 0.45rem 0.9rem;
	border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
	border-radius: var(--pill-radius);
	background: transparent;
	color: inherit;
	font: inherit;
	font-size: 0.8rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	cursor: pointer;
	transition:
		background-color var(--transition-fast),
		color var(--transition-fast),
		border-color var(--transition-fast);

	&:hover {
		border-color: currentColor;
	}

	&.is-active {
		background: var(--color-text);
		border-color: var(--color-text);
		color: var(--color-bg);
	}
}

.account-tab-panel {
	max-width: 46rem;
	padding-top: var(--small-padding);
}

.account-signout {
	justify-self: start;
	margin-top: var(--base-margin);
	border: 0;
	background: none;
	color: inherit;
	opacity: 0.7;
	text-decoration: underline;
	cursor: pointer;
	font: inherit;
}
</style>

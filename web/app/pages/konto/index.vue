<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

definePageMeta({ middleware: "account" });

const copy = useAccountCopy();
const request = useAccountRequest();
const account = useAccountStore();
const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();
const { locale } = useI18n();
const de = computed(() => locale.value === "de");

type Tab = "saves" | "profile";

const activeTab = computed<Tab>(() =>
	route.query.tab === "profile" ? "profile" : "saves",
);

function selectTab(tab: Tab) {
	router.replace({
		query: tab === "profile" ? { tab: "profile" } : {},
	});
}

type Listener = {
	id: string;
	email: string | null;
	displayName: string | null;
};

const listener = ref<Listener | null>(null);

const identity = computed(() => {
	const value = listener.value;
	if (!value) return "";
	return value.displayName || value.email || "";
});

async function loadName() {
	try {
		const response = await request<{ listener: Listener }>("me");
		listener.value = response.listener;
	} catch {
		// The tabs render their own error state.
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
	<AccountShell
		:title="copy.account"
		:subtitle="identity"
		:eyebrow="de ? 'Konto' : 'Account'"
	>
		<template #actions>
			<button type="button" @click="logout">{{ copy.logout }}</button>
		</template>

		<nav class="account-tabs" role="tablist" aria-label="Account">
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
		</nav>

		<section v-if="activeTab === 'saves'" class="account-panel">
			<AccountSaves />
		</section>
		<section v-else class="account-panel">
			<AccountProfile @updated="loadName" />
		</section>
	</AccountShell>
</template>

<style scoped>
.account-tabs {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
}

.account-tab {
	padding: 0.45rem 0.95rem;
	border: 0;
	border-radius: var(--pill-radius);
	background-color: color-mix(in srgb, var(--color-text) 7%, transparent);
	color: inherit;
	font: inherit;
	font-size: var(--small-font-size);
	letter-spacing: var(--button-letter-spacing);
	text-transform: uppercase;
	cursor: pointer;
	transition:
		background-color var(--transition-fast),
		color var(--transition-fast);

	&:hover {
		background-color: color-mix(in srgb, var(--color-text) 12%, transparent);
	}

	&.is-active {
		background-color: var(--color-text);
		color: var(--color-bg);
	}
}

.account-panel {
	width: 100%;
}
</style>

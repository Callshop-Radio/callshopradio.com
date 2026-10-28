<script setup lang="ts">
import { onMounted, ref } from "vue";

definePageMeta({ middleware: "account" });

const copy = useAccountCopy();
const request = useAccountRequest();
const localePath = useLocalePath();

type List = { id: string; name: string; isDefault: boolean; itemCount: number };

const lists = ref<List[]>([]);
const name = ref("");
const state = ref<"loading" | "ready" | "error">("loading");
const message = ref("");

async function load() {
	try {
		const response = await request<{ lists: List[] }>("lists");
		lists.value = response.lists;
		state.value = "ready";
	} catch {
		state.value = "error";
	}
}

async function create() {
	if (!name.value.trim()) return;
	try {
		await request("lists", { method: "POST", body: { name: name.value } });
		name.value = "";
		await load();
	} catch {
		message.value = copy.value.nameTaken;
	}
}

onMounted(load);
</script>

<template>
	<AccountShell :title="copy.openLists">
		<p>
			<NuxtLink :to="localePath('/konto')">{{ copy.back }}</NuxtLink>
		</p>

		<form class="list-create" @submit.prevent="create">
			<input v-model="name" :placeholder="copy.listName" maxlength="60" :aria-label="copy.listName">
			<button type="submit" class="account-action">{{ copy.create }}</button>
		</form>
		<p v-if="message" class="account-error">{{ message }}</p>

		<p v-if="state === 'loading'">â€¦</p>
		<p v-else-if="state === 'error'">{{ copy.unavailable }}</p>
		<ul v-else class="list-grid">
			<li v-for="list in lists" :key="list.id">
				<NuxtLink :to="localePath(`/konto/listen/${list.id}`)" class="list-card">
					<span class="list-card__name">{{ list.name }}</span>
					<span class="list-card__meta">{{ list.itemCount === 1 ? "1 Set" : `${list.itemCount} Sets` }}</span>
				</NuxtLink>
			</li>
		</ul>
	</AccountShell>
</template>

<style scoped>
.list-create {
	display: flex;
	gap: 0.75rem;
}

.list-create input {
	flex: 1;
	padding: 0.8rem 1rem;
	border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
	border-radius: 10px;
	background: transparent;
	color: inherit;
	font: inherit;
}

.account-action {
	padding: 0.8rem 1.1rem;
	border: 0;
	border-radius: 999px;
	background: transparent;
	color: inherit;
	font: inherit;
	font-weight: 600;
	cursor: pointer;
}

.list-grid {
	list-style: none;
	margin: 0;
	padding: 0;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 1rem;
}

.list-card {
	display: grid;
	gap: 0.3rem;
	padding: 1rem;
	border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
	border-radius: 12px;
	text-decoration: none;
	color: inherit;
}

.list-card__name {
	font-weight: 600;
}

.list-card__meta {
	opacity: 0.65;
	font-size: 0.85rem;
}

.account-error {
	margin: 0;
	color: #b02a2a;
}
</style>




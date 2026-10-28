<script setup lang="ts">
import { onMounted, ref } from "vue";

const props = defineProps<{ listId: string }>();
const copy = useAccountCopy();
const request = useAccountRequest();
const localePath = useLocalePath();

type Item = {
	setId: string;
	position: number;
	note: string | null;
	addedAt: string;
};
type List = {
	id: string;
	name: string;
	description: string | null;
	isDefault: boolean;
	itemCount: number;
};

const list = ref<List | null>(null);
const items = ref<Item[]>([]);
const name = ref("");
const state = ref<"loading" | "ready" | "missing">("loading");
const message = ref("");

async function load() {
	try {
		const all: Item[] = [];
		let cursor: string | null = null;
		let header: List | null = null;
		do {
			const suffix: string = cursor
				? `?cursor=${encodeURIComponent(cursor)}`
				: "";
			const response: { list: List; items: Item[]; nextCursor: string | null } =
				await request<{
					list: List;
					items: Item[];
					nextCursor: string | null;
				}>(`lists/${encodeURIComponent(props.listId)}${suffix}`);
			header = response.list;
			all.push(...response.items);
			cursor = response.nextCursor;
		} while (cursor);

		list.value = header;
		items.value = all;
		name.value = header?.name ?? "";
		state.value = "ready";
	} catch {
		state.value = "missing";
	}
}

async function rename() {
	await request(`lists/${encodeURIComponent(props.listId)}`, {
		method: "PATCH",
		body: { name: name.value },
	});
	await load();
	message.value = copy.value.saved;
}

async function removeItem(setId: string) {
	await request(
		`lists/${encodeURIComponent(props.listId)}/items/${encodeURIComponent(setId)}`,
		{
			method: "DELETE",
		},
	);
	await load();
}

async function removeList() {
	if (!window.confirm(copy.value.deleteConfirm)) return;
	await request(`lists/${encodeURIComponent(props.listId)}`, {
		method: "DELETE",
	});
	await navigateTo(localePath("/konto/listen"));
}

onMounted(load);
</script>

<template>
	<section class="list-editor">
		<p v-if="state === 'loading'">…</p>
		<p v-else-if="state === 'missing'">{{ copy.unavailable }}</p>

		<template v-else-if="list">
			<form class="list-editor__rename" @submit.prevent="rename">
				<input v-model="name" maxlength="60" :aria-label="copy.listName">
				<button type="submit" class="account-action">{{ copy.rename }}</button>
			</form>
			<p class="list-editor__meta">{{ items.length }} Sets</p>
			<p v-if="message">{{ message }}</p>

			<ul v-if="items.length > 0" class="list-editor__items">
				<li v-for="item in items" :key="item.setId">
					<span class="list-editor__id">{{ item.setId }}</span>
					<button type="button" class="account-secondary" @click="removeItem(item.setId)">
						{{ copy.remove }}
					</button>
				</li>
			</ul>
			<p v-else>{{ copy.emptyList }}</p>

			<button v-if="!list.isDefault" type="button" class="account-secondary account-danger" @click="removeList">
				{{ copy.delete }}
			</button>
		</template>
	</section>
</template>

<style scoped>
.list-editor {
	display: grid;
	gap: 1rem;
}

.list-editor__rename {
	display: flex;
	gap: 0.75rem;
}

.list-editor__rename input {
	flex: 1;
	padding: 0.8rem 1rem;
	border: 1px solid rgb(0 0 0 / 22%);
	border-radius: 10px;
	background: transparent;
	color: inherit;
	font: inherit;
}

.list-editor__items {
	list-style: none;
	margin: 0;
	padding: 0;
	display: grid;
	gap: 0.5rem;
}

.list-editor__items li {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
	padding: 0.7rem 0.9rem;
	border: 1px solid rgb(0 0 0 / 12%);
	border-radius: 10px;
}

.list-editor__id {
	font-family: var(--font-mono, ui-monospace, monospace);
	font-size: 0.8rem;
	opacity: 0.75;
	word-break: break-all;
}

.account-action {
	padding: 0.8rem 1.1rem;
	border: 0;
	border-radius: 999px;
	background: currentColor;
	color: var(--color-bg, #fff);
	font: inherit;
	font-weight: 600;
	cursor: pointer;
}

.account-secondary {
	border: 0;
	background: none;
	color: inherit;
	opacity: 0.75;
	text-decoration: underline;
	cursor: pointer;
	font: inherit;
}

.account-danger {
	color: #b02a2a;
}

.list-editor__meta {
	margin: 0;
	opacity: 0.7;
}
</style>

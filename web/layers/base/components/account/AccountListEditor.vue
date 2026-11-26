<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { SETS_BY_IDS_QUERY } from "~~/queries/sanity.queries";

const props = defineProps<{ listId: string }>();
const copy = useAccountCopy();
const request = useAccountRequest();
const localePath = useLocalePath();
const { locale } = useI18n();
const mainStore = useMainStore();
const de = computed(() => locale.value === "de");

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
type SetCard = {
	_id: string;
	title: string | null;
	additionalTitle: string | null;
	slug: { current: string } | null;
	datetime: string | null;
	image?: { asset?: { url?: string } | null } | null;
	artists?: Array<{ _id: string; name: string | null }>;
};

const list = ref<List | null>(null);
const items = ref<Item[]>([]);
const cards = ref<Record<string, SetCard>>({});
const name = ref("");
const state = ref<"loading" | "ready" | "missing">("loading");
const message = ref("");

const dirty = computed(
	() => Boolean(list.value) && name.value.trim() !== list.value?.name,
);

const fallbackCover = computed(() => {
	const fallback = mainStore?.siteFallbacks?.fallbackSet as
		| { image?: { asset?: { url?: string } | null } | null }
		| undefined;
	return fallback?.image?.asset?.url ?? "";
});

function imageOf(setId: string): string {
	const url = cards.value[setId]?.image?.asset?.url || fallbackCover.value;
	return sanityImageUrl(url, 240) ?? "";
}

function titleOf(setId: string): string {
	const card = cards.value[setId];
	return card?.title || card?.additionalTitle || "Untitled";
}

function artistsOf(setId: string): string {
	return (cards.value[setId]?.artists ?? [])
		.map((artist) => artist.name)
		.filter(Boolean)
		.join(", ");
}

function linkOf(setId: string): string {
	const slug = cards.value[setId]?.slug?.current;
	return slug ? localePath(`/set/${slug}`) : localePath("/");
}

async function hydrate(ids: string[]) {
	if (ids.length === 0) return;
	try {
		const sanity = useSanity();
		const rows = (await sanity.fetch(SETS_BY_IDS_QUERY, {
			ids: [...new Set(ids)],
		})) as SetCard[];
		const next = { ...cards.value };
		for (const row of rows) next[row._id] = row;
		cards.value = next;
	} catch {
		// Thumbnails are a bonus; the list still works without them.
	}
}

async function load() {
	try {
		const all: Item[] = [];
		let cursor: string | null = null;
		let header: List | null = null;
		do {
			const suffix: string = cursor
				? `?cursor=${encodeURIComponent(cursor)}`
				: "";
			const response = await request<{
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
		await hydrate(all.map((item) => item.setId));
	} catch {
		state.value = "missing";
	}
}

async function rename() {
	if (!dirty.value) return;
	await request(`lists/${encodeURIComponent(props.listId)}`, {
		method: "PATCH",
		body: { name: name.value.trim() },
	});
	await load();
	message.value = copy.value.saved;
}

async function removeItem(setId: string) {
	await request(
		`lists/${encodeURIComponent(props.listId)}/items/${encodeURIComponent(setId)}`,
		{ method: "DELETE" },
	);
	await load();
}

async function removeList() {
	if (!window.confirm(copy.value.deleteConfirm)) return;
	await request(`lists/${encodeURIComponent(props.listId)}`, {
		method: "DELETE",
	});
	await navigateTo(localePath("/konto"));
}

onMounted(load);
</script>

<template>
	<section class="editor">
		<p v-if="state === 'loading'" class="editor__state">…</p>
		<p v-else-if="state === 'missing'" class="editor__state">
			{{ copy.unavailable }}
		</p>

		<template v-else-if="list">
			<form class="editor__rename" @submit.prevent="rename">
				<input v-model="name" maxlength="60" :aria-label="copy.listName">
				<button type="submit" class="editor__save" :disabled="!dirty">
					{{ copy.rename }}
				</button>
			</form>
			<p v-if="message" class="editor__hint">{{ message }}</p>

			<p class="editor__meta">
				{{ items.length }} {{ items.length === 1 ? "Set" : "Sets" }}
			</p>

			<ul v-if="items.length > 0" class="rows">
				<li v-for="item in items" :key="item.setId" class="row">
					<NuxtLink :to="linkOf(item.setId)" class="row__main">
						<span class="row__cover">
							<img
								v-if="imageOf(item.setId)"
								:src="imageOf(item.setId)"
								alt=""
								loading="lazy"
								decoding="async"
							>
						</span>
						<span class="row__text">
							<span class="row__name">{{ titleOf(item.setId) }}</span>
							<span v-if="artistsOf(item.setId)" class="row__sub">
								{{ artistsOf(item.setId) }}
							</span>
						</span>
					</NuxtLink>
					<button type="button" class="row__remove" @click="removeItem(item.setId)">
						{{ copy.remove }}
					</button>
				</li>
			</ul>
			<p v-else class="editor__state">{{ copy.emptyList }}</p>

			<button
				v-if="!list.isDefault"
				type="button"
				class="editor__danger"
				@click="removeList"
			>
				{{ de ? "Liste löschen" : "Delete list" }}
			</button>
		</template>
	</section>
</template>

<style scoped>
.editor {
	display: grid;
	gap: 1rem;
	width: 100%;
}

.editor__state {
	margin: 0;
	opacity: 0.6;
}

.editor__rename {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.editor__rename input {
	flex: 1 1 18rem;
	min-width: 0;
	padding: 0.85rem 1.1rem;
	border: 0;
	border-radius: 12px;
	background-color: color-mix(in srgb, var(--color-text) 6%, transparent);
	color: inherit;
	font: inherit;

	&:focus {
		outline: none;
		background-color: color-mix(in srgb, var(--color-text) 10%, transparent);
	}
}

.editor__save {
	padding: 0.85rem 1.2rem;
	border: 0;
	border-radius: var(--pill-radius);
	background-color: var(--color-text);
	color: var(--color-bg);
	font: inherit;
	font-size: var(--small-font-size);
	letter-spacing: var(--button-letter-spacing);
	text-transform: uppercase;
	cursor: pointer;

	&:disabled {
		opacity: 0.35;
		cursor: default;
	}
}

.editor__hint {
	margin: 0;
	font-size: var(--small-font-size);
	color: var(--color-pink);
}

.editor__meta {
	margin: 0;
	font-size: var(--small-font-size);
	letter-spacing: var(--button-letter-spacing);
	text-transform: uppercase;
	color: color-mix(in srgb, var(--color-text) 45%, transparent);
}

.rows {
	margin: 0;
	padding: 0;
	list-style: none;
}

.row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.5rem 0;
	border-top: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);

	&:first-child {
		border-top: 0;
	}
}

.row__main {
	display: flex;
	align-items: center;
	gap: 0.85rem;
	flex: 1 1 auto;
	min-width: 0;
	color: inherit;
	text-decoration: none;

	&:hover .row__name {
		color: var(--color-pink);
	}
}

.row__cover {
	display: block;
	flex: none;
	width: 3.25rem;
	height: 3.25rem;
	border-radius: 5px;
	overflow: hidden;
	background-color: color-mix(in srgb, var(--color-text) 7%, transparent);

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.row__text {
	display: grid;
	gap: 0.1rem;
	min-width: 0;
}

.row__name {
	font-family: var(--font-text-medium);
	font-size: var(--base-font-size);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	transition: color var(--transition-fast);
}

.row__sub {
	font-size: var(--small-font-size);
	color: color-mix(in srgb, var(--color-text) 50%, transparent);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.row__remove {
	flex: none;
	border: 0;
	background: none;
	color: color-mix(in srgb, var(--color-text) 45%, transparent);
	font: inherit;
	font-size: var(--small-font-size);
	cursor: pointer;

	&:hover {
		color: var(--color-pink);
	}
}

.editor__danger {
	justify-self: start;
	margin-top: 0.5rem;
	padding: 0.5rem 1rem;
	border: 0;
	border-radius: var(--pill-radius);
	background-color: color-mix(in srgb, var(--color-pink) 14%, transparent);
	color: var(--color-pink);
	font: inherit;
	font-size: var(--small-font-size);
	cursor: pointer;
}
</style>

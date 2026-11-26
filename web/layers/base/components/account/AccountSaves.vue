<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { SETS_BY_IDS_QUERY } from "~~/queries/sanity.queries";

const copy = useAccountCopy();
const request = useAccountRequest();
const localePath = useLocalePath();
const { locale } = useI18n();
const de = computed(() => locale.value === "de");

type ListInfo = {
	id: string;
	name: string;
	isDefault: boolean;
	itemCount: number;
};
type ListItem = { setId: string };
type SavedItem = { setId: string; addedAt: string; listIds: string[] };
type SetCard = {
	_id: string;
	title: string | null;
	additionalTitle: string | null;
	slug: { current: string } | null;
	datetime: string | null;
	image?: { asset?: { url?: string } | null } | null;
	artists?: Array<{ _id: string; name: string | null }>;
};

const lists = ref<ListInfo[]>([]);
const saved = ref<SavedItem[]>([]);
const cards = ref<Record<string, SetCard>>({});
const thumbs = ref<Record<string, string[]>>({});
const name = ref("");
const state = ref<"loading" | "ready" | "error">("loading");
const creating = ref(false);
const message = ref("");
const nameInput = ref<HTMLInputElement | null>(null);

const savedCount = computed(() => saved.value.length);
const meta = computed(() => {
	if (!de.value) {
		return `${savedCount.value} ${savedCount.value === 1 ? "saved set" : "saved sets"} · ${lists.value.length} ${lists.value.length === 1 ? "list" : "lists"}`;
	}
	return `${savedCount.value} ${savedCount.value === 1 ? "gemerktes Set" : "gemerkte Sets"} · ${lists.value.length} ${lists.value.length === 1 ? "Liste" : "Listen"}`;
});

function imageOf(card: SetCard | undefined): string {
	return card?.image?.asset?.url ?? "";
}

function titleOf(card: SetCard | undefined): string {
	return card?.title || card?.additionalTitle || "Untitled";
}

function artistsOf(card: SetCard | undefined): string {
	const names = (card?.artists ?? [])
		.map((artist) => artist.name)
		.filter(Boolean) as string[];
	return names.join(", ");
}

function dateOf(card: SetCard | undefined): string {
	const value = card?.datetime ? new Date(card.datetime) : null;
	if (!value || Number.isNaN(value.getTime())) return "";
	return value.toLocaleDateString(de.value ? "de-DE" : "en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

function linkOf(card: SetCard | undefined): string {
	const slug = card?.slug?.current;
	return slug ? localePath(`/set/${slug}`) : localePath("/");
}

async function hydrate(ids: string[]) {
	const unique = [...new Set(ids.filter(Boolean))];
	const missing = unique.filter((id) => !(id in cards.value));
	if (missing.length === 0) return;
	try {
		const sanity = useSanity();
		const rows = (await sanity.fetch(SETS_BY_IDS_QUERY, {
			ids: missing,
		})) as SetCard[];
		const next = { ...cards.value };
		for (const row of rows) next[row._id] = row;
		cards.value = next;
	} catch {
		// A failed lookup only costs the thumbnail, never the list.
	}
}

async function load() {
	try {
		const [listsResponse, savedResponse] = await Promise.all([
			request<{ lists: ListInfo[] }>("lists"),
			request<{ items: SavedItem[]; nextCursor: string | null }>("me/saved"),
		]);
		lists.value = listsResponse.lists;
		saved.value = savedResponse.items;

		const details = await Promise.all(
			listsResponse.lists.map(async (list) => {
				try {
					const detail = await request<{ items: ListItem[] }>(
						`lists/${encodeURIComponent(list.id)}?limit=3`,
					);
					return [list.id, detail.items.map((item) => item.setId)] as const;
				} catch {
					return [list.id, [] as string[]] as const;
				}
			}),
		);
		const nextThumbs: Record<string, string[]> = {};
		for (const [listId, ids] of details) nextThumbs[listId] = ids;
		thumbs.value = nextThumbs;

		await hydrate([
			...savedResponse.items.map((item) => item.setId),
			...details.flatMap(([, ids]) => ids),
		]);
		state.value = "ready";
	} catch {
		state.value = "error";
	}
}

async function create() {
	const clean = name.value.trim();
	if (!clean || creating.value) return;
	creating.value = true;
	message.value = "";
	try {
		await request("lists", { method: "POST", body: { name: clean } });
		name.value = "";
		await load();
		nameInput.value?.focus();
	} catch {
		message.value = copy.value.nameTaken;
	} finally {
		creating.value = false;
	}
}

async function remove(setId: string) {
	try {
		await request(`me/saved/${encodeURIComponent(setId)}`, {
			method: "DELETE",
		});
		saved.value = saved.value.filter((item) => item.setId !== setId);
	} catch {
		message.value = copy.value.unavailable;
	}
}

onMounted(load);
</script>

<template>
	<div class="saves">
		<p v-if="state === 'ready'" class="saves__meta">{{ meta }}</p>

		<form class="new-list" @submit.prevent="create">
			<input
				ref="nameInput"
				v-model="name"
				:placeholder="de ? 'Name der neuen Liste' : 'Name of the new list'"
				maxlength="60"
				:aria-label="copy.listName"
			/>
			<button
				type="submit"
				class="new-list__submit"
				:disabled="!name.trim() || creating"
			>
				<span class="new-list__plus" aria-hidden="true">+</span>
				{{ de ? "Liste anlegen" : "Create list" }}
			</button>
		</form>
		<p v-if="message" class="saves__error" role="alert">{{ message }}</p>

		<p v-if="state === 'loading'" class="saves__state">…</p>
		<p v-else-if="state === 'error'" class="saves__state">
			{{ copy.unavailable }}
		</p>

		<template v-else>
			<ul class="lists">
				<li v-for="list in lists" :key="list.id">
					<NuxtLink
						:to="localePath(`/konto/listen/${list.id}`)"
						class="list-card"
					>
						<span class="list-card__thumbs" aria-hidden="true">
							<span
								v-for="(setId, index) in thumbs[list.id]?.slice(0, 3) ?? []"
								:key="`${list.id}-${setId}-${index}`"
								class="list-card__thumb"
							>
								<img
									v-if="imageOf(cards[setId])"
									:src="imageOf(cards[setId])"
									alt=""
									loading="lazy"
									decoding="async"
								>
							</span>
							<span
								v-if="!(thumbs[list.id] ?? []).length"
								class="list-card__thumb list-card__thumb--empty"
							/>
						</span>
						<span class="list-card__text">
							<span class="list-card__name">{{ list.name }}</span>
							<span class="list-card__meta">
								{{ list.itemCount }} {{ list.itemCount === 1 ? "Set" : "Sets" }}
								<span v-if="list.isDefault" class="list-card__tag">
									{{ de ? "Standard" : "Default" }}
								</span>
							</span>
						</span>
						<span class="list-card__arrow" aria-hidden="true">→</span>
					</NuxtLink>
				</li>
			</ul>

			<section class="saved">
				<h2 class="saved__title">{{ copy.savedSets }}</h2>
				<p v-if="saved.length === 0" class="saves__state">
					{{ de ? "Noch nichts gemerkt." : "Nothing saved yet." }}
				</p>
				<ul v-else class="saved__list">
					<li v-for="item in saved" :key="item.setId" class="saved__row">
						<NuxtLink :to="linkOf(cards[item.setId])" class="saved__main">
							<span class="saved__cover">
								<img
									v-if="imageOf(cards[item.setId])"
									:src="imageOf(cards[item.setId])"
									alt=""
									loading="lazy"
									decoding="async"
								>
							</span>
							<span class="saved__text">
								<span class="saved__name">{{ titleOf(cards[item.setId]) }}</span>
								<span class="saved__sub">
									{{ artistsOf(cards[item.setId]) }}
									<span v-if="artistsOf(cards[item.setId]) && dateOf(cards[item.setId])">·</span>
									{{ dateOf(cards[item.setId]) }}
								</span>
							</span>
						</NuxtLink>
						<button
							type="button"
							class="saved__remove"
							:aria-label="copy.unsave"
							@click="remove(item.setId)"
						>
							{{ copy.remove }}
						</button>
					</li>
				</ul>
			</section>
		</template>
	</div>
</template>

<style scoped>
.saves {
	display: grid;
	gap: 1.5rem;
	width: 100%;
}

.saves__meta {
	margin: 0;
	font-size: var(--small-font-size);
	letter-spacing: var(--button-letter-spacing);
	text-transform: uppercase;
	color: color-mix(in srgb, var(--color-text) 45%, transparent);
}

.saves__state {
	margin: 0;
	opacity: 0.6;
}

.saves__error {
	margin: 0;
	color: var(--color-pink);
	font-size: var(--small-font-size);
}

.new-list {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.new-list input {
	flex: 1 1 18rem;
	min-width: 0;
	padding: 0.85rem 1.1rem;
	border: 0;
	border-radius: 12px;
	background-color: color-mix(in srgb, var(--color-text) 6%, transparent);
	color: var(--color-text);
	font: inherit;

	&::placeholder {
		color: color-mix(in srgb, var(--color-text) 42%, transparent);
	}

	&:focus {
		outline: none;
		background-color: color-mix(in srgb, var(--color-text) 10%, transparent);
	}
}

.new-list__submit {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
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
	transition: background-color var(--transition-fast);

	&:disabled {
		background-color: color-mix(in srgb, var(--color-text) 8%, transparent);
		color: color-mix(in srgb, var(--color-text) 40%, transparent);
		cursor: default;
	}

	&:hover:not(:disabled) {
		background-color: var(--color-pink);
		color: #111;
	}
}

.new-list__plus {
	font-size: 1rem;
	line-height: 1;
}

.lists {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
	gap: 0.75rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.list-card {
	display: flex;
	align-items: center;
	gap: 0.9rem;
	padding: 0.85rem 1rem;
	border-radius: 12px;
	background-color: color-mix(in srgb, var(--color-text) 5%, transparent);
	color: inherit;
	text-decoration: none;
	transition: background-color var(--transition-fast);

	&:hover {
		background-color: color-mix(in srgb, var(--color-text) 9%, transparent);
	}

	&:hover .list-card__arrow {
		opacity: 1;
		transform: translateX(2px);
	}
}

.list-card__thumbs {
	display: flex;
	gap: 0.2rem;
	flex: none;
}

.list-card__thumb {
	display: block;
	width: 2.1rem;
	height: 2.1rem;
	border-radius: 5px;
	overflow: hidden;
	background-color: color-mix(in srgb, var(--color-text) 8%, transparent);

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.list-card__thumb--empty {
	background-color: color-mix(in srgb, var(--color-text) 6%, transparent);
}

.list-card__text {
	display: grid;
	gap: 0.15rem;
	min-width: 0;
}

.list-card__name {
	font-family: var(--font-text-medium);
	font-size: var(--base-font-size);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.list-card__meta {
	font-size: var(--small-font-size);
	color: color-mix(in srgb, var(--color-text) 48%, transparent);
}

.list-card__tag {
	margin-left: 0.4rem;
	padding: 0.05rem 0.4rem;
	border-radius: 999px;
	background-color: color-mix(in srgb, var(--color-pink) 18%, transparent);
	color: var(--color-pink);
	font-size: 0.625rem;
	letter-spacing: 0.06em;
	text-transform: uppercase;
}

.list-card__arrow {
	margin-left: auto;
	opacity: 0.35;
	transition:
		opacity var(--transition-fast),
		transform var(--transition-fast);
}

.saved {
	display: grid;
	gap: 0.5rem;
	margin-top: 0.5rem;
}

.saved__title {
	margin: 0;
	font-family: var(--font-text-medium);
	font-size: var(--small-font-size);
	letter-spacing: var(--button-letter-spacing);
	text-transform: uppercase;
	color: color-mix(in srgb, var(--color-text) 55%, transparent);
}

.saved__list {
	margin: 0;
	padding: 0;
	list-style: none;
}

.saved__row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.5rem 0;
	border-top: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);

	&:first-child {
		border-top: 0;
	}
}

.saved__main {
	display: flex;
	align-items: center;
	gap: 0.85rem;
	min-width: 0;
	flex: 1 1 auto;
	color: inherit;
	text-decoration: none;

	&:hover .saved__name {
		color: var(--color-pink);
	}
}

.saved__cover {
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

.saved__text {
	display: grid;
	gap: 0.1rem;
	min-width: 0;
}

.saved__name {
	font-family: var(--font-text-medium);
	font-size: var(--base-font-size);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	transition: color var(--transition-fast);
}

.saved__sub {
	font-size: var(--small-font-size);
	color: color-mix(in srgb, var(--color-text) 50%, transparent);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.saved__remove {
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

@media screen and (max-width: 600px) {
	.new-list__submit {
		width: 100%;
		justify-content: center;
	}
}
</style>

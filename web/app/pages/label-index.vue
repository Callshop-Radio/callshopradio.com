<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { about } from "~/data/label-index/about";
import labelData from "~/data/label-index/labels.json";
import type { Label, SortMode } from "~/data/label-index/types";

definePageMeta({
	bodyClass: "page--index",
	path: "/index",
});

const labels = labelData as Label[];
const route = useRoute();
const router = useRouter();
const query = ref("");
const sort = ref<SortMode>("az");
const shuffled = ref<Label[]>([...labels]);
const activeLabel = ref<Label | null>(null);
const dialogRef = ref<{ open: () => void; close: () => void } | null>(null);
let trigger: HTMLElement | null = null;

useSeoMeta({
	title: "Index — Callshop Radio",
	description: "An index of independent house and techno labels from Germany.",
});

const visible = computed(() => {
	const needle = query.value.trim().toLowerCase();
	const filtered = needle
		? labels.filter(
				(label) =>
					label.name.toLowerCase().includes(needle) ||
					label.location.toLowerCase().includes(needle),
			)
		: labels;

	const list = [...filtered];

	if (sort.value === "az") {
		list.sort((a, b) =>
			a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
		);
	} else if (sort.value === "year") {
		list.sort((a, b) => {
			const yearA = Number.parseInt(a.founded, 10) || 9999;
			const yearB = Number.parseInt(b.founded, 10) || 9999;
			return yearA - yearB;
		});
	} else {
		const order = new Map(
			shuffled.value.map((label, index) => [label.slug, index]),
		);
		list.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
	}

	return list;
});

function shuffleLabels(source: Label[]) {
	const list = [...source];
	for (let index = list.length - 1; index > 0; index -= 1) {
		const swap = Math.floor(Math.random() * (index + 1));
		const current = list[index];
		const other = list[swap];
		if (current && other) {
			list[index] = other;
			list[swap] = current;
		}
	}
	return list;
}

function setSort(value: SortMode) {
	if (value === "shuffle") {
		shuffled.value = shuffleLabels(labels);
	}
	sort.value = value;
}

async function showLabel(label: Label) {
	activeLabel.value = label;
	await nextTick();
	dialogRef.value?.open();
}

async function openLabel(label: Label, event: MouseEvent) {
	trigger = event.currentTarget as HTMLElement;
	await showLabel(label);
}

function openFromQuery() {
	const slug = String(route.query.label ?? "");
	if (!slug) return;
	const label = labels.find((item) => item.slug === slug);
	if (!label) return;
	trigger = null;
	void showLabel(label);
}

function onDialogClose() {
	activeLabel.value = null;
	nextTick(() => trigger?.focus());
	if (route.query.label) {
		const nextQuery = { ...route.query };
		delete nextQuery.label;
		void router.replace({ query: nextQuery });
	}
}

onMounted(openFromQuery);
watch(
	() => route.query.label,
	() => openFromQuery(),
);
</script>

<template>
	<div class="index-page">
		<header class="index-intro">
			<p class="index-intro__eyebrow">Label</p>
			<h1 class="index-intro__title">Index</h1>
			<p class="index-intro__lede">
				Independent house and techno labels from Germany
			</p>
			<p class="index-intro__count">{{ labels.length }} labels</p>
		</header>

		<IndexAbout :paragraphs="about" />

		<IndexFilterBar
			v-model:query="query"
			:sort="sort"
			:visible="visible.length"
			:total="labels.length"
			@update:sort="setSort"
		/>

		<ul v-if="visible.length" class="index-grid">
			<li v-for="label in visible" :key="label.slug">
				<IndexCard :label="label" @open="openLabel" />
			</li>
		</ul>
		<p v-else class="index-empty">No labels match.</p>

		<IndexDialog
			v-if="activeLabel"
			ref="dialogRef"
			:label="activeLabel"
			@close="onDialogClose"
		/>
	</div>
</template>

<style lang="postcss" scoped>
.index-page {
  --accent: var(--color-purple);

  width: 100%;
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: clamp(2rem, 6vw, 5rem) 0 clamp(3rem, 8vw, 6rem);
}

.index-intro {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.index-intro__eyebrow,
.index-intro__count {
  margin: 0;
  color: var(--color-dark-grey);
  font-size: var(--text-sm);
  letter-spacing: var(--menu-letter-spacing);
  text-transform: uppercase;
}

.index-intro__eyebrow {
  color: var(--accent, var(--color-purple));
}

.index-intro__title {
  margin: 0;
  font-family: var(--font-text-medium);
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  letter-spacing: -0.045em;
  line-height: 0.9;
  text-transform: uppercase;
}

.index-intro__lede {
  max-width: 58ch;
  margin: 0.6rem 0 0;
  font-size: var(--text-xl);
  line-height: 1.4;
}

.index-intro__count {
  margin-top: 0.4rem;
}

.index-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(0.75rem, 1.6vw, 1.5rem);
  margin: 1.5rem 0 0;
  padding: 0;
  list-style: none;
}

.index-empty {
  margin: 3rem 0;
  color: var(--color-dark-grey);
  font-size: var(--text-md);
}

@media screen and (max-width: 1100px) {
  .index-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media screen and (max-width: 760px) {
  .index-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
  }
}
</style>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const props = defineProps<{ setId: string }>();
const copy = useAccountCopy();
const request = useAccountRequest();
const account = useAccountStore();

type List = { id: string; name: string; isDefault: boolean };
const lists = ref<List[]>([]);
const selected = ref("");
const message = ref("");

onMounted(async () => {
	if (account.sessionState === "unknown") await account.loadSession();
	if (account.sessionState !== "authenticated") return;
	try {
		const response = await request<{ lists: List[] }>("lists");
		// The default list is the heart; the picker is for named lists only.
		lists.value = response.lists.filter((entry) => !entry.isDefault);
		selected.value = lists.value[0]?.id ?? "";
	} catch {
		lists.value = [];
	}
});

async function add() {
	if (!selected.value) return;
	try {
		await request(`lists/${encodeURIComponent(selected.value)}/items`, {
			method: "POST",
			body: { setId: props.setId },
		});
		await account.refresh([props.setId]);
		message.value = copy.value.saved;
	} catch {
		message.value = copy.value.unavailable;
	}
}
</script>

<template>
	<div v-if="lists.length > 0" class="save-to-list">
		<select v-model="selected" :aria-label="copy.lists">
			<option v-for="list in lists" :key="list.id" :value="list.id">{{ list.name }}</option>
		</select>
		<button type="button" class="save-to-list__button" @click="add">{{ copy.add }}</button>
		<p v-if="message" class="save-to-list__message">{{ message }}</p>
	</div>
</template>

<style scoped>
.save-to-list {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
}

select {
	padding: 0.45rem 0.7rem;
	border: 1px solid rgb(0 0 0 / 22%);
	border-radius: 999px;
	background: transparent;
	color: inherit;
	font: inherit;
	font-size: 0.85rem;
}

.save-to-list__button {
	padding: 0.45rem 0.9rem;
	border: 1px solid rgb(0 0 0 / 22%);
	border-radius: 999px;
	background: transparent;
	color: inherit;
	font: inherit;
	font-size: 0.85rem;
	cursor: pointer;
}

.save-to-list__message {
	margin: 0;
	font-size: 0.8rem;
	opacity: 0.7;
	flex-basis: 100%;
}
</style>

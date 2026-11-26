<script setup lang="ts">
const copy = useAccountCopy();
const route = useRoute();
const localePath = useLocalePath();

definePageMeta({ middleware: "account" });

const listId = computed(() => String(route.params.id ?? ""));
</script>

<template>
	<AccountShell :title="copy.lists" :eyebrow="copy.account">
		<template #actions>
			<NuxtLink :to="localePath('/konto')">{{ copy.back }}</NuxtLink>
		</template>
		<AccountListEditor v-if="listId" :list-id="listId" />
	</AccountShell>
</template>

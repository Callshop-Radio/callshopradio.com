<script setup lang="ts">
const copy = useAccountCopy();
const route = useRoute();
const localePath = useLocalePath();

definePageMeta({ middleware: "account" });

const listId = computed(() => String(route.params.id ?? ""));
</script>

<template>
	<AccountShell :title="copy.lists">
		<p>
			<NuxtLink :to="localePath('/konto/listen')">{{ copy.back }}</NuxtLink>
		</p>
		<AccountListEditor v-if="listId" :list-id="listId" />
	</AccountShell>
</template>

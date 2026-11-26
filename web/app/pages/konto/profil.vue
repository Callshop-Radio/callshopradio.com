<script setup lang="ts">
definePageMeta({ middleware: "account" });

const copy = useAccountCopy();
const localePath = useLocalePath();
</script>

<template>
	<AccountShell :title="copy.profile">
		<p>
			<NuxtLink :to="localePath('/konto')">{{ copy.back }}</NuxtLink>
		</p>
		<AccountProfile />
	</AccountShell>
</template>

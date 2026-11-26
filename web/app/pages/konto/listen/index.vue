<script setup lang="ts">
const localePath = useLocalePath();

definePageMeta({ middleware: "account" });

await navigateTo(localePath("/konto"), { replace: true });
</script>

<template>
	<div />
</template>

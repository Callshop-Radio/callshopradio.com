<script setup lang="ts">
// biome-ignore lint/style/useVueMultiWordComponentNames: route is /chat
definePageMeta({
	bodyClass: "chat-page",
});

useHead({
	title: "Chat",
});
</script>

<template>
	<ChatSection page />
</template>

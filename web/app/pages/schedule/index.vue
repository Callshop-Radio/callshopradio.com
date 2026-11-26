<script setup lang="ts">
// The old LibreTime schedule page is retired. The schedule now lives in the
// timetable popup, so this route only forwards there and opens it.
await navigateTo("/?schedule=popup&expanded=1", {
	redirectCode: 302,
	replace: true,
});
</script>

<template>
	<div />
</template>

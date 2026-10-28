<script setup lang="ts">
const copy = useAccountCopy();
const localePath = useLocalePath();
</script>

<template>
	<AccountLogin />
	<p class="account-switch">
		<NuxtLink :to="localePath('/konto')">{{ copy.account }}</NuxtLink>
	</p>
</template>

<style scoped>
.account-switch {
	text-align: center;
	padding-bottom: 3rem;
	opacity: 0.7;
}
</style>

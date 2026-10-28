<script setup lang="ts">
import { computed } from "vue";

const copy = useAccountCopy();
const localePath = useLocalePath();
const route = useRoute();

const revocationFailed = computed(() => route.query.revoked === "0");
</script>

<template>
	<AccountLogin />
	<p v-if="revocationFailed" class="account-notice">{{ copy.logoutFailed }}</p>
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

.account-notice {
	width: min(760px, 100%);
	margin: 0 auto 1.5rem;
	padding: 0 1.25rem;
	color: #b02a2a;
	text-align: center;
}
</style>

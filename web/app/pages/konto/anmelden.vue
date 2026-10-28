<script setup lang="ts">
import { computed } from "vue";

const copy = useAccountCopy();
const route = useRoute();

const revocationFailed = computed(() => route.query.revoked === "0");
</script>

<template>
	<AccountLogin />
	<p v-if="revocationFailed" class="account-notice">{{ copy.logoutFailed }}</p>
</template>

<style scoped>
.account-notice {
	width: var(--page-max-width);
	max-width: 100%;
	margin: 0 auto 3rem;
	color: var(--color-pink);
}
</style>

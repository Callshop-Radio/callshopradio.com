<script setup lang="ts">
import { computed, ref } from "vue";

import { safeNextPath } from "~/utils/accountPaths";

const copy = useAccountCopy();
const { locale } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const request = useAccountRequest();
const account = useAccountStore();

const email = ref("");
const code = ref("");
const step = ref<"email" | "code">("email");
const busy = ref(false);
const message = ref("");

const next = computed(() => safeNextPath(route.query.next));

async function requestCode() {
	if (busy.value) return;
	busy.value = true;
	message.value = "";
	try {
		await request("auth/request-code", {
			method: "POST",
			body: { email: email.value, locale: locale.value },
		});
		step.value = "code";
	} catch {
		// The manager answers generically on purpose; a mail outage is reported.
		message.value = copy.value.mailFailed;
	} finally {
		busy.value = false;
	}
}

async function verify() {
	if (busy.value) return;
	busy.value = true;
	message.value = "";
	try {
		await request("auth/verify", {
			method: "POST",
			body: { email: email.value, code: code.value },
		});
		// A different account may be signing in: drop every cached id first.
		account.reset();
		await account.loadSession();
		await navigateTo(localePath(next.value));
	} catch {
		message.value = copy.value.codeFailed;
	} finally {
		busy.value = false;
	}
}
</script>

<template>
	<AccountShell :title="copy.signInToSave">
		<form v-if="step === 'email'" class="account-form" @submit.prevent="requestCode">
			<label>
				<span>{{ copy.email }}</span>
				<input
					v-model="email"
					type="email"
					name="email"
					autocomplete="email"
					required
					:disabled="busy"
				>
			</label>
			<button type="submit" class="account-action" :disabled="busy">{{ copy.sendCode }}</button>
		</form>

		<form v-else class="account-form" @submit.prevent="verify">
			<p class="account-hint">{{ copy.codeSent }}</p>
			<label>
				<span>{{ copy.code }}</span>
				<input
					v-model="code"
					inputmode="numeric"
					pattern="[0-9]{6}"
					maxlength="6"
					autocomplete="one-time-code"
					required
					:disabled="busy"
				>
			</label>
			<button type="submit" class="account-action" :disabled="busy">{{ copy.verify }}</button>
			<button type="button" class="account-secondary" :disabled="busy" @click="step = 'email'">
				{{ copy.changeEmail }}
			</button>
		</form>

		<p v-if="message" class="account-message" role="alert">{{ message }}</p>
	</AccountShell>
</template>

<style scoped>
.account-form {
	display: grid;
	gap: 1rem;
}

label {
	display: grid;
	gap: 0.4rem;
	font-size: 0.85rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
}

input {
	padding: 0.85rem 1rem;
	border: 1px solid rgb(0 0 0 / 25%);
	border-radius: 10px;
	font-size: 1.1rem;
	background: transparent;
	color: inherit;
}

.account-action {
	padding: 0.9rem 1.2rem;
	border: 0;
	border-radius: 999px;
	background: currentColor;
	color: var(--color-bg, #fff);
	font: inherit;
	font-weight: 600;
	cursor: pointer;
}

.account-secondary {
	border: 0;
	background: none;
	color: inherit;
	opacity: 0.7;
	text-decoration: underline;
	cursor: pointer;
}

.account-hint,
.account-message {
	margin: 0;
}

.account-message {
	color: #b02a2a;
}
</style>

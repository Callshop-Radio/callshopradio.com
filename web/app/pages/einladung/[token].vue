<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import {
	inviteStep,
	inviteTokenFromRoute,
	isTotpCode,
	passwordProblem,
} from "~/utils/inviteFlow";

useSeoMeta({
	title: "Einladung — Callshop Radio",
	robots: "noindex, nofollow",
});

const copy = useAccountCopy();
const route = useRoute();
const localePath = useLocalePath();
const request = useAccountRequest();

const token = inviteTokenFromRoute(route.params.token);
const invite = ref<{ email: string; role: string; expiresAt: string } | null>(
	null,
);
const password = ref("");
const code = ref("");
const recoveryCodes = ref<string[]>([]);
const twoFactor = ref<{ secret: string; otpauthUri: string } | null>(null);
const busy = ref(false);
const message = ref("");
const invalid = ref(token === null);
const checked = ref(false);
const accepted = ref(false);
const confirmed = ref(false);
const failed = ref(false);

const step = computed(() =>
	inviteStep({
		checked: checked.value,
		invalid: invalid.value,
		accepted: accepted.value,
		confirmed: confirmed.value,
		failed: failed.value,
	}),
);

async function check() {
	if (!token || checked.value) return;
	try {
		invite.value = await request<{
			email: string;
			role: string;
			expiresAt: string;
		}>("invites/check", { method: "POST", body: { token } });
		checked.value = true;
	} catch {
		invalid.value = true;
	}
}

async function accept() {
	if (busy.value || !token) return;
	const problem = passwordProblem(password.value);
	if (problem) {
		message.value =
			problem === "short"
				? copy.value.invitePasswordTooShort
				: copy.value.invitePasswordTooShort;
		return;
	}
	busy.value = true;
	message.value = "";
	try {
		const response = await request<{
			user: { email: string; role: string };
			twoFactor: { secret: string; otpauthUri: string };
		}>("invites/accept", {
			method: "POST",
			body: { token, password: password.value },
		});
		twoFactor.value = response.twoFactor;
		accepted.value = true;
		password.value = "";
	} catch {
		// A second accept, an expired token or a role change all end here.
		invalid.value = true;
	} finally {
		busy.value = false;
	}
}

async function confirm() {
	if (busy.value || !isTotpCode(code.value)) return;
	busy.value = true;
	message.value = "";
	try {
		const response = await request<{ recoveryCodes: string[] }>(
			"me/2fa/confirm",
			{
				method: "POST",
				body: { code: code.value },
			},
		);
		recoveryCodes.value = response.recoveryCodes ?? [];
		confirmed.value = true;
	} catch {
		message.value = copy.value.inviteCodeFailed;
	} finally {
		busy.value = false;
	}
}

onMounted(check);
</script>

<template>
	<AccountShell :title="copy.inviteTitle" centered>
		<p v-if="step === 'checking'" class="invite-hint">{{ copy.inviteChecking }}</p>

		<p v-else-if="step === 'invalid'" class="invite-error" role="alert">
			{{ copy.inviteInvalid }}
		</p>

		<form v-else-if="step === 'password'" class="invite" @submit.prevent="accept">
			<p class="invite-hint">{{ copy.inviteIntro }}</p>
			<p v-if="invite" class="invite-mail">{{ invite.email }}</p>
			<label class="invite__field">
				<span>{{ copy.invitePassword }}</span>
				<input
					v-model="password"
					type="password"
					name="password"
					autocomplete="new-password"
					minlength="12"
					required
					:disabled="busy"
				>
			</label>
			<p class="invite-hint">{{ copy.invitePasswordHint }}</p>
			<p v-if="message" class="invite-error" role="alert">{{ message }}</p>
			<button type="submit" class="invite__primary" :disabled="busy">
				{{ copy.inviteAccept }}
			</button>
		</form>

		<form v-else-if="step === 'twofactor'" class="invite" @submit.prevent="confirm">
			<h2 class="invite__title">{{ copy.inviteTwoFactorTitle }}</h2>
			<p class="invite-hint">{{ copy.inviteTwoFactorIntro }}</p>
			<p v-if="twoFactor" class="invite-secret">
				<span>{{ copy.inviteSecret }}</span>
				<code>{{ twoFactor.secret }}</code>
			</p>
			<a
				v-if="twoFactor"
				class="invite-hint"
				:href="twoFactor.otpauthUri"
			>{{ copy.inviteOpenApp }}</a>
			<label class="invite__field">
				<span>{{ copy.inviteCode }}</span>
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
			<p v-if="message" class="invite-error" role="alert">{{ message }}</p>
			<button type="submit" class="invite__primary" :disabled="busy">
				{{ copy.inviteConfirm }}
			</button>
		</form>

		<div v-else-if="step === 'done'" class="invite">
			<h2 class="invite__title">{{ copy.inviteDone }}</h2>
			<p class="invite-hint">{{ copy.inviteDoneIntro }}</p>
			<ul v-if="recoveryCodes.length" class="invite-codes">
				<li v-for="entry in recoveryCodes" :key="entry"><code>{{ entry }}</code></li>
			</ul>
			<p class="invite-hint">{{ copy.inviteManagerLogin }}</p>
			<NuxtLink class="invite__primary" :to="localePath('/konto')">
				{{ copy.inviteGoAccount }}
			</NuxtLink>
		</div>

		<p v-else class="invite-error" role="alert">{{ copy.inviteInvalid }}</p>
	</AccountShell>
</template>

<style scoped>
.invite {
	display: grid;
	gap: 1rem;
	width: 100%;
	max-width: 420px;
	margin: 0 auto;
	text-align: left;
}

.invite__title {
	margin: 0;
	font-size: 1.2rem;
}

.invite__field {
	display: grid;
	gap: 0.45rem;
	font-size: 0.78rem;
	letter-spacing: 0.1em;
	text-transform: uppercase;
}

.invite__field input {
	width: 100%;
	padding: 0.95rem 1rem;
	border: 1px solid color-mix(in srgb, currentColor 28%, transparent);
	border-radius: 10px;
	background: transparent;
	color: inherit;
	font: inherit;
	font-size: 1.05rem;
	letter-spacing: normal;
	text-transform: none;
}

.invite__field input:focus {
	outline: none;
	border-color: var(--color-pink);
	background: color-mix(in srgb, var(--color-pink) 8%, transparent);
}

.invite__primary {
	justify-self: start;
	margin-top: 0.4rem;
	padding: 0.9rem 1.6rem;
	border: 0;
	border-radius: 999px;
	background: var(--color-pink);
	color: #0b0b0b;
	font: inherit;
	font-weight: 600;
	text-decoration: none;
	cursor: pointer;
}

.invite__primary:disabled {
	opacity: 0.55;
	cursor: progress;
}

.invite-hint {
	margin: 0;
	max-width: 38ch;
	font-size: 0.9rem;
	opacity: 0.72;
}

.invite-mail {
	margin: 0;
	font-weight: 600;
}

.invite-secret {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	align-items: center;
	margin: 0;
}

.invite-secret code,
.invite-codes code {
	font-size: 0.95rem;
	word-break: break-all;
}

.invite-codes {
	margin: 0;
	padding-left: 1.2rem;
	columns: 2;
}

.invite-error {
	margin: 0;
	color: var(--color-pink);
	font-size: 0.9rem;
}
</style>

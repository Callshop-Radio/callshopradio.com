<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

import { safeNextPath } from "~/utils/accountPaths";

const copy = useAccountCopy();
const { locale } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const request = useAccountRequest();
const account = useAccountStore();

const email = ref("");
const code = ref("");
const privacyAccepted = ref(false);
const step = ref<"email" | "code">("email");
const busy = ref(false);
const message = ref("");
const cooldown = ref(0);
const codeInput = ref<HTMLInputElement | null>(null);
let cooldownTimer: ReturnType<typeof setInterval> | null = null;

const next = computed(() => safeNextPath(route.query.next));
const PRIVACY_VERSION = "2026-11-11";
const maskedEmail = computed(() =>
	email.value.replace(/^(.).*(@.*)$/, "$1•••$2"),
);

function stopCooldown() {
	if (cooldownTimer) clearInterval(cooldownTimer);
	cooldownTimer = null;
}

function startCooldown() {
	stopCooldown();
	cooldown.value = 60;
	cooldownTimer = setInterval(() => {
		cooldown.value -= 1;
		if (cooldown.value <= 0) stopCooldown();
	}, 1000);
}

async function sendCode() {
	if (busy.value) return;
	if (!privacyAccepted.value) {
		message.value = copy.value.privacyRequired;
		return;
	}
	busy.value = true;
	message.value = "";
	try {
		await request("auth/request-code", {
			method: "POST",
			body: {
				email: email.value,
				locale: locale.value,
				privacyAccepted: true,
				privacyVersion: PRIVACY_VERSION,
			},
		});
		step.value = "code";
		startCooldown();
	} catch {
		message.value = copy.value.mailFailed;
	} finally {
		busy.value = false;
	}
}

async function resend() {
	if (cooldown.value > 0 || busy.value) return;
	await sendCode();
}

async function verify() {
	if (busy.value) return;
	busy.value = true;
	message.value = "";
	try {
		await request("auth/verify", {
			method: "POST",
			body: {
				email: email.value,
				code: code.value,
				privacyAccepted: privacyAccepted.value,
				privacyVersion: PRIVACY_VERSION,
			},
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

function backToEmail() {
	stopCooldown();
	cooldown.value = 0;
	code.value = "";
	message.value = "";
	step.value = "email";
}

watch(step, async (value) => {
	if (value === "code") {
		await nextTick();
		codeInput.value?.focus();
	}
});

onBeforeUnmount(stopCooldown);
</script>

<template>
	<AccountShell :title="copy.signInTitle" :subtitle="copy.signInIntro" centered>
		<Transition name="step" mode="out-in">
			<form v-if="step === 'email'" key="email" class="login" @submit.prevent="sendCode">
				<label class="login__field">
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

				<label class="login__privacy">
					<input
						v-model="privacyAccepted"
						type="checkbox"
						:disabled="busy"
					>
					<span>
						{{ copy.privacyAccept }}
						<NuxtLink
							:to="localePath('/privacy')"
							target="_blank"
							rel="noopener"
						>
							{{ copy.privacyLink }}
						</NuxtLink>.
					</span>
				</label>

				<p v-if="message" class="login__error" role="alert">{{ message }}</p>

				<button
					type="submit"
					class="login__primary"
					:disabled="busy || !privacyAccepted"
				>
					{{ copy.sendCode }}
				</button>
				<p class="login__hint">{{ copy.codeHint }}</p>
			</form>

			<form v-else key="code" class="login" @submit.prevent="verify">
				<p class="login__sent">
					{{ copy.codeSentFor }} <strong>{{ maskedEmail }}</strong>
				</p>

				<label class="login__field login__field--code">
					<span>{{ copy.code }}</span>
					<input
						ref="codeInput"
						v-model="code"
						inputmode="numeric"
						pattern="[0-9]{6}"
						maxlength="6"
						autocomplete="one-time-code"
						required
						:disabled="busy"
					>
				</label>

				<p v-if="message" class="login__error" role="alert">{{ message }}</p>

				<button type="submit" class="login__primary" :disabled="busy">
					{{ copy.verify }}
				</button>

				<div class="login__actions">
					<button type="button" :disabled="busy || cooldown > 0" @click="resend">
						{{ cooldown > 0 ? `${copy.resend} (${cooldown}s)` : copy.resend }}
					</button>
					<button type="button" :disabled="busy" @click="backToEmail">
						{{ copy.changeEmail }}
					</button>
				</div>
			</form>
		</Transition>
	</AccountShell>
</template>

<style scoped>
.login {
	display: grid;
	gap: 1rem;
	width: 100%;
	max-width: 420px;
	margin: 0 auto;
	text-align: left;
}

.login__field {
	display: grid;
	gap: 0.45rem;
	font-size: 0.78rem;
	letter-spacing: 0.1em;
	text-transform: uppercase;
}

.login__field input {
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
	transition:
		border-color 160ms ease,
		background 160ms ease;
}

.login__field input:focus {
	outline: none;
	border-color: var(--color-pink);
	background: color-mix(in srgb, var(--color-pink) 8%, transparent);
}

.login__field--code input {
	font-size: 1.5rem;
	letter-spacing: 0.4em;
	font-variant-numeric: tabular-nums;
}

.login__primary {
	justify-self: start;
	margin-top: 0.4rem;
	padding: 0.9rem 1.6rem;
	border: 0;
	border-radius: 999px;
	background: var(--color-pink);
	color: #0b0b0b;
	font: inherit;
	font-weight: 600;
	cursor: pointer;
	transition:
		transform 160ms ease,
		filter 160ms ease;
}

.login__primary:hover:not(:disabled) {
	transform: translateY(-1px);
	filter: brightness(1.08);
}

.login__primary:disabled {
	opacity: 0.55;
	cursor: progress;
}

.login__hint {
	margin: 0;
	max-width: 38ch;
	font-size: 0.85rem;
	opacity: 0.6;
}

.login__sent {
	margin: 0;
	font-size: 0.9rem;
	opacity: 0.75;
}

.login__error {
	margin: 0;
	color: var(--color-pink);
	font-size: 0.9rem;
}

.login__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 1.25rem;
}

.login__actions button {
	padding: 0;
	border: 0;
	background: none;
	color: inherit;
	font: inherit;
	font-size: 0.85rem;
	opacity: 0.7;
	text-decoration: underline;
	cursor: pointer;
}

.login__actions button:hover:not(:disabled) {
	opacity: 1;
}

.login__actions button:disabled {
	opacity: 0.35;
	cursor: default;
	text-decoration: none;
}

.step-enter-active,
.step-leave-active {
	transition:
		opacity 180ms ease,
		transform 180ms ease;
}

.step-enter-from {
	opacity: 0;
	transform: translateY(6px);
}

.step-leave-to {
	opacity: 0;
	transform: translateY(-6px);
}
</style>

<style scoped>
.login__privacy {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  font-size: 0.85rem;
  line-height: 1.45;
  opacity: 0.85;
  cursor: pointer;
}

.login__privacy input {
  flex: none;
  width: 1rem;
  height: 1rem;
  margin-top: 0.15rem;
  accent-color: var(--color-pink);
  cursor: pointer;
}

.login__privacy a {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.login__privacy a:hover {
  color: var(--color-pink);
}
</style>

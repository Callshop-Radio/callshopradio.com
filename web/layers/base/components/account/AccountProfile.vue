<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";

const copy = useAccountCopy();
const request = useAccountRequest();
const account = useAccountStore();
const localePath = useLocalePath();
const emit = defineEmits<{ updated: [] }>();

type Profile = {
	id: number;
	email: string | null;
	displayName: string | null;
	role: string;
	locale: "de" | "en";
	avatarUpdatedAt: string | null;
	counts: { savedSets: number; lists: number };
};

const profile = ref<Profile | null>(null);
const form = reactive({ displayName: "", locale: "en" as "de" | "en" });
const state = ref<"loading" | "ready" | "error">("loading");
const savedMessage = ref("");
const avatarVersion = ref(0);

async function load() {
	try {
		const response = await request<{ listener: Profile }>("me");
		profile.value = response.listener;
		form.displayName = response.listener.displayName ?? "";
		form.locale = response.listener.locale;
		state.value = "ready";
	} catch {
		state.value = "error";
	}
}

async function save() {
	savedMessage.value = "";
	try {
		const response = await request<{ listener: Profile }>("me", {
			method: "PATCH",
			body: { displayName: form.displayName || null, locale: form.locale },
		});
		profile.value = response.listener;
		savedMessage.value = copy.value.saved;
		emit("updated");
	} catch {
		savedMessage.value = copy.value.codeFailed;
	}
}

async function upload(event: Event) {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	const type = ["image/jpeg", "image/png", "image/webp"].includes(file.type)
		? file.type
		: "";
	if (!type) {
		savedMessage.value = copy.value.avatarType;
		return;
	}
	await request("me/avatar", {
		method: "PUT",
		body: file,
		headers: { "content-type": type },
	});
	avatarVersion.value += 1;
	await load();
	emit("updated");
	input.value = "";
}

async function removeAvatar() {
	await request("me/avatar", { method: "DELETE" });
	avatarVersion.value += 1;
	await load();
	emit("updated");
}

async function exportData() {
	const payload = await request<Record<string, unknown>>("me/export");
	const blob = new Blob([JSON.stringify(payload, null, 2)], {
		type: "application/json",
	});
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "callshop-konto.json";
	link.click();
	URL.revokeObjectURL(link.href);
}

async function removeAccount() {
	if (!window.confirm(copy.value.deleteConfirm)) return;
	await request("me", { method: "DELETE" });
	account.reset();
	await navigateTo(localePath("/"));
}

const avatarSrc = computed(() =>
	profile.value?.avatarUpdatedAt
		? `/api/account/me/avatar?v=${avatarVersion.value}`
		: "",
);

onMounted(load);
</script>

<template>
	<div class="profile">
		<p v-if="state === 'loading'" class="profile__state">�</p>
		<p v-else-if="state === 'error'" class="profile__state">
			{{ copy.unavailable }}
		</p>

		<template v-else>
			<div class="profile__avatar-row">
				<img v-if="avatarSrc" :src="avatarSrc" alt="" class="profile__avatar">
				<div v-else class="profile__avatar profile__avatar--empty">
					{{ (profile?.displayName || profile?.email || "?").slice(0, 1) }}
				</div>
				<div class="profile__avatar-actions">
					<label class="pill">
						{{ copy.uploadAvatar }}
						<input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="upload">
					</label>
					<button v-if="avatarSrc" type="button" class="link" @click="removeAvatar">
						{{ copy.removeAvatar }}
					</button>
					<span class="profile__hint">{{ copy.avatarType }}</span>
				</div>
			</div>

			<form class="profile__form" @submit.prevent="save">
				<label class="profile__field">
					<span>{{ copy.name }}</span>
					<input v-model="form.displayName" maxlength="60" autocomplete="nickname">
				</label>
				<label class="profile__field">
					<span>{{ copy.language }}</span>
					<select v-model="form.locale">
						<option value="de">Deutsch</option>
						<option value="en">English</option>
					</select>
				</label>
				<button type="submit" class="pill pill--solid">
					{{ copy.saveChanges }}
				</button>
			</form>
			<p v-if="savedMessage" class="profile__saved">{{ savedMessage }}</p>

			<div class="profile__links">
				<button type="button" class="link" @click="exportData">
					{{ copy.exportData }}
				</button>
				<button type="button" class="link link--danger" @click="removeAccount">
					{{ copy.deleteAccount }}
				</button>
			</div>
		</template>
	</div>
</template>

<style scoped>
.profile {
	display: grid;
	gap: 1.75rem;
	width: 100%;
	max-width: 46rem;
}

.profile__state {
	margin: 0;
	opacity: 0.6;
}

.profile__avatar-row {
	display: flex;
	align-items: center;
	gap: 1.25rem;
}

.profile__avatar {
	width: 5.5rem;
	height: 5.5rem;
	border-radius: 50%;
	object-fit: cover;
	background-color: color-mix(in srgb, var(--color-text) 8%, transparent);
}

.profile__avatar--empty {
	display: grid;
	place-items: center;
	font-family: var(--font-text-semibold);
	font-size: 2rem;
	text-transform: uppercase;
	color: color-mix(in srgb, var(--color-text) 55%, transparent);
}

.profile__avatar-actions {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.5rem;
}

.profile__hint {
	font-size: var(--small-font-size);
	color: color-mix(in srgb, var(--color-text) 42%, transparent);
}

.profile__form {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
	gap: 1rem;
	align-items: end;
}

.profile__field {
	display: grid;
	gap: 0.4rem;
	font-size: var(--small-font-size);
	letter-spacing: var(--button-letter-spacing);
	text-transform: uppercase;
	color: color-mix(in srgb, var(--color-text) 55%, transparent);
}

.profile__field input,
.profile__field select {
	width: 100%;
	padding: 0.85rem 1.1rem;
	border: 0;
	border-radius: var(--radius-surface);
	background-color: color-mix(in srgb, var(--color-text) 6%, transparent);
	color: var(--color-text);
	font: inherit;
	font-size: var(--base-font-size);
	letter-spacing: normal;
	text-transform: none;

	&:focus {
		outline: none;
		background-color: color-mix(in srgb, var(--color-text) 10%, transparent);
	}
}

.pill {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0.6rem 1.1rem;
	border: 0;
	border-radius: var(--radius-pill);
	background-color: color-mix(in srgb, var(--color-text) 8%, transparent);
	color: inherit;
	font: inherit;
	font-size: var(--small-font-size);
	letter-spacing: var(--button-letter-spacing);
	text-transform: uppercase;
	cursor: pointer;
	transition: background-color var(--transition-fast);

	&:hover {
		background-color: color-mix(in srgb, var(--color-text) 14%, transparent);
	}
}

.pill--solid {
	grid-column: 1 / -1;
	justify-self: start;
	background-color: var(--color-text);
	color: var(--color-bg);

	&:hover {
		background-color: var(--color-pink);
		color: var(--color-black);
	}
}

.profile__saved {
	margin: 0;
	font-size: var(--small-font-size);
	color: var(--color-pink);
}

.profile__links {
	display: flex;
	flex-wrap: wrap;
	gap: 1.25rem;
	padding-top: 0.5rem;
	border-top: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
}

.link {
	padding: 0;
	border: 0;
	background: none;
	color: color-mix(in srgb, var(--color-text) 55%, transparent);
	font: inherit;
	font-size: var(--small-font-size);
	cursor: pointer;

	&:hover {
		color: var(--color-text);
	}
}

.link--danger:hover {
	color: var(--color-pink);
}
</style>
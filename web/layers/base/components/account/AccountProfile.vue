<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";

const copy = useAccountCopy();
const request = useAccountRequest();
const account = useAccountStore();
const localePath = useLocalePath();

type Profile = {
	id: string;
	email: string | null;
	displayName: string | null;
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
	input.value = "";
}

async function removeAvatar() {
	await request("me/avatar", { method: "DELETE" });
	avatarVersion.value += 1;
	await load();
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
	<div class="account-profile">
		<p v-if="state === 'loading'">…</p>
		<p v-else-if="state === 'error'">{{ copy.unavailable }}</p>

		<template v-else>
			<div class="avatar-row">
				<img v-if="avatarSrc" :src="avatarSrc" alt="" class="avatar">
				<div v-else class="avatar avatar--empty">{{ (profile?.displayName || profile?.email || "?").slice(0, 1) }}</div>
				<div class="avatar-actions">
					<label class="account-secondary">
						{{ copy.uploadAvatar }}
						<input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="upload">
					</label>
					<button v-if="avatarSrc" type="button" class="account-secondary" @click="removeAvatar">
						{{ copy.removeAvatar }}
					</button>
				</div>
			</div>

			<form class="account-form" @submit.prevent="save">
				<label>
					<span>{{ copy.name }}</span>
					<input v-model="form.displayName" maxlength="60" autocomplete="nickname">
				</label>
				<label>
					<span>{{ copy.language }}</span>
					<select v-model="form.locale">
						<option value="de">Deutsch</option>
						<option value="en">English</option>
					</select>
				</label>
				<button type="submit" class="account-action">{{ copy.saveChanges }}</button>
			</form>
			<p v-if="savedMessage" class="account-hint">{{ savedMessage }}</p>

			<div class="account-links">
				<button type="button" class="account-secondary" @click="exportData">{{ copy.exportData }}</button>
				<button type="button" class="account-secondary account-danger" @click="removeAccount">
					{{ copy.deleteAccount }}
				</button>
			</div>
		</template>
	</div>
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

input,
select {
	padding: 0.8rem 1rem;
	border: 1px solid rgb(0 0 0 / 22%);
	border-radius: 10px;
	background: transparent;
	color: inherit;
	font: inherit;
}

.account-action {
	padding: 0.85rem 1.2rem;
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
	opacity: 0.75;
	text-decoration: underline;
	cursor: pointer;
	font: inherit;
}

.account-danger {
	color: #b02a2a;
}

.account-links {
	display: flex;
	flex-wrap: wrap;
	gap: 1.5rem;
}

.avatar-row {
	display: flex;
	align-items: center;
	gap: 1.25rem;
}

.avatar {
	width: 96px;
	height: 96px;
	border-radius: 50%;
	object-fit: cover;
	background: rgb(0 0 0 / 8%);
}

.avatar--empty {
	display: grid;
	place-items: center;
	font-size: 2rem;
	text-transform: uppercase;
}

.avatar-actions {
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
	align-items: flex-start;
}

.account-hint {
	margin: 0;
	opacity: 0.75;
}
</style>

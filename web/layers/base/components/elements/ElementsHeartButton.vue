<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { useAccountStore } from "~/stores/accountStore";

const props = withDefaults(
	defineProps<{
		setId: string;
		variant?: "overlay" | "inline";
	}>(),
	{ variant: "overlay" },
);

const account = useAccountStore();
const copy = useAccountCopy();
const { openLogin } = useAccountUi();
const request = useAccountRequest();
const { track } = useAccountTracking();

type List = { id: string; name: string; isDefault: boolean };

const PLUS_WINDOW_MS = 4000;

const mode = ref<"idle" | "plus">("idle");
const popping = ref(false);
const menuOpen = ref(false);
const menuStyle = ref<Record<string, string>>({});
const buttonRef = ref<HTMLButtonElement | null>(null);
const busy = ref(false);
const lists = ref<List[]>([]);
let plusTimer: ReturnType<typeof setTimeout> | null = null;
let popTimer: ReturnType<typeof setTimeout> | null = null;

const saved = computed(() => props.setId in account.saved);
const memberLists = computed(() => account.saved[props.setId] ?? []);
const hasNamedList = computed(() =>
	memberLists.value.some((id) => id !== account.defaultListId),
);
const label = computed(() =>
	saved.value ? copy.value.unsave : copy.value.save,
);

function clearTimers() {
	if (plusTimer) clearTimeout(plusTimer);
	if (popTimer) clearTimeout(popTimer);
	plusTimer = null;
	popTimer = null;
}

function schedulePlus() {
	clearTimers();
	popping.value = true;
	popTimer = setTimeout(() => {
		popping.value = false;
	}, 450);
	plusTimer = setTimeout(() => {
		mode.value = "idle";
	}, PLUS_WINDOW_MS);
}

async function toggle() {
	if (mode.value === "plus") {
		await openMenu();
		return;
	}

	if (account.sessionState === "unknown") await account.loadSession();
	if (account.sessionState !== "authenticated") {
		// v1 deliberately does not replay the mutation after login.
		openLogin();
		return;
	}

	if (
		saved.value &&
		hasNamedList.value &&
		!window.confirm(copy.value.unsaveEverywhere)
	) {
		return;
	}

	busy.value = true;
	const wasSaved = saved.value;
	try {
		await account.toggle(props.setId);
	} finally {
		busy.value = false;
	}

	if (saved.value !== wasSaved) {
		track(saved.value ? "set-saved" : "set-unsaved", {
			setId: props.setId,
			source: "heart",
		});
	}
	// Saving turns the heart into a short-lived plus for the list menu.
	if (saved.value && !wasSaved) {
		mode.value = "plus";
		schedulePlus();
	}
}

async function openMenu() {
	if (menuOpen.value) return;
	clearTimers();
	try {
		const response = await request<{ lists: List[] }>("lists");
		lists.value = response.lists;
	} catch {
		lists.value = [];
	}
	menuOpen.value = true;
	// Anchor the popover to the icon, kept inside the viewport.
	const rect = buttonRef.value?.getBoundingClientRect();
	const width = 220;
	const height = 220;
	if (rect) {
		const left = Math.min(
			Math.max(8, rect.left),
			window.innerWidth - width - 8,
		);
		const below = rect.bottom + 8;
		const top =
			below + height > window.innerHeight - 8
				? Math.max(8, rect.top - height - 8)
				: below;
		menuStyle.value = {
			left: `${Math.round(left)}px`,
			top: `${Math.round(top)}px`,
		};
	}
}

function closeMenu() {
	menuOpen.value = false;
	mode.value = "idle";
}

async function toggleList(list: List) {
	if (busy.value) return;
	busy.value = true;
	const included = memberLists.value.includes(list.id);
	try {
		if (included) {
			await request(
				`lists/${encodeURIComponent(list.id)}/items/${encodeURIComponent(props.setId)}`,
				{
					method: "DELETE",
				},
			);
		} else {
			await request(`lists/${encodeURIComponent(list.id)}/items`, {
				method: "POST",
				body: { setId: props.setId },
			});
			track("set-saved", {
				setId: props.setId,
				source: "list-menu",
				listId: list.id,
			});
		}
		await account.refresh([props.setId]);
	} finally {
		busy.value = false;
	}
}

onBeforeUnmount(clearTimers);
</script>

<template>
	<div class="heart" :class="[`heart--${variant}`]">
		<button
			ref="buttonRef"
			type="button"
			class="heart__button"
			:class="{ 'is-saved': saved, 'is-popping': popping, 'is-plus': mode === 'plus' }"
			:aria-pressed="saved"
			:aria-label="mode === 'plus' ? copy.addToList : label"
			:aria-haspopup="mode === 'plus' ? 'menu' : undefined"
			:aria-expanded="mode === 'plus' ? menuOpen : undefined"
			:disabled="busy"
			@click.stop.prevent="toggle"
		>
			<span class="heart__icons">
				<Transition name="icon">
					<svg
					v-if="mode === 'plus'"
					key="plus"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						d="M12 5v14M5 12h14"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
				<svg
					v-else
					key="heart"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					:fill="saved ? 'currentColor' : 'none'"
					stroke="currentColor"
					stroke-width="1.7"
					aria-hidden="true"
				>
					<path
						d="M12 20.2 4.9 13a4.6 4.6 0 0 1 6.5-6.5l.6.6.6-.6A4.6 4.6 0 0 1 19.1 13Z"
						stroke-linejoin="round"
					/>
				</svg>
				</Transition>
			</span>
		</button>

		<Teleport to="body">
			<Transition name="menu">
				<div v-if="menuOpen" class="heart__layer">
					<div class="heart__backdrop" @click="closeMenu" />
					<div
						class="heart__menu"
						role="menu"
						:class="`heart__menu--${variant}`"
						:style="menuStyle"
					>
						<button
							v-for="list in lists"
							:key="list.id"
							type="button"
							role="menuitemcheckbox"
							class="heart__item"
							:aria-checked="memberLists.includes(list.id)"
							:disabled="busy"
							@click="toggleList(list)"
						>
							<span>{{ list.name }}</span>
							<svg
								v-if="memberLists.includes(list.id)"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									d="m5 12 5 5 9-10"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</button>
						<p v-if="lists.length === 0" class="heart__empty">{{ copy.noLists }}</p>
					</div>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<style scoped>
.heart {
	display: inline-flex;
	position: relative;
}

.heart--overlay {
	position: absolute;
	top: 6px;
	right: 6px;
	z-index: 3;
}

.heart__button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	padding: 0;
	border: 0;
	background: none;
	color: inherit;
	cursor: pointer;
	opacity: 0.62;
	transition:
		opacity 180ms ease,
		color 180ms ease,
		transform 180ms ease;
}

.heart--overlay .heart__button {
	filter: drop-shadow(0 1px 3px rgb(0 0 0 / 65%));
}

.heart__button:hover {
	opacity: 1;
	transform: scale(1.1);
}

.heart__button:focus-visible {
	outline: 2px solid currentColor;
	outline-offset: 2px;
	border-radius: 999px;
}

.heart__button.is-saved,
.heart__button.is-plus {
	color: var(--color-pink);
	opacity: 1;
}

.heart__button.is-popping svg {
	animation: heart-pop 450ms cubic-bezier(0.2, 0.8, 0.3, 1.4);
}

.heart__button:disabled {
	cursor: progress;
}

@keyframes heart-pop {
	0% {
		transform: scale(1);
	}
	40% {
		transform: scale(1.5);
	}
	100% {
		transform: scale(1);
	}
}

.heart__icons {
	display: grid;
	place-items: center;
}

.heart__icons > * {
	grid-area: 1 / 1;
}

.icon-enter-active,
.icon-leave-active {
	transition:
		transform 220ms cubic-bezier(0.2, 0.8, 0.3, 1.15),
		opacity 160ms ease;
}

.icon-enter-from {
	transform: scale(0.55) rotate(-10deg);
	opacity: 0;
}

.icon-leave-to {
	transform: scale(0.55) rotate(10deg);
	opacity: 0;
}

.heart__layer {
	position: fixed;
	inset: 0;
	z-index: 60;
}

.heart__backdrop {
	position: absolute;
	inset: 0;
	background: transparent;
}

.heart__menu {
	position: fixed;
	min-width: 220px;
	max-width: min(320px, 82vw);
	max-height: 60vh;
	overflow-y: auto;
	padding: 0.35rem;
	border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
	border-radius: 12px;
	background: var(--color-bg);
	box-shadow: 0 18px 40px rgb(0 0 0 / 45%);
	transform-origin: top left;
}

.heart__item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	width: 100%;
	padding: 0.55rem 0.7rem;
	border: 0;
	border-radius: 8px;
	background: none;
	color: inherit;
	font: inherit;
	text-align: left;
	cursor: pointer;
	transition: background 140ms ease;
}

.heart__item:hover {
	background: color-mix(in srgb, currentColor 10%, transparent);
}

.heart__empty {
	margin: 0;
	padding: 0.7rem;
	opacity: 0.65;
	font-size: 0.9rem;
}

.menu-enter-active,
.menu-leave-active {
	transition: opacity 160ms ease;
}

.menu-enter-active .heart__menu,
.menu-leave-active .heart__menu {
	transition:
		transform 180ms cubic-bezier(0.2, 0.8, 0.3, 1.1),
		opacity 160ms ease;
}

.menu-enter-from,
.menu-leave-to {
	opacity: 0;
}

.menu-enter-from .heart__menu,
.menu-leave-to .heart__menu {
	transform: scale(0.94);
	opacity: 0;
}
</style>

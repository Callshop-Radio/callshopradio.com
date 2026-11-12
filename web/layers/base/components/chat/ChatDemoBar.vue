<script setup lang="ts">
defineProps<{
	signedIn: boolean;
	hostActive: boolean;
}>();

const emit = defineEmits<{
	signin: [];
	signout: [];
	"host-join": [];
	"host-leave": [];
	simulate: [];
	reset: [];
}>();
</script>

<template>
	<div class="chat-demo">
		<span class="chat-demo__label">Chat-Demo</span>

		<button
			v-if="!signedIn"
			type="button"
			class="chat-demo__btn"
			@click="emit('signin')"
		>
			Anmelden
		</button>
		<button
			v-else
			type="button"
			class="chat-demo__btn"
			@click="emit('signout')"
		>
			Abmelden
		</button>

		<button
			v-if="!hostActive"
			type="button"
			class="chat-demo__btn"
			@click="emit('host-join')"
		>
			Host kommt
		</button>
		<button
			v-else
			type="button"
			class="chat-demo__btn"
			@click="emit('host-leave')"
		>
			Host geht
		</button>

		<button
			type="button"
			class="chat-demo__btn"
			@click="emit('simulate')"
		>
			Nachricht
		</button>

		<button type="button" class="chat-demo__btn" @click="emit('reset')">
			Reset
		</button>
	</div>
</template>

<style lang="postcss" scoped>
button {
	font: inherit;
	color: inherit;
	background: transparent;
	border: 0;
	padding: 0;
	cursor: pointer;
}

.chat-demo {
	position: fixed;
	left: 0.75rem;
	bottom: calc(0.75rem + var(--player-bar-height));
	z-index: 1200;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.25rem;
	padding: 0.375rem 0.5rem;
	border-radius: 8px;
	background-color: rgba(17, 17, 17, 0.92);
	color: #fff;
	font-family: system-ui, sans-serif;
	font-size: 11px;
	line-height: 1;
	box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
	backdrop-filter: blur(6px);
}

.chat-demo__label {
	letter-spacing: 0.06em;
	color: #f794b3;
	padding-right: 0.25rem;
}

.chat-demo__btn {
	font: inherit;
	padding: 0.25rem 0.4375rem;
	border-radius: 5px;
	border: 1px solid rgba(255, 255, 255, 0.25);
	background-color: transparent;
	color: inherit;
	cursor: pointer;

	&:hover {
		background-color: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.5);
	}
}
</style>

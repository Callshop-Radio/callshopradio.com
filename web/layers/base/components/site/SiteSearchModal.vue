<script setup>
const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(["update:modelValue", "close"]);

const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

const handleClose = () => {
	isOpen.value = false;
	emit("close");
};

const handleSelect = (_result) => {
	handleClose();
};

// Close on escape key
const handleKeydown = (event) => {
	if (event.key === "Escape") {
		handleClose();
	}
};

// Add/remove event listener based on open state
watch(isOpen, (newValue) => {
	if (newValue) {
		document.addEventListener("keydown", handleKeydown);
		// Prevent body scroll when modal is open
		document.body.style.overflow = "hidden";
	} else {
		document.removeEventListener("keydown", handleKeydown);
		document.body.style.overflow = "";
	}
});

// Cleanup on unmount
onUnmounted(() => {
	document.removeEventListener("keydown", handleKeydown);
	document.body.style.overflow = "";
});
</script>

<template>
	<Teleport to="body">
		<Transition name="search-modal">
			<div
				v-if="isOpen"
				class="search-modal-overlay"
				@click.self="handleClose"
			>
				<div class="search-modal-container">
					<SiteSearch
						:is-modal="true"
						:auto-focus="true"
						@close="handleClose"
						@select="handleSelect"
					/>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style lang="postcss" scoped>
.search-modal-overlay {
  position: fixed;
  /* Start below the sticky navbar so the header (and the search toggle) stays
     visible and clickable while the modal is open. */
  top: var(--nav-height);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 999998;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);

  @media (max-width: 900px) {
    padding-top: var(--base-padding);
    padding-left: var(--base-padding);
    padding-right: var(--base-padding);
  }
}

.search-modal-container {
  width: 100%;
  max-width: 600px;
  animation: slideDown 0.2s ease-out;
}

/* Transition animations */
.search-modal-enter-active,
.search-modal-leave-active {
  transition: all 0.2s ease;
}

.search-modal-enter-from,
.search-modal-leave-to {
  opacity: 0;
}

.search-modal-enter-from .search-modal-container,
.search-modal-leave-to .search-modal-container {
  transform: translateY(-20px) scale(0.95);
}

@keyframes slideDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .search-modal-overlay {
    background: rgba(0, 0, 0, 0.7);
  }
}
</style>

<script setup>
import { useMainStore } from "~/stores/mainStore";

const props = defineProps({
	_type: {
		type: String,
		default: "",
	},
	type: {
		type: String,
		default: "external",
	},
	href: {
		type: String,
		default: "",
	},
	url: {
		type: String,
		default: "",
	},
	blank: {
		type: Boolean,
		default: false,
	},
	route: {
		type: String,
		default: "",
	},
	slug: {
		type: [String, Object],
		default: "",
	},
	parentSlug: {
		type: String,
		default: "",
	},
	setSlug: {
		type: String,
		default: "",
	},
	refType: {
		type: String,
		default: "",
	},
	reference: {
		type: Object,
		default: null,
	},
	func: {
		type: String,
		default: "",
	},
});

const { localizedSanityPath } = useSanityLink();
const { $CC } = useNuxtApp();
const mainStore = useMainStore();

const linkTarget = computed(() => {
	if (props.type === "internal") {
		return localizedSanityPath({
			type: props.type,
			route: props.route || undefined,
			slug: props.slug,
			parentSlug: props.parentSlug || undefined,
			setSlug: props.setSlug || undefined,
			refType: props.refType || undefined,
			reference: props.reference || undefined,
		});
	}

	if (props.type === "external") {
		return props.href || props.url || "#";
	}

	return "#";
});

const onClick = (event) => {
	if (props.type !== "function" && props._type !== "linkCookie") return;

	event.preventDefault();

	if (props.func === "cookie" || props._type === "linkCookie") {
		if (!mainStore?.siteCookieBanner?.useCookieBanner) {
			console.warn("Cookie banner triggered but not enabled.");
			return;
		}
		$CC.showPreferences();
	}
};
</script>

<template>
	<a
		v-if="type === 'function' || _type === 'linkCookie'"
		href="#"
		class="link-style"
		@click="onClick"
	><slot /></a>
	<NuxtLink
		v-else
		:to="linkTarget"
		:target="blank && type === 'external' ? '_blank' : undefined"
		:rel="blank && type === 'external' ? 'noopener' : undefined"
	><slot /></NuxtLink>
</template>

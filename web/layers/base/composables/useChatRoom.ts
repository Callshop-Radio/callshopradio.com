// The public room. In production it reads the Manager through the small BFF
// (`/api/chat/*`); in the local preview it can still run on mock data so the
// window can be designed without a backend. Posting is not wired yet: that
// needs the listener-account BFF.

import {
	CHAT_PACKS,
	type ChatPack,
	type ChatSticker,
} from "~~/layers/base/data/chatPacks";

export type ChatRole = "listener" | "host" | "editor" | "admin";

export interface ChatAuthor {
	id: string;
	name: string;
	initials: string;
	role: ChatRole;
}

export interface ChatTrack {
	id: string;
	artist: string | null;
	title: string | null;
}

export interface ChatMessage {
	id: number;
	kind: "text" | "sticker" | "event" | "track";
	author: ChatAuthor | null;
	body: string;
	sticker: ChatSticker | null;
	track?: ChatTrack | null;
	time: string;
	deleted?: boolean;
}

export interface ChatHost {
	name: string;
	showTitle: string;
}

interface ServerMessage {
	id: number;
	kind: "text" | "sticker" | "event" | "track";
	role: ChatRole | null;
	name: string | null;
	body: string | null;
	sticker: {
		slug: string;
		alt: string;
		w: number;
		h: number;
		url: string;
	} | null;
	track?: { id: string; artist: string | null; title: string | null } | null;
	at: string;
	deleted: boolean;
}

const STICKER_INDEX = new Map<string, ChatSticker>(
	CHAT_PACKS.flatMap((pack) => pack.stickers.map((s) => [s.slug, s])),
);

const sticker = (slug: string): ChatSticker | null =>
	STICKER_INDEX.get(slug) ?? null;

const author = (
	id: string,
	name: string,
	role: ChatRole = "listener",
): ChatAuthor => ({
	id,
	name,
	initials: name.slice(0, 2).toUpperCase(),
	role,
});

const SEED = (): ChatMessage[] => [
	{
		id: 1,
		kind: "text",
		author: author("nina", "Nina"),
		body: "läuft das bei euch auch so warm rein heute?",
		sticker: null,
		time: "20:12",
	},
	{
		id: 2,
		kind: "text",
		author: author("jonas", "Jonas"),
		body: "was war das für ein Track vorhin? so ein shuffle-ding",
		sticker: null,
		time: "20:14",
	},
	{
		id: 3,
		kind: "event",
		author: null,
		body: "Mara ist jetzt im Chat.",
		sticker: null,
		time: "20:15",
	},
	{
		id: 4,
		kind: "text",
		author: author("mara", "Mara", "host"),
		body: "Jonas, das war Flexible – Sexdub. Steht gleich in der Tracklist.",
		sticker: null,
		time: "20:16",
	},
	{
		id: 5,
		kind: "sticker",
		author: author("timo", "Timo"),
		body: "",
		sticker: sticker("emotigoodmeal"),
		time: "20:17",
	},
	{
		id: 6,
		kind: "text",
		author: author("alina", "Alina"),
		body: "hallo aus leipzig 👋 erste mali hier",
		sticker: null,
		time: "20:19",
	},
	{
		id: 7,
		kind: "text",
		author: author("nina", "Nina"),
		body: "willkommen!",
		sticker: null,
		time: "20:20",
	},
	{
		id: 8,
		kind: "sticker",
		author: author("timo", "Timo"),
		body: "",
		sticker: sticker("emotiwave"),
		time: "20:21",
	},
	{
		id: 9,
		kind: "text",
		author: author("jonas", "Jonas"),
		body: "danke mara 🙏",
		sticker: null,
		time: "20:23",
	},
];

const INCOMING = [
	{ name: "Alina", body: "der übergang gerade war fies gut" },
	{ name: "Timo", body: "bleibt die sendung noch bis 22?" },
	{ name: "Nina", body: "die sticker sind ja mal herrlich" },
	{ name: "Oskar", body: "höre zum ersten mal rein, sehr schön hier" },
];

let pollTimer: ReturnType<typeof setTimeout> | null = null;
let polling = false;

const timeOf = (iso: string) => {
	const date = new Date(iso);
	return Number.isNaN(date.getTime())
		? ""
		: date.toLocaleTimeString("de-DE", {
				hour: "2-digit",
				minute: "2-digit",
			});
};

const toMessage = (dto: ServerMessage): ChatMessage => {
	if (dto.kind === "track") {
		return {
			id: dto.id,
			kind: "track",
			author: null,
			body: "",
			sticker: null,
			track: dto.track || null,
			time: timeOf(dto.at),
			deleted: dto.deleted,
		};
	}
	if (dto.kind === "event") {
		return {
			id: dto.id,
			kind: "event",
			author: null,
			body: dto.body || "",
			sticker: null,
			time: timeOf(dto.at),
		};
	}
	const name = dto.name || "Gast";
	return {
		id: dto.id,
		kind: dto.kind,
		author: {
			id: String(dto.id),
			name,
			initials: name.slice(0, 2).toUpperCase(),
			role: dto.role || "listener",
		},
		body: dto.body || "",
		sticker: dto.sticker
			? {
					slug: dto.sticker.slug,
					alt: dto.sticker.alt,
					src: dto.sticker.url,
					w: dto.sticker.w,
					h: dto.sticker.h,
				}
			: null,
		time: timeOf(dto.at),
		deleted: dto.deleted,
	};
};

const toPack = (pack: {
	slug: string;
	title: string;
	stickers: Array<{
		slug: string;
		alt: string;
		w: number;
		h: number;
		url: string;
	}>;
}): ChatPack => ({
	slug: pack.slug,
	title: pack.title,
	stickers: pack.stickers.map((entry) => ({
		slug: entry.slug,
		alt: entry.alt,
		src: entry.url,
		w: entry.w,
		h: entry.h,
	})),
});

export const useChatRoom = () => {
	const config = useRuntimeConfig();
	const localePath = useLocalePath();
	const real = Boolean(config.public.chatReal);

	const packs = useState<ChatPack[]>("chat-packs", () =>
		real ? [] : CHAT_PACKS,
	);
	const messages = useState<ChatMessage[]>("chat-mock-messages", () =>
		real ? [] : SEED(),
	);
	const signedIn = useState<boolean>("chat-mock-signed-in", () => false);
	const host = useState<ChatHost | null>("chat-mock-host", () =>
		real ? null : { name: "Mara", showTitle: "Bassline Diaries" },
	);
	const people = useState<Array<{ name: string; role: ChatRole }>>(
		"chat-people",
		() =>
			real
				? []
				: [
						{ name: "Nina", role: "listener" },
						{ name: "Jonas", role: "listener" },
						{ name: "Timo", role: "listener" },
						{ name: "Alina", role: "listener" },
						{ name: "Oskar", role: "listener" },
						{ name: "Mara", role: "host" },
					],
	);
	const cursor = useState<{ after: number; since: string | null }>(
		"chat-cursor",
		() => ({ after: 0, since: null }),
	);
	const packsVersion = useState<string | null>(
		"chat-packs-version",
		() => null,
	);
	const loaded = useState<boolean>("chat-loaded", () => !real);

	const me = computed<ChatAuthor | null>(() =>
		signedIn.value ? author("me", "Lena", "listener") : null,
	);
	const displayPeople = computed(() =>
		signedIn.value && !real
			? [...people.value, { name: "Lena", role: "listener" as ChatRole }]
			: people.value,
	);
	const online = computed(() => displayPeople.value.length);
	const peopleNames = computed(() =>
		displayPeople.value.map((person) => person.name).join(", "),
	);

	const clock = () =>
		new Date().toLocaleTimeString("de-DE", {
			hour: "2-digit",
			minute: "2-digit",
		});

	const nextId = () =>
		messages.value.reduce((max, m) => Math.max(max, m.id), 0) + 1;

	const push = (message: Omit<ChatMessage, "id">) => {
		messages.value = [...messages.value, { ...message, id: nextId() }];
	};

	const sendText = (body: string) => {
		if (real) return;
		const text = body.trim().slice(0, 500);
		if (!text || !me.value) return;
		push({
			kind: "text",
			author: me.value,
			body: text,
			sticker: null,
			time: clock(),
		});
	};

	const sendSticker = (stickerSlug: string) => {
		if (real) return;
		const chosen = sticker(stickerSlug);
		if (!chosen || !me.value) return;
		push({
			kind: "sticker",
			author: me.value,
			body: "",
			sticker: chosen,
			time: clock(),
		});
	};

	const signIn = () => {
		if (real) {
			window.location.assign(localePath("/konto/anmelden"));
			return;
		}
		signedIn.value = true;
	};

	const signOut = () => {
		signedIn.value = false;
	};

	const hostJoin = () => {
		if (real || host.value) return;
		host.value = { name: "Mara", showTitle: "Bassline Diaries" };
		push({
			kind: "event",
			author: null,
			body: "Mara ist jetzt im Chat.",
			sticker: null,
			time: clock(),
		});
	};

	const hostLeave = () => {
		if (real || !host.value) return;
		host.value = null;
		push({
			kind: "event",
			author: null,
			body: "Mara hat den Chat verlassen. Der Raum bleibt offen.",
			sticker: null,
			time: clock(),
		});
	};

	const simulateIncoming = () => {
		if (real) return;
		const pick = INCOMING[messages.value.length % INCOMING.length];
		if (!pick) return;
		const known = messages.value.find(
			(m) => m.author?.name === pick.name,
		)?.author;
		push({
			kind: "text",
			author: known ?? author(pick.name.toLowerCase(), pick.name),
			body: pick.body,
			sticker: null,
			time: clock(),
		});
	};

	const reset = () => {
		if (real) return;
		messages.value = SEED();
		signedIn.value = false;
		host.value = { name: "Mara", showTitle: "Bassline Diaries" };
	};

	const loadPacks = async () => {
		const data = await $fetch<{ packs: Parameters<typeof toPack>[0][] }>(
			"/api/chat/packs",
		);
		packs.value = (data.packs || []).map(toPack);
	};

	const applyState = (data: {
		now: string;
		messages: ServerMessage[];
		deleted: Array<{ id: number }>;
		presence: {
			hosts: Array<{ name: string; showTitle: string | null }>;
			team?: Array<{ name: string; role: string | null }>;
			people?: Array<{ name: string; role: string | null }>;
			staff: number;
			online: number;
		};
		packsVersion: string | null;
	}) => {
		const byId = new Map(
			messages.value.map((message) => [message.id, message]),
		);
		for (const dto of data.messages || []) byId.set(dto.id, toMessage(dto));
		for (const gone of data.deleted || []) {
			const message = byId.get(gone.id);
			if (message) {
				byId.set(gone.id, {
					...message,
					deleted: true,
					body: "",
					sticker: null,
				});
			}
		}
		messages.value = [...byId.values()].sort((a, b) => a.id - b.id).slice(-200);

		const newest = messages.value.at(-1)?.id ?? 0;
		cursor.value = { after: newest, since: data.now };

		const firstHost = data.presence?.hosts?.[0];
		host.value = firstHost
			? {
					name: firstHost.name,
					showTitle: firstHost.showTitle || "",
				}
			: null;
		people.value = (data.presence?.people || []).map((person) => ({
			name: person.name,
			role: (person.role || "listener") as ChatRole,
		}));

		if (data.packsVersion && data.packsVersion !== packsVersion.value) {
			packsVersion.value = data.packsVersion;
			loadPacks().catch(() => {});
		}
		loaded.value = true;
	};

	const poll = async () => {
		try {
			const data = await $fetch<Parameters<typeof applyState>[0]>(
				"/api/chat/state",
				{
					query: {
						...(cursor.value.after ? { after: cursor.value.after } : {}),
						...(cursor.value.since ? { since: cursor.value.since } : {}),
					},
				},
			);
			applyState(data);
		} catch {
			// Keep the last visible state; retry on the slower interval.
		}
		pollTimer = setTimeout(poll, 3000);
	};

	if (real) {
		onMounted(() => {
			if (polling) return;
			polling = true;
			loadPacks().catch(() => {});
			poll();
		});
		onBeforeUnmount(() => {
			polling = false;
			if (pollTimer) clearTimeout(pollTimer);
			pollTimer = null;
		});
	}

	return {
		real,
		loaded,
		packs,
		messages,
		signedIn,
		me,
		host,
		online,
		people: displayPeople,
		peopleNames,
		sendText,
		sendSticker,
		signIn,
		signOut,
		hostJoin,
		hostLeave,
		simulateIncoming,
		reset,
	};
};

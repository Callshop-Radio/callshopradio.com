import type { H3Event } from "h3";
import {
	createError,
	deleteCookie,
	getCookie,
	getQuery,
	readBody,
	setCookie,
} from "h3";

import { ACCOUNT_COOKIE } from "./accountSession";

/**
 * Local-only stand-in for the manager's site API. The production manager still
 * speaks the older listener API, so a local sign-in cannot be completed against
 * it. In `nuxt dev` these mocks answer instead; production is untouched.
 *
 * Disable with NUXT_DEV_MOCK=0.
 */
export function isDevMock(): boolean {
	return (
		process.env.NODE_ENV !== "production" && process.env.NUXT_DEV_MOCK !== "0"
	);
}

const TOKEN = `usr_${"devmock".padEnd(43, "0")}`;

type List = {
	id: string;
	name: string;
	isDefault: boolean;
	itemCount: number;
};

const account = {
	signedIn: false,
	pendingEmail: "",
	email: "listener@example.com",
	displayName: "Test Listener",
	locale: "en",
};

const lists: List[] = [
	{ id: "l1", name: "Favorites", isDefault: true, itemCount: 0 },
];
let nextListId = 2;

function user() {
	return {
		id: 1,
		displayName: account.displayName,
		email: account.email,
		role: "listener",
		locale: account.locale,
		avatarUpdatedAt: null,
		counts: { savedSets: 0, lists: lists.length },
	};
}

function requireAccount(event: H3Event) {
	if (getCookie(event, ACCOUNT_COOKIE) !== TOKEN) {
		throw createError({ statusCode: 401, statusMessage: "unauthenticated" });
	}
}

function listOf(id: string): List {
	const list = lists.find((entry) => entry.id === id);
	if (!list) throw createError({ statusCode: 404, statusMessage: "not_found" });
	return list;
}

export async function mockAccount(
	event: H3Event,
	path: string,
	method: string,
) {
	const verb = method.toUpperCase();

	if (path === "status" && verb === "GET") return { enabled: true };

	if (path === "auth/request-code" && verb === "POST") {
		const body = (await readBody(event).catch(() => ({}))) as {
			email?: string;
		};
		account.pendingEmail = String(body?.email ?? "");
		return { ok: true };
	}

	if (path === "auth/verify" && verb === "POST") {
		const body = (await readBody(event).catch(() => ({}))) as {
			email?: string;
			code?: string;
		};
		if (!/^\d{6}$/.test(String(body?.code ?? ""))) {
			throw createError({ statusCode: 400, statusMessage: "code_invalid" });
		}
		account.signedIn = true;
		account.email =
			account.pendingEmail || String(body?.email ?? account.email);
		setCookie(event, ACCOUNT_COOKIE, TOKEN, {
			httpOnly: true,
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60 * 24 * 7,
		});
		return { ok: true };
	}

	if (path === "auth/logout" && verb === "POST") {
		account.signedIn = false;
		deleteCookie(event, ACCOUNT_COOKIE, { path: "/" });
		return { revoked: true };
	}

	if (path === "invites/check" || path === "invites/accept") {
		throw createError({ statusCode: 404, statusMessage: "not_found" });
	}

	requireAccount(event);

	if (path === "me" && verb === "GET") return { user: user() };

	if (path === "me" && verb === "PATCH") {
		const body = (await readBody(event).catch(() => ({}))) as {
			displayName?: string | null;
			locale?: string;
		};
		account.displayName = body?.displayName ?? account.displayName;
		account.locale = body?.locale ?? account.locale;
		return { user: user() };
	}

	if (path === "me" && verb === "DELETE") {
		account.signedIn = false;
		deleteCookie(event, ACCOUNT_COOKIE, { path: "/" });
		return { ok: true };
	}

	if (path === "me/export") {
		return { user: user(), lists, saved: {} };
	}

	if (path === "me/avatar") {
		if (verb === "GET") {
			throw createError({ statusCode: 404, statusMessage: "not_found" });
		}
		return { ok: true };
	}

	if (path === "me/saved-ids") {
		return { saved: {}, defaultListId: lists[0]?.id ?? null };
	}

	if (/^me\/saved\/[^/]+$/.test(path)) {
		return verb === "PUT" ? { listId: lists[0]?.id ?? null } : { ok: true };
	}

	if (path === "lists" && verb === "GET") return { lists };

	if (path === "lists" && verb === "POST") {
		const body = (await readBody(event).catch(() => ({}))) as {
			name?: string;
		};
		const list: List = {
			id: `l${nextListId++}`,
			name: String(body?.name ?? "Liste"),
			isDefault: false,
			itemCount: 0,
		};
		lists.push(list);
		return { list };
	}

	const listMatch = /^lists\/([^/]+)$/.exec(path);
	if (listMatch) {
		const list = listOf(listMatch[1]);
		if (verb === "GET") return { list, items: [], nextCursor: null };
		if (verb === "PATCH") {
			const body = (await readBody(event).catch(() => ({}))) as {
				name?: string;
			};
			if (body?.name) list.name = String(body.name);
			return { list };
		}
		if (verb === "DELETE") {
			const index = lists.findIndex((entry) => entry.id === list.id);
			if (index >= 0) lists.splice(index, 1);
			return { ok: true };
		}
	}

	if (/^lists\/[^/]+\/(items|order)/.test(path)) return { ok: true };
	if (
		path === "me/2fa/confirm" ||
		path === "me/live" ||
		path === "me/live/token"
	) {
		return { ok: true };
	}

	throw createError({ statusCode: 404, statusMessage: "not_found" });
}

// --- Chat mock -----------------------------------------------------------

type MockChatMessage = {
	id: number;
	kind: "text" | "event";
	body: string;
	at: string;
	name?: string;
	role?: string;
};

const chat: {
	messages: MockChatMessage[];
	nextId: number;
	packsVersion: string;
} = {
	messages: [
		{
			id: 1,
			kind: "text",
			name: "Nina",
			role: "listener",
			body: "läuft das bei euch auch so warm rein heute?",
			at: new Date(Date.now() - 18 * 60_000).toISOString(),
		},
		{
			id: 2,
			kind: "event",
			body: "Mara ist jetzt im Chat.",
			at: new Date(Date.now() - 15 * 60_000).toISOString(),
		},
		{
			id: 3,
			kind: "text",
			name: "Mara",
			role: "host",
			body: "Jonas, das war Flexible – Sexdub. Steht gleich in der Tracklist.",
			at: new Date(Date.now() - 8 * 60_000).toISOString(),
		},
	],
	nextId: 4,
	packsVersion: "dev-packs",
};

export async function mockChat(event: H3Event, route: string, method: string) {
	const verb = method.toUpperCase();

	if (route === "state" && verb === "GET") {
		const query = getQuery(event);
		const after = Number(query.after ?? 0);
		return {
			now: new Date().toISOString(),
			messages: chat.messages.filter((message) => message.id > after),
			deleted: [],
			presence: {
				hosts: [{ name: "Mara", showTitle: "Bassline Diaries" }],
				team: [{ name: "Mara", role: "host" }],
				people: [{ name: "Nina", role: "listener" }],
				staff: 1,
				online: 2,
			},
			packsVersion: chat.packsVersion,
		};
	}

	if (route === "packs" && verb === "GET") return { packs: [] };

	if (route === "messages" && verb === "POST") {
		if (getCookie(event, ACCOUNT_COOKIE) !== TOKEN) {
			throw createError({ statusCode: 401, statusMessage: "unauthenticated" });
		}
		const body = (await readBody(event).catch(() => ({}))) as {
			body?: string;
		};
		const text = String(body?.body ?? "")
			.trim()
			.slice(0, 500);
		if (!text) {
			throw createError({ statusCode: 400, statusMessage: "empty_message" });
		}
		const message: MockChatMessage = {
			id: chat.nextId++,
			kind: "text",
			name: account.displayName || "Test Listener",
			role: "listener",
			body: text,
			at: new Date().toISOString(),
		};
		chat.messages.push(message);
		return { message };
	}

	throw createError({ statusCode: 404, statusMessage: "not_found" });
}

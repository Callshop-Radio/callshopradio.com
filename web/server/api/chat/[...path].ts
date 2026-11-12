import type { H3Event } from "h3";
import {
	createError,
	defineEventHandler,
	getRequestURL,
	setHeader,
	setResponseStatus,
} from "h3";

import { isDevMock, mockChat } from "../../utils/devMock";

/**
 * Read-only bridge between the local website and the Manager chat.
 *
 * Posting needs a listener token and therefore the account BFF; until that is
 * merged this route only exposes the public room (state + packs) so the site
 * can be designed against the real, empty room instead of mock data.
 */

const ALLOWED = new Set(["GET state", "GET packs"]);
const TIMEOUT_MS = 15_000;

function routeFromEvent(event: H3Event): string {
	const path = getRequestURL(event).pathname.replace(/^\/api\/chat\/?/, "");
	return path.replace(/\/+$/, "");
}

export default defineEventHandler(async (event) => {
	const method = String(event.method ?? "GET").toUpperCase();
	const route = routeFromEvent(event);

	setHeader(event, "cache-control", "no-store");

	if (isDevMock()) {
		return await mockChat(event, route, method);
	}

	if (!ALLOWED.has(`${method} ${route}`)) {
		throw createError({ statusCode: 404, statusMessage: "not_found" });
	}

	const config = useRuntimeConfig(event) as {
		managerBaseUrl?: string;
		chatClientSecret?: string;
	};
	const base = String(
		config.managerBaseUrl || "https://air.callshopradio.live",
	).replace(/\/+$/, "");
	const secret = String(config.chatClientSecret ?? "");

	if (!base || !secret) {
		throw createError({
			statusCode: 503,
			statusMessage: "chat_unavailable",
		});
	}

	const upstream = await $fetch.raw(`${base}/api/listener/v1/chat/${route}`, {
		method: "GET",
		headers: {
			"x-listener-client": secret,
			accept: "application/json",
		},
		ignoreResponseError: true,
		timeout: TIMEOUT_MS,
	});

	setResponseStatus(event, upstream.status);
	return upstream._data;
});

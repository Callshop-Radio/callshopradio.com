import type { H3Event } from "h3";
import {
	createError,
	defineEventHandler,
	getHeader,
	getRequestURL,
	readRawBody,
	setHeader,
	setResponseStatus,
} from "h3";

import { tokenFromCookieHeader } from "../../utils/accountSession";
import { isDevMock, mockChat } from "../../utils/devMock";

/**
 * Bridge between the website and the Manager chat. Reads are public; posting a
 * message needs the listener session that the account BFF stored in the
 * `callshop_user` cookie, which is forwarded as a bearer token.
 */

const ALLOWED = new Set(["GET state", "GET packs", "POST messages"]);
const TIMEOUT_MS = 15_000;
const BODY_LIMIT = 16 * 1024;

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

	const token = tokenFromCookieHeader(getHeader(event, "cookie"));
	if (method === "POST" && !token) {
		throw createError({ statusCode: 401, statusMessage: "unauthenticated" });
	}

	const declared = Number(getHeader(event, "content-length") ?? 0);
	if (declared > BODY_LIMIT) {
		throw createError({ statusCode: 413, statusMessage: "payload_too_large" });
	}
	const rawBody =
		method === "POST" ? await readRawBody(event, false) : undefined;
	if (rawBody && rawBody.length > BODY_LIMIT) {
		throw createError({ statusCode: 413, statusMessage: "payload_too_large" });
	}

	const headers: Record<string, string> = {
		"x-listener-client": secret,
		accept: "application/json",
	};
	if (token) headers.authorization = `Bearer ${token}`;
	if (rawBody && rawBody.length > 0)
		headers["content-type"] = "application/json";

	const upstream = await $fetch.raw(`${base}/api/listener/v1/chat/${route}`, {
		method,
		headers,
		body: rawBody && rawBody.length > 0 ? new Uint8Array(rawBody) : undefined,
		ignoreResponseError: true,
		timeout: TIMEOUT_MS,
	});

	setResponseStatus(event, upstream.status);
	return upstream._data;
});

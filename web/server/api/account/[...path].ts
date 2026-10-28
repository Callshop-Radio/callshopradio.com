import type { H3Event } from "h3";
import {
	appendResponseHeader,
	createError,
	defineEventHandler,
	getHeader,
	readRawBody,
	setHeader,
	setResponseStatus,
} from "h3";

import { accountIpKey } from "../../utils/listenerClientIp";
import {
	LISTENER_COOKIE,
	tokenFromCookieHeader,
} from "../../utils/listenerSession";
import {
	isAllowedAccountRoute,
	normalizeAccountPath,
	originAllowed,
	upstreamHeaders,
} from "../../utils/managerFetch";

const TIMEOUT_MS = 15_000;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export default defineEventHandler(async (event) => {
	const method = String(event.method ?? "GET").toUpperCase();
	const path = normalizeAccountPath(event.path);
	setHeader(event, "cache-control", "no-store");

	if (!isAllowedAccountRoute(method, path)) {
		throw createError({ statusCode: 404, statusMessage: "not_found" });
	}

	const config = useRuntimeConfig(event) as {
		managerBaseUrl?: string;
		accountClientSecret?: string;
		accountIpSecret?: string;
		accountAllowedOrigins?: string;
	};

	const base = String(config.managerBaseUrl ?? "").replace(/\/+$/, "");
	const clientSecret = String(config.accountClientSecret ?? "");
	if (!base || !clientSecret) {
		throw createError({
			statusCode: 503,
			statusMessage: "account_unavailable",
		});
	}

	if (
		!SAFE_METHODS.has(method) &&
		!originAllowed(
			getHeader(event, "origin"),
			String(config.accountAllowedOrigins ?? ""),
		)
	) {
		throw createError({ statusCode: 403, statusMessage: "origin_rejected" });
	}

	const token = tokenFromCookieHeader(getHeader(event, "cookie"));
	const isLogin = path.startsWith("auth/");
	const isPublic = isLogin || path === "status";

	if (!isPublic && !token) {
		throw createError({ statusCode: 401, statusMessage: "unauthenticated" });
	}

	let ipKey: string | null = null;
	if (isLogin) {
		ipKey = accountIpKey(event, String(config.accountIpSecret ?? ""));
		if (!ipKey) {
			throw createError({
				statusCode: 503,
				statusMessage: "client_ip_unavailable",
			});
		}
	}

	const body = SAFE_METHODS.has(method)
		? undefined
		: await readRawBody(event, false);
	const queryIndex = String(event.path ?? "").indexOf("?");
	const search = queryIndex === -1 ? "" : String(event.path).slice(queryIndex);

	let response: Response;
	try {
		response = await fetch(`${base}/api/listener/v1/${path}${search}`, {
			method,
			headers: upstreamHeaders({
				token,
				ipKey,
				clientSecret,
				contentType: getHeader(event, "content-type"),
				accept: getHeader(event, "accept"),
			}),
			body: body && body.length > 0 ? new Uint8Array(body) : undefined,
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});
	} catch {
		if (path === "auth/logout") {
			clearCookie(event);
			return { revoked: false };
		}
		// Keep the session: a manager outage is not a logout.
		throw createError({
			statusCode: 502,
			statusMessage: "upstream_unavailable",
		});
	}

	const expiresAt = response.headers.get("x-listener-expires-at");
	if (token && expiresAt) {
		writeCookie(event, token, new Date(expiresAt));
	}
	if (response.status === 401) {
		clearCookie(event);
	}

	if (path === "auth/logout") {
		clearCookie(event);
		return { revoked: response.ok };
	}

	const responseType = String(response.headers.get("content-type") ?? "");
	setResponseStatus(event, response.status);

	if (responseType.startsWith("image/")) {
		setHeader(event, "content-type", responseType);
		return Buffer.from(await response.arrayBuffer());
	}

	if (responseType.includes("application/json")) {
		const data = (await response.json()) as Record<string, unknown> & {
			token?: string;
			expiresAt?: string;
		};
		if (path === "auth/verify" && response.ok && data?.token) {
			writeCookie(event, data.token, new Date(String(data.expiresAt)));
			delete data.token;
		}
		return data;
	}

	return await response.text();
});

function writeCookie(event: H3Event, token: string, expiresAt: Date) {
	const maxAge = Math.max(
		0,
		Math.floor((expiresAt.getTime() - Date.now()) / 1000),
	);
	appendResponseHeader(
		event,
		"set-cookie",
		`${LISTENER_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`,
	);
}

function clearCookie(event: H3Event) {
	appendResponseHeader(
		event,
		"set-cookie",
		`${LISTENER_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
	);
}

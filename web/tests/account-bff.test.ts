import assert from "node:assert/strict";
import test from "node:test";
import {
	accountIpKeyFor,
	clientIpFrom,
	isIp,
} from "../server/utils/accountClientIp.ts";
import {
	ACCOUNT_COOKIE,
	copySetCookies,
	sessionCookieOptions,
	tokenFromCookieHeader,
} from "../server/utils/accountSession.ts";
import {
	isAllowedAccountRoute,
	normalizeAccountPath,
	originAllowed,
	upstreamHeaders,
} from "../server/utils/managerFetch.ts";

const ALLOWED: Array<[string, string]> = [
	["POST", "auth/request-code"],
	["POST", "auth/verify"],
	["POST", "auth/logout"],
	["POST", "invites/check"],
	["POST", "invites/accept"],
	["GET", "status"],
	["GET", "me"],
	["PATCH", "me"],
	["DELETE", "me"],
	["GET", "me/export"],
	["GET", "me/avatar"],
	["PUT", "me/avatar"],
	["DELETE", "me/avatar"],
	["POST", "me/2fa/confirm"],
	["GET", "me/live"],
	["POST", "me/live/token"],
	["GET", "me/saved"],
	["PUT", "me/saved/set-a"],
	["DELETE", "me/saved/set-a"],
	["GET", "me/saved-ids"],
	["GET", "lists"],
	["POST", "lists"],
	["PATCH", "lists/order"],
	["GET", "lists/abc"],
	["PATCH", "lists/abc"],
	["DELETE", "lists/abc"],
	["POST", "lists/abc/items"],
	["DELETE", "lists/abc/items/set-a"],
	["PATCH", "lists/abc/order"],
];

test("the BFF exposes exactly the contract routes", () => {
	for (const [method, path] of ALLOWED) {
		assert.equal(
			isAllowedAccountRoute(method, path),
			true,
			`${method} ${path}`,
		);
	}
	for (const [method, path] of [
		["GET", "auth/verify"],
		["POST", "status"],
		["POST", "me"],
		["GET", "me/saved/set-a"],
		["PUT", "lists/abc"],
		["GET", "lists/abc/items"],
		["GET", "lists/abc/items/set-a"],
		["GET", "lists/abc/order"],
		["GET", "me/live/token"],
		["PUT", "me/live/token"],
		["GET", "invites/check"],
		["POST", "invites/accept/extra"],
		["GET", "admin/users"],
		["POST", "users/1/role"],
		["POST", "users/1/invite"],
		["GET", "me/../admin"],
	] as Array<[string, string]>) {
		assert.equal(
			isAllowedAccountRoute(method, path),
			false,
			`${method} ${path}`,
		);
	}
});

test("path normalization strips the prefix and rejects traversal", () => {
	assert.equal(normalizeAccountPath("/api/account/me"), "me");
	assert.equal(normalizeAccountPath("/api/account/lists/abc/"), "lists/abc");
	assert.equal(normalizeAccountPath("/api/account//me"), "");
	assert.equal(normalizeAccountPath("/api/account/me/../x"), "");
	assert.equal(normalizeAccountPath("/api/account/"), "");
	assert.equal(normalizeAccountPath("/api/other/me"), "");
});

test("upstream headers carry only the BFF-owned values", () => {
	const headers = upstreamHeaders({
		token: "usr_x",
		ipKey: "abc",
		clientSecret: "secret",
		contentType: "application/json; charset=utf-8",
		accept: "application/json",
	});
	assert.deepEqual(headers, {
		"x-site-client": "secret",
		"x-site-ip-key": "abc",
		authorization: "Bearer usr_x",
		"content-type": "application/json",
		accept: "application/json",
	});
	assert.equal(
		upstreamHeaders({ clientSecret: "secret" }).authorization,
		undefined,
	);
});

test("origins must be on the private allowlist", () => {
	assert.equal(
		originAllowed(
			"https://callshopradio.com",
			"https://callshopradio.com,https://www.callshopradio.com",
		),
		true,
	);
	assert.equal(
		originAllowed("https://evil.example", "https://callshopradio.com"),
		false,
	);
	assert.equal(originAllowed(undefined, "https://callshopradio.com"), false);
	assert.equal(originAllowed("https://callshopradio.com", ""), false);
});

test("the client ip comes from the provider, never from a request header", () => {
	assert.equal(isIp("203.0.113.7"), true);
	assert.equal(isIp("2a01:4f8::1"), true);
	assert.equal(isIp("999.1.1.1"), false);
	assert.equal(isIp("not-an-ip"), false);

	const env = {} as Record<string, string | undefined>;
	assert.equal(
		clientIpFrom({
			contextIp: "203.0.113.7",
			headers: { "x-listener-ip-key": "1".repeat(64) },
			env,
		}),
		"203.0.113.7",
	);
	assert.equal(
		clientIpFrom({
			headers: { "x-nf-client-connection-ip": "198.51.100.9" },
			env,
		}),
		null,
		"header is ignored outside the Netlify runtime",
	);
	assert.equal(
		clientIpFrom({
			headers: { "x-nf-client-connection-ip": "198.51.100.9" },
			env: { NETLIFY: "true" },
		}),
		"198.51.100.9",
	);
	assert.equal(
		clientIpFrom({
			headers: {},
			env: { NUXT_ACCOUNT_DEV_MODE: "1", NODE_ENV: "production" },
		}),
		null,
		"dev fallback never applies in production",
	);
	assert.equal(
		clientIpFrom({
			headers: { "x-listener-dev-ip": "1.2.3.4" },
			env: { NUXT_ACCOUNT_DEV_MODE: "1", NODE_ENV: "development" },
		}),
		"127.0.0.1",
		"dev mode ignores caller-supplied values",
	);
});

test("the ip key is a stable hmac and depends on the secret", () => {
	const one = accountIpKeyFor("203.0.113.7", "secret-one");
	const two = accountIpKeyFor("203.0.113.7", "secret-one");
	const three = accountIpKeyFor("203.0.113.7", "secret-two");
	assert.match(one, /^[a-f0-9]{64}$/);
	assert.equal(one, two);
	assert.notEqual(one, three);
});

test("the session cookie is host-only, secure, httponly and lax", () => {
	const now = Date.parse("2026-10-28T10:00:00Z");
	const options = sessionCookieOptions(new Date(now + 90 * 24 * 3600_000), now);
	assert.equal(options.httpOnly, true);
	assert.equal(options.secure, true);
	assert.equal(options.sameSite, "lax");
	assert.equal(options.path, "/");
	assert.equal(options.maxAge, 90 * 24 * 3600);
	assert.equal(sessionCookieOptions(new Date(now - 1000), now).maxAge, 0);
});

test("only a well-formed account token is read from the cookie header", () => {
	const token = `usr_${"a".repeat(43)}`;
	assert.equal(
		tokenFromCookieHeader(`a=1; callshop_user=${token}; b=2`),
		token,
	);
	assert.equal(tokenFromCookieHeader("callshop_user=short"), null);
	assert.equal(tokenFromCookieHeader(undefined), null);
	assert.equal(tokenFromCookieHeader(`callshop_listener=${token}`), null);
	assert.equal(tokenFromCookieHeader("callshop_session=staff"), null);
});

test("the SSR cookie copy only forwards the account cookie", () => {
	const headers = new Headers();
	headers.append("set-cookie", `${ACCOUNT_COOKIE}=usr_x; Path=/; HttpOnly`);
	headers.append("set-cookie", "callshop_session=staff; Path=/; HttpOnly");
	const copied: string[] = [];
	assert.equal(
		copySetCookies(headers, (value) => copied.push(value)),
		1,
	);
	assert.match(copied[0] ?? "", /callshop_user=/);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
	ACCOUNT_COOKIE,
	copySetCookies,
} from "../server/utils/accountSession.ts";

function headers(...values: string[]): Headers {
	const instance = new Headers();
	for (const value of values) instance.append("set-cookie", value);
	return instance;
}

test("SSR forwards account cookie renewals onto the document response", () => {
	const copied: string[] = [];
	const count = copySetCookies(
		headers(
			`${ACCOUNT_COOKIE}=usr_${"a".repeat(43)}; Path=/; Max-Age=100; HttpOnly; Secure; SameSite=Lax`,
		),
		(value) => copied.push(value),
	);
	assert.equal(count, 1);
	assert.match(copied[0] ?? "", /callshop_user=usr_/);
});

test("SSR copies a deletion but never a staff session cookie", () => {
	const copied: string[] = [];
	const count = copySetCookies(
		headers(
			"callshop_session=staff; Path=/; HttpOnly",
			`${ACCOUNT_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
		),
		(value) => copied.push(value),
	);
	assert.equal(count, 1);
	assert.match(copied[0] ?? "", /Max-Age=0/);
	assert.ok(copied.every((value) => !value.startsWith("callshop_session=")));
});

test("a response without set-cookie forwards nothing", () => {
	let calls = 0;
	assert.equal(
		copySetCookies(headers(), () => (calls += 1)),
		0,
	);
	assert.equal(calls, 0);
});

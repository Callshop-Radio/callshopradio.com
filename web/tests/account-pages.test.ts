import assert from "node:assert/strict";
import test from "node:test";

import { safeNextPath } from "../app/utils/accountPaths.ts";

test("same-site paths survive the login redirect", () => {
	assert.equal(safeNextPath("/konto/listen"), "/konto/listen");
	assert.equal(safeNextPath("/de/shows/abc?x=1"), "/de/shows/abc?x=1");
	assert.equal(safeNextPath(["/konto/profil"]), "/konto/profil");
});

test("protocol-relative and absolute urls fall back to the account page", () => {
	for (const value of [
		"//evil.example",
		"https://evil.example",
		"/\\evil.example",
		"javascript:alert(1)",
		"konto",
		"",
		null,
		undefined,
		"x".repeat(600),
	]) {
		assert.equal(safeNextPath(value), "/konto", String(value));
	}
	assert.equal(safeNextPath("//evil.example", "/konto/anmelden"), "/konto/anmelden");
});

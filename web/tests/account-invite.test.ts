import assert from "node:assert/strict";
import test from "node:test";

import {
	inviteStep,
	inviteTokenFromRoute,
	isTotpCode,
	normalizeTotpCode,
	passwordProblem,
} from "../app/utils/inviteFlow.ts";

const TOKEN = `inv_${"a".repeat(43)}`;

test("only a 32-byte invite token from the path is accepted", () => {
	assert.equal(inviteTokenFromRoute(TOKEN), TOKEN);
	assert.equal(inviteTokenFromRoute([TOKEN]), TOKEN);
	assert.equal(inviteTokenFromRoute(` ${TOKEN} `), TOKEN);
	for (const value of [
		"",
		"inv_short",
		`inv_${"a".repeat(42)}`,
		`inv_${"a".repeat(44)}`,
		`inv_${"a".repeat(42)}+`,
		"usr_" + "a".repeat(43),
		null,
		undefined,
		42,
	]) {
		assert.equal(inviteTokenFromRoute(value), null, String(value));
	}
});

test("the password policy is length 12 and nothing else", () => {
	assert.equal(passwordProblem("x".repeat(12)), null);
	assert.equal(passwordProblem("correct horse battery staple"), null);
	assert.equal(passwordProblem("x".repeat(11)), "short");
	assert.equal(passwordProblem(""), "short");
	assert.equal(passwordProblem(null), "short");
	assert.equal(passwordProblem("x".repeat(201)), "long");
});

test("the invite screen cannot skip a step", () => {
	assert.equal(inviteStep({}), "checking");
	assert.equal(inviteStep({ checked: true }), "password");
	assert.equal(inviteStep({ checked: true, accepted: true }), "twofactor");
	assert.equal(
		inviteStep({ checked: true, accepted: true, confirmed: true }),
		"done",
	);
	assert.equal(inviteStep({ checked: true, invalid: true }), "invalid");
	assert.equal(inviteStep({ checked: true, failed: true }), "error");
	// A failing check wins over everything: a replay never reaches the form.
	assert.equal(
		inviteStep({
			checked: true,
			accepted: true,
			confirmed: true,
			invalid: true,
		}),
		"invalid",
	);
});

test("authenticator codes are six digits", () => {
	assert.equal(normalizeTotpCode(" 123 456 "), "123456");
	assert.equal(isTotpCode("123456"), true);
	assert.equal(isTotpCode("123 456"), true);
	assert.equal(isTotpCode("12345"), false);
	assert.equal(isTotpCode("1234567"), false);
	assert.equal(isTotpCode("abcdef"), false);
	assert.equal(isTotpCode(null), false);
});

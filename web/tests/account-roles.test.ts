import assert from "node:assert/strict";
import test from "node:test";

import {
	ACCOUNT_ROLES,
	isAccountRole,
	isStaffRole,
	roleLabel,
} from "../app/utils/accountRole.ts";

test("every pool role has a badge label in both languages", () => {
	for (const role of ACCOUNT_ROLES) {
		assert.notEqual(roleLabel(role, "de"), "", role);
		assert.notEqual(roleLabel(role, "en"), "", role);
	}
	assert.equal(roleLabel("listener", "de"), "Hörer");
	assert.equal(roleLabel("artist", "en"), "Artist");
	assert.equal(roleLabel("admin", "de"), "Admin");
});

test("an unknown role renders no badge instead of guessing", () => {
	assert.equal(roleLabel("root", "de"), "");
	assert.equal(roleLabel(null, "de"), "");
	assert.equal(isAccountRole("root"), false);
});

test("the badge is read-only: only the listener role is not staff", () => {
	assert.equal(isStaffRole("listener"), false);
	for (const role of ACCOUNT_ROLES.filter((entry) => entry !== "listener")) {
		assert.equal(isStaffRole(role), true, role);
	}
	assert.equal(isStaffRole("root"), false);
});

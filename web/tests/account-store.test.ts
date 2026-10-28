import assert from "node:assert/strict";
import test from "node:test";
import type { AccountRequest } from "../app/stores/accountStore.ts";
import { createAccountController } from "../app/stores/accountStore.ts";

function httpError(statusCode: number): Error & { statusCode: number } {
	return Object.assign(new Error(`http ${statusCode}`), { statusCode });
}

function recorder(
	responses: Array<
		(path: string, options?: Record<string, unknown>) => unknown
	>,
) {
	const calls: Array<{ path: string; options?: Record<string, unknown> }> = [];
	const request: AccountRequest = async <T>(
		path: string,
		options?: Record<string, unknown>,
	) => {
		calls.push({ path, options });
		const handler = responses.shift();
		if (!handler) throw new Error(`unexpected call ${path}`);
		return (await handler(path, options)) as T;
	};
	return { calls, request };
}

test("only unknown ids are fetched, in batches of at most 200", async () => {
	const { calls, request } = recorder([
		() => ({ saved: { "set-0": ["list-a"] } }),
		() => ({ saved: {} }),
		() => ({ saved: {} }),
	]);
	const account = createAccountController(request);
	const ids = Array.from({ length: 450 }, (_, index) => `set-${index}`);

	await account.loadVisible(ids);
	assert.equal(calls.length, 3);
	const sizes = calls.map(
		(call) => (call.path.split("ids=")[1] ?? "").split("%2C").length,
	);
	assert.deepEqual(sizes, [200, 200, 50]);

	await account.loadVisible(["set-0"]);
	assert.equal(calls.length, 3, "known ids are not fetched again");
});

test("a 401 on a card makes the visitor a guest and drops the state", async () => {
	const { request } = recorder([() => Promise.reject(httpError(401))]);
	const account = createAccountController(request);
	account.saved.value = { "set-a": ["list-a"] };

	await account.loadVisible(["set-b"]);
	assert.equal(account.sessionState.value, "guest");
	assert.deepEqual(account.saved.value, {});
});

test("a manager outage keeps the state instead of logging out", async () => {
	const { request } = recorder([() => Promise.reject(httpError(503))]);
	const account = createAccountController(request);
	account.saved.value = { "set-a": ["list-a"] };
	account.sessionState.value = "authenticated";

	await account.loadVisible(["set-b"]);
	assert.equal(account.sessionState.value, "unavailable");
	assert.deepEqual(account.saved.value, { "set-a": ["list-a"] });
});

test("two quick clicks on one set run in order and end unsaved", async () => {
	const { calls, request } = recorder([
		(_path, options) => {
			assert.equal(options?.method, "PUT");
			return { listId: "list-a" };
		},
		(_path, options) => {
			assert.equal(options?.method, "DELETE");
			return { removed: 1 };
		},
	]);
	const account = createAccountController(request);

	await Promise.all([account.toggle("set-a"), account.toggle("set-a")]);

	assert.deepEqual(
		calls.map((call) => call.options?.method),
		["PUT", "DELETE"],
	);
	assert.equal("set-a" in account.saved.value, false);
});

test("a failed save rolls back to the previous state", async () => {
	const { request } = recorder([() => Promise.reject(httpError(500))]);
	const account = createAccountController(request);

	await account.toggle("set-a");
	assert.equal("set-a" in account.saved.value, false);
});

test("a late response after reset cannot restore old data", async () => {
	let release: (value: unknown) => void = () => {};
	const gate = new Promise((resolve) => {
		release = resolve;
	});
	const { request } = recorder([
		async () => {
			await gate;
			return { saved: { "set-a": ["list-a"] } };
		},
	]);
	const account = createAccountController(request);

	const pending = account.loadVisible(["set-a"]);
	account.reset();
	release({ saved: { "set-a": ["list-a"] } });
	await pending;

	assert.deepEqual(account.saved.value, {});
	assert.equal(account.sessionState.value, "guest");
});

test("loading the session distinguishes guest, member and outage", async () => {
	const { request } = recorder([
		() => Promise.reject(httpError(401)),
		() => ({ listener: {} }),
		() => Promise.reject(httpError(502)),
	]);
	const account = createAccountController(request);

	await account.loadSession();
	assert.equal(account.sessionState.value, "guest");

	await account.loadSession();
	assert.equal(account.sessionState.value, "authenticated");

	await account.loadSession();
	assert.equal(account.sessionState.value, "unavailable");
});

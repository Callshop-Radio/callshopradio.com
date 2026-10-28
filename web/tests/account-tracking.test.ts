import assert from "node:assert/strict";
import test from "node:test";

import { useAccountTracking } from "../app/composables/useAccountTracking.ts";

test("without the tracker nothing is sent and nothing throws", () => {
	const tracking = useAccountTracking();
	assert.doesNotThrow(() => tracking.track("set-saved", { setId: "set-a" }));
});

test("the tracker receives the event name and payload", () => {
	const calls: Array<{ name: string; data?: Record<string, unknown> }> = [];
	(globalThis as { window?: unknown }).window = globalThis;
	(globalThis as { umami?: unknown }).umami = {
		track: (name: string, data?: Record<string, unknown>) =>
			calls.push({ name, data }),
	};

	try {
		const tracking = useAccountTracking();
		tracking.track("set-saved", { setId: "set-a", source: "heart" });
		tracking.track("set-unsaved", { setId: "set-a", source: "heart" });
	} finally {
		delete (globalThis as { window?: unknown }).window;
		delete (globalThis as { umami?: unknown }).umami;
	}

	assert.deepEqual(calls, [
		{ name: "set-saved", data: { setId: "set-a", source: "heart" } },
		{ name: "set-unsaved", data: { setId: "set-a", source: "heart" } },
	]);
});

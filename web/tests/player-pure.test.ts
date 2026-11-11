import assert from "node:assert/strict";
import test from "node:test";

import {
	formatPlayerTime,
	nextMilestones,
} from "../layers/base/utils/player.ts";
import { toSetPlayable } from "../layers/base/utils/setPlayable.ts";
import {
	clampVideoWidth,
	hlsRetryDelay,
	shouldOpenVideo,
	videoHeightForWidth,
} from "../layers/base/utils/videoPanel.ts";

test("toSetPlayable maps the Sanity set, show and artists", () => {
	const playable = toSetPlayable(
		{
			_id: "set-1",
			title: "The Bubble",
			slug: { current: "the-bubble" },
			parentShow: {
				_id: "show-1",
				title: "The Bubble",
				slug: { current: "the-bubble" },
			},
			persons: [
				{ title: "Nico", slug: { current: "nico" }, poolVisibility: true },
			],
			soundcloud: { tracks: [{ permalink_url: "https://soundcloud.com/x" }] },
		},
		"cover.jpg",
	);
	assert.equal(playable.id, "set-1");
	assert.equal(playable.title, "The Bubble");
	assert.equal(playable.slug, "the-bubble");
	assert.equal(playable.show?.slug, "the-bubble");
	assert.equal(playable.artists[0].slug, "nico");
	assert.equal(playable.artists[0].poolVisibility, true);
	assert.equal(playable.cover, "cover.jpg");
	assert.equal(playable.soundcloudUrl, "https://soundcloud.com/x");
});

test("toSetPlayable falls back to the SoundCloud track id", () => {
	const playable = toSetPlayable(
		{ _id: "set-2", title: "X", soundcloud: { tracks: [{ id: 42 }] } },
		null,
	);
	assert.equal(playable.soundcloudUrl, "https://api.soundcloud.com/tracks/42");
});

test("formatPlayerTime handles minutes and hours", () => {
	assert.equal(formatPlayerTime(0), "0:00");
	assert.equal(formatPlayerTime(3599), "59:59");
	assert.equal(formatPlayerTime(3600), "1:00:00");
});

test("nextMilestones reports only crossed milestones", () => {
	assert.deepEqual(nextMilestones(26, new Set()), [25]);
	assert.deepEqual(nextMilestones(76, new Set([25, 50])), [75]);
	assert.deepEqual(nextMilestones(100, new Set([25, 50, 75])), [100]);
});

test("clampVideoWidth respects 280, 640 and the viewport margin", () => {
	assert.equal(clampVideoWidth(200, 1200), 280);
	assert.equal(clampVideoWidth(900, 1200), 640);
	assert.equal(clampVideoWidth(700, 600), 552);
});

test("videoHeightForWidth keeps 16:9", () => {
	assert.equal(videoHeightForWidth(360), 203);
});

test("shouldOpenVideo ignores a dismissed session", () => {
	assert.equal(
		shouldOpenVideo({ live: true, since: "s2", dismissedSince: "s1" }),
		true,
	);
	assert.equal(
		shouldOpenVideo({ live: true, since: "s1", dismissedSince: "s1" }),
		false,
	);
	assert.equal(
		shouldOpenVideo({ live: false, since: "s2", dismissedSince: "s1" }),
		false,
	);
});

test("hlsRetryDelay stops after three retries", () => {
	assert.equal(hlsRetryDelay(0), 2000);
	assert.equal(hlsRetryDelay(1), 4000);
	assert.equal(hlsRetryDelay(2), 8000);
	assert.equal(hlsRetryDelay(3), null);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
	formatPlayerTime,
	nextMilestones,
	scheduleShowProgress,
	streamShowProgress,
} from "../layers/base/utils/player.ts";
import { toSetPlayable } from "../layers/base/utils/setPlayable.ts";
import {
	clampVideoWidth,
	hlsRetryDelay,
	shouldOpenVideo,
	videoHeightForWidth,
} from "../layers/base/utils/videoPanel.ts";
import {
	clampWaveformSamples,
	downsampleSamples,
	waveformPath,
} from "../layers/base/utils/waveform.ts";

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
	assert.equal(playable.path, "/shows/the-bubble/the-bubble");
	assert.equal(playable.show?.slug, "the-bubble");
	assert.equal(playable.show?.path, "/shows/the-bubble");
	assert.equal(playable.artists[0].slug, "nico");
	assert.equal(playable.artists[0].poolVisibility, true);
	assert.equal(playable.artists[0].path, "/pool/nico");
	assert.equal(playable.cover, "cover.jpg");
	assert.equal(playable.soundcloudUrl, "https://soundcloud.com/x");
	assert.equal(playable.soundcloudPageUrl, "https://soundcloud.com/x");
	assert.equal(playable.soundcloudId, null);
});

test("toSetPlayable prefers Sanity paths and links hidden artists", () => {
	const playable = toSetPlayable(
		{
			_id: "set-4",
			title: "AssimAssim w/ Høll 19.10.26",
			path: "/shows/assimassim/assimassim-w-holl-19-10-26",
			parentShow: {
				_id: "show-4",
				title: "AssimAssim",
				path: "/shows/assimassim",
			},
			persons: [
				{
					title: "Høll",
					slug: { current: "holl" },
					poolVisibility: false,
					path: "/pool/holl",
				},
			],
		},
		null,
	);
	assert.equal(playable.path, "/shows/assimassim/assimassim-w-holl-19-10-26");
	assert.equal(playable.show?.path, "/shows/assimassim");
	assert.equal(playable.artists[0].path, "/pool/holl");
	assert.equal(playable.artists[0].poolVisibility, false);
});

test("toSetPlayable keeps the SoundCloud track id for the waveform", () => {
	const playable = toSetPlayable(
		{ _id: "set-3", title: "X", soundcloud: { tracks: [{ id: 2135626407 }] } },
		null,
	);
	assert.equal(playable.soundcloudId, "2135626407");
});

test("toSetPlayable falls back to the SoundCloud track id", () => {
	const playable = toSetPlayable(
		{ _id: "set-2", title: "X", soundcloud: { tracks: [{ id: 42 }] } },
		null,
	);
	assert.equal(playable.soundcloudUrl, "https://api.soundcloud.com/tracks/42");
	assert.equal(playable.soundcloudPageUrl, null);
});

test("formatPlayerTime handles minutes and hours", () => {
	assert.equal(formatPlayerTime(0), "0:00");
	assert.equal(formatPlayerTime(3599), "59:59");
	assert.equal(formatPlayerTime(3600), "1:00:00");
});

test("streamShowProgress reads the live occurrence window", () => {
	const updatedAt = "2026-11-11T21:00:00Z";
	const progress = streamShowProgress(
		{
			state: "live",
			updatedAt,
			progress: { elapsedSeconds: 3600, durationSeconds: 7200 },
		},
		Date.parse(updatedAt),
	);
	assert.equal(progress?.percent, 50);
	assert.equal(progress?.endMs, Date.parse("2026-11-11T22:00:00Z"));
});

test("streamShowProgress advances between feed polls", () => {
	const updatedAt = "2026-11-11T21:00:00Z";
	const progress = streamShowProgress(
		{
			state: "live",
			updatedAt,
			progress: { elapsedSeconds: 3600, durationSeconds: 7200 },
		},
		Date.parse("2026-11-11T21:10:00Z"),
	);
	assert.equal(Math.round(progress?.percent ?? 0), 58);
});

test("streamShowProgress tracks an AutoDJ replay", () => {
	const updatedAt = "2026-11-12T00:00:00Z";
	const progress = streamShowProgress(
		{
			state: "auto",
			updatedAt,
			progress: { elapsedSeconds: 5171, durationSeconds: 7507 },
		},
		Date.parse(updatedAt),
	);
	assert.equal(Math.round(progress?.percent ?? 0), 69);
});

test("scheduleShowProgress tracks the current timetable slot", () => {
	const starts = "2026-11-11T21:00:00Z";
	const ends = "2026-11-11T22:00:00Z";
	const progress = scheduleShowProgress(
		{ starts, ends },
		Date.parse("2026-11-11T21:30:00Z"),
	);
	assert.equal(progress?.percent, 50);
	assert.equal(progress?.endMs, Date.parse(ends));
	assert.equal(
		scheduleShowProgress({ starts, ends }, Date.parse("2026-11-11T22:00:00Z")),
		null,
	);
});

test("streamShowProgress ignores auto and missing windows", () => {
	assert.equal(
		streamShowProgress(
			{ state: "auto", updatedAt: new Date().toISOString(), progress: null },
			Date.now(),
		),
		null,
	);
	assert.equal(
		streamShowProgress(
			{
				state: "live",
				updatedAt: new Date().toISOString(),
				progress: { elapsedSeconds: 1, durationSeconds: 0 },
			},
			Date.now(),
		),
		null,
	);
	assert.equal(streamShowProgress(null, Date.now()), null);
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

test("downsampleSamples keeps the loudest peak of every bucket", () => {
	assert.deepEqual(downsampleSamples([1, 9, 2, 8, 3, 7], 3), [9, 8, 7]);
	assert.deepEqual(downsampleSamples([], 3), []);
	assert.deepEqual(downsampleSamples([5], 3), [5]);
});

test("waveformPath renders one bar per sample bucket", () => {
	const path = waveformPath([100, 50, 25, 75], 100, 2);
	assert.equal((path.match(/M/g) || []).length, 2);
	assert.match(path, /^M[\d.]+ [\d.]+h[\d.]+v[\d.]+h-[\d.]+z/);
});

test("waveformPath tolerates empty and zero scales", () => {
	assert.equal(waveformPath([], 140, 10), "");
	const path = waveformPath([0, 0], 0, 2);
	assert.equal((path.match(/M/g) || []).length, 2);
});

test("clampWaveformSamples rejects junk and caps the length", () => {
	assert.equal(clampWaveformSamples("nope"), null);
	assert.deepEqual(clampWaveformSamples([1, "2", Number.NaN], 10), [1, 2]);
	assert.equal(
		clampWaveformSamples(
			Array.from({ length: 10 }, (_, i) => i),
			4,
		)?.length,
		4,
	);
});

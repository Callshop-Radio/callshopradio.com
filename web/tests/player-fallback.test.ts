import assert from "node:assert/strict";
import test from "node:test";

import {
	feedFromAzuraCast,
	feedFromIcecast,
	unknownFeed,
	videoFromStatus,
} from "../server/utils/playerFallback.ts";

const audioUrl = "https://stream.example/radio.mp3";

test("AzuraCast now playing becomes an auto feed without links", () => {
	const feed = feedFromAzuraCast(
		{ now_playing: { song: { title: "Sporecast", artist: "BNYI, índigo" } } },
		{ audioUrl },
	);
	assert.equal(feed.state, "auto");
	assert.equal(feed.title, "Sporecast");
	assert.equal(feed.subtitle, "BNYI, índigo");
	assert.equal(feed.show, null);
	assert.equal(feed.set, null);
	assert.deepEqual(feed.artists, []);
	assert.equal(feed.audio.url, audioUrl);
});

test("AzuraCast accepts the single-station object as well as an array", () => {
	const np = { now_playing: { song: { title: "A", artist: "B" } } };
	assert.equal(feedFromAzuraCast(np, { audioUrl }).title, "A");
	assert.equal(feedFromAzuraCast([np], { audioUrl }).title, "A");
});

test("Icecast picks the /callshopradio source from an array", () => {
	const status = {
		icestats: {
			source: [
				{
					listenurl: "/listen/callshopradio/radio.mp3",
					title: "Set",
					artist: "Artist",
				},
				{
					listenurl: "/listen/callshopradio-wien/radio.mp3",
					title: "Wien",
					artist: "X",
				},
			],
		},
	};
	const feed = feedFromIcecast(status, { audioUrl });
	assert.equal(feed.title, "Set");
	assert.equal(feed.subtitle, "Artist");
});

test("video status maps live and since", () => {
	const video = videoFromStatus(
		{ live: true, since: "2026-11-11T20:00:00Z" },
		{ hlsUrl: "https://video.example/live.m3u8" },
	);
	assert.deepEqual(video, {
		live: true,
		since: "2026-11-11T20:00:00Z",
		hlsUrl: "https://video.example/live.m3u8",
		title: "Live Video",
	});
});

test("video status rejects a non-boolean live value", () => {
	assert.equal(videoFromStatus({ live: "yes" }, { hlsUrl: "h" }), null);
});

test("unknown feed keeps the audio URL and has no links", () => {
	const feed = unknownFeed({
		audioUrl,
		fallbackUrl: "https://legacy.example/radio",
	});
	assert.equal(feed.state, "unknown");
	assert.equal(feed.audio.url, audioUrl);
	assert.equal(feed.audio.fallbackUrl, "https://legacy.example/radio");
	assert.equal(feed.show, null);
	assert.deepEqual(feed.artists, []);
});

test("AzuraCast offline is an offline feed", () => {
	const feed = feedFromAzuraCast(
		{ is_online: false, now_playing: { song: { title: "X" } } },
		{ audioUrl },
	);
	assert.equal(feed.state, "offline");
	assert.equal(feed.track, null);
	assert.equal(feed.title, "Callshop Radio");
});

test("Icecast without a matching source is offline", () => {
	const feed = feedFromIcecast(
		{
			icestats: {
				source: [{ listenurl: "/callshopradio-wien/radio.mp3", title: "Wien" }],
			},
		},
		{ audioUrl },
	);
	assert.equal(feed.state, "offline");
	assert.equal(feed.track, null);
});

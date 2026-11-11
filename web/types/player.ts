export type PlayerStatus = "live" | "replay" | "auto" | "offline" | "unknown";

export interface PlayerShow {
	title: string;
	path: string | null;
}

export interface PlayerSet {
	title: string;
	path: string | null;
	durationSeconds: number | null;
}

export interface PlayerArtist {
	name: string;
	path: string | null;
}

export interface PlayerTrack {
	title: string;
	artist: string | null;
}

export interface PlayerProgress {
	elapsedSeconds: number;
	durationSeconds: number;
}

export interface PlayerVideo {
	live: boolean;
	since: string | null;
	hlsUrl: string;
	title: string;
}

export interface PlayerWaveform {
	samples: number[];
	width: number;
	height: number;
}

export interface PlayerFeed {
	version: 1;
	updatedAt: string;
	state: PlayerStatus;
	audio: { url: string; fallbackUrl?: string };
	video: PlayerVideo | null;
	title: string;
	subtitle: string | null;
	cover: string | null;
	show: PlayerShow | null;
	set: PlayerSet | null;
	artists: PlayerArtist[];
	track: PlayerTrack | null;
	progress: PlayerProgress | null;
	tracklist: PlayerTrack[] | null;
	source?: "manager" | "azura" | "icecast" | "fallback";
}

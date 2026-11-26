export interface WaveformSamples {
	samples: number[];
	width: number;
	height: number;
}

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 100;

/**
 * SoundCloud returns 1800 peak samples for a track. The row only has room for
 * a few hundred bars, so keep the loudest sample of every bucket.
 */
export function downsampleSamples(samples: number[], bars: number): number[] {
	if (!samples.length || bars <= 0) return [];
	const count = Math.min(bars, samples.length);
	const bucket = samples.length / count;
	const peaks: number[] = [];
	for (let index = 0; index < count; index += 1) {
		const start = Math.floor(index * bucket);
		const end = Math.max(start + 1, Math.floor((index + 1) * bucket));
		let peak = 0;
		for (
			let cursor = start;
			cursor < end && cursor < samples.length;
			cursor += 1
		) {
			const value = Math.abs(Number(samples[cursor]) || 0);
			if (value > peak) peak = value;
		}
		peaks.push(peak);
	}
	return peaks;
}

/** Build the bar path once; both the base and the played layer reuse it. */
export function waveformPath(
	samples: number[],
	scale: number,
	bars: number,
	width = VIEW_WIDTH,
	height = VIEW_HEIGHT,
): string {
	const peaks = downsampleSamples(samples, bars);
	if (!peaks.length) return "";
	const step = width / peaks.length;
	const barWidth = Math.max(step * 0.55, 0.6);
	const middle = height / 2;
	const factor = Number(scale) > 0 ? Number(scale) : Math.max(...peaks, 1);
	return peaks
		.map((peak, index) => {
			const ratio = Math.min(1, Math.max(0, peak / factor));
			const barHeight = Math.max(1.5, ratio * (height - 2));
			const x = index * step + (step - barWidth) / 2;
			const y = middle - barHeight / 2;
			return `M${x.toFixed(2)} ${y.toFixed(2)}h${barWidth.toFixed(2)}v${barHeight.toFixed(2)}h${(-barWidth).toFixed(2)}z`;
		})
		.join("");
}

export function clampWaveformSamples(
	samples: unknown,
	maxSamples = 4000,
): number[] | null {
	if (!Array.isArray(samples)) return null;
	const values = samples
		.slice(0, maxSamples)
		.map((value) => Number(value))
		.filter((value) => Number.isFinite(value));
	return values.length ? values : null;
}

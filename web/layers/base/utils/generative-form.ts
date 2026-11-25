/**
 * Port of the generator in /public/generative-playground.html.
 *
 * The playground stays the tuning surface; this module uses the same rules so
 * the lab can draw a fresh form on every page load without shipping a canvas.
 */

// biome-ignore-all lint/style/noNonNullAssertion: the grid is always ROWS x COLS

export type FormGrid = number[][];
export type FormPoint = [number, number];
export type FormRect = { x: number; y: number; w: number; h: number };

export type FormOptions = {
	blocks: number;
	minSize: number;
	maxSize: number;
	overlap: number;
	nesting: number;
	radius: number;
};

export type FormResult = {
	seed: number;
	path: string;
	viewBox: string;
	points: FormPoint[];
	rects: FormRect[];
	blocks: number;
	area: number;
};

export const LAB_FORM_OPTIONS: FormOptions = {
	blocks: 6,
	minSize: 2,
	maxSize: 3,
	overlap: 1,
	nesting: 0.75,
	radius: 0.5,
};

const COLS = 12;
const ROWS = 9;

function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function randInt(rng: () => number, min: number, max: number) {
	return min + Math.floor(rng() * (max - min + 1));
}

function weightedPick(rng: () => number, entries: Array<[string, number]>) {
	const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
	let value = rng() * total;
	for (const [entry, weight] of entries) {
		value -= weight;
		if (value <= 0) return entry;
	}
	return entries[entries.length - 1]?.[0] ?? "right";
}

function makeGrid(): FormGrid {
	return Array.from({ length: ROWS }, () => Array(COLS).fill(0) as number[]);
}

function stamp(grid: FormGrid, rect: FormRect) {
	for (let y = rect.y; y < rect.y + rect.h; y++) {
		for (let x = rect.x; x < rect.x + rect.w; x++) {
			if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
			grid[y]![x] = 1;
		}
	}
	return true;
}

function cloneGrid(grid: FormGrid) {
	return grid.map((row) => row.slice());
}

function countFilled(grid: FormGrid) {
	return grid.reduce((sum, row) => sum + row.reduce((a, v) => a + v, 0), 0);
}

function isConnected(grid: FormGrid) {
	const cells: FormPoint[] = [];
	for (let y = 0; y < ROWS; y++) {
		for (let x = 0; x < COLS; x++) if (grid[y]![x]) cells.push([x, y]);
	}
	const first = cells[0];
	if (!first) return false;

	const seen = new Set<string>();
	const queue: FormPoint[] = [first];
	seen.add(first.join(","));

	while (queue.length) {
		const cell = queue.shift();
		if (!cell) break;
		const [x, y] = cell;
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		] as const) {
			const nx = x + dx;
			const ny = y + dy;
			if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
			if (!grid[ny]![nx]) continue;
			const key = `${nx},${ny}`;
			if (seen.has(key)) continue;
			seen.add(key);
			queue.push([nx, ny]);
		}
	}

	return seen.size === cells.length;
}

function hasHole(grid: FormGrid) {
	const visited = Array.from(
		{ length: ROWS },
		() => Array(COLS).fill(false) as boolean[],
	);
	const queue: FormPoint[] = [];
	const enqueue = (x: number, y: number) => {
		if (grid[y]![x] || visited[y]![x]) return;
		visited[y]![x] = true;
		queue.push([x, y]);
	};

	for (let x = 0; x < COLS; x++) {
		enqueue(x, 0);
		enqueue(x, ROWS - 1);
	}
	for (let y = 0; y < ROWS; y++) {
		enqueue(0, y);
		enqueue(COLS - 1, y);
	}

	while (queue.length) {
		const cell = queue.shift();
		if (!cell) break;
		const [x, y] = cell;
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		] as const) {
			const nx = x + dx;
			const ny = y + dy;
			if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
			enqueue(nx, ny);
		}
	}

	for (let y = 0; y < ROWS; y++) {
		for (let x = 0; x < COLS; x++) {
			if (!grid[y]![x] && !visited[y]![x]) return true;
		}
	}
	return false;
}

function hasPinch(grid: FormGrid) {
	for (let y = 1; y < ROWS - 1; y++) {
		for (let x = 1; x < COLS - 1; x++) {
			if (grid[y]![x]) continue;
			const a = grid[y - 1]![x - 1] && grid[y + 1]![x + 1];
			const b = grid[y - 1]![x + 1] && grid[y + 1]![x - 1];
			const horizontal = grid[y]![x - 1] && grid[y]![x + 1];
			const vertical = grid[y - 1]![x] && grid[y + 1]![x];
			if ((a || b) && !horizontal && !vertical) return true;
		}
	}
	return false;
}

function boundsOf(grid: FormGrid): FormRect {
	let minX = COLS;
	let minY = ROWS;
	let maxX = -1;
	let maxY = -1;
	for (let y = 0; y < ROWS; y++) {
		for (let x = 0; x < COLS; x++) {
			if (!grid[y]![x]) continue;
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x);
			maxY = Math.max(maxY, y);
		}
	}
	return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

type Edge = { a: FormPoint; b: FormPoint };

function traceContour(grid: FormGrid): FormPoint[] {
	const edges: Edge[] = [];
	for (let y = 0; y < ROWS; y++) {
		for (let x = 0; x < COLS; x++) {
			if (!grid[y]![x]) continue;
			if (y === 0 || !grid[y - 1]![x]) {
				edges.push({ a: [x, y], b: [x + 1, y] });
			}
			if (x === COLS - 1 || !grid[y]![x + 1]) {
				edges.push({ a: [x + 1, y], b: [x + 1, y + 1] });
			}
			if (y === ROWS - 1 || !grid[y + 1]![x]) {
				edges.push({ a: [x + 1, y + 1], b: [x, y + 1] });
			}
			if (x === 0 || !grid[y]![x - 1]) {
				edges.push({ a: [x, y + 1], b: [x, y] });
			}
		}
	}

	const byStart = new Map<string, Edge[]>();
	for (const edge of edges) {
		const key = edge.a.join(",");
		const list = byStart.get(key);
		if (list) list.push(edge);
		else byStart.set(key, [edge]);
	}

	const first = edges[0];
	if (!first) return [];
	const points: FormPoint[] = [];
	let current = first;
	let guard = 0;
	do {
		points.push(current.a);
		const candidates = byStart.get(current.b.join(",")) ?? [];
		const next = candidates.find((edge) => edge !== current) ?? candidates[0];
		if (!next) break;
		current = next;
		guard += 1;
	} while (current !== first && guard < edges.length + 4);

	let changed = true;
	while (changed && points.length > 4) {
		changed = false;
		for (let i = 0; i < points.length; i++) {
			const point = points[i];
			const prev = points[(i - 1 + points.length) % points.length];
			const next = points[(i + 1) % points.length];
			if (!point || !prev || !next) continue;
			if (
				(prev[0] === point[0] && point[0] === next[0]) ||
				(prev[1] === point[1] && point[1] === next[1])
			) {
				points.splice(i, 1);
				changed = true;
				break;
			}
		}
	}

	return points;
}

function polygonPath(points: FormPoint[]) {
	if (!points.length) return "";
	return `M ${points.map(([x, y]) => `${x} ${y}`).join(" L ")} Z`;
}

function cornerTurns(points: FormPoint[]) {
	let left = 0;
	let right = 0;
	for (let i = 0; i < points.length; i++) {
		const point = points[i];
		const prev = points[(i - 1 + points.length) % points.length];
		const next = points[(i + 1) % points.length];
		if (!point || !prev || !next) continue;
		const inX = Math.sign(point[0] - prev[0]);
		const inY = Math.sign(point[1] - prev[1]);
		const outX = Math.sign(next[0] - point[0]);
		const outY = Math.sign(next[1] - point[1]);
		const cross = inX * outY - inY * outX;
		if (cross > 0) right += 1;
		if (cross < 0) left += 1;
	}
	return { left, right };
}

function roundedPath(points: FormPoint[], radius: number) {
	const count = points.length;
	if (count < 4) return polygonPath(points);

	const corners = [];
	for (let i = 0; i < count; i++) {
		const point = points[i];
		const prev = points[(i - 1 + count) % count];
		const next = points[(i + 1) % count];
		if (!point || !prev || !next) continue;
		const inX = Math.sign(point[0] - prev[0]);
		const inY = Math.sign(point[1] - prev[1]);
		const outX = Math.sign(next[0] - point[0]);
		const outY = Math.sign(next[1] - point[1]);
		const lenPrev = Math.abs(point[0] - prev[0]) + Math.abs(point[1] - prev[1]);
		const lenNext = Math.abs(next[0] - point[0]) + Math.abs(next[1] - point[1]);
		const r = Math.min(radius, lenPrev / 2, lenNext / 2);
		corners.push({
			p: point,
			inX,
			inY,
			outX,
			outY,
			r,
			sweep: inX * outY - inY * outX > 0 ? 1 : 0,
		});
	}
	if (!corners.length) return polygonPath(points);

	const fmt = (value: number) => Number(value.toFixed(3));
	const before: FormPoint[] = corners.map((corner) => [
		corner.p[0] - corner.inX * corner.r,
		corner.p[1] - corner.inY * corner.r,
	]);
	const after: FormPoint[] = corners.map((corner) => [
		corner.p[0] + corner.outX * corner.r,
		corner.p[1] + corner.outY * corner.r,
	]);

	const start = before[0];
	if (!start) return polygonPath(points);
	let path = `M ${fmt(start[0])} ${fmt(start[1])}`;
	for (let i = 0; i < corners.length; i++) {
		const corner = corners[i];
		const afterPoint = after[i];
		const nextBefore = before[(i + 1) % corners.length];
		if (!corner || !afterPoint || !nextBefore) continue;
		if (corner.r > 0.001) {
			path += ` A ${fmt(corner.r)} ${fmt(corner.r)} 0 0 ${corner.sweep} ${fmt(afterPoint[0])} ${fmt(afterPoint[1])}`;
		} else {
			path += ` L ${fmt(corner.p[0])} ${fmt(corner.p[1])}`;
		}
		path += ` L ${fmt(nextBefore[0])} ${fmt(nextBefore[1])}`;
	}
	return `${path} Z`;
}

function validate(grid: FormGrid) {
	if (!isConnected(grid)) return false;
	if (hasHole(grid)) return false;
	if (hasPinch(grid)) return false;
	const area = countFilled(grid);
	if (area < 10 || area > 72) return false;
	const bounds = boundsOf(grid);
	if (bounds.x < 1 || bounds.y < 1) return false;
	if (bounds.x + bounds.w > COLS - 2 || bounds.y + bounds.h > ROWS - 2) {
		return false;
	}
	const points = traceContour(grid);
	if (points.length < 8) return false;
	const turns = cornerTurns(points);
	if (turns.left < 1 || turns.right < 1) return false;
	return true;
}

function pickShift(
	rng: () => number,
	min: number,
	max: number,
	nesting: number,
) {
	if (nesting > 0 && rng() < nesting) {
		return rng() < 0.5 ? min : max;
	}
	return randInt(rng, min, max);
}

function generate(seed: number, options: FormOptions) {
	const rng = mulberry32(seed);
	const minSize = Math.min(options.minSize, options.maxSize);
	const maxSize = Math.max(options.minSize, options.maxSize);
	const nesting = Math.max(0, Math.min(1, options.nesting));
	const target = options.blocks;

	for (let attempt = 0; attempt < 120; attempt++) {
		const grid = makeGrid();
		const rects: FormRect[] = [];
		const startW = randInt(rng, 3, Math.min(5, maxSize + 1));
		const startH = randInt(rng, 2, Math.min(4, maxSize + 1));
		const startX = randInt(rng, 1, Math.max(1, COLS - startW - 2));
		const startY = randInt(rng, 1, Math.max(1, ROWS - startH - 2));
		const start = { x: startX, y: startY, w: startW, h: startH };
		if (!stamp(grid, start)) continue;
		rects.push(start);

		let lastDir: string | null = null;
		let lastLong = false;
		for (let block = 1; block < target; block++) {
			const prev = rects[rects.length - 1];
			if (!prev) break;
			let placed = false;

			for (let tries = 0; tries < 30 && !placed; tries++) {
				const opposite: Record<string, string> = {
					right: "left",
					left: "right",
					down: "up",
					up: "down",
				};
				const directions = ["right", "down", "left", "up"].filter(
					(dir) => dir !== (lastDir ? opposite[lastDir] : undefined),
				);
				const weighted: Array<[string, number]> = directions.map((dir) => {
					let weight = dir === "right" || dir === "down" ? 0.36 : 0.14;
					if (lastDir === "right" && dir === "down") weight += 0.2;
					if (lastDir === "down" && dir === "right") weight += 0.2;
					if (lastDir === "left" && dir === "up") weight += 0.12;
					if (lastDir === "up" && dir === "left") weight += 0.12;
					return [dir, weight];
				});
				const dir = weightedPick(rng, weighted);
				const horizontal = dir === "right" || dir === "left";
				const longLeg = rng() < nesting * 0.85;
				let w: number;
				let h: number;

				if (horizontal) {
					w = longLeg
						? randInt(rng, minSize, Math.min(3, maxSize))
						: randInt(rng, minSize, maxSize);
					h = longLeg
						? randInt(rng, Math.max(4, maxSize - 1), Math.min(6, maxSize + 1))
						: randInt(rng, minSize, maxSize);
				} else {
					h = longLeg
						? randInt(rng, minSize, Math.min(3, maxSize))
						: randInt(rng, minSize, maxSize);
					w = longLeg
						? randInt(rng, Math.max(4, maxSize - 1), Math.min(6, maxSize + 1))
						: randInt(rng, minSize, maxSize);
				}

				if (lastLong && !longLeg && rng() < 0.75) {
					w = Math.max(w, randInt(rng, 3, maxSize));
					h = Math.max(h, randInt(rng, 3, maxSize));
				}

				const overlap = options.overlap;
				let x: number;
				let y: number;

				if (dir === "right") {
					x = prev.x + prev.w - overlap;
					y =
						prev.y + pickShift(rng, -(h - overlap), prev.h - overlap, nesting);
				} else if (dir === "left") {
					x = prev.x - w + overlap;
					y =
						prev.y + pickShift(rng, -(h - overlap), prev.h - overlap, nesting);
				} else if (dir === "down") {
					y = prev.y + prev.h - overlap;
					x =
						prev.x + pickShift(rng, -(w - overlap), prev.w - overlap, nesting);
				} else {
					y = prev.y - h + overlap;
					x =
						prev.x + pickShift(rng, -(w - overlap), prev.w - overlap, nesting);
				}

				const rect = { x, y, w, h };
				if (x < 1 || y < 1) continue;
				if (x + w > COLS - 1 || y + h > ROWS - 1) continue;
				const nextGrid = cloneGrid(grid);
				if (!stamp(nextGrid, rect)) continue;
				const before = countFilled(grid);
				const after = countFilled(nextGrid);
				if (after - before < 1) continue;
				if (!isConnected(nextGrid) || hasHole(nextGrid) || hasPinch(nextGrid)) {
					continue;
				}

				grid.splice(0, grid.length, ...nextGrid);
				rects.push(rect);
				lastDir = dir;
				lastLong = longLeg;
				placed = true;
			}
			if (!placed) break;
		}

		if (rects.length < target) continue;
		if (!validate(grid)) continue;
		const points = traceContour(grid);
		const turns = cornerTurns(points);
		if (turns.left < 1 || turns.right < 1) continue;
		return {
			grid,
			rects,
			points,
			seed,
			area: countFilled(grid),
			turns,
		};
	}

	const fallbackRects: FormRect[] = [
		{ x: 2, y: 2, w: 4, h: 3 },
		{ x: 5, y: 4, w: 3, h: 4 },
		{ x: 7, y: 6, w: 3, h: 2 },
	];
	const grid = makeGrid();
	for (const rect of fallbackRects) stamp(grid, rect);
	const points = traceContour(grid);
	return {
		grid,
		rects: fallbackRects,
		points,
		seed,
		area: countFilled(grid),
		turns: cornerTurns(points),
	};
}

function formViewBox(points: FormPoint[]) {
	if (!points.length) return `0 0 ${COLS} ${ROWS}`;
	const xs = points.map(([x]) => x);
	const ys = points.map(([, y]) => y);
	const pad = 0.75;
	const minX = Math.min(...xs) - pad;
	const minY = Math.min(...ys) - pad;
	const width = Math.max(...xs) - Math.min(...xs) + pad * 2;
	const height = Math.max(...ys) - Math.min(...ys) + pad * 2;
	return `${minX} ${minY} ${width} ${height}`;
}

export function randomFormSeed() {
	return Math.floor(Math.random() * 999_999) + 1;
}

/** Each slide gets its own deterministic form from the session seed. */
export function formSeedFor(baseSeed: number, slideIndex: number) {
	const mixed = (baseSeed * 31 + slideIndex * 104_729) % 999_983;
	return mixed > 0 ? mixed : 1;
}

export function generateForm(
	seed: number,
	options: FormOptions = LAB_FORM_OPTIONS,
): FormResult {
	const result = generate(seed, options);
	return {
		seed,
		path: roundedPath(result.points, options.radius),
		viewBox: formViewBox(result.points),
		points: result.points,
		rects: result.rects,
		blocks: result.rects.length,
		area: result.area,
	};
}

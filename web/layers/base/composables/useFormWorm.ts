const targets = new Set<SVGPathElement>();

/**
 * The worm is computed once in LabAtmosphere. The foreground copy (above the
 * inactive cards) registers its path here so both copies always share the
 * exact same `d`, including during the morph.
 */
export function registerFormWormTarget(target: SVGPathElement | null) {
	if (target) targets.add(target);
}

export function unregisterFormWormTarget(target: SVGPathElement | null) {
	if (target) targets.delete(target);
}

export function applyFormWormPath(path: string) {
	for (const target of targets) target.setAttribute("d", path);
}

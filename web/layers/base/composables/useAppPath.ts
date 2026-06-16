const ARCHIVE_PATHS: Record<string, string> = {
	shows: "/shows",
	sets: "/shows",
	show: "/shows",
	set: "/shows",
	pool: "/pool",
	person: "/pool",
	venue: "/pool",
	words: "/words",
	article: "/words",
	word: "/words",
	schedule: "/schedule",
};

/** Locale-aware path helpers. Sanity documents supply language-neutral `path`. */
export function useAppPath() {
	const localePath = useLocalePath();

	function to(path?: string | null) {
		return path ? localePath(path) : undefined;
	}

	function archive(section: string) {
		return localePath(ARCHIVE_PATHS[section] ?? `/${section}`);
	}

	function searchTag(title: string) {
		return localePath(`/search?q=${encodeURIComponent(title)}`);
	}

	async function navigateToPath(path?: string | null) {
		const target = to(path);
		if (target) await navigateTo(target);
	}

	return {
		to,
		archive,
		searchTag,
		navigateToPath,
	};
}

import type { ContentItem, Tag } from "~/types/sanity";
import { tagSlug } from "~/utils/tagSlug";

export const useTagNavigation = () => {
	const router = useRouter();
	const localePath = useLocalePath();

	function navigateToTagSearch(
		tag: Tag,
		item: ContentItem | { _type?: string },
		isGenre = false,
	) {
		// Genre and subgenre tags always open the archive filter, never search.
		if (
			tag?._type === "tag.genre" ||
			tag?._type === "tag.subGenre" ||
			(isGenre && tag?._id)
		) {
			if (navigateToGenreFilter(tag, item, isGenre)) return;
		}

		let tagName = "";

		if (isGenre) {
			tagName = tag.name || getI18nLabel(tag.title);
		} else {
			tagName = getI18nLabel(tag.title) || tag.name || "";
		}

		if (!tagName) return;

		let category = "all";
		const itemType = item?._type;

		if (["show", "set"].includes(itemType ?? "")) category = "shows";
		else if (["person", "venue"].includes(itemType ?? "")) category = "pool";
		else if (["article"].includes(itemType ?? "")) category = "article";

		router.push({
			path: localePath("/search"),
			query: {
				q: tagName,
				type: category,
			},
		});
	}

	/**
	 * A genre/subgenre pill on any page opens the archive with that filter
	 * preselected. Genres filter the genre bucket, subgenres the subgenre.
	 */
	function navigateToGenreFilter(
		tag: Tag,
		_item: ContentItem | { _type?: string },
		isGenre = false,
	): boolean {
		if (!tag?._id) return false;

		const slug = tagSlug(getI18nLabel(tag.title) || tag.name || "");
		if (!slug) return false;

		const asGenre =
			tag._type === "tag.genre" || (isGenre && tag._type !== "tag.subGenre");

		router.push({
			path: localePath("/shows"),
			query: asGenre ? { genre: slug } : { subgenre: slug },
		});
		return true;
	}

	return {
		navigateToTagSearch,
		navigateToGenreFilter,
	};
};

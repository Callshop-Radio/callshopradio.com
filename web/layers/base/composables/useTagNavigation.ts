import type { ContentItem, Tag } from "~/types/sanity";

export const useTagNavigation = () => {
	const router = useRouter();
	const localePath = useLocalePath();

	function navigateToTagSearch(
		tag: Tag,
		item: ContentItem | { _type?: string },
		isGenre = false,
	) {
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

	return {
		navigateToTagSearch,
	};
};

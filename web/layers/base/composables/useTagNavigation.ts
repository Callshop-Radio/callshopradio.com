export const useTagNavigation = () => {
  const router = useRouter();
  const localePath = useLocalePath();

  function navigateToTagSearch(tag: any, item: any, isGenre = false) {
    // Determine search term
    let tagName = "";

    if (isGenre) {
      tagName = tag.name || tag.title;
    } else {
      // For standard tags, prefer title for searching as it matches the search index
      // If title implies an object/array (i18n), we need to extract the string
      const titleVal = tag.title || tag.name;

      if (Array.isArray(titleVal)) {
        // Assume portable text / i18n array, take first element value
        tagName = titleVal[0]?.value || "";
      } else if (typeof titleVal === "object") {
        // Fallback for object without array
        tagName = "";
      } else {
        tagName = titleVal || "";
      }
    }

    if (!tagName) return;

    // Determine Category
    let category = "all";
    const itemType = item?._type;

    if (["show", "set"].includes(itemType)) category = "shows";
    else if (["person", "venue"].includes(itemType)) category = "pool";
    else if (["article"].includes(itemType)) category = "article";

    // Navigate
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

import {
	COVER_FLOW_ITEM_COUNT,
	pickRandomItems,
} from "~~/layers/base/composables/coverFlowUtils";
import {
	COVER_FLOW_ARTICLE_CANDIDATE_IDS_QUERY,
	COVER_FLOW_ARTICLES_BY_IDS_QUERY,
	COVER_FLOW_POOL_BY_IDS_QUERY,
	COVER_FLOW_POOL_CANDIDATE_IDS_QUERY,
	COVER_FLOW_SET_CANDIDATE_IDS_QUERY,
	COVER_FLOW_SETS_BY_IDS_QUERY,
} from "~~/queries/coverFlow.queries";

const COVER_FLOW_TYPES = ["sets", "pool", "articles"] as const;
type CoverFlowType = (typeof COVER_FLOW_TYPES)[number];

const CANDIDATE_QUERIES: Record<CoverFlowType, string> = {
	sets: COVER_FLOW_SET_CANDIDATE_IDS_QUERY,
	pool: COVER_FLOW_POOL_CANDIDATE_IDS_QUERY,
	articles: COVER_FLOW_ARTICLE_CANDIDATE_IDS_QUERY,
};

const BY_IDS_QUERIES: Record<CoverFlowType, string> = {
	sets: COVER_FLOW_SETS_BY_IDS_QUERY,
	pool: COVER_FLOW_POOL_BY_IDS_QUERY,
	articles: COVER_FLOW_ARTICLES_BY_IDS_QUERY,
};

export default defineEventHandler(async (event) => {
	const type = getRouterParam(event, "type") as CoverFlowType | undefined;

	if (!type || !COVER_FLOW_TYPES.includes(type)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid cover flow type",
		});
	}

	setResponseHeaders(event, {
		"Cache-Control": "no-store",
	});

	const sanity = useSanity();
	const candidates = await sanity.fetch<{ _id: string }[]>(
		CANDIDATE_QUERIES[type],
	);
	const ids = pickRandomItems(candidates ?? [], COVER_FLOW_ITEM_COUNT)
		.map((item) => item._id)
		.filter(Boolean);

	if (!ids.length) {
		return [];
	}

	return sanity.fetch(BY_IDS_QUERIES[type], { ids });
});

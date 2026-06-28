import { defineQuery } from "groq";
import { COVER_FLOW_CANDIDATE_IDS_LIMIT } from "../layers/base/composables/coverFlowUtils";
import {
	ARTICLE_COVER_FLOW_SLIDER_ITEM_QUERY,
	POOL_COVER_FLOW_SLIDER_ITEM_QUERY,
	SET_COVER_FLOW_SLIDER_ITEM_QUERY,
} from "./sanity.snippets";

export const COVER_FLOW_SET_CANDIDATE_IDS_QUERY = defineQuery(`
*[_type == 'set' && datetime != null] | order(datetime desc)[0...${COVER_FLOW_CANDIDATE_IDS_LIMIT}]{ _id }`);

export const COVER_FLOW_POOL_CANDIDATE_IDS_QUERY = defineQuery(`
*[_type in ['person', 'venue'] && poolVisibility == true] | order(_updatedAt desc)[0...${COVER_FLOW_CANDIDATE_IDS_LIMIT}]{ _id }`);

export const COVER_FLOW_ARTICLE_CANDIDATE_IDS_QUERY = defineQuery(`
*[_type == 'article' && useTeaserText == true && count(textTeaser) > 0] | order(datetime desc)[0...${COVER_FLOW_CANDIDATE_IDS_LIMIT}]{ _id }`);

export const COVER_FLOW_SETS_BY_IDS_QUERY = defineQuery(`
*[_id in $ids] ${SET_COVER_FLOW_SLIDER_ITEM_QUERY}`);

export const COVER_FLOW_POOL_BY_IDS_QUERY = defineQuery(`
*[_id in $ids] ${POOL_COVER_FLOW_SLIDER_ITEM_QUERY}`);

export const COVER_FLOW_ARTICLES_BY_IDS_QUERY = defineQuery(`
*[_id in $ids] ${ARTICLE_COVER_FLOW_SLIDER_ITEM_QUERY}`);

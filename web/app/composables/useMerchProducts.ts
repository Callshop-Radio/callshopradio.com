import { computed } from "vue";
import type { MerchProduct } from "~/data/merch";
import { MERCH_PRODUCTS } from "~/data/merch";

/**
 * One place to read the merch catalogue. Today it is the static list; once the
 * manager on the VPS exposes its products API, this function fetches it and the
 * page keeps working unchanged.
 */
export function useMerchProducts() {
	const products: MerchProduct[] = MERCH_PRODUCTS;
	const soldOutCount = computed(
		() => products.filter((product) => product.soldOut).length,
	);

	return { products, soldOutCount };
}

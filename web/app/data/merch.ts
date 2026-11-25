export type MerchProduct = {
	id: string;
	title: string;
	/** Gallery images; the first one is the card cover. */
	images: string[];
	/** Alt text for the set; the page appends the position when there are several. */
	imageAlt: string;
	/** External checkout link. `null` while the piece is sold out. */
	buyUrl: string | null;
	soldOut: boolean;
	/** One or two lines for the product dialog. */
	description?: string;
	/** Short material or production note, shown under the title. */
	meta?: string;
};

const SANITY_CDN = "https://cdn.sanity.io/images/0smxd0yv/production";

/**
 * The current drop. Static for now: the manager on the VPS will serve the same
 * shape from its API later, so only `useMerchProducts()` has to change.
 */
export const MERCH_PRODUCTS: MerchProduct[] = [
	{
		id: "carhartt-8-years-longsleeve",
		title: "Carhartt WIP x Callshop Radio - 8 Years Callshop Radio Longsleeve",
		images: [
			`${SANITY_CDN}/6d0a9a0cf75710ee3e6114a31de982dc1ac3d18d-806x500.png?w=1600&fit=max&auto=format`,
		],
		imageAlt: "White long sleeve with the 8-bit pattern print, front and back",
		buyUrl: "https://tally.so/r/eqOzko",
		soldOut: false,
	},
	{
		id: "tee-0800-reissue-black-red",
		title: "0800-C-A-L-L-S-H-O-P Tee - Reissue Black/Red",
		images: [
			`${SANITY_CDN}/8176ac58a8cc4c4e7023daee42df2daaa2cdc4a7-1920x1080.jpg?w=1600&fit=max&auto=format`,
		],
		imageAlt:
			"Black tee with the red 0800-C-A-L-L-S-H-O-P globe print, front and back",
		buyUrl: null,
		soldOut: true,
	},
	{
		id: "airwaves-cap",
		title: "Callshop Airwaves Cap",
		images: [
			`${SANITY_CDN}/ec9a1587bb6ced64d6c00114b117c7e6e57c68a6-1920x1080.jpg?w=1600&fit=max&auto=format`,
		],
		imageAlt: "Callshop Airwaves cap",
		buyUrl: null,
		soldOut: true,
	},
	{
		id: "airwaves-hoodie",
		title: "Callshop Airwaves Hoodie",
		images: [
			`${SANITY_CDN}/a1a5e170dfdb09984f4dbdfe8f58ab3d6d277515-1920x1080.jpg?w=1600&fit=max&auto=format`,
		],
		imageAlt: "Callshop Airwaves hoodie",
		buyUrl: null,
		soldOut: true,
	},
	{
		id: "pool-cap",
		title: "Callshop Pool Cap",
		images: [
			`${SANITY_CDN}/d5e653011437ec508069db760440cd468c8e3e73-1920x1080.jpg?w=1600&fit=max&auto=format`,
		],
		imageAlt: "Callshop Pool cap",
		buyUrl: null,
		soldOut: true,
	},
	{
		id: "tee-0800-white-blue",
		title: "0800-C-A-L-L-S-H-O-P Tee - White/Blue",
		images: [
			`${SANITY_CDN}/ec9997963c0e3290cf4810ab5e54933ac52a90d1-1920x1080.jpg?w=1600&fit=max&auto=format`,
		],
		imageAlt: "White tee with the blue 0800-C-A-L-L-S-H-O-P print",
		buyUrl: null,
		soldOut: true,
	},
	{
		id: "crew-shirt",
		title: "Callshop Crew Shirt",
		images: [
			"/merch/callshop-crew-shirt-1.jpg",
			"/merch/callshop-crew-shirt-2.jpg",
			"/merch/callshop-crew-shirt-3.jpg",
			"/merch/callshop-crew-shirt-4.jpg",
			"/merch/callshop-crew-shirt-5.jpg",
			"/merch/callshop-crew-shirt-6.jpg",
			"/merch/callshop-crew-shirt-7.jpg",
			"/merch/callshop-crew-shirt-8.jpg",
		],
		imageAlt:
			"Colour-blocked Callshop Radio crew shirt in blue, black, yellow, red and pink",
		buyUrl: null,
		soldOut: true,
		meta: "Design by Hade · 100% recycled PES · made in Portugal",
		description:
			"The crew shirt, designed by Hade and produced in Portugal together with Raval Football. Pre-order only, made from recycled polyester.",
	},
	{
		id: "hoodie",
		title: "Callshop Hoodie",
		images: [
			"/merch/callshop-hoodie-1.jpg",
			"/merch/callshop-hoodie-2.jpg",
			"/merch/callshop-hoodie-3.jpg",
		],
		imageAlt:
			"Heather grey hoodie with the embroidered Callshop Radio phone logo",
		buyUrl: null,
		soldOut: true,
		meta: "Heather grey · embroidered logo",
		description:
			"Heather grey hoodie with the embroidered Callshop Radio phone logo. A small, limited run.",
	},
];

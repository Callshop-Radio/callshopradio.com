import { appendResponseHeader } from "h3";

import { copySetCookies } from "../../server/utils/listenerSession";

/**
 * Same-origin calls only. On the server the incoming cookie is forwarded so a
 * private SSR render is personalised; the renewal Set-Cookie is copied onto the
 * outer document response, which a nested fetch would otherwise drop.
 */
export function useAccountRequest() {
	const request = useRequestFetch() as unknown as {
		raw<T>(url: string, options?: Record<string, unknown>): Promise<{ _data: T; headers: Headers }>;
	};
	const event = import.meta.server ? useRequestEvent() : null;

	return async function accountRequest<T>(path: string, options: Record<string, unknown> = {}): Promise<T> {
		const response = await request.raw<T>(`/api/account/${String(path).replace(/^\/+/, "")}`, {
			...options,
			credentials: "same-origin",
		});
		if (event) {
			copySetCookies(response.headers, (value) => appendResponseHeader(event, "set-cookie", value));
		}
		return response._data as T;
	};
}

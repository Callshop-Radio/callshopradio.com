import { appendResponseHeader } from "h3";

import { copySetCookies } from "../../server/utils/listenerSession";

type RawResponse<T> = {
	_data: T;
	headers: Headers;
	status: number;
	ok: boolean;
};

/**
 * Same-origin calls only. On the server the incoming cookie is forwarded so a
 * private SSR render is personalised; the renewal or deletion Set-Cookie is
 * copied onto the outer document response, which a nested fetch would
 * otherwise drop — including on a 401, which is exactly when it matters.
 */
export function useAccountRequest() {
	const request = useRequestFetch() as unknown as {
		raw<T>(
			url: string,
			options?: Record<string, unknown>,
		): Promise<RawResponse<T>>;
	};
	const event = import.meta.server ? useRequestEvent() : null;

	return async function accountRequest<T>(
		path: string,
		options: Record<string, unknown> = {},
	): Promise<T> {
		const response = await request.raw<T>(
			`/api/account/${String(path).replace(/^\/+/, "")}`,
			{
				...options,
				credentials: "same-origin",
				ignoreResponseError: true,
			},
		);

		if (event) {
			copySetCookies(response.headers, (value) =>
				appendResponseHeader(event, "set-cookie", value),
			);
		}

		if (!response.ok) {
			throw Object.assign(
				new Error(`account request failed: ${response.status}`),
				{
					statusCode: response.status,
					data: response._data,
				},
			);
		}

		return response._data as T;
	};
}

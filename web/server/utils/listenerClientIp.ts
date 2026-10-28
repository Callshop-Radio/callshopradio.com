import { createHmac } from "node:crypto";
import { getHeader } from "h3";

const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-f:]+$/i;

export function isIp(value: unknown): value is string {
	const ip = String(value ?? "").trim();
	if (ip.length === 0 || ip.length > 45) return false;
	if (IPV4.test(ip)) {
		return ip.split(".").every((part) => Number(part) <= 255);
	}
	return ip.includes(":") && IPV6.test(ip);
}

/**
 * The manager needs a trustworthy client IP for login throttling. Netlify gives
 * functions `context.ip`; its legacy `x-nf-client-connection-ip` header is only
 * read when the runtime proves it is running on Netlify. A browser-supplied
 * header is never trusted, and there is no production fallback.
 */
export function clientIpFrom({
	contextIp,
	headers,
	env,
}: {
	contextIp?: unknown;
	headers: Record<string, string | string[] | undefined>;
	env: Record<string, string | undefined>;
}): string | null {
	if (isIp(contextIp)) return contextIp.trim();

	if (env.NETLIFY === "true") {
		const header = headers["x-nf-client-connection-ip"];
		const value = Array.isArray(header) ? header[0] : header;
		if (isIp(value)) return value.trim();
	}

	if (env.NUXT_ACCOUNT_DEV_MODE === "1" && env.NODE_ENV !== "production") {
		return "127.0.0.1";
	}
	return null;
}

export function listenerIpKey(ip: string, secret: string): string {
	return createHmac("sha256", secret).update(ip).digest("hex");
}

export function listenerClientIp(
	event: unknown,
	env = process.env,
): string | null {
	const context = (event as { context?: Record<string, unknown> })?.context;
	const headers = (
		event as {
			node?: { req?: { headers?: Record<string, string | string[]> } };
		}
	)?.node?.req?.headers;
	return clientIpFrom({
		contextIp:
			context?.ip ?? (context?.netlify as { ip?: unknown } | undefined)?.ip,
		headers: headers ?? {},
		env,
	});
}

export function accountIpKey(
	event: unknown,
	secret: string,
	env = process.env,
): string | null {
	const ip = listenerClientIp(event, env);
	return ip ? listenerIpKey(ip, secret) : null;
}

export function requestHeader(
	event: unknown,
	name: string,
): string | undefined {
	return getHeader(event as never, name) as string | undefined;
}

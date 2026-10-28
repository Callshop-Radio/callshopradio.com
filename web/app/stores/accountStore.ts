import { defineStore } from "pinia";
import { ref } from "vue";

export type SessionState =
	| "unknown"
	| "guest"
	| "authenticated"
	| "unavailable";
export type AccountRequest = <T>(
	path: string,
	options?: Record<string, unknown>,
) => Promise<T>;

const BATCH_SIZE = 200;

function chunk<T>(items: T[], size: number): T[][] {
	const batches: T[][] = [];
	for (let index = 0; index < items.length; index += size) {
		batches.push(items.slice(index, index + size));
	}
	return batches;
}

function statusOf(error: unknown): number {
	const value =
		(error as {
			statusCode?: number;
			status?: number;
			response?: { status?: number };
		}) ?? {};
	return Number(
		value.statusCode ?? value.status ?? value.response?.status ?? 0,
	);
}

/**
 * The account state is deliberately a plain controller so it can be tested
 * without a Nuxt runtime. The Pinia store below is a thin wrapper.
 *
 * Rules that matter: no account data in public SSR, only unknown ids are
 * fetched, toggles for one set never race, and a late response from before a
 * logout can never write into the fresh state.
 */
export function createAccountController(request: AccountRequest) {
	const saved = ref<Record<string, string[]>>({});
	const sessionState = ref<SessionState>("unknown");
	const generation = ref(0);
	const inFlight = new Map<string, Promise<void>>();

	async function loadSession(): Promise<void> {
		const current = generation.value;
		try {
			await request("me");
			if (current !== generation.value) return;
			sessionState.value = "authenticated";
		} catch (error) {
			if (current !== generation.value) return;
			const status = statusOf(error);
			if (status === 401) {
				sessionState.value = "guest";
				saved.value = {};
				return;
			}
			sessionState.value = "unavailable";
		}
	}

	async function loadVisible(ids: string[]): Promise<void> {
		if (sessionState.value === "guest") return;
		const unique = [
			...new Set(ids.filter((id) => typeof id === "string" && id.length > 0)),
		].filter((id) => !(id in saved.value));
		if (unique.length === 0) return;

		const current = generation.value;
		for (const batch of chunk(unique, BATCH_SIZE)) {
			try {
				const response = await request<{ saved: Record<string, string[]> }>(
					`me/saved-ids?ids=${encodeURIComponent(batch.join(","))}`,
				);
				if (current !== generation.value) return;
				saved.value = { ...saved.value, ...(response?.saved ?? {}) };
				if (sessionState.value === "unknown")
					sessionState.value = "authenticated";
			} catch (error) {
				if (current !== generation.value) return;
				const status = statusOf(error);
				if (status === 401) {
					sessionState.value = "guest";
					saved.value = {};
				} else {
					sessionState.value = "unavailable";
				}
				return;
			}
		}
	}

	async function toggle(setId: string): Promise<void> {
		const key = String(setId);
		const current = generation.value;

		const run = async () => {
			if (current !== generation.value) return;
			const wasSaved = key in saved.value;
			const previous = saved.value[key];
			// Optimistic: an empty list means "saved, list ids unknown".
			saved.value = { ...saved.value, [key]: previous ?? [] };

			try {
				if (wasSaved) {
					await request(`me/saved/${encodeURIComponent(key)}`, {
						method: "DELETE",
					});
					if (current !== generation.value) return;
					const next = { ...saved.value };
					delete next[key];
					saved.value = next;
				} else {
					const response = await request<{ listId: string }>(
						`me/saved/${encodeURIComponent(key)}`,
						{
							method: "PUT",
						},
					);
					if (current !== generation.value) return;
					saved.value = {
						...saved.value,
						[key]: response?.listId ? [response.listId] : [],
					};
				}
			} catch (error) {
				if (current !== generation.value) return;
				const status = statusOf(error);
				if (status === 401) {
					sessionState.value = "guest";
					saved.value = {};
					return;
				}
				// Roll back to the exact previous state.
				const next = { ...saved.value };
				if (previous === undefined) delete next[key];
				else next[key] = previous;
				saved.value = next;
			}
		};

		const task = (inFlight.get(key) ?? Promise.resolve()).then(run, run);
		const tracked = task.finally(() => {
			if (inFlight.get(key) === tracked) inFlight.delete(key);
		});
		inFlight.set(key, tracked);
		await tracked;
	}

	function reset(): void {
		generation.value += 1;
		saved.value = {};
		sessionState.value = "guest";
		inFlight.clear();
	}

	return { saved, sessionState, loadSession, loadVisible, toggle, reset };
}

export const useAccountStore = defineStore("account", () => {
	const request = useAccountRequest();
	return createAccountController(request as AccountRequest);
});

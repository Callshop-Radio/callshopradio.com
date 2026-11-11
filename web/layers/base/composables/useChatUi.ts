export const useChatUi = () => {
	const open = useState<boolean>("chat-open", () => false);
	const minimized = useState<boolean>("chat-minimized", () => false);

	const persist = (key: string, value: boolean) => {
		if (import.meta.client) {
			localStorage.setItem(key, value ? "1" : "0");
		}
	};

	const toggle = () => {
		open.value = !open.value;
		persist("chat:open", open.value);
	};

	const close = () => {
		open.value = false;
		persist("chat:open", false);
	};

	const minimize = () => {
		minimized.value = true;
		persist("chat:minimized", true);
	};

	const restore = () => {
		minimized.value = false;
		persist("chat:minimized", false);
	};

	const toggleMinimize = () => {
		minimized.value = !minimized.value;
		persist("chat:minimized", minimized.value);
	};

	return { open, minimized, toggle, close, minimize, restore, toggleMinimize };
};

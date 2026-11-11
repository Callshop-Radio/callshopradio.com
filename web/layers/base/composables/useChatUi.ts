export const useChatUi = () => {
	const open = useState<boolean>("chat-open", () => false);
	const minimized = useState<boolean>("chat-minimized", () => false);

	const toggle = () => {
		open.value = !open.value;
	};

	const close = () => {
		open.value = false;
	};

	const minimize = () => {
		minimized.value = true;
	};

	const restore = () => {
		minimized.value = false;
	};

	const toggleMinimize = () => {
		minimized.value = !minimized.value;
	};

	return { open, minimized, toggle, close, minimize, restore, toggleMinimize };
};

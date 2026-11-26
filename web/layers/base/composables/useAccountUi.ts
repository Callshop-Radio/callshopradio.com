export const useAccountUi = () => {
	const loginOpen = useState<boolean>("account-login-open", () => false);

	const openLogin = () => {
		loginOpen.value = true;
	};

	const closeLogin = () => {
		loginOpen.value = false;
	};

	return { loginOpen, openLogin, closeLogin };
};

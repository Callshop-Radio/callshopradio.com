export const parseI18nObj = (
	stringObj: Array<{ _key: string; value: string }> | undefined,
): string | undefined => {
	const { locale } = useI18n();

	if (!stringObj) {
		console.warn("No i18n string object provided!");
		return;
	}

	return stringObj.find((item) => item._key === locale.value)?.value;
};

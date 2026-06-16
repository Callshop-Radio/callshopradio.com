type I18nArrayItem<T = string> = {
	_key?: string;
	language?: string;
	value?: T;
};

/** Resolve locale from v5 `language` or legacy v4 `_key`. */
export const getI18nLocale = (item: I18nArrayItem): string | undefined =>
	item.language ?? item._key;

export const parseI18nObj = <T = string>(
	stringObj: Array<I18nArrayItem<T>> | undefined,
): T | undefined => {
	const { locale } = useI18n();

	if (!stringObj) {
		console.warn("No i18n string object provided!");
		return;
	}

	return stringObj.find((item) => getI18nLocale(item) === locale.value)?.value;
};

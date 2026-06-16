type I18nArrayItem<T = string> = {
	_key?: string;
	language?: string;
	_type?: string;
	value?: T;
};

type I18nField<T = string> = I18nArrayItem<T>[] | T | null | undefined;

/** Resolve locale from v5 `language` or legacy v4 `_key`. */
export const getI18nLocale = <T = string>(
	item: I18nArrayItem<T>,
): string | undefined => item.language ?? item._key;

const isNonEmptyValue = (value: unknown): boolean => {
	if (value == null) return false;
	if (typeof value === "string") return value.length > 0;
	if (Array.isArray(value)) return value.length > 0;
	return true;
};

/** True when the array is an internationalizedArray* wrapper list. */
export const isI18nArray = <T = string>(
	value: unknown,
): value is I18nArrayItem<T>[] => {
	if (!Array.isArray(value) || value.length === 0) return false;
	const first = value[0];
	if (typeof first !== "object" || first === null) return false;
	if (!("value" in first)) return false;
	if (first._type?.includes("internationalizedArray")) return true;
	return "language" in first || (typeof first._key === "string" && !first._type);
};

const readLocale = (): string => {
	try {
		const i18n = useNuxtApp().$i18n as {
			locale: { value: string };
		};
		return i18n?.locale?.value ?? "en";
	} catch {
		return "en";
	}
};

const readDefaultLocale = (): string => {
	try {
		const i18n = useNuxtApp().$i18n as {
			defaultLocale?: string;
			locale?: { value: string };
		};
		return i18n?.defaultLocale ?? i18n?.locale?.value ?? "en";
	} catch {
		return "en";
	}
};

/** Pick the best matching entry from an internationalized array. */
export const resolveI18nValue = <T = string>(
	stringObj: I18nArrayItem<T>[] | undefined,
	locale?: string,
): T | undefined => {
	if (!stringObj?.length) return undefined;

	const activeLocale = locale ?? readLocale();
	const defaultLocale = readDefaultLocale();

	const byLocale = stringObj.find(
		(item) => getI18nLocale(item) === activeLocale,
	);
	if (isNonEmptyValue(byLocale?.value)) return byLocale?.value;

	if (activeLocale !== defaultLocale) {
		const byDefault = stringObj.find(
			(item) => getI18nLocale(item) === defaultLocale,
		);
		if (isNonEmptyValue(byDefault?.value)) return byDefault?.value;
	}

	const firstFilled = stringObj.find((item) => isNonEmptyValue(item.value));
	return firstFilled?.value;
};

/**
 * Resolve internationalized rich text, string, or pass through plain values.
 * Safe to call from templates (uses `$i18n`, not `useI18n()`).
 */
export const parseI18nObj = <T = string>(
	field: I18nField<T>,
	locale?: string,
): T | undefined => {
	if (field == null) return undefined;
	if (isI18nArray<T>(field)) return resolveI18nValue(field, locale);
	return field as T;
};

/** Resolve internationalized string fields (e.g. tag.city title/short). */
export const getI18nLabel = (field: I18nField<string>): string => {
	if (field == null) return "";
	if (typeof field === "string") return field;
	const resolved = parseI18nObj<string>(field);
	return typeof resolved === "string" ? resolved : "";
};

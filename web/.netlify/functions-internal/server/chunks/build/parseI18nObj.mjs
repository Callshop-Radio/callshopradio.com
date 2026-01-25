import { e as useI18n } from './server.mjs';

const parseI18nObj = (stringObj) => {
  var _a;
  const { locale } = useI18n();
  if (!stringObj) {
    console.warn("No i18n string object provided!");
    return;
  }
  return (_a = stringObj.find((item) => item._key === locale.value)) == null ? void 0 : _a.value;
};

export { parseI18nObj as p };

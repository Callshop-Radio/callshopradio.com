import { shallowReactive, reactive, effectScope, getCurrentScope, hasInjectionContext, getCurrentInstance, toRef, inject, shallowRef, isReadonly, isRef, isShallow, isReactive, toRaw, ref, markRaw, onScopeDispose, watch, nextTick, toRefs, computed, unref, defineComponent, h, Fragment, createVNode, Text, onServerPrefetch, resolveComponent, mergeProps, useSSRContext, withCtx, createBlock, openBlock, renderSlot, createTextVNode, toDisplayString as toDisplayString$1, provide, createElementBlock, Suspense, watchEffect, withAsyncContext, onErrorCaptured, resolveDynamicComponent, createApp } from 'vue';
import { n as createHooks, o as getContext, c as createError$1, t as toRouteMatcher, q as createRouter, v as defu, w as sanitizeStatusCode, x as executeAsync, y as getRequestHeaders, z as destr, A as klona, B as parse$1, C as getRequestHeader, D as isEqual$1, E as setCookie, F as getCookie, G as deleteCookie } from '../nitro/nitro.mjs';
import { START_LOCATION, createMemoryHistory, createRouter as createRouter$1, isNavigationFailure, RouterView } from 'vue-router';
import { studioPath, studioPathToJsonPath, resolveEditInfo, jsonPathToStudioPath } from '@sanity/client/csm';
import { encodeSanityNodeData } from '@sanity/visual-editing-csm';
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { ssrRenderAttrs, ssrRenderClass, ssrRenderAttr, ssrInterpolate, ssrRenderList, ssrRenderTeleport, ssrRenderComponent, ssrIncludeBooleanAttr, ssrRenderSlot, ssrRenderStyle, ssrRenderSuspense, ssrRenderVNode } from 'vue/server-renderer';
import { u as useHead$1, a as useSeoMeta$1, h as headSymbol } from '../routes/renderer.mjs';
import { createPlaceholderFromHash, autoSizes, loadImage, lazyLoad } from 'unlazy';
import Hls from 'hls.js';
import emblaCarouselVue from 'embla-carousel-vue';

const appPageTransition = {};
const nuxtLinkDefaults = { "componentName": "NuxtLink" };
const asyncDataDefaults = { "deep": false };
const appId = "nuxt-app";

function getNuxtAppCtx(id = appId) {
  return getContext(id, {
    asyncContext: false
  });
}
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  var _a;
  let hydratingCount = 0;
  const nuxtApp = {
    _id: options.id || appId || "nuxt-app",
    _scope: effectScope(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.16.1";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: shallowReactive({
      ...((_a = options.ssrContext) == null ? void 0 : _a.payload) || {},
      data: shallowReactive({}),
      state: reactive({}),
      once: /* @__PURE__ */ new Set(),
      _errors: shallowReactive({})
    }),
    static: {
      data: {}
    },
    runWithContext(fn) {
      if (nuxtApp._scope.active && !getCurrentScope()) {
        return nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn));
      }
      return callWithNuxt(nuxtApp, fn);
    },
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: shallowReactive({}),
    _payloadRevivers: {},
    ...options
  };
  {
    nuxtApp.payload.serverRendered = true;
  }
  if (nuxtApp.ssrContext) {
    nuxtApp.payload.path = nuxtApp.ssrContext.url;
    nuxtApp.ssrContext.nuxt = nuxtApp;
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: nuxtApp.ssrContext.runtimeConfig.public,
      app: nuxtApp.ssrContext.runtimeConfig.app
    };
  }
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    const contextCaller = async function(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    };
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter$1(nuxtApp, $name, value);
    defineGetter$1(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter$1(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter$1(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
function registerPluginHooks(nuxtApp, plugin) {
  if (plugin.hooks) {
    nuxtApp.hooks.addHooks(plugin.hooks);
  }
}
async function applyPlugin(nuxtApp, plugin) {
  if (typeof plugin === "function") {
    const { provide } = await nuxtApp.runWithContext(() => plugin(nuxtApp)) || {};
    if (provide && typeof provide === "object") {
      for (const key in provide) {
        nuxtApp.provide(key, provide[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins) {
  var _a, _b, _c, _d;
  const resolvedPlugins = [];
  const unresolvedPlugins = [];
  const parallels = [];
  const errors = [];
  let promiseDepth = 0;
  async function executePlugin(plugin) {
    var _a2;
    const unresolvedPluginsForThisPlugin = ((_a2 = plugin.dependsOn) == null ? void 0 : _a2.filter((name) => plugins.some((p) => p._name === name) && !resolvedPlugins.includes(name))) ?? [];
    if (unresolvedPluginsForThisPlugin.length > 0) {
      unresolvedPlugins.push([new Set(unresolvedPluginsForThisPlugin), plugin]);
    } else {
      const promise = applyPlugin(nuxtApp, plugin).then(async () => {
        if (plugin._name) {
          resolvedPlugins.push(plugin._name);
          await Promise.all(unresolvedPlugins.map(async ([dependsOn, unexecutedPlugin]) => {
            if (dependsOn.has(plugin._name)) {
              dependsOn.delete(plugin._name);
              if (dependsOn.size === 0) {
                promiseDepth++;
                await executePlugin(unexecutedPlugin);
              }
            }
          }));
        }
      });
      if (plugin.parallel) {
        parallels.push(promise.catch((e) => errors.push(e)));
      } else {
        await promise;
      }
    }
  }
  for (const plugin of plugins) {
    if (((_a = nuxtApp.ssrContext) == null ? void 0 : _a.islandContext) && ((_b = plugin.env) == null ? void 0 : _b.islands) === false) {
      continue;
    }
    registerPluginHooks(nuxtApp, plugin);
  }
  for (const plugin of plugins) {
    if (((_c = nuxtApp.ssrContext) == null ? void 0 : _c.islandContext) && ((_d = plugin.env) == null ? void 0 : _d.islands) === false) {
      continue;
    }
    await executePlugin(plugin);
  }
  await Promise.all(parallels);
  if (promiseDepth) {
    for (let i = 0; i < promiseDepth; i++) {
      await Promise.all(parallels);
    }
  }
  if (errors.length) {
    throw errors[0];
  }
}
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin) {
  if (typeof plugin === "function") {
    return plugin;
  }
  const _name = plugin._name || plugin.name;
  delete plugin.name;
  return Object.assign(plugin.setup || (() => {
  }), plugin, { [NuxtPluginIndicator]: true, _name });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => setup();
  const nuxtAppCtx = getNuxtAppCtx(nuxt._id);
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
function tryUseNuxtApp(id) {
  var _a;
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = (_a = getCurrentInstance()) == null ? void 0 : _a.appContext.app.$nuxt;
  }
  nuxtAppInstance || (nuxtAppInstance = getNuxtAppCtx(id).tryUse());
  return nuxtAppInstance || null;
}
function useNuxtApp(id) {
  const nuxtAppInstance = tryUseNuxtApp(id);
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig(_event) {
  return useNuxtApp().$config;
}
function defineGetter$1(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}

const NUXT_ERROR_SIGNATURE = "__nuxt_error";
const useError = () => toRef(useNuxtApp().payload, "error");
const showError = (error) => {
  const nuxtError = createError(error);
  try {
    const nuxtApp = useNuxtApp();
    const error2 = useError();
    if (false) ;
    error2.value || (error2.value = nuxtError);
  } catch {
    throw nuxtError;
  }
  return nuxtError;
};
const isNuxtError = (error) => !!error && typeof error === "object" && NUXT_ERROR_SIGNATURE in error;
const createError = (error) => {
  const nuxtError = createError$1(error);
  Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
    value: true,
    configurable: false,
    writable: false
  });
  return nuxtError;
};

const unhead_PtamfB47yqQY_Rh4zjrimgYJkXOrkZ_s7Rhm1JWaAcQ = defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    nuxtApp.vueApp.use(head);
  }
});

const ROUTE_KEY_PARENTHESES_RE$1 = /(:\w+)\([^)]+\)/g;
const ROUTE_KEY_SYMBOLS_RE$1 = /(:\w+)[?+*]/g;
const ROUTE_KEY_NORMAL_RE$1 = /:\w+/g;
const interpolatePath = (route, match) => {
  return match.path.replace(ROUTE_KEY_PARENTHESES_RE$1, "$1").replace(ROUTE_KEY_SYMBOLS_RE$1, "$1").replace(ROUTE_KEY_NORMAL_RE$1, (r) => {
    var _a;
    return ((_a = route.params[r.slice(1)]) == null ? void 0 : _a.toString()) || "";
  });
};
const generateRouteKey$1 = (routeProps, override) => {
  const matchedRoute = routeProps.route.matched.find((m) => {
    var _a;
    return ((_a = m.components) == null ? void 0 : _a.default) === routeProps.Component.type;
  });
  const source = override ?? (matchedRoute == null ? void 0 : matchedRoute.meta.key) ?? (matchedRoute && interpolatePath(routeProps.route, matchedRoute));
  return typeof source === "function" ? source(routeProps.route) : source;
};
function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

async function getRouteRules(arg) {
  const path = typeof arg === "string" ? arg : arg.path;
  {
    useNuxtApp().ssrContext._preloadManifest = true;
    const _routeRulesMatcher = toRouteMatcher(
      createRouter({ routes: useRuntimeConfig().nitro.routeRules })
    );
    return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
  }
}

const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const SLASH_RE = /\//g;
const EQUAL_RE = /=/g;
const PLUS_RE = /\+/g;
const ENC_CARET_RE = /%5e/gi;
const ENC_BACKTICK_RE = /%60/gi;
const ENC_PIPE_RE = /%7c/gi;
const ENC_SPACE_RE = /%20/gi;
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^").replace(SLASH_RE, "%2F");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function decode(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodeQueryKey(text) {
  return decode(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode(text.replace(PLUS_RE, " "));
}
function parseQuery(parametersString = "") {
  const object = {};
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map((_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k) => query[k] !== void 0).map((k) => encodeQueryItem(k, query[k])).filter(Boolean).join("&");
}
const PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
const PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
const PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
const PROTOCOL_SCRIPT_RE = /^[\s\0]*(blob|data|javascript|vbscript):$/i;
const TRAILING_SLASH_RE = /\/$|\/\?|\/#/;
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
function isScriptProtocol(protocol) {
  return !!protocol && PROTOCOL_SCRIPT_RE.test(protocol);
}
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/");
  }
  return TRAILING_SLASH_RE.test(input);
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
  if (!hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex >= 0) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
  }
  const [s0, ...s] = path.split("?");
  const cleanPath = s0.endsWith("/") ? s0.slice(0, -1) : s0;
  return (cleanPath || "/") + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/") ? input : input + "/";
  }
  if (hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex >= 0) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
    if (!path) {
      return fragment;
    }
  }
  const [s0, ...s] = path.split("?");
  return s0 + "/" + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}
function isEqual(a, b, options = {}) {
  if (!options.trailingSlash) {
    a = withTrailingSlash(a);
    b = withTrailingSlash(b);
  }
  if (!options.leadingSlash) {
    a = withLeadingSlash(a);
    b = withLeadingSlash(b);
  }
  if (!options.encoding) {
    a = decode(a);
    b = decode(b);
  }
  return a === b;
}
const protocolRelative = Symbol.for("ufo:protocolRelative");
function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto.toLowerCase(),
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  let [, host = "", path = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  if (protocol === "file:") {
    path = path.replace(/\/(?=[A-Za-z]:)/, "");
  }
  const { pathname, search, hash } = parsePath(path);
  return {
    protocol: protocol.toLowerCase(),
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash,
    [protocolRelative]: !protocol
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol || parsed[protocolRelative] ? (parsed.protocol || "") + "//" : "";
  return proto + auth + host + pathname + search + hash;
}

const LayoutMetaSymbol = Symbol("layout-meta");
const PageRouteSymbol = Symbol("route");

const useRouter = () => {
  var _a;
  return (_a = useNuxtApp()) == null ? void 0 : _a.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, useNuxtApp()._route);
  }
  return useNuxtApp()._route;
};
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const addRouteMiddleware = (name, middleware, options = {}) => {
  const nuxtApp = useNuxtApp();
  const global = options.global || false;
  const mw = middleware;
  if (!mw) {
    console.warn("[nuxt] No route middleware passed to `addRouteMiddleware`.", name);
    return;
  }
  if (global) {
    nuxtApp._middleware.global.push(mw);
  } else {
    nuxtApp._middleware.named[name] = mw;
  }
};
const isProcessingMiddleware = () => {
  try {
    if (useNuxtApp()._processingMiddleware) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};
const URL_QUOTE_RE = /"/g;
const navigateTo = (to, options) => {
  to || (to = "/");
  const toPath = typeof to === "string" ? to : "path" in to ? resolveRouteObject$1(to) : useRouter().resolve(to).href;
  const isExternalHost = hasProtocol(toPath, { acceptRelative: true });
  const isExternal = (options == null ? void 0 : options.external) || isExternalHost;
  if (isExternal) {
    if (!(options == null ? void 0 : options.external)) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const { protocol } = new URL(toPath, "http://localhost");
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL(useRuntimeConfig().app.baseURL, fullPath);
      const redirect = async function(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedLoc = location2.replace(URL_QUOTE_RE, "%22");
        const encodedHeader = encodeURL(location2, isExternalHost);
        nuxtApp.ssrContext._renderResponse = {
          statusCode: sanitizeStatusCode((options == null ? void 0 : options.redirectCode) || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: encodedHeader }
        };
        return response;
      };
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options == null ? void 0 : options.replace) {
      (void 0).replace(toPath);
    } else {
      (void 0).href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  return (options == null ? void 0 : options.replace) ? router.replace(to) : router.push(to);
};
function resolveRouteObject$1(to) {
  return withQuery(to.path || "", to.query || {}) + (to.hash || "");
}
function encodeURL(location2, isExternalHost = false) {
  const url = new URL(location2, "http://localhost");
  if (!isExternalHost) {
    return url.pathname + url.search + url.hash;
  }
  if (location2.startsWith("//")) {
    return url.toString().replace(url.protocol, "");
  }
  return url.toString();
}

const __nuxt_page_meta = null;

const component_45stubGOflwPN47VKOcY0ylYmKy6eIi9QhKMrWp1urJSgBK_A = {};

var _a, _b;
function handleHotUpdate(_router, _generateRoutes) {
}
const _routes = [
  {
    name: "index___en",
    path: "/",
    component: () => import('./index.vue.mjs')
  },
  {
    name: "index___de",
    path: "/de",
    component: () => import('./index.vue.mjs')
  },
  {
    name: "slug___en",
    path: "/:slug()",
    component: () => import('./_slug_.vue.mjs')
  },
  {
    name: "slug___de",
    path: "/de/:slug()",
    component: () => import('./_slug_.vue.mjs')
  },
  {
    name: "pool___en",
    path: "/pool",
    component: () => import('./index.vue2.mjs')
  },
  {
    name: "pool___de",
    path: "/de/pool",
    component: () => import('./index.vue2.mjs')
  },
  {
    name: "pool-slug___en",
    path: "/pool/:slug()",
    component: () => import('./_slug_.vue2.mjs')
  },
  {
    name: "pool-slug___de",
    path: "/de/pool/:slug()",
    component: () => import('./_slug_.vue2.mjs')
  },
  {
    name: "shows___en",
    path: "/shows",
    component: () => import('./index.vue3.mjs')
  },
  {
    name: "shows___de",
    path: "/de/shows",
    component: () => import('./index.vue3.mjs')
  },
  {
    name: "words___en",
    path: "/words",
    component: () => import('./index.vue4.mjs')
  },
  {
    name: "words___de",
    path: "/de/words",
    component: () => import('./index.vue4.mjs')
  },
  {
    name: "search___en",
    path: "/search",
    component: () => import('./index.vue5.mjs')
  },
  {
    name: "search___de",
    path: "/de/search",
    component: () => import('./index.vue5.mjs')
  },
  {
    name: "words-slug___en",
    path: "/words/:slug()",
    component: () => import('./_slug_.vue3.mjs')
  },
  {
    name: "words-slug___de",
    path: "/de/words/:slug()",
    component: () => import('./_slug_.vue3.mjs')
  },
  {
    name: "schedule___en",
    path: "/schedule",
    component: () => import('./index.vue6.mjs')
  },
  {
    name: "schedule___de",
    path: "/de/schedule",
    component: () => import('./index.vue6.mjs')
  },
  {
    name: "shows-slug___en",
    path: "/shows/:slug()",
    component: () => import('./index.vue7.mjs')
  },
  {
    name: "shows-slug___de",
    path: "/de/shows/:slug()",
    component: () => import('./index.vue7.mjs')
  },
  {
    name: "shows-slug-set___en",
    path: "/shows/:slug()/:set()",
    component: () => import('./index.vue8.mjs')
  },
  {
    name: "shows-slug-set___de",
    path: "/de/shows/:slug()/:set()",
    component: () => import('./index.vue8.mjs')
  },
  {
    name: (_a = __nuxt_page_meta) == null ? void 0 : _a.name,
    path: "/sitemap.xml",
    component: component_45stubGOflwPN47VKOcY0ylYmKy6eIi9QhKMrWp1urJSgBK_A
  },
  {
    name: (_b = __nuxt_page_meta) == null ? void 0 : _b.name,
    path: "/de/sitemap.xml",
    component: component_45stubGOflwPN47VKOcY0ylYmKy6eIi9QhKMrWp1urJSgBK_A
  }
];

const ROUTE_KEY_PARENTHESES_RE = /(:\w+)\([^)]+\)/g;
const ROUTE_KEY_SYMBOLS_RE = /(:\w+)[?+*]/g;
const ROUTE_KEY_NORMAL_RE = /:\w+/g;
function generateRouteKey(route) {
  const source = (route == null ? void 0 : route.meta.key) ?? route.path.replace(ROUTE_KEY_PARENTHESES_RE, "$1").replace(ROUTE_KEY_SYMBOLS_RE, "$1").replace(ROUTE_KEY_NORMAL_RE, (r) => {
    var _a;
    return ((_a = route.params[r.slice(1)]) == null ? void 0 : _a.toString()) || "";
  });
  return typeof source === "function" ? source(route) : source;
}
function isChangingPage(to, from) {
  if (to === from || from === START_LOCATION) {
    return false;
  }
  if (generateRouteKey(to) !== generateRouteKey(from)) {
    return true;
  }
  const areComponentsSame = to.matched.every(
    (comp, index) => {
      var _a, _b;
      return comp.components && comp.components.default === ((_b = (_a = from.matched[index]) == null ? void 0 : _a.components) == null ? void 0 : _b.default);
    }
  );
  if (areComponentsSame) {
    return false;
  }
  return true;
}

const routerOptions0 = {
  scrollBehavior(to, from, savedPosition) {
    var _a;
    const nuxtApp = useNuxtApp();
    const behavior = ((_a = useRouter().options) == null ? void 0 : _a.scrollBehaviorType) ?? "auto";
    let position = savedPosition || void 0;
    const routeAllowsScrollToTop = typeof to.meta.scrollToTop === "function" ? to.meta.scrollToTop(to, from) : to.meta.scrollToTop;
    if (!position && from && to && routeAllowsScrollToTop !== false && isChangingPage(to, from)) {
      position = { left: 0, top: 0 };
    }
    if (to.path === from.path) {
      if (from.hash && !to.hash) {
        return { left: 0, top: 0 };
      }
      if (to.hash) {
        return { el: to.hash, top: _getHashElementScrollMarginTop(to.hash), behavior };
      }
      return false;
    }
    const hasTransition = (route) => !!(route.meta.pageTransition ?? appPageTransition);
    const hookToWait = hasTransition(from) && hasTransition(to) ? "page:transition:finish" : "page:finish";
    return new Promise((resolve) => {
      nuxtApp.hooks.hookOnce(hookToWait, async () => {
        await new Promise((resolve2) => setTimeout(resolve2, 0));
        if (to.hash) {
          position = { el: to.hash, top: _getHashElementScrollMarginTop(to.hash), behavior };
        }
        resolve(position);
      });
    });
  }
};
function _getHashElementScrollMarginTop(selector) {
  try {
    const elem = (void 0).querySelector(selector);
    if (elem) {
      return (Number.parseFloat(getComputedStyle(elem).scrollMarginTop) || 0) + (Number.parseFloat(getComputedStyle((void 0).documentElement).scrollPaddingTop) || 0);
    }
  } catch {
  }
  return 0;
}

const configRouterOptions = {
  hashMode: false,
  scrollBehaviorType: "auto"
};
const routerOptions = {
  ...configRouterOptions,
  ...routerOptions0
};

const validate = defineNuxtRouteMiddleware(async (to) => {
  var _a;
  let __temp, __restore;
  if (!((_a = to.meta) == null ? void 0 : _a.validate)) {
    return;
  }
  const nuxtApp = useNuxtApp();
  const router = useRouter();
  const result = ([__temp, __restore] = executeAsync(() => Promise.resolve(to.meta.validate(to))), __temp = await __temp, __restore(), __temp);
  if (result === true) {
    return;
  }
  const error = createError({
    statusCode: result && result.statusCode || 404,
    statusMessage: result && result.statusMessage || `Page Not Found: ${to.fullPath}`,
    data: {
      path: to.fullPath
    }
  });
  const unsub = router.beforeResolve((final) => {
    unsub();
    if (final === to) {
      const unsub2 = router.afterEach(async () => {
        unsub2();
        await nuxtApp.runWithContext(() => showError(error));
      });
      return false;
    }
  });
});

const manifest_45route_45rule = defineNuxtRouteMiddleware(async (to) => {
  {
    return;
  }
});

const globalMiddleware = [
  validate,
  manifest_45route_45rule
];
const namedMiddleware = {};

const plugin$1 = defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  async setup(nuxtApp) {
    var _a, _b, _c, _d;
    let __temp, __restore;
    let routerBase = useRuntimeConfig().app.baseURL;
    const history = ((_b = (_a = routerOptions).history) == null ? void 0 : _b.call(_a, routerBase)) ?? createMemoryHistory(routerBase);
    const routes = routerOptions.routes ? ([__temp, __restore] = executeAsync(() => routerOptions.routes(_routes)), __temp = await __temp, __restore(), __temp) ?? _routes : _routes;
    let startPosition;
    const router = createRouter$1({
      ...routerOptions,
      scrollBehavior: (to, from, savedPosition) => {
        if (from === START_LOCATION) {
          startPosition = savedPosition;
          return;
        }
        if (routerOptions.scrollBehavior) {
          router.options.scrollBehavior = routerOptions.scrollBehavior;
          if ("scrollRestoration" in (void 0).history) {
            const unsub = router.beforeEach(() => {
              unsub();
              (void 0).history.scrollRestoration = "manual";
            });
          }
          return routerOptions.scrollBehavior(to, START_LOCATION, startPosition || savedPosition);
        }
      },
      history,
      routes
    });
    handleHotUpdate(router, routerOptions.routes ? routerOptions.routes : (routes2) => routes2);
    nuxtApp.vueApp.use(router);
    const previousRoute = shallowRef(router.currentRoute.value);
    router.afterEach((_to, from) => {
      previousRoute.value = from;
    });
    Object.defineProperty(nuxtApp.vueApp.config.globalProperties, "previousRoute", {
      get: () => previousRoute.value
    });
    const initialURL = nuxtApp.ssrContext.url;
    const _route = shallowRef(router.currentRoute.value);
    const syncCurrentRoute = () => {
      _route.value = router.currentRoute.value;
    };
    nuxtApp.hook("page:finish", syncCurrentRoute);
    router.afterEach((to, from) => {
      var _a2, _b2, _c2, _d2;
      if (((_b2 = (_a2 = to.matched[0]) == null ? void 0 : _a2.components) == null ? void 0 : _b2.default) === ((_d2 = (_c2 = from.matched[0]) == null ? void 0 : _c2.components) == null ? void 0 : _d2.default)) {
        syncCurrentRoute();
      }
    });
    const route = {};
    for (const key in _route.value) {
      Object.defineProperty(route, key, {
        get: () => _route.value[key],
        enumerable: true
      });
    }
    nuxtApp._route = shallowReactive(route);
    nuxtApp._middleware || (nuxtApp._middleware = {
      global: [],
      named: {}
    });
    useError();
    if (!((_c = nuxtApp.ssrContext) == null ? void 0 : _c.islandContext)) {
      router.afterEach(async (to, _from, failure) => {
        delete nuxtApp._processingMiddleware;
        if (failure) {
          await nuxtApp.callHook("page:loading:end");
        }
        if ((failure == null ? void 0 : failure.type) === 4) {
          return;
        }
        if (to.redirectedFrom && to.fullPath !== initialURL) {
          await nuxtApp.runWithContext(() => navigateTo(to.fullPath || "/"));
        }
      });
    }
    try {
      if (true) {
        ;
        [__temp, __restore] = executeAsync(() => router.push(initialURL)), await __temp, __restore();
        ;
      }
      ;
      [__temp, __restore] = executeAsync(() => router.isReady()), await __temp, __restore();
      ;
    } catch (error2) {
      [__temp, __restore] = executeAsync(() => nuxtApp.runWithContext(() => showError(error2))), await __temp, __restore();
    }
    const resolvedInitialRoute = router.currentRoute.value;
    syncCurrentRoute();
    if ((_d = nuxtApp.ssrContext) == null ? void 0 : _d.islandContext) {
      return { provide: { router } };
    }
    const initialLayout = nuxtApp.payload.state._layout;
    router.beforeEach(async (to, from) => {
      var _a2, _b2, _c2;
      await nuxtApp.callHook("page:loading:start");
      to.meta = reactive(to.meta);
      if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
        to.meta.layout = initialLayout;
      }
      nuxtApp._processingMiddleware = true;
      if (!((_a2 = nuxtApp.ssrContext) == null ? void 0 : _a2.islandContext)) {
        const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
        for (const component of to.matched) {
          const componentMiddleware = component.meta.middleware;
          if (!componentMiddleware) {
            continue;
          }
          for (const entry of toArray(componentMiddleware)) {
            middlewareEntries.add(entry);
          }
        }
        {
          const routeRules = await nuxtApp.runWithContext(() => getRouteRules({ path: to.path }));
          if (routeRules.appMiddleware) {
            for (const key in routeRules.appMiddleware) {
              if (routeRules.appMiddleware[key]) {
                middlewareEntries.add(key);
              } else {
                middlewareEntries.delete(key);
              }
            }
          }
        }
        for (const entry of middlewareEntries) {
          const middleware = typeof entry === "string" ? nuxtApp._middleware.named[entry] || await ((_c2 = (_b2 = namedMiddleware)[entry]) == null ? void 0 : _c2.call(_b2).then((r) => r.default || r)) : entry;
          if (!middleware) {
            throw new Error(`Unknown route middleware: '${entry}'.`);
          }
          const result = await nuxtApp.runWithContext(() => middleware(to, from));
          {
            if (result === false || result instanceof Error) {
              const error2 = result || createError$1({
                statusCode: 404,
                statusMessage: `Page Not Found: ${initialURL}`
              });
              await nuxtApp.runWithContext(() => showError(error2));
              return false;
            }
          }
          if (result === true) {
            continue;
          }
          if (result || result === false) {
            return result;
          }
        }
      }
    });
    router.onError(async () => {
      delete nuxtApp._processingMiddleware;
      await nuxtApp.callHook("page:loading:end");
    });
    router.afterEach(async (to, _from) => {
      if (to.matched.length === 0) {
        await nuxtApp.runWithContext(() => showError(createError$1({
          statusCode: 404,
          fatal: false,
          statusMessage: `Page not found: ${to.fullPath}`,
          data: {
            path: to.fullPath
          }
        })));
      }
    });
    nuxtApp.hooks.hookOnce("app:created", async () => {
      try {
        if ("name" in resolvedInitialRoute) {
          resolvedInitialRoute.name = void 0;
        }
        await router.replace({
          ...resolvedInitialRoute,
          force: true
        });
        router.options.scrollBehavior = routerOptions.scrollBehavior;
      } catch (error2) {
        await nuxtApp.runWithContext(() => showError(error2));
      }
    });
    return { provide: { router } };
  }
});

const useStateKeyPrefix = "$s";
function useState(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  const [_key, init] = args;
  if (!_key || typeof _key !== "string") {
    throw new TypeError("[nuxt] [useState] key must be a string: " + _key);
  }
  if (init !== void 0 && typeof init !== "function") {
    throw new Error("[nuxt] [useState] init must be a function: " + init);
  }
  const key = useStateKeyPrefix + _key;
  const nuxtApp = useNuxtApp();
  const state = toRef(nuxtApp.payload.state, key);
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (isRef(initialValue)) {
      nuxtApp.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
}

function useRequestEvent(nuxtApp = useNuxtApp()) {
  var _a;
  return (_a = nuxtApp.ssrContext) == null ? void 0 : _a.event;
}
function useRequestHeaders(include) {
  const event = useRequestEvent();
  const _headers = event ? getRequestHeaders(event) : {};
  if (!include || !event) {
    return _headers;
  }
  const headers = /* @__PURE__ */ Object.create(null);
  for (const _key of include) {
    const key = _key.toLowerCase();
    const header = _headers[key];
    if (header) {
      headers[key] = header;
    }
  }
  return headers;
}

const _0_siteConfig_Mw2QuAhuRFPYVYqMlPmLPRQRiI_883v_N9WPOxZZuZY = defineNuxtPlugin({
  name: "nuxt-site-config:init",
  enforce: "pre",
  async setup(nuxtApp) {
    var _a;
    const state = useState("site-config");
    {
      const context = (_a = useRequestEvent()) == null ? void 0 : _a.context;
      nuxtApp.hooks.hook("app:rendered", () => {
        state.value = context == null ? void 0 : context.siteConfig.get({
          debug: useRuntimeConfig()["nuxt-site-config"].debug,
          resolveRefs: true
        });
      });
    }
    let stack = {};
    return {
      provide: {
        nuxtSiteConfig: stack
      }
    };
  }
});

function definePayloadReducer(name, reduce) {
  {
    useNuxtApp().ssrContext._payloadReducers[name] = reduce;
  }
}

const reducers = [
  ["NuxtError", (data) => isNuxtError(data) && data.toJSON()],
  ["EmptyShallowRef", (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["EmptyRef", (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["ShallowRef", (data) => isRef(data) && isShallow(data) && data.value],
  ["ShallowReactive", (data) => isReactive(data) && isShallow(data) && toRaw(data)],
  ["Ref", (data) => isRef(data) && data.value],
  ["Reactive", (data) => isReactive(data) && toRaw(data)]
];
const revive_payload_server_Ws8SUMTo68XWM_TEhuJIQbORo_qC7bnyjJcGdGVwAYw = defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const [reducer, fn] of reducers) {
      definePayloadReducer(reducer, fn);
    }
  }
});

/*!
 * pinia v2.3.1
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */
let activePinia;
const setActivePinia = (pinia) => activePinia = pinia;
const piniaSymbol = (
  /* istanbul ignore next */
  Symbol()
);
function isPlainObject$1(o) {
  return o && typeof o === "object" && Object.prototype.toString.call(o) === "[object Object]" && typeof o.toJSON !== "function";
}
var MutationType;
(function(MutationType2) {
  MutationType2["direct"] = "direct";
  MutationType2["patchObject"] = "patch object";
  MutationType2["patchFunction"] = "patch function";
})(MutationType || (MutationType = {}));
function createPinia() {
  const scope = effectScope(true);
  const state = scope.run(() => ref({}));
  let _p = [];
  let toBeInstalled = [];
  const pinia = markRaw({
    install(app) {
      setActivePinia(pinia);
      {
        pinia._a = app;
        app.provide(piniaSymbol, pinia);
        app.config.globalProperties.$pinia = pinia;
        toBeInstalled.forEach((plugin) => _p.push(plugin));
        toBeInstalled = [];
      }
    },
    use(plugin) {
      if (!this._a && true) {
        toBeInstalled.push(plugin);
      } else {
        _p.push(plugin);
      }
      return this;
    },
    _p,
    // it's actually undefined here
    // @ts-expect-error
    _a: null,
    _e: scope,
    _s: /* @__PURE__ */ new Map(),
    state
  });
  return pinia;
}
const noop$1 = () => {
};
function addSubscription(subscriptions, callback, detached, onCleanup = noop$1) {
  subscriptions.push(callback);
  const removeSubscription = () => {
    const idx = subscriptions.indexOf(callback);
    if (idx > -1) {
      subscriptions.splice(idx, 1);
      onCleanup();
    }
  };
  if (!detached && getCurrentScope()) {
    onScopeDispose(removeSubscription);
  }
  return removeSubscription;
}
function triggerSubscriptions(subscriptions, ...args) {
  subscriptions.slice().forEach((callback) => {
    callback(...args);
  });
}
const fallbackRunWithContext = (fn) => fn();
const ACTION_MARKER = Symbol();
const ACTION_NAME = Symbol();
function mergeReactiveObjects(target, patchToApply) {
  if (target instanceof Map && patchToApply instanceof Map) {
    patchToApply.forEach((value, key) => target.set(key, value));
  } else if (target instanceof Set && patchToApply instanceof Set) {
    patchToApply.forEach(target.add, target);
  }
  for (const key in patchToApply) {
    if (!patchToApply.hasOwnProperty(key))
      continue;
    const subPatch = patchToApply[key];
    const targetValue = target[key];
    if (isPlainObject$1(targetValue) && isPlainObject$1(subPatch) && target.hasOwnProperty(key) && !isRef(subPatch) && !isReactive(subPatch)) {
      target[key] = mergeReactiveObjects(targetValue, subPatch);
    } else {
      target[key] = subPatch;
    }
  }
  return target;
}
const skipHydrateSymbol = (
  /* istanbul ignore next */
  Symbol()
);
function shouldHydrate(obj) {
  return !isPlainObject$1(obj) || !obj.hasOwnProperty(skipHydrateSymbol);
}
const { assign: assign$1 } = Object;
function isComputed(o) {
  return !!(isRef(o) && o.effect);
}
function createOptionsStore(id, options, pinia, hot) {
  const { state, actions, getters } = options;
  const initialState = pinia.state.value[id];
  let store;
  function setup() {
    if (!initialState && (true)) {
      {
        pinia.state.value[id] = state ? state() : {};
      }
    }
    const localState = toRefs(pinia.state.value[id]);
    return assign$1(localState, actions, Object.keys(getters || {}).reduce((computedGetters, name) => {
      computedGetters[name] = markRaw(computed(() => {
        setActivePinia(pinia);
        const store2 = pinia._s.get(id);
        return getters[name].call(store2, store2);
      }));
      return computedGetters;
    }, {}));
  }
  store = createSetupStore(id, setup, options, pinia, hot, true);
  return store;
}
function createSetupStore($id, setup, options = {}, pinia, hot, isOptionsStore) {
  let scope;
  const optionsForPlugin = assign$1({ actions: {} }, options);
  const $subscribeOptions = { deep: true };
  let isListening;
  let isSyncListening;
  let subscriptions = [];
  let actionSubscriptions = [];
  let debuggerEvents;
  const initialState = pinia.state.value[$id];
  if (!isOptionsStore && !initialState && (true)) {
    {
      pinia.state.value[$id] = {};
    }
  }
  ref({});
  let activeListener;
  function $patch(partialStateOrMutator) {
    let subscriptionMutation;
    isListening = isSyncListening = false;
    if (typeof partialStateOrMutator === "function") {
      partialStateOrMutator(pinia.state.value[$id]);
      subscriptionMutation = {
        type: MutationType.patchFunction,
        storeId: $id,
        events: debuggerEvents
      };
    } else {
      mergeReactiveObjects(pinia.state.value[$id], partialStateOrMutator);
      subscriptionMutation = {
        type: MutationType.patchObject,
        payload: partialStateOrMutator,
        storeId: $id,
        events: debuggerEvents
      };
    }
    const myListenerId = activeListener = Symbol();
    nextTick().then(() => {
      if (activeListener === myListenerId) {
        isListening = true;
      }
    });
    isSyncListening = true;
    triggerSubscriptions(subscriptions, subscriptionMutation, pinia.state.value[$id]);
  }
  const $reset = isOptionsStore ? function $reset2() {
    const { state } = options;
    const newState = state ? state() : {};
    this.$patch(($state) => {
      assign$1($state, newState);
    });
  } : (
    /* istanbul ignore next */
    noop$1
  );
  function $dispose() {
    scope.stop();
    subscriptions = [];
    actionSubscriptions = [];
    pinia._s.delete($id);
  }
  const action = (fn, name = "") => {
    if (ACTION_MARKER in fn) {
      fn[ACTION_NAME] = name;
      return fn;
    }
    const wrappedAction = function() {
      setActivePinia(pinia);
      const args = Array.from(arguments);
      const afterCallbackList = [];
      const onErrorCallbackList = [];
      function after(callback) {
        afterCallbackList.push(callback);
      }
      function onError(callback) {
        onErrorCallbackList.push(callback);
      }
      triggerSubscriptions(actionSubscriptions, {
        args,
        name: wrappedAction[ACTION_NAME],
        store,
        after,
        onError
      });
      let ret;
      try {
        ret = fn.apply(this && this.$id === $id ? this : store, args);
      } catch (error) {
        triggerSubscriptions(onErrorCallbackList, error);
        throw error;
      }
      if (ret instanceof Promise) {
        return ret.then((value) => {
          triggerSubscriptions(afterCallbackList, value);
          return value;
        }).catch((error) => {
          triggerSubscriptions(onErrorCallbackList, error);
          return Promise.reject(error);
        });
      }
      triggerSubscriptions(afterCallbackList, ret);
      return ret;
    };
    wrappedAction[ACTION_MARKER] = true;
    wrappedAction[ACTION_NAME] = name;
    return wrappedAction;
  };
  const partialStore = {
    _p: pinia,
    // _s: scope,
    $id,
    $onAction: addSubscription.bind(null, actionSubscriptions),
    $patch,
    $reset,
    $subscribe(callback, options2 = {}) {
      const removeSubscription = addSubscription(subscriptions, callback, options2.detached, () => stopWatcher());
      const stopWatcher = scope.run(() => watch(() => pinia.state.value[$id], (state) => {
        if (options2.flush === "sync" ? isSyncListening : isListening) {
          callback({
            storeId: $id,
            type: MutationType.direct,
            events: debuggerEvents
          }, state);
        }
      }, assign$1({}, $subscribeOptions, options2)));
      return removeSubscription;
    },
    $dispose
  };
  const store = reactive(partialStore);
  pinia._s.set($id, store);
  const runWithContext = pinia._a && pinia._a.runWithContext || fallbackRunWithContext;
  const setupStore = runWithContext(() => pinia._e.run(() => (scope = effectScope()).run(() => setup({ action }))));
  for (const key in setupStore) {
    const prop = setupStore[key];
    if (isRef(prop) && !isComputed(prop) || isReactive(prop)) {
      if (!isOptionsStore) {
        if (initialState && shouldHydrate(prop)) {
          if (isRef(prop)) {
            prop.value = initialState[key];
          } else {
            mergeReactiveObjects(prop, initialState[key]);
          }
        }
        {
          pinia.state.value[$id][key] = prop;
        }
      }
    } else if (typeof prop === "function") {
      const actionValue = action(prop, key);
      {
        setupStore[key] = actionValue;
      }
      optionsForPlugin.actions[key] = prop;
    } else ;
  }
  {
    assign$1(store, setupStore);
    assign$1(toRaw(store), setupStore);
  }
  Object.defineProperty(store, "$state", {
    get: () => pinia.state.value[$id],
    set: (state) => {
      $patch(($state) => {
        assign$1($state, state);
      });
    }
  });
  pinia._p.forEach((extender) => {
    {
      assign$1(store, scope.run(() => extender({
        store,
        app: pinia._a,
        pinia,
        options: optionsForPlugin
      })));
    }
  });
  if (initialState && isOptionsStore && options.hydrate) {
    options.hydrate(store.$state, initialState);
  }
  isListening = true;
  isSyncListening = true;
  return store;
}
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function defineStore(idOrOptions, setup, setupOptions) {
  let id;
  let options;
  const isSetupStore = typeof setup === "function";
  {
    id = idOrOptions;
    options = isSetupStore ? setupOptions : setup;
  }
  function useStore(pinia, hot) {
    const hasContext = hasInjectionContext();
    pinia = // in test mode, ignore the argument provided as we can always retrieve a
    // pinia instance with getActivePinia()
    (pinia) || (hasContext ? inject(piniaSymbol, null) : null);
    if (pinia)
      setActivePinia(pinia);
    pinia = activePinia;
    if (!pinia._s.has(id)) {
      if (isSetupStore) {
        createSetupStore(id, setup, options, pinia);
      } else {
        createOptionsStore(id, options, pinia);
      }
    }
    const store = pinia._s.get(id);
    return store;
  }
  useStore.$id = id;
  return useStore;
}

const plugin = defineNuxtPlugin({
  name: "pinia",
  setup(nuxtApp) {
    const pinia = createPinia();
    nuxtApp.vueApp.use(pinia);
    setActivePinia(pinia);
    {
      nuxtApp.payload.pinia = pinia.state.value;
    }
    return {
      provide: {
        pinia
      }
    };
  }
});

const components_plugin_4kY4pyzJIYX99vmMAAIorFf3CnAaptHitJgf7JxiED8 = defineNuxtPlugin({
  name: "nuxt:global-components"
});

function updateSiteConfig(input = {}) {
  {
    const stack = useRequestEvent().context.siteConfig;
    stack.push(input);
    return;
  }
}

function useSiteConfig(options) {
  let stack;
  stack = useRequestEvent().context.siteConfig.get(defu({ resolveRefs: true }, options));
  return stack || {};
}

const i18n_server_9Ww3mBWgMvABCLimDvjSH_DVs_37h_2t7FOcwdX8N1o = defineNuxtPlugin({
  name: "nuxt-site-config:i18n",
  // @ts-expect-error untyped
  dependsOn: ["i18n:plugin"],
  setup(nuxtApp) {
    const i18n = nuxtApp.$i18n;
    if (!i18n)
      return;
    useSiteConfig().url;
    try {
      const url = parseURL(i18n.baseUrl.value);
      if (false) ;
    } catch {
    }
    updateSiteConfig({
      _priority: -1,
      _context: "@nuxtjs/i18n",
      url: void 0,
      // @ts-expect-error untyped
      currentLocale: i18n.locale,
      // @ts-expect-error untyped
      description: computed(() => i18n.te("nuxtSiteConfig.description") ? i18n.t("nuxtSiteConfig.description") : void 0),
      // @ts-expect-error untyped
      name: computed(() => i18n.te("nuxtSiteConfig.name") ? i18n.t("nuxtSiteConfig.name") : void 0)
    });
  }
});

/*!
  * shared v10.0.6
  * (c) 2025 kazuya kawaguchi
  * Released under the MIT License.
  */
const makeSymbol = (name, shareable = false) => !shareable ? Symbol(name) : Symbol.for(name);
const generateFormatCacheKey = (locale, key, source) => friendlyJSONstringify({ l: locale, k: key, s: source });
const friendlyJSONstringify = (json) => JSON.stringify(json).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029").replace(/\u0027/g, "\\u0027");
const isNumber = (val) => typeof val === "number" && isFinite(val);
const isDate = (val) => toTypeString(val) === "[object Date]";
const isRegExp = (val) => toTypeString(val) === "[object RegExp]";
const isEmptyObject = (val) => isPlainObject(val) && Object.keys(val).length === 0;
const assign = Object.assign;
const _create = Object.create;
const create = (obj = null) => _create(obj);
function escapeHtml(rawText) {
  return rawText.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
const hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key);
}
const isArray = Array.isArray;
const isFunction = (val) => typeof val === "function";
const isString = (val) => typeof val === "string";
const isBoolean = (val) => typeof val === "boolean";
const isObject$1 = (val) => val !== null && typeof val === "object";
const isPromise = (val) => {
  return isObject$1(val) && isFunction(val.then) && isFunction(val.catch);
};
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const isPlainObject = (val) => toTypeString(val) === "[object Object]";
const toDisplayString = (val) => {
  return val == null ? "" : isArray(val) || isPlainObject(val) && val.toString === objectToString ? JSON.stringify(val, null, 2) : String(val);
};
function join(items, separator = "") {
  return items.reduce((str, item, index) => index === 0 ? str + item : str + separator + item, "");
}
function warn(msg, err) {
  if (typeof console !== "undefined") {
    console.warn(`[intlify] ` + msg);
    if (err) {
      console.warn(err.stack);
    }
  }
}
const isNotObjectOrIsArray = (val) => !isObject$1(val) || isArray(val);
function deepCopy(src, des) {
  if (isNotObjectOrIsArray(src) || isNotObjectOrIsArray(des)) {
    throw new Error("Invalid value");
  }
  const stack = [{ src, des }];
  while (stack.length) {
    const { src: src2, des: des2 } = stack.pop();
    Object.keys(src2).forEach((key) => {
      if (key === "__proto__") {
        return;
      }
      if (isObject$1(src2[key]) && !isObject$1(des2[key])) {
        des2[key] = Array.isArray(src2[key]) ? [] : create();
      }
      if (isNotObjectOrIsArray(des2[key]) || isNotObjectOrIsArray(src2[key])) {
        des2[key] = src2[key];
      } else {
        stack.push({ src: src2[key], des: des2[key] });
      }
    });
  }
}

function isHTTPS(req, trustProxy = true) {
  const _xForwardedProto = trustProxy && req.headers ? req.headers["x-forwarded-proto"] : void 0;
  const protoCheck = typeof _xForwardedProto === "string" ? _xForwardedProto.includes("https") : void 0;
  if (protoCheck) {
    return true;
  }
  const _encrypted = req.connection ? req.connection.encrypted : void 0;
  const encryptedCheck = _encrypted !== void 0 ? _encrypted === true : void 0;
  if (encryptedCheck) {
    return true;
  }
  if (protoCheck === void 0 && encryptedCheck === void 0) {
    return void 0;
  }
  return false;
}

const localeCodes = [
  "en",
  "de"
];
const localeLoaders = {
  en: [],
  de: []
};
const vueI18nConfigs = [];
const normalizedLocales = [
  {
    code: "en",
    iso: "en-US",
    name: "English",
    files: []
  },
  {
    code: "de",
    iso: "de-DE",
    name: "Deutsch",
    files: []
  }
];
const NUXT_I18N_MODULE_ID = "@nuxtjs/i18n";
const parallelPlugin = false;
const DEFAULT_COOKIE_KEY = "i18n_redirected";
const DEFAULT_DYNAMIC_PARAMS_KEY = "nuxtI18nInternal";
const SWITCH_LOCALE_PATH_LINK_IDENTIFIER = "nuxt-i18n-slp";

function getNormalizedLocales(locales) {
  return locales.map((x) => typeof x === "string" ? { code: x } : x);
}
function getRouteName(routeName) {
  if (typeof routeName === "string") return routeName;
  if (routeName != null) return routeName.toString();
  return "(null)";
}
function getLocaleRouteName(routeName, locale, {
  defaultLocale,
  strategy,
  routesNameSeparator,
  defaultLocaleRouteNameSuffix,
  differentDomains
}) {
  const localizedRoutes = strategy !== "no_prefix" || differentDomains;
  let name = getRouteName(routeName) + (localizedRoutes ? routesNameSeparator + locale : "");
  if (locale === defaultLocale && strategy === "prefix_and_default") {
    name += routesNameSeparator + defaultLocaleRouteNameSuffix;
  }
  return name;
}
function resolveBaseUrl(baseUrl, context) {
  if (isFunction(baseUrl)) {
    return baseUrl(context);
  }
  return baseUrl;
}
function matchBrowserLocale(locales, browserLocales) {
  const matchedLocales = [];
  for (const [index, browserCode] of browserLocales.entries()) {
    const matchedLocale = locales.find((l) => l.language.toLowerCase() === browserCode.toLowerCase());
    if (matchedLocale) {
      matchedLocales.push({ code: matchedLocale.code, score: 1 - index / browserLocales.length });
      break;
    }
  }
  for (const [index, browserCode] of browserLocales.entries()) {
    const languageCode = browserCode.split("-")[0].toLowerCase();
    const matchedLocale = locales.find((l) => l.language.split("-")[0].toLowerCase() === languageCode);
    if (matchedLocale) {
      matchedLocales.push({ code: matchedLocale.code, score: 0.999 - index / browserLocales.length });
      break;
    }
  }
  return matchedLocales;
}
function compareBrowserLocale(a, b) {
  if (a.score === b.score) {
    return b.code.length - a.code.length;
  }
  return b.score - a.score;
}
function findBrowserLocale(locales, browserLocales, {
  matcher = matchBrowserLocale,
  comparer = compareBrowserLocale
} = {}) {
  const normalizedLocales = [];
  for (const l of locales) {
    const { code } = l;
    const language = l.language || code;
    normalizedLocales.push({ code, language });
  }
  const matchedLocales = matcher(normalizedLocales, browserLocales);
  if (matchedLocales.length === 0) {
    return "";
  }
  if (matchedLocales.length > 1) {
    matchedLocales.sort(comparer);
  }
  return matchedLocales[0].code;
}
function getLocalesRegex(localeCodes2) {
  return new RegExp(`^/(${localeCodes2.join("|")})(?:/|$)`, "i");
}
const localesPattern = `(${localeCodes.join("|")})`;
const regexpPath = getLocalesRegex(localeCodes);
function createLocaleFromRouteGetter() {
  const { routesNameSeparator, defaultLocaleRouteNameSuffix } = useRuntimeConfig().public.i18n;
  const defaultSuffixPattern = `(?:${routesNameSeparator}${defaultLocaleRouteNameSuffix})?`;
  const regexpName = new RegExp(`${routesNameSeparator}${localesPattern}${defaultSuffixPattern}$`, "i");
  const getLocaleFromRoute = (route) => {
    let matches = null;
    if (typeof route === "string") {
      matches = route.match(regexpPath);
      return (matches == null ? void 0 : matches[1]) ?? "";
    }
    if (route.name) {
      matches = getRouteName(route.name).match(regexpName);
    } else if (route.path) {
      matches = route.path.match(regexpPath);
    }
    return (matches == null ? void 0 : matches[1]) ?? "";
  };
  return getLocaleFromRoute;
}

const cacheMessages = /* @__PURE__ */ new Map();
async function loadVueI18nOptions(vueI18nConfigs, nuxt) {
  const vueI18nOptions = { messages: {} };
  for (const configFile of vueI18nConfigs) {
    const { default: resolver } = await configFile();
    const resolved = isFunction(resolver) ? await nuxt.runWithContext(() => resolver()) : resolver;
    deepCopy(resolved, vueI18nOptions);
  }
  return vueI18nOptions;
}
function makeFallbackLocaleCodes(fallback, locales) {
  if (fallback === false) return [];
  if (Array.isArray(fallback)) return fallback;
  let fallbackLocales = [];
  if (typeof fallback === "string") {
    if (locales.every((locale) => locale !== fallback)) {
      fallbackLocales.push(fallback);
    }
    return fallbackLocales;
  }
  const targets = [...locales, "default"];
  for (const locale of targets) {
    if (locale in fallback == false) continue;
    fallbackLocales = [...fallbackLocales, ...fallback[locale].filter(Boolean)];
  }
  return fallbackLocales;
}
async function loadMessage(locale, { key, load }, nuxt) {
  let message = null;
  try {
    const getter = await load().then((r) => "default" in r ? r.default : r);
    if (isFunction(getter)) {
      message = await nuxt.runWithContext(() => getter(locale));
    } else {
      message = getter;
      if (message != null && cacheMessages && true) {
        cacheMessages.set(key, message);
      }
    }
  } catch (e) {
    console.error("Failed locale loading: " + e.message);
  }
  return message;
}
async function loadLocale(locale, localeLoaders, setter, nuxt) {
  const loaders = localeLoaders[locale];
  if (loaders == null) {
    return;
  }
  const targetMessage = {};
  for (const loader of loaders) {
    let message = null;
    if (cacheMessages && cacheMessages.has(loader.key) && loader.cache) {
      message = cacheMessages.get(loader.key);
    } else {
      message = await nuxt.runWithContext(() => loadMessage(locale, loader, nuxt));
    }
    if (message != null) {
      deepCopy(message, targetMessage);
    }
  }
  setter(locale, targetMessage);
}

function isI18nInstance(i18n) {
  return i18n != null && "global" in i18n && "mode" in i18n;
}
function isComposer(target) {
  return target != null && !("__composer" in target) && "locale" in target && isRef(target.locale);
}
function isVueI18n(target) {
  return target != null && "__composer" in target;
}
function getI18nTarget(i18n) {
  return isI18nInstance(i18n) ? i18n.global : i18n;
}
function getComposer$2(i18n) {
  const target = getI18nTarget(i18n);
  if (isComposer(target)) return target;
  if (isVueI18n(target)) return target.__composer;
  return target;
}

function getRouteBaseName(common, route) {
  const _route = unref(route);
  const routeName = typeof _route === "object" ? _route == null ? void 0 : _route.name : _route;
  if (_route == null || !routeName) {
    return;
  }
  const name = getRouteName(routeName);
  return name.split(common.runtimeConfig.public.i18n.routesNameSeparator)[0];
}
function localePath(common, route, locale) {
  var _a;
  if (typeof route === "string" && hasProtocol(route, { acceptRelative: true })) {
    return route;
  }
  const localizedRoute = resolveRoute(common, route, locale);
  return localizedRoute == null ? "" : ((_a = localizedRoute.redirectedFrom) == null ? void 0 : _a.fullPath) || localizedRoute.fullPath;
}
function localeRoute(common, route, locale) {
  return resolveRoute(common, route, locale) ?? void 0;
}
function normalizeRawLocation(route) {
  if (typeof route !== "string") {
    return Object.assign({}, route);
  }
  if (route[0] === "/") {
    const { pathname: path, search, hash } = parsePath(route);
    return { path, query: parseQuery(search), hash };
  }
  return { name: route };
}
const isRouteLocationPathRaw = (val) => !!val.path && !val.name;
function resolveRouteObject(common, route, locale) {
  const runtimeI18n = common.runtimeConfig.public.i18n;
  if (isRouteLocationPathRaw(route)) {
    const resolved = resolve(common, route, locale);
    const resolvedName = getRouteBaseName(common, resolved);
    if (resolvedName) {
      resolved.name = getLocaleRouteName(resolvedName, locale, runtimeI18n);
      return resolved;
    }
    const prefixable = extendPrefixable(common.runtimeConfig);
    if (prefixable({ ...runtimeI18n, currentLocale: locale })) {
      route.path = "/" + locale + route.path;
    }
    route.path = (runtimeI18n.trailingSlash ? withTrailingSlash : withoutTrailingSlash)(route.path, true);
    return route;
  }
  route.name || (route.name = getRouteBaseName(common, common.router.currentRoute.value));
  const localizedName = getLocaleRouteName(route.name, locale, runtimeI18n);
  if (common.router.hasRoute(localizedName)) {
    route.name = localizedName;
  }
  return route;
}
function resolveRoute(common, route, locale) {
  try {
    const _locale = locale || unref(getI18nTarget(common.i18n).locale);
    const normalized = normalizeRawLocation(route);
    const resolved = common.router.resolve(resolveRouteObject(common, normalized, _locale));
    if (resolved.name) {
      return resolved;
    }
    return common.router.resolve(route);
  } catch (e) {
    if (isNavigationFailure(
      e,
      1
      /* No match */
    )) {
      return null;
    }
  }
}
function getLocalizableMetaFromDynamicParams(common, route) {
  var _a;
  if (common.runtimeConfig.public.i18n.experimental.switchLocalePathLinkSSR) {
    return unref(common.metaState.value);
  }
  const meta = route.meta || {};
  return ((_a = unref(meta)) == null ? void 0 : _a[DEFAULT_DYNAMIC_PARAMS_KEY]) || {};
}
function switchLocalePath(common, locale, _route) {
  const route = _route ?? common.router.currentRoute.value;
  const name = getRouteBaseName(common, route);
  if (!name) {
    return "";
  }
  const resolvedParams = getLocalizableMetaFromDynamicParams(common, route)[locale];
  const routeCopy = {
    name,
    params: Object.assign({}, route.params, resolvedParams),
    fullPath: route.fullPath,
    query: route.query,
    hash: route.hash,
    path: route.path,
    meta: route.meta
    // matched: route.matched,
    // redirectedFrom: route.redirectedFrom
  };
  const path = localePath(common, routeCopy, locale);
  const switchLocalePathIntercepter = extendSwitchLocalePathIntercepter(common.runtimeConfig);
  return switchLocalePathIntercepter(path, locale);
}
function resolve(common, route, locale) {
  if (common.runtimeConfig.public.i18n.strategy === "no_prefix") {
    return route;
  }
  if (common.runtimeConfig.public.i18n.strategy !== "prefix") {
    return common.router.resolve(route);
  }
  const restPath = route.path.slice(1);
  const targetPath = route.path[0] + locale + (restPath && "/" + restPath);
  const _route = common.router.options.routes.find((r) => r.path === targetPath);
  if (_route == null) {
    return route;
  }
  return common.router.resolve(Object.assign({}, route, _route, { path: targetPath }));
}

function initCommonComposableOptions(i18n) {
  return {
    i18n: i18n ?? useNuxtApp().$i18n,
    router: useRouter(),
    runtimeConfig: useRuntimeConfig(),
    metaState: useState("nuxt-i18n-meta", () => ({}))
  };
}
async function loadAndSetLocale(newLocale, initial = false) {
  const nuxtApp = useNuxtApp();
  const { differentDomains, skipSettingLocaleOnNavigate } = nuxtApp.$config.public.i18n;
  const opts = runtimeDetectBrowserLanguage();
  const oldLocale = unref(nuxtApp.$i18n.locale);
  const localeCodes2 = unref(nuxtApp.$i18n.localeCodes);
  function syncCookie(locale = oldLocale) {
    if (opts === false || !opts.useCookie) return;
    if (skipSettingLocaleOnNavigate) return;
    nuxtApp.$i18n.setLocaleCookie(locale);
  }
  const localeOverride = await nuxtApp.$i18n.onBeforeLanguageSwitch(oldLocale, newLocale, initial, nuxtApp);
  if (localeOverride && localeCodes2.includes(localeOverride)) {
    if (oldLocale === localeOverride) {
      syncCookie();
      return false;
    }
    newLocale = localeOverride;
  }
  if (!newLocale) {
    syncCookie();
    return false;
  }
  if (!initial && differentDomains) {
    syncCookie();
    return false;
  }
  if (oldLocale === newLocale) {
    syncCookie();
    return false;
  }
  const i18nFallbackLocales = unref(nuxtApp.$i18n.fallbackLocale);
  const setter = nuxtApp.$i18n.mergeLocaleMessage.bind(nuxtApp.$i18n);
  if (i18nFallbackLocales) {
    const fallbackLocales = makeFallbackLocaleCodes(i18nFallbackLocales, [newLocale]);
    await Promise.all(fallbackLocales.map((locale) => loadLocale(locale, localeLoaders, setter, nuxtApp)));
  }
  await loadLocale(newLocale, localeLoaders, setter, nuxtApp);
  if (skipSettingLocaleOnNavigate) {
    return false;
  }
  syncCookie(newLocale);
  nuxtApp._vueI18n.__setLocale(newLocale);
  await nuxtApp.$i18n.onLanguageSwitched(oldLocale, newLocale);
  return true;
}
function detectLocale(route, routeLocale, currentLocale, localeCookie) {
  const nuxtApp = useNuxtApp();
  const { strategy, defaultLocale, differentDomains, multiDomainLocales } = nuxtApp.$config.public.i18n;
  const _detectBrowserLanguage = runtimeDetectBrowserLanguage();
  const detectedBrowser = detectBrowserLanguage(route, localeCookie, currentLocale);
  if (detectedBrowser.locale && detectedBrowser.from != null && localeCodes.includes(detectedBrowser.locale)) {
    return detectedBrowser.locale;
  }
  let detected = "";
  if (differentDomains || multiDomainLocales) {
    detected || (detected = getLocaleDomain(normalizedLocales, strategy, route));
  } else if (strategy !== "no_prefix") {
    detected || (detected = routeLocale);
  }
  const cookieLocale = (localeCodes.includes(detectedBrowser.locale) || localeCookie && localeCodes.includes(localeCookie)) && _detectBrowserLanguage && _detectBrowserLanguage.useCookie && localeCookie;
  detected || (detected = cookieLocale || currentLocale || defaultLocale || "");
  return detected;
}
function detectRedirect({ to, from, locale, routeLocale }, inMiddleware = false) {
  if (routeLocale === locale || useNuxtApp().$i18n.strategy === "no_prefix") {
    return "";
  }
  const common = initCommonComposableOptions();
  let redirectPath = switchLocalePath(common, locale, to);
  if (inMiddleware && !redirectPath) {
    redirectPath = localePath(common, to.fullPath, locale);
  }
  if (isEqual(redirectPath, to.fullPath) || from && isEqual(redirectPath, from.fullPath)) {
    return "";
  }
  return redirectPath;
}
const useRedirectState = () => useState(NUXT_I18N_MODULE_ID + ":redirect", () => "");
async function navigate({ nuxtApp, locale, route, redirectPath }, enableNavigate = false) {
  const { rootRedirect, differentDomains, multiDomainLocales, skipSettingLocaleOnNavigate, locales, strategy } = nuxtApp.$config.public.i18n;
  if (route.path === "/" && rootRedirect) {
    let redirectCode = 302;
    if (typeof rootRedirect === "string") {
      redirectPath = "/" + rootRedirect;
    } else {
      redirectPath = "/" + rootRedirect.path;
      redirectCode = rootRedirect.statusCode;
    }
    redirectPath = nuxtApp.$localePath(redirectPath, locale);
    return navigateTo(redirectPath, { redirectCode });
  }
  if (multiDomainLocales && strategy === "prefix_except_default") {
    const host = getHost();
    const currentDomain = locales.find((locale2) => {
      var _a;
      if (typeof locale2 === "string") return;
      return (_a = locale2.defaultForDomains) == null ? void 0 : _a.find((domain) => domain === host);
    });
    const defaultLocaleForDomain = typeof currentDomain !== "string" ? currentDomain == null ? void 0 : currentDomain.code : void 0;
    if (route.path.startsWith(`/${defaultLocaleForDomain}`)) {
      return navigateTo(route.path.replace(`/${defaultLocaleForDomain}`, ""));
    }
    if (!route.path.startsWith(`/${locale}`) && locale !== defaultLocaleForDomain) {
      const getLocaleFromRoute = createLocaleFromRouteGetter();
      const oldLocale = getLocaleFromRoute(route.path);
      if (oldLocale !== "") {
        return navigateTo(`/${locale + route.path.replace(`/${oldLocale}`, "")}`);
      }
      return navigateTo(`/${locale + (route.path === "/" ? "" : route.path)}`);
    }
    if (redirectPath && route.path !== redirectPath) {
      return navigateTo(redirectPath);
    }
    return;
  }
  if (differentDomains) {
    const state = useRedirectState();
    if (state.value && state.value !== redirectPath) {
      {
        state.value = redirectPath;
      }
    }
  } else if (redirectPath) {
    return navigateTo(redirectPath);
  }
}
function prefixable({ currentLocale, defaultLocale, strategy }) {
  return (
    // strategy has no prefixes
    strategy !== "no_prefix" && // strategy should not prefix default locale
    !(currentLocale === defaultLocale && (strategy === "prefix_and_default" || strategy === "prefix_except_default"))
  );
}
function extendPrefixable(runtimeConfig = useRuntimeConfig()) {
  return (opts) => {
    const _prefixable = prefixable(opts);
    return _prefixable && !runtimeConfig.public.i18n.differentDomains;
  };
}
function extendSwitchLocalePathIntercepter(runtimeConfig = useRuntimeConfig()) {
  return (path, locale) => {
    if (!runtimeConfig.public.i18n.differentDomains) {
      return path;
    }
    const domain = getDomainFromLocale(locale);
    return domain && joinURL(domain, path) || path;
  };
}
function extendBaseUrl() {
  return () => {
    const ctx = useNuxtApp();
    const { baseUrl, defaultLocale, differentDomains } = ctx.$config.public.i18n;
    if (isFunction(baseUrl)) {
      const baseUrlResult = baseUrl(ctx);
      return baseUrlResult;
    }
    const localeCode = isFunction(defaultLocale) ? defaultLocale() : defaultLocale;
    if (differentDomains && localeCode) {
      const domain = getDomainFromLocale(localeCode);
      if (domain) {
        return domain;
      }
    }
    if (baseUrl) {
      return baseUrl;
    }
    return baseUrl;
  };
}

const CookieDefaults = {
  path: "/",
  watch: true,
  decode: (val) => destr(decodeURIComponent(val)),
  encode: (val) => encodeURIComponent(typeof val === "string" ? val : JSON.stringify(val))
};
function useCookie(name, _opts) {
  var _a;
  const opts = { ...CookieDefaults, ..._opts };
  opts.filter ?? (opts.filter = (key) => key === name);
  const cookies = readRawCookies(opts) || {};
  let delay;
  if (opts.maxAge !== void 0) {
    delay = opts.maxAge * 1e3;
  } else if (opts.expires) {
    delay = opts.expires.getTime() - Date.now();
  }
  const hasExpired = delay !== void 0 && delay <= 0;
  const cookieValue = klona(hasExpired ? void 0 : cookies[name] ?? ((_a = opts.default) == null ? void 0 : _a.call(opts)));
  const cookie = ref(cookieValue);
  {
    const nuxtApp = useNuxtApp();
    const writeFinalCookieValue = () => {
      if (opts.readonly || isEqual$1(cookie.value, cookies[name])) {
        return;
      }
      nuxtApp._cookies || (nuxtApp._cookies = {});
      if (name in nuxtApp._cookies) {
        if (isEqual$1(cookie.value, nuxtApp._cookies[name])) {
          return;
        }
      }
      nuxtApp._cookies[name] = cookie.value;
      writeServerCookie(useRequestEvent(nuxtApp), name, cookie.value, opts);
    };
    const unhook = nuxtApp.hooks.hookOnce("app:rendered", writeFinalCookieValue);
    nuxtApp.hooks.hookOnce("app:error", () => {
      unhook();
      return writeFinalCookieValue();
    });
  }
  return cookie;
}
function readRawCookies(opts = {}) {
  {
    return parse$1(getRequestHeader(useRequestEvent(), "cookie") || "", opts);
  }
}
function writeServerCookie(event, name, value, opts = {}) {
  if (event) {
    if (value !== null && value !== void 0) {
      return setCookie(event, name, value, opts);
    }
    if (getCookie(event, name) !== void 0) {
      return deleteCookie(event, name, opts);
    }
  }
}

function formatMessage(message) {
  return NUXT_I18N_MODULE_ID + " " + message;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
function wrapComposable(fn, common = initCommonComposableOptions()) {
  return (...args) => fn(common, ...args);
}
function parseAcceptLanguage(input) {
  return input.split(",").map((tag) => tag.split(";")[0]);
}
function getBrowserLocale() {
  let ret;
  {
    const header = useRequestHeaders(["accept-language"]);
    const accept = header["accept-language"];
    if (accept) {
      ret = findBrowserLocale(normalizedLocales, parseAcceptLanguage(accept));
    }
  }
  return ret;
}
function getI18nCookie() {
  const detect = runtimeDetectBrowserLanguage();
  const cookieKey = detect && detect.cookieKey || DEFAULT_COOKIE_KEY;
  const date = /* @__PURE__ */ new Date();
  const cookieOptions = {
    expires: new Date(date.setDate(date.getDate() + 365)),
    path: "/",
    sameSite: detect && detect.cookieCrossOrigin ? "none" : "lax",
    secure: detect && detect.cookieCrossOrigin || detect && detect.cookieSecure
  };
  if (detect && detect.cookieDomain) {
    cookieOptions.domain = detect.cookieDomain;
  }
  return useCookie(cookieKey, cookieOptions);
}
function getLocaleCookie(cookieRef, detect, defaultLocale) {
  if (detect === false || !detect.useCookie) {
    return;
  }
  const localeCode = cookieRef.value ?? void 0;
  if (localeCode == null) {
    return;
  }
  if (localeCodes.includes(localeCode)) {
    return localeCode;
  }
  if (defaultLocale) {
    cookieRef.value = defaultLocale;
    return defaultLocale;
  }
  cookieRef.value = void 0;
  return;
}
function setLocaleCookie(cookieRef, locale, detect) {
  if (detect === false || !detect.useCookie) {
    return;
  }
  cookieRef.value = locale;
}
const DefaultDetectBrowserLanguageFromResult = {
  locale: "",
  reason: "disabled"
  /* DISABLED */
};
function detectBrowserLanguage(route, localeCookie, locale = "") {
  const _detect = runtimeDetectBrowserLanguage();
  if (!_detect) {
    return DefaultDetectBrowserLanguageFromResult;
  }
  const nuxtApp = useNuxtApp();
  const strategy = nuxtApp.$i18n.strategy;
  const firstAccess = nuxtApp._vueI18n.__firstAccess;
  if (!firstAccess) {
    return {
      locale: strategy === "no_prefix" ? locale : "",
      reason: "first_access_only"
      /* FIRST_ACCESS */
    };
  }
  const { redirectOn, alwaysRedirect, useCookie: useCookie2, fallbackLocale } = _detect;
  const path = isString(route) ? route : route.path;
  if (strategy !== "no_prefix") {
    if (redirectOn === "root" && path !== "/") {
      return {
        locale: "",
        reason: "not_redirect_on_root"
        /* NO_REDIRECT_ROOT */
      };
    }
    if (redirectOn === "no prefix" && !alwaysRedirect && path.match(getLocalesRegex(localeCodes))) {
      return {
        locale: "",
        reason: "not_redirect_on_no_prefix"
        /* NO_REDIRECT_NO_PREFIX */
      };
    }
  }
  let from;
  const cookieMatch = useCookie2 && localeCookie || void 0;
  if (useCookie2) {
    from = "cookie";
  }
  const browserMatch = nuxtApp.$i18n.getBrowserLocale();
  if (!cookieMatch) {
    from = "navigator_or_header";
  }
  const matchedLocale = cookieMatch || browserMatch;
  const resolved = matchedLocale || fallbackLocale || "";
  if (!matchedLocale && fallbackLocale) {
    from = "fallback";
  }
  return { locale: resolved, from };
}
function getHost() {
  let host;
  {
    const header = useRequestHeaders(["x-forwarded-host", "host"]);
    let detectedHost;
    if ("x-forwarded-host" in header) {
      detectedHost = header["x-forwarded-host"];
    } else if ("host" in header) {
      detectedHost = header["host"];
    }
    host = isArray(detectedHost) ? detectedHost[0] : detectedHost;
  }
  return host;
}
function getLocaleDomain(locales, strategy, route) {
  let host = getHost() || "";
  const routePath = isObject$1(route) ? route.path : isString(route) ? route : "";
  if (host) {
    let matchingLocale;
    const matchingLocales = locales.filter((locale) => {
      if (locale && locale.domain) {
        let domain = locale.domain;
        if (hasProtocol(locale.domain)) {
          domain = locale.domain.replace(/(http|https):\/\//, "");
        }
        return domain === host;
      } else if (Array.isArray(locale == null ? void 0 : locale.domains)) {
        return locale.domains.includes(host);
      }
      return false;
    });
    if (matchingLocales.length === 1) {
      matchingLocale = matchingLocales[0];
    } else if (matchingLocales.length > 1) {
      if (strategy === "no_prefix") {
        console.warn(
          formatMessage(
            "Multiple matching domains found! This is not supported for no_prefix strategy in combination with differentDomains!"
          )
        );
        matchingLocale = matchingLocales[0];
      } else {
        if (route) {
          if (routePath && routePath !== "") {
            const matches = routePath.match(getLocalesRegex(matchingLocales.map((l) => l.code)));
            if (matches && matches.length > 1) {
              matchingLocale = matchingLocales.find((l) => l.code === matches[1]);
            }
          }
        }
        if (!matchingLocale) {
          matchingLocale = matchingLocales.find(
            (l) => Array.isArray(l.defaultForDomains) ? l.defaultForDomains.includes(host) : l.domainDefault
          );
        }
      }
    }
    if (matchingLocale) {
      return matchingLocale.code;
    } else {
      host = "";
    }
  }
  return host;
}
function getDomainFromLocale(localeCode) {
  var _a, _b, _c;
  const runtimeConfig = useRuntimeConfig();
  const nuxtApp = useNuxtApp();
  const host = getHost();
  const config = runtimeConfig.public.i18n;
  const lang = normalizedLocales.find((locale) => locale.code === localeCode);
  const domain = ((_b = (_a = config == null ? void 0 : config.domainLocales) == null ? void 0 : _a[localeCode]) == null ? void 0 : _b.domain) || (lang == null ? void 0 : lang.domain) || ((_c = lang == null ? void 0 : lang.domains) == null ? void 0 : _c.find((v) => v === host));
  if (domain) {
    if (hasProtocol(domain, { strict: true })) {
      return domain;
    }
    let protocol;
    {
      const {
        node: { req }
      } = useRequestEvent(nuxtApp);
      protocol = req && isHTTPS(req) ? "https:" : "http:";
    }
    return protocol + "//" + domain;
  }
  console.warn(formatMessage("Could not find domain name for locale " + localeCode));
}
const runtimeDetectBrowserLanguage = (opts = useRuntimeConfig().public.i18n) => {
  if ((opts == null ? void 0 : opts.detectBrowserLanguage) === false) return false;
  return opts == null ? void 0 : opts.detectBrowserLanguage;
};
function setupMultiDomainLocales(nuxtContext, defaultLocaleDomain) {
  const { multiDomainLocales, strategy, routesNameSeparator, defaultLocaleRouteNameSuffix } = nuxtContext.$config.public.i18n;
  if (!multiDomainLocales) return;
  if (!(strategy === "prefix_except_default" || strategy === "prefix_and_default")) return;
  const router = useRouter();
  const defaultRouteSuffix = [routesNameSeparator, defaultLocaleRouteNameSuffix].join("");
  for (const route of router.getRoutes()) {
    const routeName = getRouteName(route.name);
    if (routeName.endsWith(defaultRouteSuffix)) {
      router.removeRoute(routeName);
      continue;
    }
    const routeNameLocale = routeName.split(routesNameSeparator)[1];
    if (routeNameLocale === defaultLocaleDomain) {
      router.addRoute({
        ...route,
        path: route.path === `/${routeNameLocale}` ? "/" : route.path.replace(`/${routeNameLocale}`, "")
      });
    }
  }
}
function getDefaultLocaleForDomain(nuxtContext) {
  const { locales, defaultLocale, multiDomainLocales } = nuxtContext.$config.public.i18n;
  let defaultLocaleDomain = defaultLocale || "";
  if (!multiDomainLocales) {
    return defaultLocaleDomain;
  }
  const host = getHost();
  const hasDefaultForDomains = locales.some(
    (l) => typeof l !== "string" && Array.isArray(l.defaultForDomains)
  );
  if (hasDefaultForDomains) {
    const findDefaultLocale = locales.find(
      (l) => typeof l === "string" || !Array.isArray(l.defaultForDomains) ? false : l.defaultForDomains.includes(host ?? "")
    );
    defaultLocaleDomain = (findDefaultLocale == null ? void 0 : findDefaultLocale.code) ?? "";
  }
  return defaultLocaleDomain;
}

function useRouteBaseName() {
  return wrapComposable(getRouteBaseName);
}
function useLocalePath() {
  return wrapComposable(localePath);
}
function useLocaleRoute() {
  return wrapComposable(localeRoute);
}
function useLocaleLocation() {
  return wrapComposable(localeRoute);
}
function useSwitchLocalePath() {
  return wrapComposable(switchLocalePath);
}

const switch_locale_path_ssr_Hk9vdM15aB_0VkdtA_Usx_xFCjk41oE2KO5i9C8RnMs = defineNuxtPlugin({
  name: "i18n:plugin:switch-locale-path-ssr",
  dependsOn: ["i18n:plugin"],
  setup(nuxt) {
    if (nuxt.$config.public.i18n.experimental.switchLocalePathLinkSSR !== true) return;
    const switchLocalePath = useSwitchLocalePath();
    const switchLocalePathLinkWrapperExpr = new RegExp(
      [
        `<!--${SWITCH_LOCALE_PATH_LINK_IDENTIFIER}-\\[(\\w+)\\]-->`,
        `.+?`,
        `<!--/${SWITCH_LOCALE_PATH_LINK_IDENTIFIER}-->`
      ].join(""),
      "g"
    );
    nuxt.hook("app:rendered", (ctx) => {
      var _a;
      if (((_a = ctx.renderResult) == null ? void 0 : _a.html) == null) return;
      ctx.renderResult.html = ctx.renderResult.html.replaceAll(
        switchLocalePathLinkWrapperExpr,
        (match, p1) => match.replace(/href="([^"]+)"/, `href="${encodeURI(switchLocalePath(p1 ?? ""))}"`)
      );
    });
  }
});

const route_locale_detect_9xnjrvR2gs_Q4sLywtkwzH8IawzhEmfdVknj25um3og = defineNuxtPlugin({
  name: "i18n:plugin:route-locale-detect",
  dependsOn: ["i18n:plugin"],
  async setup(nuxt) {
    let __temp, __restore;
    const nuxtApp = nuxt;
    const currentRoute = nuxtApp.$router.currentRoute;
    const getRouteLocale = createLocaleFromRouteGetter();
    async function handleRouteDetect(to) {
      let detected = detectLocale(to, getRouteLocale(to), unref(nuxtApp.$i18n.locale), nuxtApp.$i18n.getLocaleCookie());
      if (nuxtApp._vueI18n.__firstAccess) {
        nuxtApp._vueI18n.__setLocale(detected);
        const fallbackLocales = makeFallbackLocaleCodes(unref(nuxtApp._vueI18n.global.fallbackLocale), [detected]);
        await Promise.all(fallbackLocales.map((x) => nuxtApp.$i18n.loadLocaleMessages(x)));
        await nuxtApp.$i18n.loadLocaleMessages(detected);
      }
      const modified = await nuxtApp.runWithContext(() => loadAndSetLocale(detected, nuxtApp._vueI18n.__firstAccess));
      if (modified) {
        detected = unref(nuxtApp.$i18n.locale);
      }
      return detected;
    }
    [__temp, __restore] = executeAsync(() => handleRouteDetect(currentRoute.value)), await __temp, __restore();
    const localeChangeMiddleware = defineNuxtRouteMiddleware(async (to, from) => {
      let __temp2, __restore2;
      const locale = ([__temp2, __restore2] = executeAsync(() => nuxtApp.runWithContext(() => handleRouteDetect(to))), __temp2 = await __temp2, __restore2(), __temp2);
      const redirectPath = ([__temp2, __restore2] = executeAsync(() => nuxtApp.runWithContext(
        () => detectRedirect({ to, from, locale, routeLocale: getRouteLocale(to) }, true)
      )), __temp2 = await __temp2, __restore2(), __temp2);
      nuxtApp._vueI18n.__firstAccess = false;
      return [__temp2, __restore2] = executeAsync(() => nuxtApp.runWithContext(() => navigate({ nuxtApp, redirectPath, locale, route: to }))), __temp2 = await __temp2, __restore2(), __temp2;
    });
    addRouteMiddleware("locale-changing", localeChangeMiddleware, { global: true });
  }
});

function extendI18n(i18n, { extendComposer, extendComposerInstance }) {
  const scope = effectScope();
  const installI18n = i18n.install.bind(i18n);
  i18n.install = (app, ...options) => {
    const pluginOptions = Object.assign({}, options[0]);
    pluginOptions.__composerExtend = (c) => {
      extendComposerInstance(c, getComposer$2(i18n));
      return () => {
      };
    };
    if (i18n.mode === "legacy") {
      pluginOptions.__vueI18nExtend = (vueI18n) => {
        extendComposerInstance(vueI18n, getComposer$2(vueI18n));
        return () => {
        };
      };
    }
    Reflect.apply(installI18n, i18n, [app, pluginOptions]);
    const globalComposer = getComposer$2(i18n);
    scope.run(() => {
      extendComposer(globalComposer);
      if (i18n.mode === "legacy" && isVueI18n(i18n.global)) {
        extendComposerInstance(i18n.global, getComposer$2(i18n.global));
      }
    });
    if (i18n.mode === "composition" && app.config.globalProperties.$i18n != null) {
      extendComposerInstance(app.config.globalProperties.$i18n, globalComposer);
    }
    if (app.unmount) {
      const unmountApp = app.unmount.bind(app);
      app.unmount = () => {
        scope.stop();
        unmountApp();
      };
    }
  };
  return scope;
}

function creatHeadContext({ key, seo }) {
  const nuxtApp = useNuxtApp();
  const { defaultDirection } = useRuntimeConfig().public.i18n;
  const locale = unref(nuxtApp.$i18n.locale);
  const locales = getNormalizedLocales(unref(nuxtApp.$i18n.locales));
  const currentLocale = locales.find((l) => l.code === locale) || { code: locale };
  return {
    key,
    seo,
    locale,
    locales,
    currentDir: currentLocale.dir || defaultDirection,
    currentLocale,
    currentLanguage: currentLocale.language,
    baseUrl: getBaseUrl()
  };
}
function localeHead(common, { dir = true, lang = true, seo = true, key = "hid" }) {
  const metaObject = {
    htmlAttrs: {},
    link: [],
    meta: []
  };
  const ctx = creatHeadContext({ seo, key });
  if (!ctx.baseUrl) {
    console.warn("I18n `baseUrl` is required to generate valid SEO tag links.");
  }
  if (ctx.locales == null || ctx.baseUrl == null) {
    return metaObject;
  }
  if (dir) {
    metaObject.htmlAttrs.dir = ctx.currentDir;
  }
  if (lang && ctx.currentLanguage) {
    metaObject.htmlAttrs.lang = ctx.currentLanguage;
  }
  if (seo && ctx.locale && ctx.locales) {
    metaObject.link.push(
      ...getHreflangLinks(common, ctx),
      ...getCanonicalLink(common, ctx)
    );
    metaObject.meta.push(
      ...getOgUrl(common, ctx),
      ...getCurrentOgLocale(ctx),
      ...getAlternateOgLocales(ctx)
    );
  }
  return metaObject;
}
function getBaseUrl() {
  const nuxtApp = useNuxtApp();
  const i18n = getComposer$2(nuxtApp.$i18n);
  return joinURL(unref(i18n.baseUrl), nuxtApp.$config.app.baseURL);
}
function getHreflangLinks(common, ctx) {
  const { defaultLocale, strategy } = useRuntimeConfig().public.i18n;
  const links = [];
  if (strategy === "no_prefix") return links;
  const localeMap = /* @__PURE__ */ new Map();
  for (const locale of ctx.locales) {
    if (!locale.language) {
      console.warn("Locale `language` ISO code is required to generate alternate link");
      continue;
    }
    const [language, region] = locale.language.split("-");
    if (language && region && (locale.isCatchallLocale || !localeMap.has(language))) {
      localeMap.set(language, locale);
    }
    localeMap.set(locale.language, locale);
  }
  const strictCanonicals = common.runtimeConfig.public.i18n.experimental.alternateLinkCanonicalQueries === true;
  const routeWithoutQuery = strictCanonicals ? common.router.resolve({ query: {} }) : void 0;
  if (!common.runtimeConfig.public.i18n.experimental.switchLocalePathLinkSSR && strictCanonicals) {
    routeWithoutQuery.meta = common.router.currentRoute.value.meta;
  }
  for (const [language, mapLocale] of localeMap.entries()) {
    const localePath = switchLocalePath(common, mapLocale.code, routeWithoutQuery);
    const canonicalQueryParams = getCanonicalQueryParams(common, ctx);
    let href = toAbsoluteUrl(localePath, ctx.baseUrl);
    if (canonicalQueryParams && strictCanonicals) {
      href = `${href}?${canonicalQueryParams}`;
    }
    if (localePath) {
      links.push({
        [ctx.key]: `i18n-alt-${language}`,
        rel: "alternate",
        href,
        hreflang: language
      });
    }
  }
  if (defaultLocale) {
    const localePath = switchLocalePath(common, defaultLocale, routeWithoutQuery);
    const canonicalQueryParams = getCanonicalQueryParams(common, ctx);
    let href = toAbsoluteUrl(localePath, ctx.baseUrl);
    if (canonicalQueryParams && strictCanonicals) {
      href = `${href}?${canonicalQueryParams}`;
    }
    if (localePath) {
      links.push({
        [ctx.key]: "i18n-xd",
        rel: "alternate",
        href,
        hreflang: "x-default"
      });
    }
  }
  return links;
}
function getCanonicalUrl(common, ctx) {
  const route = common.router.currentRoute.value;
  const currentRoute = localeRoute(common, {
    ...route,
    path: void 0,
    name: getRouteBaseName(common, route)
  });
  if (!currentRoute) return "";
  let href = toAbsoluteUrl(currentRoute.path, ctx.baseUrl);
  const canonicalQueryParams = getCanonicalQueryParams(common, ctx);
  if (canonicalQueryParams) {
    href = `${href}?${canonicalQueryParams}`;
  }
  return href;
}
function getCanonicalLink(common, ctx) {
  const href = getCanonicalUrl(common, ctx);
  if (!href) return [];
  return [{ [ctx.key]: "i18n-can", rel: "canonical", href }];
}
function getCanonicalQueryParams(common, ctx) {
  const route = common.router.currentRoute.value;
  const currentRoute = localeRoute(common, {
    ...route,
    path: void 0,
    name: getRouteBaseName(common, route)
  });
  const canonicalQueries = isObject$1(ctx.seo) && ctx.seo.canonicalQueries || [];
  const currentRouteQueryParams = (currentRoute == null ? void 0 : currentRoute.query) || {};
  const params = new URLSearchParams();
  for (const queryParamName of canonicalQueries) {
    if (queryParamName in currentRouteQueryParams) {
      const queryParamValue = currentRouteQueryParams[queryParamName];
      if (isArray(queryParamValue)) {
        queryParamValue.forEach((v) => params.append(queryParamName, v || ""));
      } else {
        params.append(queryParamName, queryParamValue || "");
      }
    }
  }
  return params.toString() || void 0;
}
function getOgUrl(common, ctx) {
  const href = getCanonicalUrl(common, ctx);
  if (!href) return [];
  return [{ [ctx.key]: "i18n-og-url", property: "og:url", content: href }];
}
function getCurrentOgLocale(ctx) {
  if (!ctx.currentLocale || !ctx.currentLanguage) return [];
  return [{ [ctx.key]: "i18n-og", property: "og:locale", content: hyphenToUnderscore(ctx.currentLanguage) }];
}
function getAlternateOgLocales(ctx) {
  const alternateLocales = ctx.locales.filter((locale) => locale.language && locale.language !== ctx.currentLanguage);
  return alternateLocales.map((locale) => ({
    [ctx.key]: `i18n-og-alt-${locale.language}`,
    property: "og:locale:alternate",
    content: hyphenToUnderscore(locale.language)
  }));
}
function hyphenToUnderscore(str) {
  return (str || "").replace(/-/g, "_");
}
function toAbsoluteUrl(urlOrPath, baseUrl) {
  if (urlOrPath.match(/^https?:\/\//)) return urlOrPath;
  return joinURL(baseUrl, urlOrPath);
}

/*!
  * message-compiler v11.1.11
  * (c) 2025 kazuya kawaguchi
  * Released under the MIT License.
  */
function createPosition(line, column, offset) {
  return { line, column, offset };
}
function createLocation(start, end, source) {
  const loc = { start, end };
  return loc;
}
const CompileErrorCodes = {
  // tokenizer error codes
  EXPECTED_TOKEN: 1,
  INVALID_TOKEN_IN_PLACEHOLDER: 2,
  UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER: 3,
  UNKNOWN_ESCAPE_SEQUENCE: 4,
  INVALID_UNICODE_ESCAPE_SEQUENCE: 5,
  UNBALANCED_CLOSING_BRACE: 6,
  UNTERMINATED_CLOSING_BRACE: 7,
  EMPTY_PLACEHOLDER: 8,
  NOT_ALLOW_NEST_PLACEHOLDER: 9,
  INVALID_LINKED_FORMAT: 10,
  // parser error codes
  MUST_HAVE_MESSAGES_IN_PLURAL: 11,
  UNEXPECTED_EMPTY_LINKED_MODIFIER: 12,
  UNEXPECTED_EMPTY_LINKED_KEY: 13,
  UNEXPECTED_LEXICAL_ANALYSIS: 14};
const COMPILE_ERROR_CODES_EXTEND_POINT = 17;
function createCompileError(code, loc, options = {}) {
  const { domain, messages, args } = options;
  const msg = code;
  const error = new SyntaxError(String(msg));
  error.code = code;
  if (loc) {
    error.location = loc;
  }
  error.domain = domain;
  return error;
}
function defaultOnError(error) {
  throw error;
}
const CHAR_SP = " ";
const CHAR_CR = "\r";
const CHAR_LF = "\n";
const CHAR_LS = String.fromCharCode(8232);
const CHAR_PS = String.fromCharCode(8233);
function createScanner(str) {
  const _buf = str;
  let _index = 0;
  let _line = 1;
  let _column = 1;
  let _peekOffset = 0;
  const isCRLF = (index2) => _buf[index2] === CHAR_CR && _buf[index2 + 1] === CHAR_LF;
  const isLF = (index2) => _buf[index2] === CHAR_LF;
  const isPS = (index2) => _buf[index2] === CHAR_PS;
  const isLS = (index2) => _buf[index2] === CHAR_LS;
  const isLineEnd = (index2) => isCRLF(index2) || isLF(index2) || isPS(index2) || isLS(index2);
  const index = () => _index;
  const line = () => _line;
  const column = () => _column;
  const peekOffset = () => _peekOffset;
  const charAt = (offset) => isCRLF(offset) || isPS(offset) || isLS(offset) ? CHAR_LF : _buf[offset];
  const currentChar = () => charAt(_index);
  const currentPeek = () => charAt(_index + _peekOffset);
  function next() {
    _peekOffset = 0;
    if (isLineEnd(_index)) {
      _line++;
      _column = 0;
    }
    if (isCRLF(_index)) {
      _index++;
    }
    _index++;
    _column++;
    return _buf[_index];
  }
  function peek() {
    if (isCRLF(_index + _peekOffset)) {
      _peekOffset++;
    }
    _peekOffset++;
    return _buf[_index + _peekOffset];
  }
  function reset() {
    _index = 0;
    _line = 1;
    _column = 1;
    _peekOffset = 0;
  }
  function resetPeek(offset = 0) {
    _peekOffset = offset;
  }
  function skipToPeek() {
    const target = _index + _peekOffset;
    while (target !== _index) {
      next();
    }
    _peekOffset = 0;
  }
  return {
    index,
    line,
    column,
    peekOffset,
    charAt,
    currentChar,
    currentPeek,
    next,
    peek,
    reset,
    resetPeek,
    skipToPeek
  };
}
const EOF = void 0;
const DOT = ".";
const LITERAL_DELIMITER = "'";
const ERROR_DOMAIN$3 = "tokenizer";
function createTokenizer(source, options = {}) {
  const location = options.location !== false;
  const _scnr = createScanner(source);
  const currentOffset = () => _scnr.index();
  const currentPosition = () => createPosition(_scnr.line(), _scnr.column(), _scnr.index());
  const _initLoc = currentPosition();
  const _initOffset = currentOffset();
  const _context = {
    currentType: 13,
    offset: _initOffset,
    startLoc: _initLoc,
    endLoc: _initLoc,
    lastType: 13,
    lastOffset: _initOffset,
    lastStartLoc: _initLoc,
    lastEndLoc: _initLoc,
    braceNest: 0,
    inLinked: false,
    text: ""
  };
  const context = () => _context;
  const { onError } = options;
  function emitError(code, pos, offset, ...args) {
    const ctx = context();
    pos.column += offset;
    pos.offset += offset;
    if (onError) {
      const loc = location ? createLocation(ctx.startLoc, pos) : null;
      const err = createCompileError(code, loc, {
        domain: ERROR_DOMAIN$3,
        args
      });
      onError(err);
    }
  }
  function getToken(context2, type, value) {
    context2.endLoc = currentPosition();
    context2.currentType = type;
    const token = { type };
    if (location) {
      token.loc = createLocation(context2.startLoc, context2.endLoc);
    }
    if (value != null) {
      token.value = value;
    }
    return token;
  }
  const getEndToken = (context2) => getToken(
    context2,
    13
    /* TokenTypes.EOF */
  );
  function eat(scnr, ch) {
    if (scnr.currentChar() === ch) {
      scnr.next();
      return ch;
    } else {
      emitError(CompileErrorCodes.EXPECTED_TOKEN, currentPosition(), 0, ch);
      return "";
    }
  }
  function peekSpaces(scnr) {
    let buf = "";
    while (scnr.currentPeek() === CHAR_SP || scnr.currentPeek() === CHAR_LF) {
      buf += scnr.currentPeek();
      scnr.peek();
    }
    return buf;
  }
  function skipSpaces(scnr) {
    const buf = peekSpaces(scnr);
    scnr.skipToPeek();
    return buf;
  }
  function isIdentifierStart(ch) {
    if (ch === EOF) {
      return false;
    }
    const cc = ch.charCodeAt(0);
    return cc >= 97 && cc <= 122 || // a-z
    cc >= 65 && cc <= 90 || // A-Z
    cc === 95;
  }
  function isNumberStart(ch) {
    if (ch === EOF) {
      return false;
    }
    const cc = ch.charCodeAt(0);
    return cc >= 48 && cc <= 57;
  }
  function isNamedIdentifierStart(scnr, context2) {
    const { currentType } = context2;
    if (currentType !== 2) {
      return false;
    }
    peekSpaces(scnr);
    const ret = isIdentifierStart(scnr.currentPeek());
    scnr.resetPeek();
    return ret;
  }
  function isListIdentifierStart(scnr, context2) {
    const { currentType } = context2;
    if (currentType !== 2) {
      return false;
    }
    peekSpaces(scnr);
    const ch = scnr.currentPeek() === "-" ? scnr.peek() : scnr.currentPeek();
    const ret = isNumberStart(ch);
    scnr.resetPeek();
    return ret;
  }
  function isLiteralStart(scnr, context2) {
    const { currentType } = context2;
    if (currentType !== 2) {
      return false;
    }
    peekSpaces(scnr);
    const ret = scnr.currentPeek() === LITERAL_DELIMITER;
    scnr.resetPeek();
    return ret;
  }
  function isLinkedDotStart(scnr, context2) {
    const { currentType } = context2;
    if (currentType !== 7) {
      return false;
    }
    peekSpaces(scnr);
    const ret = scnr.currentPeek() === ".";
    scnr.resetPeek();
    return ret;
  }
  function isLinkedModifierStart(scnr, context2) {
    const { currentType } = context2;
    if (currentType !== 8) {
      return false;
    }
    peekSpaces(scnr);
    const ret = isIdentifierStart(scnr.currentPeek());
    scnr.resetPeek();
    return ret;
  }
  function isLinkedDelimiterStart(scnr, context2) {
    const { currentType } = context2;
    if (!(currentType === 7 || currentType === 11)) {
      return false;
    }
    peekSpaces(scnr);
    const ret = scnr.currentPeek() === ":";
    scnr.resetPeek();
    return ret;
  }
  function isLinkedReferStart(scnr, context2) {
    const { currentType } = context2;
    if (currentType !== 9) {
      return false;
    }
    const fn = () => {
      const ch = scnr.currentPeek();
      if (ch === "{") {
        return isIdentifierStart(scnr.peek());
      } else if (ch === "@" || ch === "|" || ch === ":" || ch === "." || ch === CHAR_SP || !ch) {
        return false;
      } else if (ch === CHAR_LF) {
        scnr.peek();
        return fn();
      } else {
        return isTextStart(scnr, false);
      }
    };
    const ret = fn();
    scnr.resetPeek();
    return ret;
  }
  function isPluralStart(scnr) {
    peekSpaces(scnr);
    const ret = scnr.currentPeek() === "|";
    scnr.resetPeek();
    return ret;
  }
  function isTextStart(scnr, reset = true) {
    const fn = (hasSpace = false, prev = "") => {
      const ch = scnr.currentPeek();
      if (ch === "{") {
        return hasSpace;
      } else if (ch === "@" || !ch) {
        return hasSpace;
      } else if (ch === "|") {
        return !(prev === CHAR_SP || prev === CHAR_LF);
      } else if (ch === CHAR_SP) {
        scnr.peek();
        return fn(true, CHAR_SP);
      } else if (ch === CHAR_LF) {
        scnr.peek();
        return fn(true, CHAR_LF);
      } else {
        return true;
      }
    };
    const ret = fn();
    reset && scnr.resetPeek();
    return ret;
  }
  function takeChar(scnr, fn) {
    const ch = scnr.currentChar();
    if (ch === EOF) {
      return EOF;
    }
    if (fn(ch)) {
      scnr.next();
      return ch;
    }
    return null;
  }
  function isIdentifier(ch) {
    const cc = ch.charCodeAt(0);
    return cc >= 97 && cc <= 122 || // a-z
    cc >= 65 && cc <= 90 || // A-Z
    cc >= 48 && cc <= 57 || // 0-9
    cc === 95 || // _
    cc === 36;
  }
  function takeIdentifierChar(scnr) {
    return takeChar(scnr, isIdentifier);
  }
  function isNamedIdentifier(ch) {
    const cc = ch.charCodeAt(0);
    return cc >= 97 && cc <= 122 || // a-z
    cc >= 65 && cc <= 90 || // A-Z
    cc >= 48 && cc <= 57 || // 0-9
    cc === 95 || // _
    cc === 36 || // $
    cc === 45;
  }
  function takeNamedIdentifierChar(scnr) {
    return takeChar(scnr, isNamedIdentifier);
  }
  function isDigit(ch) {
    const cc = ch.charCodeAt(0);
    return cc >= 48 && cc <= 57;
  }
  function takeDigit(scnr) {
    return takeChar(scnr, isDigit);
  }
  function isHexDigit(ch) {
    const cc = ch.charCodeAt(0);
    return cc >= 48 && cc <= 57 || // 0-9
    cc >= 65 && cc <= 70 || // A-F
    cc >= 97 && cc <= 102;
  }
  function takeHexDigit(scnr) {
    return takeChar(scnr, isHexDigit);
  }
  function getDigits(scnr) {
    let ch = "";
    let num = "";
    while (ch = takeDigit(scnr)) {
      num += ch;
    }
    return num;
  }
  function readText(scnr) {
    let buf = "";
    while (true) {
      const ch = scnr.currentChar();
      if (ch === "{" || ch === "}" || ch === "@" || ch === "|" || !ch) {
        break;
      } else if (ch === CHAR_SP || ch === CHAR_LF) {
        if (isTextStart(scnr)) {
          buf += ch;
          scnr.next();
        } else if (isPluralStart(scnr)) {
          break;
        } else {
          buf += ch;
          scnr.next();
        }
      } else {
        buf += ch;
        scnr.next();
      }
    }
    return buf;
  }
  function readNamedIdentifier(scnr) {
    skipSpaces(scnr);
    let ch = "";
    let name = "";
    while (ch = takeNamedIdentifierChar(scnr)) {
      name += ch;
    }
    if (scnr.currentChar() === EOF) {
      emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
    }
    return name;
  }
  function readListIdentifier(scnr) {
    skipSpaces(scnr);
    let value = "";
    if (scnr.currentChar() === "-") {
      scnr.next();
      value += `-${getDigits(scnr)}`;
    } else {
      value += getDigits(scnr);
    }
    if (scnr.currentChar() === EOF) {
      emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
    }
    return value;
  }
  function isLiteral(ch) {
    return ch !== LITERAL_DELIMITER && ch !== CHAR_LF;
  }
  function readLiteral(scnr) {
    skipSpaces(scnr);
    eat(scnr, `'`);
    let ch = "";
    let literal = "";
    while (ch = takeChar(scnr, isLiteral)) {
      if (ch === "\\") {
        literal += readEscapeSequence(scnr);
      } else {
        literal += ch;
      }
    }
    const current = scnr.currentChar();
    if (current === CHAR_LF || current === EOF) {
      emitError(CompileErrorCodes.UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER, currentPosition(), 0);
      if (current === CHAR_LF) {
        scnr.next();
        eat(scnr, `'`);
      }
      return literal;
    }
    eat(scnr, `'`);
    return literal;
  }
  function readEscapeSequence(scnr) {
    const ch = scnr.currentChar();
    switch (ch) {
      case "\\":
      case `'`:
        scnr.next();
        return `\\${ch}`;
      case "u":
        return readUnicodeEscapeSequence(scnr, ch, 4);
      case "U":
        return readUnicodeEscapeSequence(scnr, ch, 6);
      default:
        emitError(CompileErrorCodes.UNKNOWN_ESCAPE_SEQUENCE, currentPosition(), 0, ch);
        return "";
    }
  }
  function readUnicodeEscapeSequence(scnr, unicode, digits) {
    eat(scnr, unicode);
    let sequence = "";
    for (let i = 0; i < digits; i++) {
      const ch = takeHexDigit(scnr);
      if (!ch) {
        emitError(CompileErrorCodes.INVALID_UNICODE_ESCAPE_SEQUENCE, currentPosition(), 0, `\\${unicode}${sequence}${scnr.currentChar()}`);
        break;
      }
      sequence += ch;
    }
    return `\\${unicode}${sequence}`;
  }
  function isInvalidIdentifier(ch) {
    return ch !== "{" && ch !== "}" && ch !== CHAR_SP && ch !== CHAR_LF;
  }
  function readInvalidIdentifier(scnr) {
    skipSpaces(scnr);
    let ch = "";
    let identifiers = "";
    while (ch = takeChar(scnr, isInvalidIdentifier)) {
      identifiers += ch;
    }
    return identifiers;
  }
  function readLinkedModifier(scnr) {
    let ch = "";
    let name = "";
    while (ch = takeIdentifierChar(scnr)) {
      name += ch;
    }
    return name;
  }
  function readLinkedRefer(scnr) {
    const fn = (buf) => {
      const ch = scnr.currentChar();
      if (ch === "{" || ch === "@" || ch === "|" || ch === "(" || ch === ")" || !ch) {
        return buf;
      } else if (ch === CHAR_SP) {
        return buf;
      } else if (ch === CHAR_LF || ch === DOT) {
        buf += ch;
        scnr.next();
        return fn(buf);
      } else {
        buf += ch;
        scnr.next();
        return fn(buf);
      }
    };
    return fn("");
  }
  function readPlural(scnr) {
    skipSpaces(scnr);
    const plural = eat(
      scnr,
      "|"
      /* TokenChars.Pipe */
    );
    skipSpaces(scnr);
    return plural;
  }
  function readTokenInPlaceholder(scnr, context2) {
    let token = null;
    const ch = scnr.currentChar();
    switch (ch) {
      case "{":
        if (context2.braceNest >= 1) {
          emitError(CompileErrorCodes.NOT_ALLOW_NEST_PLACEHOLDER, currentPosition(), 0);
        }
        scnr.next();
        token = getToken(
          context2,
          2,
          "{"
          /* TokenChars.BraceLeft */
        );
        skipSpaces(scnr);
        context2.braceNest++;
        return token;
      case "}":
        if (context2.braceNest > 0 && context2.currentType === 2) {
          emitError(CompileErrorCodes.EMPTY_PLACEHOLDER, currentPosition(), 0);
        }
        scnr.next();
        token = getToken(
          context2,
          3,
          "}"
          /* TokenChars.BraceRight */
        );
        context2.braceNest--;
        context2.braceNest > 0 && skipSpaces(scnr);
        if (context2.inLinked && context2.braceNest === 0) {
          context2.inLinked = false;
        }
        return token;
      case "@":
        if (context2.braceNest > 0) {
          emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
        }
        token = readTokenInLinked(scnr, context2) || getEndToken(context2);
        context2.braceNest = 0;
        return token;
      default: {
        let validNamedIdentifier = true;
        let validListIdentifier = true;
        let validLiteral = true;
        if (isPluralStart(scnr)) {
          if (context2.braceNest > 0) {
            emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
          }
          token = getToken(context2, 1, readPlural(scnr));
          context2.braceNest = 0;
          context2.inLinked = false;
          return token;
        }
        if (context2.braceNest > 0 && (context2.currentType === 4 || context2.currentType === 5 || context2.currentType === 6)) {
          emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
          context2.braceNest = 0;
          return readToken(scnr, context2);
        }
        if (validNamedIdentifier = isNamedIdentifierStart(scnr, context2)) {
          token = getToken(context2, 4, readNamedIdentifier(scnr));
          skipSpaces(scnr);
          return token;
        }
        if (validListIdentifier = isListIdentifierStart(scnr, context2)) {
          token = getToken(context2, 5, readListIdentifier(scnr));
          skipSpaces(scnr);
          return token;
        }
        if (validLiteral = isLiteralStart(scnr, context2)) {
          token = getToken(context2, 6, readLiteral(scnr));
          skipSpaces(scnr);
          return token;
        }
        if (!validNamedIdentifier && !validListIdentifier && !validLiteral) {
          token = getToken(context2, 12, readInvalidIdentifier(scnr));
          emitError(CompileErrorCodes.INVALID_TOKEN_IN_PLACEHOLDER, currentPosition(), 0, token.value);
          skipSpaces(scnr);
          return token;
        }
        break;
      }
    }
    return token;
  }
  function readTokenInLinked(scnr, context2) {
    const { currentType } = context2;
    let token = null;
    const ch = scnr.currentChar();
    if ((currentType === 7 || currentType === 8 || currentType === 11 || currentType === 9) && (ch === CHAR_LF || ch === CHAR_SP)) {
      emitError(CompileErrorCodes.INVALID_LINKED_FORMAT, currentPosition(), 0);
    }
    switch (ch) {
      case "@":
        scnr.next();
        token = getToken(
          context2,
          7,
          "@"
          /* TokenChars.LinkedAlias */
        );
        context2.inLinked = true;
        return token;
      case ".":
        skipSpaces(scnr);
        scnr.next();
        return getToken(
          context2,
          8,
          "."
          /* TokenChars.LinkedDot */
        );
      case ":":
        skipSpaces(scnr);
        scnr.next();
        return getToken(
          context2,
          9,
          ":"
          /* TokenChars.LinkedDelimiter */
        );
      default:
        if (isPluralStart(scnr)) {
          token = getToken(context2, 1, readPlural(scnr));
          context2.braceNest = 0;
          context2.inLinked = false;
          return token;
        }
        if (isLinkedDotStart(scnr, context2) || isLinkedDelimiterStart(scnr, context2)) {
          skipSpaces(scnr);
          return readTokenInLinked(scnr, context2);
        }
        if (isLinkedModifierStart(scnr, context2)) {
          skipSpaces(scnr);
          return getToken(context2, 11, readLinkedModifier(scnr));
        }
        if (isLinkedReferStart(scnr, context2)) {
          skipSpaces(scnr);
          if (ch === "{") {
            return readTokenInPlaceholder(scnr, context2) || token;
          } else {
            return getToken(context2, 10, readLinkedRefer(scnr));
          }
        }
        if (currentType === 7) {
          emitError(CompileErrorCodes.INVALID_LINKED_FORMAT, currentPosition(), 0);
        }
        context2.braceNest = 0;
        context2.inLinked = false;
        return readToken(scnr, context2);
    }
  }
  function readToken(scnr, context2) {
    let token = {
      type: 13
      /* TokenTypes.EOF */
    };
    if (context2.braceNest > 0) {
      return readTokenInPlaceholder(scnr, context2) || getEndToken(context2);
    }
    if (context2.inLinked) {
      return readTokenInLinked(scnr, context2) || getEndToken(context2);
    }
    const ch = scnr.currentChar();
    switch (ch) {
      case "{":
        return readTokenInPlaceholder(scnr, context2) || getEndToken(context2);
      case "}":
        emitError(CompileErrorCodes.UNBALANCED_CLOSING_BRACE, currentPosition(), 0);
        scnr.next();
        return getToken(
          context2,
          3,
          "}"
          /* TokenChars.BraceRight */
        );
      case "@":
        return readTokenInLinked(scnr, context2) || getEndToken(context2);
      default: {
        if (isPluralStart(scnr)) {
          token = getToken(context2, 1, readPlural(scnr));
          context2.braceNest = 0;
          context2.inLinked = false;
          return token;
        }
        if (isTextStart(scnr)) {
          return getToken(context2, 0, readText(scnr));
        }
        break;
      }
    }
    return token;
  }
  function nextToken() {
    const { currentType, offset, startLoc, endLoc } = _context;
    _context.lastType = currentType;
    _context.lastOffset = offset;
    _context.lastStartLoc = startLoc;
    _context.lastEndLoc = endLoc;
    _context.offset = currentOffset();
    _context.startLoc = currentPosition();
    if (_scnr.currentChar() === EOF) {
      return getToken(
        _context,
        13
        /* TokenTypes.EOF */
      );
    }
    return readToken(_scnr, _context);
  }
  return {
    nextToken,
    currentOffset,
    currentPosition,
    context
  };
}
const ERROR_DOMAIN$2 = "parser";
const KNOWN_ESCAPES = /(?:\\\\|\\'|\\u([0-9a-fA-F]{4})|\\U([0-9a-fA-F]{6}))/g;
function fromEscapeSequence(match, codePoint4, codePoint6) {
  switch (match) {
    case `\\\\`:
      return `\\`;
    // eslint-disable-next-line no-useless-escape
    case `\\'`:
      return `'`;
    default: {
      const codePoint = parseInt(codePoint4 || codePoint6, 16);
      if (codePoint <= 55295 || codePoint >= 57344) {
        return String.fromCodePoint(codePoint);
      }
      return "�";
    }
  }
}
function createParser(options = {}) {
  const location = options.location !== false;
  const { onError } = options;
  function emitError(tokenzer, code, start, offset, ...args) {
    const end = tokenzer.currentPosition();
    end.offset += offset;
    end.column += offset;
    if (onError) {
      const loc = location ? createLocation(start, end) : null;
      const err = createCompileError(code, loc, {
        domain: ERROR_DOMAIN$2,
        args
      });
      onError(err);
    }
  }
  function startNode(type, offset, loc) {
    const node = { type };
    if (location) {
      node.start = offset;
      node.end = offset;
      node.loc = { start: loc, end: loc };
    }
    return node;
  }
  function endNode(node, offset, pos, type) {
    if (location) {
      node.end = offset;
      if (node.loc) {
        node.loc.end = pos;
      }
    }
  }
  function parseText(tokenizer, value) {
    const context = tokenizer.context();
    const node = startNode(3, context.offset, context.startLoc);
    node.value = value;
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
    return node;
  }
  function parseList(tokenizer, index) {
    const context = tokenizer.context();
    const { lastOffset: offset, lastStartLoc: loc } = context;
    const node = startNode(5, offset, loc);
    node.index = parseInt(index, 10);
    tokenizer.nextToken();
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
    return node;
  }
  function parseNamed(tokenizer, key) {
    const context = tokenizer.context();
    const { lastOffset: offset, lastStartLoc: loc } = context;
    const node = startNode(4, offset, loc);
    node.key = key;
    tokenizer.nextToken();
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
    return node;
  }
  function parseLiteral(tokenizer, value) {
    const context = tokenizer.context();
    const { lastOffset: offset, lastStartLoc: loc } = context;
    const node = startNode(9, offset, loc);
    node.value = value.replace(KNOWN_ESCAPES, fromEscapeSequence);
    tokenizer.nextToken();
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
    return node;
  }
  function parseLinkedModifier(tokenizer) {
    const token = tokenizer.nextToken();
    const context = tokenizer.context();
    const { lastOffset: offset, lastStartLoc: loc } = context;
    const node = startNode(8, offset, loc);
    if (token.type !== 11) {
      emitError(tokenizer, CompileErrorCodes.UNEXPECTED_EMPTY_LINKED_MODIFIER, context.lastStartLoc, 0);
      node.value = "";
      endNode(node, offset, loc);
      return {
        nextConsumeToken: token,
        node
      };
    }
    if (token.value == null) {
      emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
    }
    node.value = token.value || "";
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
    return {
      node
    };
  }
  function parseLinkedKey(tokenizer, value) {
    const context = tokenizer.context();
    const node = startNode(7, context.offset, context.startLoc);
    node.value = value;
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
    return node;
  }
  function parseLinked(tokenizer) {
    const context = tokenizer.context();
    const linkedNode = startNode(6, context.offset, context.startLoc);
    let token = tokenizer.nextToken();
    if (token.type === 8) {
      const parsed = parseLinkedModifier(tokenizer);
      linkedNode.modifier = parsed.node;
      token = parsed.nextConsumeToken || tokenizer.nextToken();
    }
    if (token.type !== 9) {
      emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
    }
    token = tokenizer.nextToken();
    if (token.type === 2) {
      token = tokenizer.nextToken();
    }
    switch (token.type) {
      case 10:
        if (token.value == null) {
          emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
        }
        linkedNode.key = parseLinkedKey(tokenizer, token.value || "");
        break;
      case 4:
        if (token.value == null) {
          emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
        }
        linkedNode.key = parseNamed(tokenizer, token.value || "");
        break;
      case 5:
        if (token.value == null) {
          emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
        }
        linkedNode.key = parseList(tokenizer, token.value || "");
        break;
      case 6:
        if (token.value == null) {
          emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
        }
        linkedNode.key = parseLiteral(tokenizer, token.value || "");
        break;
      default: {
        emitError(tokenizer, CompileErrorCodes.UNEXPECTED_EMPTY_LINKED_KEY, context.lastStartLoc, 0);
        const nextContext = tokenizer.context();
        const emptyLinkedKeyNode = startNode(7, nextContext.offset, nextContext.startLoc);
        emptyLinkedKeyNode.value = "";
        endNode(emptyLinkedKeyNode, nextContext.offset, nextContext.startLoc);
        linkedNode.key = emptyLinkedKeyNode;
        endNode(linkedNode, nextContext.offset, nextContext.startLoc);
        return {
          nextConsumeToken: token,
          node: linkedNode
        };
      }
    }
    endNode(linkedNode, tokenizer.currentOffset(), tokenizer.currentPosition());
    return {
      node: linkedNode
    };
  }
  function parseMessage(tokenizer) {
    const context = tokenizer.context();
    const startOffset = context.currentType === 1 ? tokenizer.currentOffset() : context.offset;
    const startLoc = context.currentType === 1 ? context.endLoc : context.startLoc;
    const node = startNode(2, startOffset, startLoc);
    node.items = [];
    let nextToken = null;
    do {
      const token = nextToken || tokenizer.nextToken();
      nextToken = null;
      switch (token.type) {
        case 0:
          if (token.value == null) {
            emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
          }
          node.items.push(parseText(tokenizer, token.value || ""));
          break;
        case 5:
          if (token.value == null) {
            emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
          }
          node.items.push(parseList(tokenizer, token.value || ""));
          break;
        case 4:
          if (token.value == null) {
            emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
          }
          node.items.push(parseNamed(tokenizer, token.value || ""));
          break;
        case 6:
          if (token.value == null) {
            emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
          }
          node.items.push(parseLiteral(tokenizer, token.value || ""));
          break;
        case 7: {
          const parsed = parseLinked(tokenizer);
          node.items.push(parsed.node);
          nextToken = parsed.nextConsumeToken || null;
          break;
        }
      }
    } while (context.currentType !== 13 && context.currentType !== 1);
    const endOffset = context.currentType === 1 ? context.lastOffset : tokenizer.currentOffset();
    const endLoc = context.currentType === 1 ? context.lastEndLoc : tokenizer.currentPosition();
    endNode(node, endOffset, endLoc);
    return node;
  }
  function parsePlural(tokenizer, offset, loc, msgNode) {
    const context = tokenizer.context();
    let hasEmptyMessage = msgNode.items.length === 0;
    const node = startNode(1, offset, loc);
    node.cases = [];
    node.cases.push(msgNode);
    do {
      const msg = parseMessage(tokenizer);
      if (!hasEmptyMessage) {
        hasEmptyMessage = msg.items.length === 0;
      }
      node.cases.push(msg);
    } while (context.currentType !== 13);
    if (hasEmptyMessage) {
      emitError(tokenizer, CompileErrorCodes.MUST_HAVE_MESSAGES_IN_PLURAL, loc, 0);
    }
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
    return node;
  }
  function parseResource(tokenizer) {
    const context = tokenizer.context();
    const { offset, startLoc } = context;
    const msgNode = parseMessage(tokenizer);
    if (context.currentType === 13) {
      return msgNode;
    } else {
      return parsePlural(tokenizer, offset, startLoc, msgNode);
    }
  }
  function parse(source) {
    const tokenizer = createTokenizer(source, assign({}, options));
    const context = tokenizer.context();
    const node = startNode(0, context.offset, context.startLoc);
    if (location && node.loc) {
      node.loc.source = source;
    }
    node.body = parseResource(tokenizer);
    if (options.onCacheKey) {
      node.cacheKey = options.onCacheKey(source);
    }
    if (context.currentType !== 13) {
      emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, source[context.offset] || "");
    }
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
    return node;
  }
  return { parse };
}
function getTokenCaption(token) {
  if (token.type === 13) {
    return "EOF";
  }
  const name = (token.value || "").replace(/\r?\n/gu, "\\n");
  return name.length > 10 ? name.slice(0, 9) + "…" : name;
}
function createTransformer(ast, options = {}) {
  const _context = {
    ast,
    helpers: /* @__PURE__ */ new Set()
  };
  const context = () => _context;
  const helper = (name) => {
    _context.helpers.add(name);
    return name;
  };
  return { context, helper };
}
function traverseNodes(nodes, transformer) {
  for (let i = 0; i < nodes.length; i++) {
    traverseNode(nodes[i], transformer);
  }
}
function traverseNode(node, transformer) {
  switch (node.type) {
    case 1:
      traverseNodes(node.cases, transformer);
      transformer.helper(
        "plural"
        /* HelperNameMap.PLURAL */
      );
      break;
    case 2:
      traverseNodes(node.items, transformer);
      break;
    case 6: {
      const linked = node;
      traverseNode(linked.key, transformer);
      transformer.helper(
        "linked"
        /* HelperNameMap.LINKED */
      );
      transformer.helper(
        "type"
        /* HelperNameMap.TYPE */
      );
      break;
    }
    case 5:
      transformer.helper(
        "interpolate"
        /* HelperNameMap.INTERPOLATE */
      );
      transformer.helper(
        "list"
        /* HelperNameMap.LIST */
      );
      break;
    case 4:
      transformer.helper(
        "interpolate"
        /* HelperNameMap.INTERPOLATE */
      );
      transformer.helper(
        "named"
        /* HelperNameMap.NAMED */
      );
      break;
  }
}
function transform(ast, options = {}) {
  const transformer = createTransformer(ast);
  transformer.helper(
    "normalize"
    /* HelperNameMap.NORMALIZE */
  );
  ast.body && traverseNode(ast.body, transformer);
  const context = transformer.context();
  ast.helpers = Array.from(context.helpers);
}
function optimize(ast) {
  const body = ast.body;
  if (body.type === 2) {
    optimizeMessageNode(body);
  } else {
    body.cases.forEach((c) => optimizeMessageNode(c));
  }
  return ast;
}
function optimizeMessageNode(message) {
  if (message.items.length === 1) {
    const item = message.items[0];
    if (item.type === 3 || item.type === 9) {
      message.static = item.value;
      delete item.value;
    }
  } else {
    const values = [];
    for (let i = 0; i < message.items.length; i++) {
      const item = message.items[i];
      if (!(item.type === 3 || item.type === 9)) {
        break;
      }
      if (item.value == null) {
        break;
      }
      values.push(item.value);
    }
    if (values.length === message.items.length) {
      message.static = join(values);
      for (let i = 0; i < message.items.length; i++) {
        const item = message.items[i];
        if (item.type === 3 || item.type === 9) {
          delete item.value;
        }
      }
    }
  }
}
function minify(node) {
  node.t = node.type;
  switch (node.type) {
    case 0: {
      const resource = node;
      minify(resource.body);
      resource.b = resource.body;
      delete resource.body;
      break;
    }
    case 1: {
      const plural = node;
      const cases = plural.cases;
      for (let i = 0; i < cases.length; i++) {
        minify(cases[i]);
      }
      plural.c = cases;
      delete plural.cases;
      break;
    }
    case 2: {
      const message = node;
      const items = message.items;
      for (let i = 0; i < items.length; i++) {
        minify(items[i]);
      }
      message.i = items;
      delete message.items;
      if (message.static) {
        message.s = message.static;
        delete message.static;
      }
      break;
    }
    case 3:
    case 9:
    case 8:
    case 7: {
      const valueNode = node;
      if (valueNode.value) {
        valueNode.v = valueNode.value;
        delete valueNode.value;
      }
      break;
    }
    case 6: {
      const linked = node;
      minify(linked.key);
      linked.k = linked.key;
      delete linked.key;
      if (linked.modifier) {
        minify(linked.modifier);
        linked.m = linked.modifier;
        delete linked.modifier;
      }
      break;
    }
    case 5: {
      const list = node;
      list.i = list.index;
      delete list.index;
      break;
    }
    case 4: {
      const named = node;
      named.k = named.key;
      delete named.key;
      break;
    }
  }
  delete node.type;
}
function createCodeGenerator(ast, options) {
  const { filename, breakLineCode, needIndent: _needIndent } = options;
  const location = options.location !== false;
  const _context = {
    filename,
    code: "",
    column: 1,
    line: 1,
    offset: 0,
    map: void 0,
    breakLineCode,
    needIndent: _needIndent,
    indentLevel: 0
  };
  if (location && ast.loc) {
    _context.source = ast.loc.source;
  }
  const context = () => _context;
  function push(code, node) {
    _context.code += code;
  }
  function _newline(n, withBreakLine = true) {
    const _breakLineCode = withBreakLine ? breakLineCode : "";
    push(_needIndent ? _breakLineCode + `  `.repeat(n) : _breakLineCode);
  }
  function indent(withNewLine = true) {
    const level = ++_context.indentLevel;
    withNewLine && _newline(level);
  }
  function deindent(withNewLine = true) {
    const level = --_context.indentLevel;
    withNewLine && _newline(level);
  }
  function newline() {
    _newline(_context.indentLevel);
  }
  const helper = (key) => `_${key}`;
  const needIndent = () => _context.needIndent;
  return {
    context,
    push,
    indent,
    deindent,
    newline,
    helper,
    needIndent
  };
}
function generateLinkedNode(generator, node) {
  const { helper } = generator;
  generator.push(`${helper(
    "linked"
    /* HelperNameMap.LINKED */
  )}(`);
  generateNode(generator, node.key);
  if (node.modifier) {
    generator.push(`, `);
    generateNode(generator, node.modifier);
    generator.push(`, _type`);
  } else {
    generator.push(`, undefined, _type`);
  }
  generator.push(`)`);
}
function generateMessageNode(generator, node) {
  const { helper, needIndent } = generator;
  generator.push(`${helper(
    "normalize"
    /* HelperNameMap.NORMALIZE */
  )}([`);
  generator.indent(needIndent());
  const length = node.items.length;
  for (let i = 0; i < length; i++) {
    generateNode(generator, node.items[i]);
    if (i === length - 1) {
      break;
    }
    generator.push(", ");
  }
  generator.deindent(needIndent());
  generator.push("])");
}
function generatePluralNode(generator, node) {
  const { helper, needIndent } = generator;
  if (node.cases.length > 1) {
    generator.push(`${helper(
      "plural"
      /* HelperNameMap.PLURAL */
    )}([`);
    generator.indent(needIndent());
    const length = node.cases.length;
    for (let i = 0; i < length; i++) {
      generateNode(generator, node.cases[i]);
      if (i === length - 1) {
        break;
      }
      generator.push(", ");
    }
    generator.deindent(needIndent());
    generator.push(`])`);
  }
}
function generateResource(generator, node) {
  if (node.body) {
    generateNode(generator, node.body);
  } else {
    generator.push("null");
  }
}
function generateNode(generator, node) {
  const { helper } = generator;
  switch (node.type) {
    case 0:
      generateResource(generator, node);
      break;
    case 1:
      generatePluralNode(generator, node);
      break;
    case 2:
      generateMessageNode(generator, node);
      break;
    case 6:
      generateLinkedNode(generator, node);
      break;
    case 8:
      generator.push(JSON.stringify(node.value), node);
      break;
    case 7:
      generator.push(JSON.stringify(node.value), node);
      break;
    case 5:
      generator.push(`${helper(
        "interpolate"
        /* HelperNameMap.INTERPOLATE */
      )}(${helper(
        "list"
        /* HelperNameMap.LIST */
      )}(${node.index}))`, node);
      break;
    case 4:
      generator.push(`${helper(
        "interpolate"
        /* HelperNameMap.INTERPOLATE */
      )}(${helper(
        "named"
        /* HelperNameMap.NAMED */
      )}(${JSON.stringify(node.key)}))`, node);
      break;
    case 9:
      generator.push(JSON.stringify(node.value), node);
      break;
    case 3:
      generator.push(JSON.stringify(node.value), node);
      break;
  }
}
const generate = (ast, options = {}) => {
  const mode = isString(options.mode) ? options.mode : "normal";
  const filename = isString(options.filename) ? options.filename : "message.intl";
  !!options.sourceMap;
  const breakLineCode = options.breakLineCode != null ? options.breakLineCode : mode === "arrow" ? ";" : "\n";
  const needIndent = options.needIndent ? options.needIndent : mode !== "arrow";
  const helpers = ast.helpers || [];
  const generator = createCodeGenerator(ast, {
    filename,
    breakLineCode,
    needIndent
  });
  generator.push(mode === "normal" ? `function __msg__ (ctx) {` : `(ctx) => {`);
  generator.indent(needIndent);
  if (helpers.length > 0) {
    generator.push(`const { ${join(helpers.map((s) => `${s}: _${s}`), ", ")} } = ctx`);
    generator.newline();
  }
  generator.push(`return `);
  generateNode(generator, ast);
  generator.deindent(needIndent);
  generator.push(`}`);
  delete ast.helpers;
  const { code, map } = generator.context();
  return {
    ast,
    code,
    map: map ? map.toJSON() : void 0
    // eslint-disable-line @typescript-eslint/no-explicit-any
  };
};
function baseCompile$1(source, options = {}) {
  const assignedOptions = assign({}, options);
  const jit = !!assignedOptions.jit;
  const enalbeMinify = !!assignedOptions.minify;
  const enambeOptimize = assignedOptions.optimize == null ? true : assignedOptions.optimize;
  const parser = createParser(assignedOptions);
  const ast = parser.parse(source);
  if (!jit) {
    transform(ast, assignedOptions);
    return generate(ast, assignedOptions);
  } else {
    enambeOptimize && optimize(ast);
    enalbeMinify && minify(ast);
    return { ast, code: "" };
  }
}

function format(ast) {
  const msg = (ctx) => formatParts(ctx, ast);
  return msg;
}
function formatParts(ctx, ast) {
  const body = resolveBody(ast);
  if (body == null) {
    throw createUnhandleNodeError(
      0
      /* NodeTypes.Resource */
    );
  }
  const type = resolveType(body);
  if (type === 1) {
    const plural = body;
    const cases = resolveCases(plural);
    return ctx.plural(cases.reduce((messages, c) => [
      ...messages,
      formatMessageParts(ctx, c)
    ], []));
  } else {
    return formatMessageParts(ctx, body);
  }
}
const PROPS_BODY = ["b", "body"];
function resolveBody(node) {
  return resolveProps(node, PROPS_BODY);
}
const PROPS_CASES = ["c", "cases"];
function resolveCases(node) {
  return resolveProps(node, PROPS_CASES, []);
}
function formatMessageParts(ctx, node) {
  const static_ = resolveStatic(node);
  if (static_ != null) {
    return ctx.type === "text" ? static_ : ctx.normalize([static_]);
  } else {
    const messages = resolveItems(node).reduce((acm, c) => [...acm, formatMessagePart(ctx, c)], []);
    return ctx.normalize(messages);
  }
}
const PROPS_STATIC = ["s", "static"];
function resolveStatic(node) {
  return resolveProps(node, PROPS_STATIC);
}
const PROPS_ITEMS = ["i", "items"];
function resolveItems(node) {
  return resolveProps(node, PROPS_ITEMS, []);
}
function formatMessagePart(ctx, node) {
  const type = resolveType(node);
  switch (type) {
    case 3: {
      return resolveValue$1(node, type);
    }
    case 9: {
      return resolveValue$1(node, type);
    }
    case 4: {
      const named = node;
      if (hasOwn(named, "k") && named.k) {
        return ctx.interpolate(ctx.named(named.k));
      }
      if (hasOwn(named, "key") && named.key) {
        return ctx.interpolate(ctx.named(named.key));
      }
      throw createUnhandleNodeError(type);
    }
    case 5: {
      const list = node;
      if (hasOwn(list, "i") && isNumber(list.i)) {
        return ctx.interpolate(ctx.list(list.i));
      }
      if (hasOwn(list, "index") && isNumber(list.index)) {
        return ctx.interpolate(ctx.list(list.index));
      }
      throw createUnhandleNodeError(type);
    }
    case 6: {
      const linked = node;
      const modifier = resolveLinkedModifier(linked);
      const key = resolveLinkedKey(linked);
      return ctx.linked(formatMessagePart(ctx, key), modifier ? formatMessagePart(ctx, modifier) : void 0, ctx.type);
    }
    case 7: {
      return resolveValue$1(node, type);
    }
    case 8: {
      return resolveValue$1(node, type);
    }
    default:
      throw new Error(`unhandled node on format message part: ${type}`);
  }
}
const PROPS_TYPE = ["t", "type"];
function resolveType(node) {
  return resolveProps(node, PROPS_TYPE);
}
const PROPS_VALUE = ["v", "value"];
function resolveValue$1(node, type) {
  const resolved = resolveProps(node, PROPS_VALUE);
  if (resolved) {
    return resolved;
  } else {
    throw createUnhandleNodeError(type);
  }
}
const PROPS_MODIFIER = ["m", "modifier"];
function resolveLinkedModifier(node) {
  return resolveProps(node, PROPS_MODIFIER);
}
const PROPS_KEY = ["k", "key"];
function resolveLinkedKey(node) {
  const resolved = resolveProps(node, PROPS_KEY);
  if (resolved) {
    return resolved;
  } else {
    throw createUnhandleNodeError(
      6
      /* NodeTypes.Linked */
    );
  }
}
function resolveProps(node, props, defaultValue) {
  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    if (hasOwn(node, prop) && node[prop] != null) {
      return node[prop];
    }
  }
  return defaultValue;
}
function createUnhandleNodeError(type) {
  return new Error(`unhandled node type: ${type}`);
}
const defaultOnCacheKey = (message) => message;
let compileCache = create();
function isMessageAST(val) {
  return isObject$1(val) && resolveType(val) === 0 && (hasOwn(val, "b") || hasOwn(val, "body"));
}
function baseCompile(message, options = {}) {
  let detectError = false;
  const onError = options.onError || defaultOnError;
  options.onError = (err) => {
    detectError = true;
    onError(err);
  };
  return { ...baseCompile$1(message, options), detectError };
}
// @__NO_SIDE_EFFECTS__
function compile(message, context) {
  if (isString(message)) {
    isBoolean(context.warnHtmlMessage) ? context.warnHtmlMessage : true;
    const onCacheKey = context.onCacheKey || defaultOnCacheKey;
    const cacheKey = onCacheKey(message);
    const cached = compileCache[cacheKey];
    if (cached) {
      return cached;
    }
    const { ast, detectError } = baseCompile(message, {
      ...context,
      location: "production" !== "production",
      jit: true
    });
    const msg = format(ast);
    return !detectError ? compileCache[cacheKey] = msg : msg;
  } else {
    const cacheKey = message.cacheKey;
    if (cacheKey) {
      const cached = compileCache[cacheKey];
      if (cached) {
        return cached;
      }
      return compileCache[cacheKey] = format(message);
    } else {
      return format(message);
    }
  }
}
const CoreErrorCodes = {
  INVALID_ARGUMENT: COMPILE_ERROR_CODES_EXTEND_POINT,
  // 17
  INVALID_DATE_ARGUMENT: 18,
  INVALID_ISO_DATE_ARGUMENT: 19,
  NOT_SUPPORT_LOCALE_PROMISE_VALUE: 21,
  NOT_SUPPORT_LOCALE_ASYNC_FUNCTION: 22,
  NOT_SUPPORT_LOCALE_TYPE: 23
};
const CORE_ERROR_CODES_EXTEND_POINT = 24;
function createCoreError(code) {
  return createCompileError(code, null, void 0);
}
function getLocale(context, options) {
  return options.locale != null ? resolveLocale(options.locale) : resolveLocale(context.locale);
}
let _resolveLocale;
function resolveLocale(locale) {
  if (isString(locale)) {
    return locale;
  } else {
    if (isFunction(locale)) {
      if (locale.resolvedOnce && _resolveLocale != null) {
        return _resolveLocale;
      } else if (locale.constructor.name === "Function") {
        const resolve = locale();
        if (isPromise(resolve)) {
          throw createCoreError(CoreErrorCodes.NOT_SUPPORT_LOCALE_PROMISE_VALUE);
        }
        return _resolveLocale = resolve;
      } else {
        throw createCoreError(CoreErrorCodes.NOT_SUPPORT_LOCALE_ASYNC_FUNCTION);
      }
    } else {
      throw createCoreError(CoreErrorCodes.NOT_SUPPORT_LOCALE_TYPE);
    }
  }
}
function fallbackWithSimple(ctx, fallback, start) {
  return [.../* @__PURE__ */ new Set([
    start,
    ...isArray(fallback) ? fallback : isObject$1(fallback) ? Object.keys(fallback) : isString(fallback) ? [fallback] : [start]
  ])];
}
function fallbackWithLocaleChain(ctx, fallback, start) {
  const startLocale = isString(start) ? start : DEFAULT_LOCALE;
  const context = ctx;
  if (!context.__localeChainCache) {
    context.__localeChainCache = /* @__PURE__ */ new Map();
  }
  let chain = context.__localeChainCache.get(startLocale);
  if (!chain) {
    chain = [];
    let block = [start];
    while (isArray(block)) {
      block = appendBlockToChain(chain, block, fallback);
    }
    const defaults = isArray(fallback) || !isPlainObject(fallback) ? fallback : fallback["default"] ? fallback["default"] : null;
    block = isString(defaults) ? [defaults] : defaults;
    if (isArray(block)) {
      appendBlockToChain(chain, block, false);
    }
    context.__localeChainCache.set(startLocale, chain);
  }
  return chain;
}
function appendBlockToChain(chain, block, blocks) {
  let follow = true;
  for (let i = 0; i < block.length && isBoolean(follow); i++) {
    const locale = block[i];
    if (isString(locale)) {
      follow = appendLocaleToChain(chain, block[i], blocks);
    }
  }
  return follow;
}
function appendLocaleToChain(chain, locale, blocks) {
  let follow;
  const tokens = locale.split("-");
  do {
    const target = tokens.join("-");
    follow = appendItemToChain(chain, target, blocks);
    tokens.splice(-1, 1);
  } while (tokens.length && follow === true);
  return follow;
}
function appendItemToChain(chain, target, blocks) {
  let follow = false;
  if (!chain.includes(target)) {
    follow = true;
    if (target) {
      follow = target[target.length - 1] !== "!";
      const locale = target.replace(/!/g, "");
      chain.push(locale);
      if ((isArray(blocks) || isPlainObject(blocks)) && blocks[locale]) {
        follow = blocks[locale];
      }
    }
  }
  return follow;
}
const pathStateMachine = [];
pathStateMachine[
  0
  /* States.BEFORE_PATH */
] = {
  [
    "w"
    /* PathCharTypes.WORKSPACE */
  ]: [
    0
    /* States.BEFORE_PATH */
  ],
  [
    "i"
    /* PathCharTypes.IDENT */
  ]: [
    3,
    0
    /* Actions.APPEND */
  ],
  [
    "["
    /* PathCharTypes.LEFT_BRACKET */
  ]: [
    4
    /* States.IN_SUB_PATH */
  ],
  [
    "o"
    /* PathCharTypes.END_OF_FAIL */
  ]: [
    7
    /* States.AFTER_PATH */
  ]
};
pathStateMachine[
  1
  /* States.IN_PATH */
] = {
  [
    "w"
    /* PathCharTypes.WORKSPACE */
  ]: [
    1
    /* States.IN_PATH */
  ],
  [
    "."
    /* PathCharTypes.DOT */
  ]: [
    2
    /* States.BEFORE_IDENT */
  ],
  [
    "["
    /* PathCharTypes.LEFT_BRACKET */
  ]: [
    4
    /* States.IN_SUB_PATH */
  ],
  [
    "o"
    /* PathCharTypes.END_OF_FAIL */
  ]: [
    7
    /* States.AFTER_PATH */
  ]
};
pathStateMachine[
  2
  /* States.BEFORE_IDENT */
] = {
  [
    "w"
    /* PathCharTypes.WORKSPACE */
  ]: [
    2
    /* States.BEFORE_IDENT */
  ],
  [
    "i"
    /* PathCharTypes.IDENT */
  ]: [
    3,
    0
    /* Actions.APPEND */
  ],
  [
    "0"
    /* PathCharTypes.ZERO */
  ]: [
    3,
    0
    /* Actions.APPEND */
  ]
};
pathStateMachine[
  3
  /* States.IN_IDENT */
] = {
  [
    "i"
    /* PathCharTypes.IDENT */
  ]: [
    3,
    0
    /* Actions.APPEND */
  ],
  [
    "0"
    /* PathCharTypes.ZERO */
  ]: [
    3,
    0
    /* Actions.APPEND */
  ],
  [
    "w"
    /* PathCharTypes.WORKSPACE */
  ]: [
    1,
    1
    /* Actions.PUSH */
  ],
  [
    "."
    /* PathCharTypes.DOT */
  ]: [
    2,
    1
    /* Actions.PUSH */
  ],
  [
    "["
    /* PathCharTypes.LEFT_BRACKET */
  ]: [
    4,
    1
    /* Actions.PUSH */
  ],
  [
    "o"
    /* PathCharTypes.END_OF_FAIL */
  ]: [
    7,
    1
    /* Actions.PUSH */
  ]
};
pathStateMachine[
  4
  /* States.IN_SUB_PATH */
] = {
  [
    "'"
    /* PathCharTypes.SINGLE_QUOTE */
  ]: [
    5,
    0
    /* Actions.APPEND */
  ],
  [
    '"'
    /* PathCharTypes.DOUBLE_QUOTE */
  ]: [
    6,
    0
    /* Actions.APPEND */
  ],
  [
    "["
    /* PathCharTypes.LEFT_BRACKET */
  ]: [
    4,
    2
    /* Actions.INC_SUB_PATH_DEPTH */
  ],
  [
    "]"
    /* PathCharTypes.RIGHT_BRACKET */
  ]: [
    1,
    3
    /* Actions.PUSH_SUB_PATH */
  ],
  [
    "o"
    /* PathCharTypes.END_OF_FAIL */
  ]: 8,
  [
    "l"
    /* PathCharTypes.ELSE */
  ]: [
    4,
    0
    /* Actions.APPEND */
  ]
};
pathStateMachine[
  5
  /* States.IN_SINGLE_QUOTE */
] = {
  [
    "'"
    /* PathCharTypes.SINGLE_QUOTE */
  ]: [
    4,
    0
    /* Actions.APPEND */
  ],
  [
    "o"
    /* PathCharTypes.END_OF_FAIL */
  ]: 8,
  [
    "l"
    /* PathCharTypes.ELSE */
  ]: [
    5,
    0
    /* Actions.APPEND */
  ]
};
pathStateMachine[
  6
  /* States.IN_DOUBLE_QUOTE */
] = {
  [
    '"'
    /* PathCharTypes.DOUBLE_QUOTE */
  ]: [
    4,
    0
    /* Actions.APPEND */
  ],
  [
    "o"
    /* PathCharTypes.END_OF_FAIL */
  ]: 8,
  [
    "l"
    /* PathCharTypes.ELSE */
  ]: [
    6,
    0
    /* Actions.APPEND */
  ]
};
const literalValueRE = /^\s?(?:true|false|-?[\d.]+|'[^']*'|"[^"]*")\s?$/;
function isLiteral(exp) {
  return literalValueRE.test(exp);
}
function stripQuotes(str) {
  const a = str.charCodeAt(0);
  const b = str.charCodeAt(str.length - 1);
  return a === b && (a === 34 || a === 39) ? str.slice(1, -1) : str;
}
function getPathCharType(ch) {
  if (ch === void 0 || ch === null) {
    return "o";
  }
  const code = ch.charCodeAt(0);
  switch (code) {
    case 91:
    // [
    case 93:
    // ]
    case 46:
    // .
    case 34:
    // "
    case 39:
      return ch;
    case 95:
    // _
    case 36:
    // $
    case 45:
      return "i";
    case 9:
    // Tab (HT)
    case 10:
    // Newline (LF)
    case 13:
    // Return (CR)
    case 160:
    // No-break space (NBSP)
    case 65279:
    // Byte Order Mark (BOM)
    case 8232:
    // Line Separator (LS)
    case 8233:
      return "w";
  }
  return "i";
}
function formatSubPath(path) {
  const trimmed = path.trim();
  if (path.charAt(0) === "0" && isNaN(parseInt(path))) {
    return false;
  }
  return isLiteral(trimmed) ? stripQuotes(trimmed) : "*" + trimmed;
}
function parse(path) {
  const keys = [];
  let index = -1;
  let mode = 0;
  let subPathDepth = 0;
  let c;
  let key;
  let newChar;
  let type;
  let transition;
  let action;
  let typeMap;
  const actions = [];
  actions[
    0
    /* Actions.APPEND */
  ] = () => {
    if (key === void 0) {
      key = newChar;
    } else {
      key += newChar;
    }
  };
  actions[
    1
    /* Actions.PUSH */
  ] = () => {
    if (key !== void 0) {
      keys.push(key);
      key = void 0;
    }
  };
  actions[
    2
    /* Actions.INC_SUB_PATH_DEPTH */
  ] = () => {
    actions[
      0
      /* Actions.APPEND */
    ]();
    subPathDepth++;
  };
  actions[
    3
    /* Actions.PUSH_SUB_PATH */
  ] = () => {
    if (subPathDepth > 0) {
      subPathDepth--;
      mode = 4;
      actions[
        0
        /* Actions.APPEND */
      ]();
    } else {
      subPathDepth = 0;
      if (key === void 0) {
        return false;
      }
      key = formatSubPath(key);
      if (key === false) {
        return false;
      } else {
        actions[
          1
          /* Actions.PUSH */
        ]();
      }
    }
  };
  function maybeUnescapeQuote() {
    const nextChar = path[index + 1];
    if (mode === 5 && nextChar === "'" || mode === 6 && nextChar === '"') {
      index++;
      newChar = "\\" + nextChar;
      actions[
        0
        /* Actions.APPEND */
      ]();
      return true;
    }
  }
  while (mode !== null) {
    index++;
    c = path[index];
    if (c === "\\" && maybeUnescapeQuote()) {
      continue;
    }
    type = getPathCharType(c);
    typeMap = pathStateMachine[mode];
    transition = typeMap[type] || typeMap[
      "l"
      /* PathCharTypes.ELSE */
    ] || 8;
    if (transition === 8) {
      return;
    }
    mode = transition[0];
    if (transition[1] !== void 0) {
      action = actions[transition[1]];
      if (action) {
        newChar = c;
        if (action() === false) {
          return;
        }
      }
    }
    if (mode === 7) {
      return keys;
    }
  }
}
const cache$1 = /* @__PURE__ */ new Map();
function resolveWithKeyValue(obj, path) {
  return isObject$1(obj) ? obj[path] : null;
}
function resolveValue(obj, path) {
  if (!isObject$1(obj)) {
    return null;
  }
  let hit = cache$1.get(path);
  if (!hit) {
    hit = parse(path);
    if (hit) {
      cache$1.set(path, hit);
    }
  }
  if (!hit) {
    return null;
  }
  const len = hit.length;
  let last = obj;
  let i = 0;
  while (i < len) {
    const val = last[hit[i]];
    if (val === void 0) {
      return null;
    }
    if (isFunction(last)) {
      return null;
    }
    last = val;
    i++;
  }
  return last;
}
const VERSION$1 = "10.0.6";
const NOT_REOSLVED = -1;
const DEFAULT_LOCALE = "en-US";
const MISSING_RESOLVE_VALUE = "";
const capitalize = (str) => `${str.charAt(0).toLocaleUpperCase()}${str.substr(1)}`;
function getDefaultLinkedModifiers() {
  return {
    upper: (val, type) => {
      return type === "text" && isString(val) ? val.toUpperCase() : type === "vnode" && isObject$1(val) && "__v_isVNode" in val ? val.children.toUpperCase() : val;
    },
    lower: (val, type) => {
      return type === "text" && isString(val) ? val.toLowerCase() : type === "vnode" && isObject$1(val) && "__v_isVNode" in val ? val.children.toLowerCase() : val;
    },
    capitalize: (val, type) => {
      return type === "text" && isString(val) ? capitalize(val) : type === "vnode" && isObject$1(val) && "__v_isVNode" in val ? capitalize(val.children) : val;
    }
  };
}
let _compiler;
function registerMessageCompiler(compiler) {
  _compiler = compiler;
}
let _resolver;
function registerMessageResolver(resolver) {
  _resolver = resolver;
}
let _fallbacker;
function registerLocaleFallbacker(fallbacker) {
  _fallbacker = fallbacker;
}
const setAdditionalMeta = /* @__NO_SIDE_EFFECTS__ */ (meta) => {
};
let _fallbackContext = null;
const setFallbackContext = (context) => {
  _fallbackContext = context;
};
const getFallbackContext = () => _fallbackContext;
let _cid = 0;
function createCoreContext(options = {}) {
  const onWarn = isFunction(options.onWarn) ? options.onWarn : warn;
  const version = isString(options.version) ? options.version : VERSION$1;
  const locale = isString(options.locale) || isFunction(options.locale) ? options.locale : DEFAULT_LOCALE;
  const _locale = isFunction(locale) ? DEFAULT_LOCALE : locale;
  const fallbackLocale = isArray(options.fallbackLocale) || isPlainObject(options.fallbackLocale) || isString(options.fallbackLocale) || options.fallbackLocale === false ? options.fallbackLocale : _locale;
  const messages = isPlainObject(options.messages) ? options.messages : createResources(_locale);
  const datetimeFormats = isPlainObject(options.datetimeFormats) ? options.datetimeFormats : createResources(_locale);
  const numberFormats = isPlainObject(options.numberFormats) ? options.numberFormats : createResources(_locale);
  const modifiers = assign(create(), options.modifiers, getDefaultLinkedModifiers());
  const pluralRules = options.pluralRules || create();
  const missing = isFunction(options.missing) ? options.missing : null;
  const missingWarn = isBoolean(options.missingWarn) || isRegExp(options.missingWarn) ? options.missingWarn : true;
  const fallbackWarn = isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn) ? options.fallbackWarn : true;
  const fallbackFormat = !!options.fallbackFormat;
  const unresolving = !!options.unresolving;
  const postTranslation = isFunction(options.postTranslation) ? options.postTranslation : null;
  const processor = isPlainObject(options.processor) ? options.processor : null;
  const warnHtmlMessage = isBoolean(options.warnHtmlMessage) ? options.warnHtmlMessage : true;
  const escapeParameter = !!options.escapeParameter;
  const messageCompiler = isFunction(options.messageCompiler) ? options.messageCompiler : _compiler;
  const messageResolver = isFunction(options.messageResolver) ? options.messageResolver : _resolver || resolveWithKeyValue;
  const localeFallbacker = isFunction(options.localeFallbacker) ? options.localeFallbacker : _fallbacker || fallbackWithSimple;
  const fallbackContext = isObject$1(options.fallbackContext) ? options.fallbackContext : void 0;
  const internalOptions = options;
  const __datetimeFormatters = isObject$1(internalOptions.__datetimeFormatters) ? internalOptions.__datetimeFormatters : /* @__PURE__ */ new Map();
  const __numberFormatters = isObject$1(internalOptions.__numberFormatters) ? internalOptions.__numberFormatters : /* @__PURE__ */ new Map();
  const __meta = isObject$1(internalOptions.__meta) ? internalOptions.__meta : {};
  _cid++;
  const context = {
    version,
    cid: _cid,
    locale,
    fallbackLocale,
    messages,
    modifiers,
    pluralRules,
    missing,
    missingWarn,
    fallbackWarn,
    fallbackFormat,
    unresolving,
    postTranslation,
    processor,
    warnHtmlMessage,
    escapeParameter,
    messageCompiler,
    messageResolver,
    localeFallbacker,
    fallbackContext,
    onWarn,
    __meta
  };
  {
    context.datetimeFormats = datetimeFormats;
    context.numberFormats = numberFormats;
    context.__datetimeFormatters = __datetimeFormatters;
    context.__numberFormatters = __numberFormatters;
  }
  return context;
}
const createResources = (locale) => ({ [locale]: create() });
function handleMissing(context, key, locale, missingWarn, type) {
  const { missing, onWarn } = context;
  if (missing !== null) {
    const ret = missing(context, locale, key, type);
    return isString(ret) ? ret : key;
  } else {
    return key;
  }
}
function updateFallbackLocale(ctx, locale, fallback) {
  const context = ctx;
  context.__localeChainCache = /* @__PURE__ */ new Map();
  ctx.localeFallbacker(ctx, fallback, locale);
}
function isAlmostSameLocale(locale, compareLocale) {
  if (locale === compareLocale)
    return false;
  return locale.split("-")[0] === compareLocale.split("-")[0];
}
function isImplicitFallback(targetLocale, locales) {
  const index = locales.indexOf(targetLocale);
  if (index === -1) {
    return false;
  }
  for (let i = index + 1; i < locales.length; i++) {
    if (isAlmostSameLocale(targetLocale, locales[i])) {
      return true;
    }
  }
  return false;
}
function datetime(context, ...args) {
  const { datetimeFormats, unresolving, fallbackLocale, onWarn, localeFallbacker } = context;
  const { __datetimeFormatters } = context;
  const [key, value, options, overrides] = parseDateTimeArgs(...args);
  const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
  isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
  const part = !!options.part;
  const locale = getLocale(context, options);
  const locales = localeFallbacker(
    context,
    // eslint-disable-line @typescript-eslint/no-explicit-any
    fallbackLocale,
    locale
  );
  if (!isString(key) || key === "") {
    return new Intl.DateTimeFormat(locale, overrides).format(value);
  }
  let datetimeFormat = {};
  let targetLocale;
  let format2 = null;
  const type = "datetime format";
  for (let i = 0; i < locales.length; i++) {
    targetLocale = locales[i];
    datetimeFormat = datetimeFormats[targetLocale] || {};
    format2 = datetimeFormat[key];
    if (isPlainObject(format2))
      break;
    handleMissing(context, key, targetLocale, missingWarn, type);
  }
  if (!isPlainObject(format2) || !isString(targetLocale)) {
    return unresolving ? NOT_REOSLVED : key;
  }
  let id = `${targetLocale}__${key}`;
  if (!isEmptyObject(overrides)) {
    id = `${id}__${JSON.stringify(overrides)}`;
  }
  let formatter = __datetimeFormatters.get(id);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(targetLocale, assign({}, format2, overrides));
    __datetimeFormatters.set(id, formatter);
  }
  return !part ? formatter.format(value) : formatter.formatToParts(value);
}
const DATETIME_FORMAT_OPTIONS_KEYS = [
  "localeMatcher",
  "weekday",
  "era",
  "year",
  "month",
  "day",
  "hour",
  "minute",
  "second",
  "timeZoneName",
  "formatMatcher",
  "hour12",
  "timeZone",
  "dateStyle",
  "timeStyle",
  "calendar",
  "dayPeriod",
  "numberingSystem",
  "hourCycle",
  "fractionalSecondDigits"
];
function parseDateTimeArgs(...args) {
  const [arg1, arg2, arg3, arg4] = args;
  const options = create();
  let overrides = create();
  let value;
  if (isString(arg1)) {
    const matches = arg1.match(/(\d{4}-\d{2}-\d{2})(T|\s)?(.*)/);
    if (!matches) {
      throw createCoreError(CoreErrorCodes.INVALID_ISO_DATE_ARGUMENT);
    }
    const dateTime = matches[3] ? matches[3].trim().startsWith("T") ? `${matches[1].trim()}${matches[3].trim()}` : `${matches[1].trim()}T${matches[3].trim()}` : matches[1].trim();
    value = new Date(dateTime);
    try {
      value.toISOString();
    } catch {
      throw createCoreError(CoreErrorCodes.INVALID_ISO_DATE_ARGUMENT);
    }
  } else if (isDate(arg1)) {
    if (isNaN(arg1.getTime())) {
      throw createCoreError(CoreErrorCodes.INVALID_DATE_ARGUMENT);
    }
    value = arg1;
  } else if (isNumber(arg1)) {
    value = arg1;
  } else {
    throw createCoreError(CoreErrorCodes.INVALID_ARGUMENT);
  }
  if (isString(arg2)) {
    options.key = arg2;
  } else if (isPlainObject(arg2)) {
    Object.keys(arg2).forEach((key) => {
      if (DATETIME_FORMAT_OPTIONS_KEYS.includes(key)) {
        overrides[key] = arg2[key];
      } else {
        options[key] = arg2[key];
      }
    });
  }
  if (isString(arg3)) {
    options.locale = arg3;
  } else if (isPlainObject(arg3)) {
    overrides = arg3;
  }
  if (isPlainObject(arg4)) {
    overrides = arg4;
  }
  return [options.key || "", value, options, overrides];
}
function clearDateTimeFormat(ctx, locale, format2) {
  const context = ctx;
  for (const key in format2) {
    const id = `${locale}__${key}`;
    if (!context.__datetimeFormatters.has(id)) {
      continue;
    }
    context.__datetimeFormatters.delete(id);
  }
}
function number(context, ...args) {
  const { numberFormats, unresolving, fallbackLocale, onWarn, localeFallbacker } = context;
  const { __numberFormatters } = context;
  const [key, value, options, overrides] = parseNumberArgs(...args);
  const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
  isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
  const part = !!options.part;
  const locale = getLocale(context, options);
  const locales = localeFallbacker(
    context,
    // eslint-disable-line @typescript-eslint/no-explicit-any
    fallbackLocale,
    locale
  );
  if (!isString(key) || key === "") {
    return new Intl.NumberFormat(locale, overrides).format(value);
  }
  let numberFormat = {};
  let targetLocale;
  let format2 = null;
  const type = "number format";
  for (let i = 0; i < locales.length; i++) {
    targetLocale = locales[i];
    numberFormat = numberFormats[targetLocale] || {};
    format2 = numberFormat[key];
    if (isPlainObject(format2))
      break;
    handleMissing(context, key, targetLocale, missingWarn, type);
  }
  if (!isPlainObject(format2) || !isString(targetLocale)) {
    return unresolving ? NOT_REOSLVED : key;
  }
  let id = `${targetLocale}__${key}`;
  if (!isEmptyObject(overrides)) {
    id = `${id}__${JSON.stringify(overrides)}`;
  }
  let formatter = __numberFormatters.get(id);
  if (!formatter) {
    formatter = new Intl.NumberFormat(targetLocale, assign({}, format2, overrides));
    __numberFormatters.set(id, formatter);
  }
  return !part ? formatter.format(value) : formatter.formatToParts(value);
}
const NUMBER_FORMAT_OPTIONS_KEYS = [
  "localeMatcher",
  "style",
  "currency",
  "currencyDisplay",
  "currencySign",
  "useGrouping",
  "minimumIntegerDigits",
  "minimumFractionDigits",
  "maximumFractionDigits",
  "minimumSignificantDigits",
  "maximumSignificantDigits",
  "compactDisplay",
  "notation",
  "signDisplay",
  "unit",
  "unitDisplay",
  "roundingMode",
  "roundingPriority",
  "roundingIncrement",
  "trailingZeroDisplay"
];
function parseNumberArgs(...args) {
  const [arg1, arg2, arg3, arg4] = args;
  const options = create();
  let overrides = create();
  if (!isNumber(arg1)) {
    throw createCoreError(CoreErrorCodes.INVALID_ARGUMENT);
  }
  const value = arg1;
  if (isString(arg2)) {
    options.key = arg2;
  } else if (isPlainObject(arg2)) {
    Object.keys(arg2).forEach((key) => {
      if (NUMBER_FORMAT_OPTIONS_KEYS.includes(key)) {
        overrides[key] = arg2[key];
      } else {
        options[key] = arg2[key];
      }
    });
  }
  if (isString(arg3)) {
    options.locale = arg3;
  } else if (isPlainObject(arg3)) {
    overrides = arg3;
  }
  if (isPlainObject(arg4)) {
    overrides = arg4;
  }
  return [options.key || "", value, options, overrides];
}
function clearNumberFormat(ctx, locale, format2) {
  const context = ctx;
  for (const key in format2) {
    const id = `${locale}__${key}`;
    if (!context.__numberFormatters.has(id)) {
      continue;
    }
    context.__numberFormatters.delete(id);
  }
}
const DEFAULT_MODIFIER = (str) => str;
const DEFAULT_MESSAGE = (ctx) => "";
const DEFAULT_MESSAGE_DATA_TYPE = "text";
const DEFAULT_NORMALIZE = (values) => values.length === 0 ? "" : join(values);
const DEFAULT_INTERPOLATE = toDisplayString;
function pluralDefault(choice, choicesLength) {
  choice = Math.abs(choice);
  if (choicesLength === 2) {
    return choice ? choice > 1 ? 1 : 0 : 1;
  }
  return choice ? Math.min(choice, 2) : 0;
}
function getPluralIndex(options) {
  const index = isNumber(options.pluralIndex) ? options.pluralIndex : -1;
  return options.named && (isNumber(options.named.count) || isNumber(options.named.n)) ? isNumber(options.named.count) ? options.named.count : isNumber(options.named.n) ? options.named.n : index : index;
}
function normalizeNamed(pluralIndex, props) {
  if (!props.count) {
    props.count = pluralIndex;
  }
  if (!props.n) {
    props.n = pluralIndex;
  }
}
function createMessageContext(options = {}) {
  const locale = options.locale;
  const pluralIndex = getPluralIndex(options);
  const pluralRule = isObject$1(options.pluralRules) && isString(locale) && isFunction(options.pluralRules[locale]) ? options.pluralRules[locale] : pluralDefault;
  const orgPluralRule = isObject$1(options.pluralRules) && isString(locale) && isFunction(options.pluralRules[locale]) ? pluralDefault : void 0;
  const plural = (messages) => {
    return messages[pluralRule(pluralIndex, messages.length, orgPluralRule)];
  };
  const _list = options.list || [];
  const list = (index) => _list[index];
  const _named = options.named || create();
  isNumber(options.pluralIndex) && normalizeNamed(pluralIndex, _named);
  const named = (key) => _named[key];
  function message(key, useLinked) {
    const msg = isFunction(options.messages) ? options.messages(key, !!useLinked) : isObject$1(options.messages) ? options.messages[key] : false;
    return !msg ? options.parent ? options.parent.message(key) : DEFAULT_MESSAGE : msg;
  }
  const _modifier = (name) => options.modifiers ? options.modifiers[name] : DEFAULT_MODIFIER;
  const normalize = isPlainObject(options.processor) && isFunction(options.processor.normalize) ? options.processor.normalize : DEFAULT_NORMALIZE;
  const interpolate = isPlainObject(options.processor) && isFunction(options.processor.interpolate) ? options.processor.interpolate : DEFAULT_INTERPOLATE;
  const type = isPlainObject(options.processor) && isString(options.processor.type) ? options.processor.type : DEFAULT_MESSAGE_DATA_TYPE;
  const linked = (key, ...args) => {
    const [arg1, arg2] = args;
    let type2 = "text";
    let modifier = "";
    if (args.length === 1) {
      if (isObject$1(arg1)) {
        modifier = arg1.modifier || modifier;
        type2 = arg1.type || type2;
      } else if (isString(arg1)) {
        modifier = arg1 || modifier;
      }
    } else if (args.length === 2) {
      if (isString(arg1)) {
        modifier = arg1 || modifier;
      }
      if (isString(arg2)) {
        type2 = arg2 || type2;
      }
    }
    const ret = message(key, true)(ctx);
    const msg = (
      // The message in vnode resolved with linked are returned as an array by processor.nomalize
      type2 === "vnode" && isArray(ret) && modifier ? ret[0] : ret
    );
    return modifier ? _modifier(modifier)(msg, type2) : msg;
  };
  const ctx = {
    [
      "list"
      /* HelperNameMap.LIST */
    ]: list,
    [
      "named"
      /* HelperNameMap.NAMED */
    ]: named,
    [
      "plural"
      /* HelperNameMap.PLURAL */
    ]: plural,
    [
      "linked"
      /* HelperNameMap.LINKED */
    ]: linked,
    [
      "message"
      /* HelperNameMap.MESSAGE */
    ]: message,
    [
      "type"
      /* HelperNameMap.TYPE */
    ]: type,
    [
      "interpolate"
      /* HelperNameMap.INTERPOLATE */
    ]: interpolate,
    [
      "normalize"
      /* HelperNameMap.NORMALIZE */
    ]: normalize,
    [
      "values"
      /* HelperNameMap.VALUES */
    ]: assign(create(), _list, _named)
  };
  return ctx;
}
const NOOP_MESSAGE_FUNCTION = () => "";
const isMessageFunction = (val) => isFunction(val);
function translate(context, ...args) {
  const { fallbackFormat, postTranslation, unresolving, messageCompiler, fallbackLocale, messages } = context;
  const [key, options] = parseTranslateArgs(...args);
  const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
  const fallbackWarn = isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
  const escapeParameter = isBoolean(options.escapeParameter) ? options.escapeParameter : context.escapeParameter;
  const resolvedMessage = !!options.resolvedMessage;
  const defaultMsgOrKey = isString(options.default) || isBoolean(options.default) ? !isBoolean(options.default) ? options.default : !messageCompiler ? () => key : key : fallbackFormat ? !messageCompiler ? () => key : key : null;
  const enableDefaultMsg = fallbackFormat || defaultMsgOrKey != null && (isString(defaultMsgOrKey) || isFunction(defaultMsgOrKey));
  const locale = getLocale(context, options);
  escapeParameter && escapeParams(options);
  let [formatScope, targetLocale, message] = !resolvedMessage ? resolveMessageFormat(context, key, locale, fallbackLocale, fallbackWarn, missingWarn) : [
    key,
    locale,
    messages[locale] || create()
  ];
  let format2 = formatScope;
  let cacheBaseKey = key;
  if (!resolvedMessage && !(isString(format2) || isMessageAST(format2) || isMessageFunction(format2))) {
    if (enableDefaultMsg) {
      format2 = defaultMsgOrKey;
      cacheBaseKey = format2;
    }
  }
  if (!resolvedMessage && (!(isString(format2) || isMessageAST(format2) || isMessageFunction(format2)) || !isString(targetLocale))) {
    return unresolving ? NOT_REOSLVED : key;
  }
  let occurred = false;
  const onError = () => {
    occurred = true;
  };
  const msg = !isMessageFunction(format2) ? compileMessageFormat(context, key, targetLocale, format2, cacheBaseKey, onError) : format2;
  if (occurred) {
    return format2;
  }
  const ctxOptions = getMessageContextOptions(context, targetLocale, message, options);
  const msgContext = createMessageContext(ctxOptions);
  const messaged = evaluateMessage(context, msg, msgContext);
  const ret = postTranslation ? postTranslation(messaged, key) : messaged;
  return ret;
}
function escapeParams(options) {
  if (isArray(options.list)) {
    options.list = options.list.map((item) => isString(item) ? escapeHtml(item) : item);
  } else if (isObject$1(options.named)) {
    Object.keys(options.named).forEach((key) => {
      if (isString(options.named[key])) {
        options.named[key] = escapeHtml(options.named[key]);
      }
    });
  }
}
function resolveMessageFormat(context, key, locale, fallbackLocale, fallbackWarn, missingWarn) {
  const { messages, onWarn, messageResolver: resolveValue2, localeFallbacker } = context;
  const locales = localeFallbacker(context, fallbackLocale, locale);
  let message = create();
  let targetLocale;
  let format2 = null;
  const type = "translate";
  for (let i = 0; i < locales.length; i++) {
    targetLocale = locales[i];
    message = messages[targetLocale] || create();
    if ((format2 = resolveValue2(message, key)) === null) {
      format2 = message[key];
    }
    if (isString(format2) || isMessageAST(format2) || isMessageFunction(format2)) {
      break;
    }
    if (!isImplicitFallback(targetLocale, locales)) {
      const missingRet = handleMissing(
        context,
        // eslint-disable-line @typescript-eslint/no-explicit-any
        key,
        targetLocale,
        missingWarn,
        type
      );
      if (missingRet !== key) {
        format2 = missingRet;
      }
    }
  }
  return [format2, targetLocale, message];
}
function compileMessageFormat(context, key, targetLocale, format2, cacheBaseKey, onError) {
  const { messageCompiler, warnHtmlMessage } = context;
  if (isMessageFunction(format2)) {
    const msg2 = format2;
    msg2.locale = msg2.locale || targetLocale;
    msg2.key = msg2.key || key;
    return msg2;
  }
  if (messageCompiler == null) {
    const msg2 = () => format2;
    msg2.locale = targetLocale;
    msg2.key = key;
    return msg2;
  }
  const msg = messageCompiler(format2, getCompileContext(context, targetLocale, cacheBaseKey, format2, warnHtmlMessage, onError));
  msg.locale = targetLocale;
  msg.key = key;
  msg.source = format2;
  return msg;
}
function evaluateMessage(context, msg, msgCtx) {
  const messaged = msg(msgCtx);
  return messaged;
}
function parseTranslateArgs(...args) {
  const [arg1, arg2, arg3] = args;
  const options = create();
  if (!isString(arg1) && !isNumber(arg1) && !isMessageFunction(arg1) && !isMessageAST(arg1)) {
    throw createCoreError(CoreErrorCodes.INVALID_ARGUMENT);
  }
  const key = isNumber(arg1) ? String(arg1) : isMessageFunction(arg1) ? arg1 : arg1;
  if (isNumber(arg2)) {
    options.plural = arg2;
  } else if (isString(arg2)) {
    options.default = arg2;
  } else if (isPlainObject(arg2) && !isEmptyObject(arg2)) {
    options.named = arg2;
  } else if (isArray(arg2)) {
    options.list = arg2;
  }
  if (isNumber(arg3)) {
    options.plural = arg3;
  } else if (isString(arg3)) {
    options.default = arg3;
  } else if (isPlainObject(arg3)) {
    assign(options, arg3);
  }
  return [key, options];
}
function getCompileContext(context, locale, key, source, warnHtmlMessage, onError) {
  return {
    locale,
    key,
    warnHtmlMessage,
    onError: (err) => {
      onError && onError(err);
      {
        throw err;
      }
    },
    onCacheKey: (source2) => generateFormatCacheKey(locale, key, source2)
  };
}
function getMessageContextOptions(context, locale, message, options) {
  const { modifiers, pluralRules, messageResolver: resolveValue2, fallbackLocale, fallbackWarn, missingWarn, fallbackContext } = context;
  const resolveMessage = (key, useLinked) => {
    let val = resolveValue2(message, key);
    if (val == null && (fallbackContext || useLinked)) {
      const [, , message2] = resolveMessageFormat(
        fallbackContext || context,
        // NOTE: if has fallbackContext, fallback to root, else if use linked, fallback to local context
        key,
        locale,
        fallbackLocale,
        fallbackWarn,
        missingWarn
      );
      val = resolveValue2(message2, key);
    }
    if (isString(val) || isMessageAST(val)) {
      let occurred = false;
      const onError = () => {
        occurred = true;
      };
      const msg = compileMessageFormat(context, key, locale, val, key, onError);
      return !occurred ? msg : NOOP_MESSAGE_FUNCTION;
    } else if (isMessageFunction(val)) {
      return val;
    } else {
      return NOOP_MESSAGE_FUNCTION;
    }
  };
  const ctxOptions = {
    locale,
    modifiers,
    pluralRules,
    messages: resolveMessage
  };
  if (context.processor) {
    ctxOptions.processor = context.processor;
  }
  if (options.list) {
    ctxOptions.list = options.list;
  }
  if (options.named) {
    ctxOptions.named = options.named;
  }
  if (isNumber(options.plural)) {
    ctxOptions.pluralIndex = options.plural;
  }
  return ctxOptions;
}

/*!
  * vue-i18n v10.0.6
  * (c) 2025 kazuya kawaguchi
  * Released under the MIT License.
  */
const VERSION = "10.0.6";
const I18nErrorCodes = {
  // composer module errors
  UNEXPECTED_RETURN_TYPE: CORE_ERROR_CODES_EXTEND_POINT,
  // 24
  // legacy module errors
  INVALID_ARGUMENT: 25,
  // i18n module errors
  MUST_BE_CALL_SETUP_TOP: 26,
  NOT_INSTALLED: 27,
  // directive module errors
  REQUIRED_VALUE: 28,
  INVALID_VALUE: 29,
  NOT_INSTALLED_WITH_PROVIDE: 31,
  // unexpected error
  UNEXPECTED_ERROR: 32};
function createI18nError(code, ...args) {
  return createCompileError(code, null, void 0);
}
const TranslateVNodeSymbol = /* @__PURE__ */ makeSymbol("__translateVNode");
const DatetimePartsSymbol = /* @__PURE__ */ makeSymbol("__datetimeParts");
const NumberPartsSymbol = /* @__PURE__ */ makeSymbol("__numberParts");
const SetPluralRulesSymbol = makeSymbol("__setPluralRules");
const InejctWithOptionSymbol = /* @__PURE__ */ makeSymbol("__injectWithOption");
const DisposeSymbol = /* @__PURE__ */ makeSymbol("__dispose");
function handleFlatJson(obj) {
  if (!isObject$1(obj)) {
    return obj;
  }
  for (const key in obj) {
    if (!hasOwn(obj, key)) {
      continue;
    }
    if (!key.includes(".")) {
      if (isObject$1(obj[key])) {
        handleFlatJson(obj[key]);
      }
    } else {
      const subKeys = key.split(".");
      const lastIndex = subKeys.length - 1;
      let currentObj = obj;
      let hasStringValue = false;
      for (let i = 0; i < lastIndex; i++) {
        if (subKeys[i] === "__proto__") {
          throw new Error(`unsafe key: ${subKeys[i]}`);
        }
        if (!(subKeys[i] in currentObj)) {
          currentObj[subKeys[i]] = create();
        }
        if (!isObject$1(currentObj[subKeys[i]])) {
          hasStringValue = true;
          break;
        }
        currentObj = currentObj[subKeys[i]];
      }
      if (!hasStringValue) {
        currentObj[subKeys[lastIndex]] = obj[key];
        delete obj[key];
      }
      if (isObject$1(currentObj[subKeys[lastIndex]])) {
        handleFlatJson(currentObj[subKeys[lastIndex]]);
      }
    }
  }
  return obj;
}
function getLocaleMessages(locale, options) {
  const { messages, __i18n, messageResolver, flatJson } = options;
  const ret = isPlainObject(messages) ? messages : isArray(__i18n) ? create() : { [locale]: create() };
  if (isArray(__i18n)) {
    __i18n.forEach((custom) => {
      if ("locale" in custom && "resource" in custom) {
        const { locale: locale2, resource } = custom;
        if (locale2) {
          ret[locale2] = ret[locale2] || create();
          deepCopy(resource, ret[locale2]);
        } else {
          deepCopy(resource, ret);
        }
      } else {
        isString(custom) && deepCopy(JSON.parse(custom), ret);
      }
    });
  }
  if (messageResolver == null && flatJson) {
    for (const key in ret) {
      if (hasOwn(ret, key)) {
        handleFlatJson(ret[key]);
      }
    }
  }
  return ret;
}
function getComponentOptions(instance) {
  return instance.type;
}
function adjustI18nResources(gl, options, componentOptions) {
  let messages = isObject$1(options.messages) ? options.messages : create();
  if ("__i18nGlobal" in componentOptions) {
    messages = getLocaleMessages(gl.locale.value, {
      messages,
      __i18n: componentOptions.__i18nGlobal
    });
  }
  const locales = Object.keys(messages);
  if (locales.length) {
    locales.forEach((locale) => {
      gl.mergeLocaleMessage(locale, messages[locale]);
    });
  }
  {
    if (isObject$1(options.datetimeFormats)) {
      const locales2 = Object.keys(options.datetimeFormats);
      if (locales2.length) {
        locales2.forEach((locale) => {
          gl.mergeDateTimeFormat(locale, options.datetimeFormats[locale]);
        });
      }
    }
    if (isObject$1(options.numberFormats)) {
      const locales2 = Object.keys(options.numberFormats);
      if (locales2.length) {
        locales2.forEach((locale) => {
          gl.mergeNumberFormat(locale, options.numberFormats[locale]);
        });
      }
    }
  }
}
function createTextNode(key) {
  return createVNode(Text, null, key, 0);
}
const DEVTOOLS_META = "__INTLIFY_META__";
const NOOP_RETURN_ARRAY = () => [];
const NOOP_RETURN_FALSE = () => false;
let composerID = 0;
function defineCoreMissingHandler(missing) {
  return (ctx, locale, key, type) => {
    return missing(locale, key, getCurrentInstance() || void 0, type);
  };
}
const getMetaInfo = /* @__NO_SIDE_EFFECTS__ */ () => {
  const instance = getCurrentInstance();
  let meta = null;
  return instance && (meta = getComponentOptions(instance)[DEVTOOLS_META]) ? { [DEVTOOLS_META]: meta } : null;
};
function createComposer(options = {}) {
  const { __root, __injectWithOption } = options;
  const _isGlobal = __root === void 0;
  const flatJson = options.flatJson;
  const _ref = shallowRef;
  let _inheritLocale = isBoolean(options.inheritLocale) ? options.inheritLocale : true;
  const _locale = _ref(
    // prettier-ignore
    __root && _inheritLocale ? __root.locale.value : isString(options.locale) ? options.locale : DEFAULT_LOCALE
  );
  const _fallbackLocale = _ref(
    // prettier-ignore
    __root && _inheritLocale ? __root.fallbackLocale.value : isString(options.fallbackLocale) || isArray(options.fallbackLocale) || isPlainObject(options.fallbackLocale) || options.fallbackLocale === false ? options.fallbackLocale : _locale.value
  );
  const _messages = _ref(getLocaleMessages(_locale.value, options));
  const _datetimeFormats = _ref(isPlainObject(options.datetimeFormats) ? options.datetimeFormats : { [_locale.value]: {} });
  const _numberFormats = _ref(isPlainObject(options.numberFormats) ? options.numberFormats : { [_locale.value]: {} });
  let _missingWarn = __root ? __root.missingWarn : isBoolean(options.missingWarn) || isRegExp(options.missingWarn) ? options.missingWarn : true;
  let _fallbackWarn = __root ? __root.fallbackWarn : isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn) ? options.fallbackWarn : true;
  let _fallbackRoot = __root ? __root.fallbackRoot : isBoolean(options.fallbackRoot) ? options.fallbackRoot : true;
  let _fallbackFormat = !!options.fallbackFormat;
  let _missing = isFunction(options.missing) ? options.missing : null;
  let _runtimeMissing = isFunction(options.missing) ? defineCoreMissingHandler(options.missing) : null;
  let _postTranslation = isFunction(options.postTranslation) ? options.postTranslation : null;
  let _warnHtmlMessage = __root ? __root.warnHtmlMessage : isBoolean(options.warnHtmlMessage) ? options.warnHtmlMessage : true;
  let _escapeParameter = !!options.escapeParameter;
  const _modifiers = __root ? __root.modifiers : isPlainObject(options.modifiers) ? options.modifiers : {};
  let _pluralRules = options.pluralRules || __root && __root.pluralRules;
  let _context;
  const getCoreContext = () => {
    _isGlobal && setFallbackContext(null);
    const ctxOptions = {
      version: VERSION,
      locale: _locale.value,
      fallbackLocale: _fallbackLocale.value,
      messages: _messages.value,
      modifiers: _modifiers,
      pluralRules: _pluralRules,
      missing: _runtimeMissing === null ? void 0 : _runtimeMissing,
      missingWarn: _missingWarn,
      fallbackWarn: _fallbackWarn,
      fallbackFormat: _fallbackFormat,
      unresolving: true,
      postTranslation: _postTranslation === null ? void 0 : _postTranslation,
      warnHtmlMessage: _warnHtmlMessage,
      escapeParameter: _escapeParameter,
      messageResolver: options.messageResolver,
      messageCompiler: options.messageCompiler,
      __meta: { framework: "vue" }
    };
    {
      ctxOptions.datetimeFormats = _datetimeFormats.value;
      ctxOptions.numberFormats = _numberFormats.value;
      ctxOptions.__datetimeFormatters = isPlainObject(_context) ? _context.__datetimeFormatters : void 0;
      ctxOptions.__numberFormatters = isPlainObject(_context) ? _context.__numberFormatters : void 0;
    }
    const ctx = createCoreContext(ctxOptions);
    _isGlobal && setFallbackContext(ctx);
    return ctx;
  };
  _context = getCoreContext();
  updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
  function trackReactivityValues() {
    return [
      _locale.value,
      _fallbackLocale.value,
      _messages.value,
      _datetimeFormats.value,
      _numberFormats.value
    ];
  }
  const locale = computed({
    get: () => _locale.value,
    set: (val) => {
      _locale.value = val;
      _context.locale = _locale.value;
    }
  });
  const fallbackLocale = computed({
    get: () => _fallbackLocale.value,
    set: (val) => {
      _fallbackLocale.value = val;
      _context.fallbackLocale = _fallbackLocale.value;
      updateFallbackLocale(_context, _locale.value, val);
    }
  });
  const messages = computed(() => _messages.value);
  const datetimeFormats = /* @__PURE__ */ computed(() => _datetimeFormats.value);
  const numberFormats = /* @__PURE__ */ computed(() => _numberFormats.value);
  function getPostTranslationHandler() {
    return isFunction(_postTranslation) ? _postTranslation : null;
  }
  function setPostTranslationHandler(handler) {
    _postTranslation = handler;
    _context.postTranslation = handler;
  }
  function getMissingHandler() {
    return _missing;
  }
  function setMissingHandler(handler) {
    if (handler !== null) {
      _runtimeMissing = defineCoreMissingHandler(handler);
    }
    _missing = handler;
    _context.missing = _runtimeMissing;
  }
  const wrapWithDeps = (fn, argumentParser, warnType, fallbackSuccess, fallbackFail, successCondition) => {
    trackReactivityValues();
    let ret;
    try {
      if ("production" !== "production" || false) ;
      if (!_isGlobal) {
        _context.fallbackContext = __root ? getFallbackContext() : void 0;
      }
      ret = fn(_context);
    } finally {
      if (!_isGlobal) {
        _context.fallbackContext = void 0;
      }
    }
    if (warnType !== "translate exists" && // for not `te` (e.g `t`)
    isNumber(ret) && ret === NOT_REOSLVED || warnType === "translate exists" && !ret) {
      const [key, arg2] = argumentParser();
      return __root && _fallbackRoot ? fallbackSuccess(__root) : fallbackFail(key);
    } else if (successCondition(ret)) {
      return ret;
    } else {
      throw createI18nError(I18nErrorCodes.UNEXPECTED_RETURN_TYPE);
    }
  };
  function t(...args) {
    return wrapWithDeps((context) => Reflect.apply(translate, null, [context, ...args]), () => parseTranslateArgs(...args), "translate", (root) => Reflect.apply(root.t, root, [...args]), (key) => key, (val) => isString(val));
  }
  function rt(...args) {
    const [arg1, arg2, arg3] = args;
    if (arg3 && !isObject$1(arg3)) {
      throw createI18nError(I18nErrorCodes.INVALID_ARGUMENT);
    }
    return t(...[arg1, arg2, assign({ resolvedMessage: true }, arg3 || {})]);
  }
  function d(...args) {
    return wrapWithDeps((context) => Reflect.apply(datetime, null, [context, ...args]), () => parseDateTimeArgs(...args), "datetime format", (root) => Reflect.apply(root.d, root, [...args]), () => MISSING_RESOLVE_VALUE, (val) => isString(val));
  }
  function n(...args) {
    return wrapWithDeps((context) => Reflect.apply(number, null, [context, ...args]), () => parseNumberArgs(...args), "number format", (root) => Reflect.apply(root.n, root, [...args]), () => MISSING_RESOLVE_VALUE, (val) => isString(val));
  }
  function normalize(values) {
    return values.map((val) => isString(val) || isNumber(val) || isBoolean(val) ? createTextNode(String(val)) : val);
  }
  const interpolate = (val) => val;
  const processor = {
    normalize,
    interpolate,
    type: "vnode"
  };
  function translateVNode(...args) {
    return wrapWithDeps((context) => {
      let ret;
      const _context2 = context;
      try {
        _context2.processor = processor;
        ret = Reflect.apply(translate, null, [_context2, ...args]);
      } finally {
        _context2.processor = null;
      }
      return ret;
    }, () => parseTranslateArgs(...args), "translate", (root) => root[TranslateVNodeSymbol](...args), (key) => [createTextNode(key)], (val) => isArray(val));
  }
  function numberParts(...args) {
    return wrapWithDeps((context) => Reflect.apply(number, null, [context, ...args]), () => parseNumberArgs(...args), "number format", (root) => root[NumberPartsSymbol](...args), NOOP_RETURN_ARRAY, (val) => isString(val) || isArray(val));
  }
  function datetimeParts(...args) {
    return wrapWithDeps((context) => Reflect.apply(datetime, null, [context, ...args]), () => parseDateTimeArgs(...args), "datetime format", (root) => root[DatetimePartsSymbol](...args), NOOP_RETURN_ARRAY, (val) => isString(val) || isArray(val));
  }
  function setPluralRules(rules) {
    _pluralRules = rules;
    _context.pluralRules = _pluralRules;
  }
  function te(key, locale2) {
    return wrapWithDeps(() => {
      if (!key) {
        return false;
      }
      const targetLocale = isString(locale2) ? locale2 : _locale.value;
      const message = getLocaleMessage(targetLocale);
      const resolved = _context.messageResolver(message, key);
      return isMessageAST(resolved) || isMessageFunction(resolved) || isString(resolved);
    }, () => [key], "translate exists", (root) => {
      return Reflect.apply(root.te, root, [key, locale2]);
    }, NOOP_RETURN_FALSE, (val) => isBoolean(val));
  }
  function resolveMessages(key) {
    let messages2 = null;
    const locales = fallbackWithLocaleChain(_context, _fallbackLocale.value, _locale.value);
    for (let i = 0; i < locales.length; i++) {
      const targetLocaleMessages = _messages.value[locales[i]] || {};
      const messageValue = _context.messageResolver(targetLocaleMessages, key);
      if (messageValue != null) {
        messages2 = messageValue;
        break;
      }
    }
    return messages2;
  }
  function tm(key) {
    const messages2 = resolveMessages(key);
    return messages2 != null ? messages2 : __root ? __root.tm(key) || {} : {};
  }
  function getLocaleMessage(locale2) {
    return _messages.value[locale2] || {};
  }
  function setLocaleMessage(locale2, message) {
    if (flatJson) {
      const _message = { [locale2]: message };
      for (const key in _message) {
        if (hasOwn(_message, key)) {
          handleFlatJson(_message[key]);
        }
      }
      message = _message[locale2];
    }
    _messages.value[locale2] = message;
    _context.messages = _messages.value;
  }
  function mergeLocaleMessage(locale2, message) {
    _messages.value[locale2] = _messages.value[locale2] || {};
    const _message = { [locale2]: message };
    if (flatJson) {
      for (const key in _message) {
        if (hasOwn(_message, key)) {
          handleFlatJson(_message[key]);
        }
      }
    }
    message = _message[locale2];
    deepCopy(message, _messages.value[locale2]);
    _context.messages = _messages.value;
  }
  function getDateTimeFormat(locale2) {
    return _datetimeFormats.value[locale2] || {};
  }
  function setDateTimeFormat(locale2, format2) {
    _datetimeFormats.value[locale2] = format2;
    _context.datetimeFormats = _datetimeFormats.value;
    clearDateTimeFormat(_context, locale2, format2);
  }
  function mergeDateTimeFormat(locale2, format2) {
    _datetimeFormats.value[locale2] = assign(_datetimeFormats.value[locale2] || {}, format2);
    _context.datetimeFormats = _datetimeFormats.value;
    clearDateTimeFormat(_context, locale2, format2);
  }
  function getNumberFormat(locale2) {
    return _numberFormats.value[locale2] || {};
  }
  function setNumberFormat(locale2, format2) {
    _numberFormats.value[locale2] = format2;
    _context.numberFormats = _numberFormats.value;
    clearNumberFormat(_context, locale2, format2);
  }
  function mergeNumberFormat(locale2, format2) {
    _numberFormats.value[locale2] = assign(_numberFormats.value[locale2] || {}, format2);
    _context.numberFormats = _numberFormats.value;
    clearNumberFormat(_context, locale2, format2);
  }
  composerID++;
  const composer = {
    id: composerID,
    locale,
    fallbackLocale,
    get inheritLocale() {
      return _inheritLocale;
    },
    set inheritLocale(val) {
      _inheritLocale = val;
      if (val && __root) {
        _locale.value = __root.locale.value;
        _fallbackLocale.value = __root.fallbackLocale.value;
        updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
      }
    },
    get availableLocales() {
      return Object.keys(_messages.value).sort();
    },
    messages,
    get modifiers() {
      return _modifiers;
    },
    get pluralRules() {
      return _pluralRules || {};
    },
    get isGlobal() {
      return _isGlobal;
    },
    get missingWarn() {
      return _missingWarn;
    },
    set missingWarn(val) {
      _missingWarn = val;
      _context.missingWarn = _missingWarn;
    },
    get fallbackWarn() {
      return _fallbackWarn;
    },
    set fallbackWarn(val) {
      _fallbackWarn = val;
      _context.fallbackWarn = _fallbackWarn;
    },
    get fallbackRoot() {
      return _fallbackRoot;
    },
    set fallbackRoot(val) {
      _fallbackRoot = val;
    },
    get fallbackFormat() {
      return _fallbackFormat;
    },
    set fallbackFormat(val) {
      _fallbackFormat = val;
      _context.fallbackFormat = _fallbackFormat;
    },
    get warnHtmlMessage() {
      return _warnHtmlMessage;
    },
    set warnHtmlMessage(val) {
      _warnHtmlMessage = val;
      _context.warnHtmlMessage = val;
    },
    get escapeParameter() {
      return _escapeParameter;
    },
    set escapeParameter(val) {
      _escapeParameter = val;
      _context.escapeParameter = val;
    },
    t,
    getLocaleMessage,
    setLocaleMessage,
    mergeLocaleMessage,
    getPostTranslationHandler,
    setPostTranslationHandler,
    getMissingHandler,
    setMissingHandler,
    [SetPluralRulesSymbol]: setPluralRules
  };
  {
    composer.datetimeFormats = datetimeFormats;
    composer.numberFormats = numberFormats;
    composer.rt = rt;
    composer.te = te;
    composer.tm = tm;
    composer.d = d;
    composer.n = n;
    composer.getDateTimeFormat = getDateTimeFormat;
    composer.setDateTimeFormat = setDateTimeFormat;
    composer.mergeDateTimeFormat = mergeDateTimeFormat;
    composer.getNumberFormat = getNumberFormat;
    composer.setNumberFormat = setNumberFormat;
    composer.mergeNumberFormat = mergeNumberFormat;
    composer[InejctWithOptionSymbol] = __injectWithOption;
    composer[TranslateVNodeSymbol] = translateVNode;
    composer[DatetimePartsSymbol] = datetimeParts;
    composer[NumberPartsSymbol] = numberParts;
  }
  return composer;
}
const baseFormatProps = {
  tag: {
    type: [String, Object]
  },
  locale: {
    type: String
  },
  scope: {
    type: String,
    // NOTE: avoid https://github.com/microsoft/rushstack/issues/1050
    validator: (val) => val === "parent" || val === "global",
    default: "parent"
    /* ComponentI18nScope */
  },
  i18n: {
    type: Object
  }
};
function getInterpolateArg({ slots }, keys) {
  if (keys.length === 1 && keys[0] === "default") {
    const ret = slots.default ? slots.default() : [];
    return ret.reduce((slot, current) => {
      return [
        ...slot,
        // prettier-ignore
        ...current.type === Fragment ? current.children : [current]
      ];
    }, []);
  } else {
    return keys.reduce((arg, key) => {
      const slot = slots[key];
      if (slot) {
        arg[key] = slot();
      }
      return arg;
    }, create());
  }
}
function getFragmentableTag() {
  return Fragment;
}
const TranslationImpl = /* @__PURE__ */ defineComponent({
  /* eslint-disable */
  name: "i18n-t",
  props: assign({
    keypath: {
      type: String,
      required: true
    },
    plural: {
      type: [Number, String],
      validator: (val) => isNumber(val) || !isNaN(val)
    }
  }, baseFormatProps),
  /* eslint-enable */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup(props, context) {
    const { slots, attrs } = context;
    const i18n = props.i18n || useI18n({
      useScope: props.scope,
      __useComponent: true
    });
    return () => {
      const keys = Object.keys(slots).filter((key) => key !== "_");
      const options = create();
      if (props.locale) {
        options.locale = props.locale;
      }
      if (props.plural !== void 0) {
        options.plural = isString(props.plural) ? +props.plural : props.plural;
      }
      const arg = getInterpolateArg(context, keys);
      const children = i18n[TranslateVNodeSymbol](props.keypath, arg, options);
      const assignedAttrs = assign(create(), attrs);
      const tag = isString(props.tag) || isObject$1(props.tag) ? props.tag : getFragmentableTag();
      return h(tag, assignedAttrs, children);
    };
  }
});
const Translation = TranslationImpl;
function isVNode(target) {
  return isArray(target) && !isString(target[0]);
}
function renderFormatter(props, context, slotKeys, partFormatter) {
  const { slots, attrs } = context;
  return () => {
    const options = { part: true };
    let overrides = create();
    if (props.locale) {
      options.locale = props.locale;
    }
    if (isString(props.format)) {
      options.key = props.format;
    } else if (isObject$1(props.format)) {
      if (isString(props.format.key)) {
        options.key = props.format.key;
      }
      overrides = Object.keys(props.format).reduce((options2, prop) => {
        return slotKeys.includes(prop) ? assign(create(), options2, { [prop]: props.format[prop] }) : options2;
      }, create());
    }
    const parts = partFormatter(...[props.value, options, overrides]);
    let children = [options.key];
    if (isArray(parts)) {
      children = parts.map((part, index) => {
        const slot = slots[part.type];
        const node = slot ? slot({ [part.type]: part.value, index, parts }) : [part.value];
        if (isVNode(node)) {
          node[0].key = `${part.type}-${index}`;
        }
        return node;
      });
    } else if (isString(parts)) {
      children = [parts];
    }
    const assignedAttrs = assign(create(), attrs);
    const tag = isString(props.tag) || isObject$1(props.tag) ? props.tag : getFragmentableTag();
    return h(tag, assignedAttrs, children);
  };
}
const NumberFormatImpl = /* @__PURE__ */ defineComponent({
  /* eslint-disable */
  name: "i18n-n",
  props: assign({
    value: {
      type: Number,
      required: true
    },
    format: {
      type: [String, Object]
    }
  }, baseFormatProps),
  /* eslint-enable */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup(props, context) {
    const i18n = props.i18n || useI18n({
      useScope: props.scope,
      __useComponent: true
    });
    return renderFormatter(props, context, NUMBER_FORMAT_OPTIONS_KEYS, (...args) => (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      i18n[NumberPartsSymbol](...args)
    ));
  }
});
const NumberFormat = NumberFormatImpl;
const DatetimeFormatImpl = /* @__PURE__ */ defineComponent({
  /* eslint-disable */
  name: "i18n-d",
  props: assign({
    value: {
      type: [Number, Date],
      required: true
    },
    format: {
      type: [String, Object]
    }
  }, baseFormatProps),
  /* eslint-enable */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup(props, context) {
    const i18n = props.i18n || useI18n({
      useScope: props.scope,
      __useComponent: true
    });
    return renderFormatter(props, context, DATETIME_FORMAT_OPTIONS_KEYS, (...args) => (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      i18n[DatetimePartsSymbol](...args)
    ));
  }
});
const DatetimeFormat = DatetimeFormatImpl;
function getComposer$1(i18n, instance) {
  const i18nInternal = i18n;
  if (i18n.mode === "composition") {
    return i18nInternal.__getInstance(instance) || i18n.global;
  } else {
    const vueI18n = i18nInternal.__getInstance(instance);
    return vueI18n != null ? vueI18n.__composer : i18n.global.__composer;
  }
}
function vTDirective(i18n) {
  const _process = (binding) => {
    const { instance, value } = binding;
    if (!instance || !instance.$) {
      throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
    }
    const composer = getComposer$1(i18n, instance.$);
    const parsedValue = parseValue(value);
    return [
      Reflect.apply(composer.t, composer, [...makeParams(parsedValue)]),
      composer
    ];
  };
  const register = (el, binding) => {
    const [textContent, composer] = _process(binding);
    el.__composer = composer;
    el.textContent = textContent;
  };
  const unregister = (el) => {
    if (el.__composer) {
      el.__composer = void 0;
      delete el.__composer;
    }
  };
  const update = (el, { value }) => {
    if (el.__composer) {
      const composer = el.__composer;
      const parsedValue = parseValue(value);
      el.textContent = Reflect.apply(composer.t, composer, [
        ...makeParams(parsedValue)
      ]);
    }
  };
  const getSSRProps = (binding) => {
    const [textContent] = _process(binding);
    return { textContent };
  };
  return {
    created: register,
    unmounted: unregister,
    beforeUpdate: update,
    getSSRProps
  };
}
function parseValue(value) {
  if (isString(value)) {
    return { path: value };
  } else if (isPlainObject(value)) {
    if (!("path" in value)) {
      throw createI18nError(I18nErrorCodes.REQUIRED_VALUE, "path");
    }
    return value;
  } else {
    throw createI18nError(I18nErrorCodes.INVALID_VALUE);
  }
}
function makeParams(value) {
  const { path, locale, args, choice, plural } = value;
  const options = {};
  const named = args || {};
  if (isString(locale)) {
    options.locale = locale;
  }
  if (isNumber(choice)) {
    options.plural = choice;
  }
  if (isNumber(plural)) {
    options.plural = plural;
  }
  return [path, named, options];
}
function apply(app, i18n, ...options) {
  const pluginOptions = isPlainObject(options[0]) ? options[0] : {};
  const globalInstall = isBoolean(pluginOptions.globalInstall) ? pluginOptions.globalInstall : true;
  if (globalInstall) {
    [Translation.name, "I18nT"].forEach((name) => app.component(name, Translation));
    [NumberFormat.name, "I18nN"].forEach((name) => app.component(name, NumberFormat));
    [DatetimeFormat.name, "I18nD"].forEach((name) => app.component(name, DatetimeFormat));
  }
  {
    app.directive("t", vTDirective(i18n));
  }
}
const I18nInjectionKey = /* @__PURE__ */ makeSymbol("global-vue-i18n");
function createI18n(options = {}, VueI18nLegacy) {
  const __globalInjection = isBoolean(options.globalInjection) ? options.globalInjection : true;
  const __instances = /* @__PURE__ */ new Map();
  const [globalScope, __global] = createGlobal(options);
  const symbol = /* @__PURE__ */ makeSymbol("");
  function __getInstance(component) {
    return __instances.get(component) || null;
  }
  function __setInstance(component, instance) {
    __instances.set(component, instance);
  }
  function __deleteInstance(component) {
    __instances.delete(component);
  }
  const i18n = {
    // mode
    get mode() {
      return "composition";
    },
    // install plugin
    async install(app, ...options2) {
      app.__VUE_I18N_SYMBOL__ = symbol;
      app.provide(app.__VUE_I18N_SYMBOL__, i18n);
      if (isPlainObject(options2[0])) {
        const opts = options2[0];
        i18n.__composerExtend = opts.__composerExtend;
        i18n.__vueI18nExtend = opts.__vueI18nExtend;
      }
      let globalReleaseHandler = null;
      if (__globalInjection) {
        globalReleaseHandler = injectGlobalFields(app, i18n.global);
      }
      {
        apply(app, i18n, ...options2);
      }
      const unmountApp = app.unmount;
      app.unmount = () => {
        globalReleaseHandler && globalReleaseHandler();
        i18n.dispose();
        unmountApp();
      };
    },
    // global accessor
    get global() {
      return __global;
    },
    dispose() {
      globalScope.stop();
    },
    // @internal
    __instances,
    // @internal
    __getInstance,
    // @internal
    __setInstance,
    // @internal
    __deleteInstance
  };
  return i18n;
}
function useI18n(options = {}) {
  const instance = getCurrentInstance();
  if (instance == null) {
    throw createI18nError(I18nErrorCodes.MUST_BE_CALL_SETUP_TOP);
  }
  if (!instance.isCE && instance.appContext.app != null && !instance.appContext.app.__VUE_I18N_SYMBOL__) {
    throw createI18nError(I18nErrorCodes.NOT_INSTALLED);
  }
  const i18n = getI18nInstance(instance);
  const gl = getGlobalComposer(i18n);
  const componentOptions = getComponentOptions(instance);
  const scope = getScope(options, componentOptions);
  if (scope === "global") {
    adjustI18nResources(gl, options, componentOptions);
    return gl;
  }
  if (scope === "parent") {
    let composer2 = getComposer(i18n, instance, options.__useComponent);
    if (composer2 == null) {
      composer2 = gl;
    }
    return composer2;
  }
  const i18nInternal = i18n;
  let composer = i18nInternal.__getInstance(instance);
  if (composer == null) {
    const composerOptions = assign({}, options);
    if ("__i18n" in componentOptions) {
      composerOptions.__i18n = componentOptions.__i18n;
    }
    if (gl) {
      composerOptions.__root = gl;
    }
    composer = createComposer(composerOptions);
    if (i18nInternal.__composerExtend) {
      composer[DisposeSymbol] = i18nInternal.__composerExtend(composer);
    }
    i18nInternal.__setInstance(instance, composer);
  }
  return composer;
}
function createGlobal(options, legacyMode, VueI18nLegacy) {
  const scope = effectScope();
  const obj = scope.run(() => createComposer(options));
  if (obj == null) {
    throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
  }
  return [scope, obj];
}
function getI18nInstance(instance) {
  const i18n = inject(!instance.isCE ? instance.appContext.app.__VUE_I18N_SYMBOL__ : I18nInjectionKey);
  if (!i18n) {
    throw createI18nError(!instance.isCE ? I18nErrorCodes.UNEXPECTED_ERROR : I18nErrorCodes.NOT_INSTALLED_WITH_PROVIDE);
  }
  return i18n;
}
function getScope(options, componentOptions) {
  return isEmptyObject(options) ? "__i18n" in componentOptions ? "local" : "global" : !options.useScope ? "local" : options.useScope;
}
function getGlobalComposer(i18n) {
  return i18n.mode === "composition" ? i18n.global : i18n.global.__composer;
}
function getComposer(i18n, target, useComponent = false) {
  let composer = null;
  const root = target.root;
  let current = getParentComponentInstance(target, useComponent);
  while (current != null) {
    const i18nInternal = i18n;
    if (i18n.mode === "composition") {
      composer = i18nInternal.__getInstance(current);
    }
    if (composer != null) {
      break;
    }
    if (root === current) {
      break;
    }
    current = current.parent;
  }
  return composer;
}
function getParentComponentInstance(target, useComponent = false) {
  if (target == null) {
    return null;
  }
  return !useComponent ? target.parent : target.vnode.ctx || target.parent;
}
const globalExportProps = [
  "locale",
  "fallbackLocale",
  "availableLocales"
];
const globalExportMethods = ["t", "rt", "d", "n", "tm", "te"];
function injectGlobalFields(app, composer) {
  const i18n = /* @__PURE__ */ Object.create(null);
  globalExportProps.forEach((prop) => {
    const desc = Object.getOwnPropertyDescriptor(composer, prop);
    if (!desc) {
      throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
    }
    const wrap = isRef(desc.value) ? {
      get() {
        return desc.value.value;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set(val) {
        desc.value.value = val;
      }
    } : {
      get() {
        return desc.get && desc.get();
      }
    };
    Object.defineProperty(i18n, prop, wrap);
  });
  app.config.globalProperties.$i18n = i18n;
  globalExportMethods.forEach((method) => {
    const desc = Object.getOwnPropertyDescriptor(composer, method);
    if (!desc || !desc.value) {
      throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
    }
    Object.defineProperty(app.config.globalProperties, `$${method}`, desc);
  });
  const dispose = () => {
    delete app.config.globalProperties.$i18n;
    globalExportMethods.forEach((method) => {
      delete app.config.globalProperties[`$${method}`];
    });
  };
  return dispose;
}
registerMessageCompiler(compile);
registerMessageResolver(resolveValue);
registerLocaleFallbacker(fallbackWithLocaleChain);

const i18n_aNMRN_VpxP5fGsesKfa8RtP7jI8L9qZpzOP_wk7xuAQ = defineNuxtPlugin({
  name: "i18n:plugin",
  parallel: parallelPlugin,
  async setup(nuxt) {
    var _a;
    let __temp, __restore;
    const nuxtApp = nuxt;
    const currentRoute = nuxtApp.$router.currentRoute;
    const defaultLocaleDomain = getDefaultLocaleForDomain(nuxtApp);
    setupMultiDomainLocales(nuxtApp, defaultLocaleDomain);
    const runtimeI18n = {
      ...nuxtApp.$config.public.i18n,
      defaultLocale: defaultLocaleDomain
    };
    nuxtApp.$config.public.i18n.defaultLocale = defaultLocaleDomain;
    runtimeI18n.baseUrl = extendBaseUrl();
    const _detectBrowserLanguage = runtimeDetectBrowserLanguage();
    const vueI18nOptions = ([__temp, __restore] = executeAsync(() => loadVueI18nOptions(vueI18nConfigs, useNuxtApp())), __temp = await __temp, __restore(), __temp);
    vueI18nOptions.messages = vueI18nOptions.messages || {};
    for (const l of localeCodes) {
      (_a = vueI18nOptions.messages)[l] ?? (_a[l] = {});
    }
    vueI18nOptions.fallbackLocale = vueI18nOptions.fallbackLocale ?? false;
    if (defaultLocaleDomain) {
      vueI18nOptions.locale = defaultLocaleDomain;
    }
    const getRouteLocale = createLocaleFromRouteGetter();
    const localeCookie = getI18nCookie();
    const i18n = createI18n(vueI18nOptions);
    i18n.__firstAccess = true;
    i18n.__setLocale = (locale) => {
      const i = getI18nTarget(i18n);
      if (isRef(i.locale)) {
        i.locale.value = locale;
      } else {
        i.locale = locale;
      }
    };
    nuxtApp._vueI18n = i18n;
    extendI18n(i18n, {
      extendComposer(composer) {
        const _locales = ref(runtimeI18n.locales);
        const _localeCodes = ref(localeCodes);
        const _baseUrl = ref("");
        composer.locales = computed(() => _locales.value);
        composer.localeCodes = computed(() => _localeCodes.value);
        composer.baseUrl = computed(() => _baseUrl.value);
        {
          _baseUrl.value = resolveBaseUrl(runtimeI18n.baseUrl, nuxtApp);
        }
        composer.strategy = runtimeI18n.strategy;
        composer.localeProperties = computed(
          () => normalizedLocales.find((l) => l.code === composer.locale.value) || { code: composer.locale.value }
        );
        composer.setLocale = async (locale) => {
          await loadAndSetLocale(locale, i18n.__firstAccess);
          if (composer.strategy === "no_prefix" || false) {
            await composer.loadLocaleMessages(locale);
            i18n.__setLocale(locale);
            return;
          }
          const route = currentRoute.value;
          const redirectPath = await nuxtApp.runWithContext(
            () => detectRedirect({ to: route, locale, routeLocale: getRouteLocale(route) })
          );
          await nuxtApp.runWithContext(() => navigate({ nuxtApp, redirectPath, locale, route }, true));
        };
        composer.loadLocaleMessages = async (locale) => await loadLocale(locale, localeLoaders, composer.mergeLocaleMessage.bind(composer), nuxtApp);
        composer.differentDomains = runtimeI18n.differentDomains;
        composer.defaultLocale = runtimeI18n.defaultLocale;
        composer.getBrowserLocale = () => getBrowserLocale();
        composer.getLocaleCookie = () => getLocaleCookie(localeCookie, _detectBrowserLanguage, composer.defaultLocale);
        composer.setLocaleCookie = (locale) => setLocaleCookie(localeCookie, locale, _detectBrowserLanguage);
        composer.onBeforeLanguageSwitch = (oldLocale, newLocale, initialSetup, context) => nuxt.callHook("i18n:beforeLocaleSwitch", {
          oldLocale,
          newLocale,
          initialSetup,
          context
        });
        composer.onLanguageSwitched = (oldLocale, newLocale) => nuxt.callHook("i18n:localeSwitched", { oldLocale, newLocale });
        composer.finalizePendingLocaleChange = async () => {
          var _a2;
          if (!i18n.__pendingLocale) return;
          i18n.__setLocale(i18n.__pendingLocale);
          (_a2 = i18n.__resolvePendingLocalePromise) == null ? void 0 : _a2.call(i18n);
          i18n.__pendingLocale = void 0;
        };
        composer.waitForPendingLocaleChange = async () => {
          if (i18n.__pendingLocale && i18n.__pendingLocalePromise) {
            await i18n.__pendingLocalePromise;
          }
        };
      },
      extendComposerInstance(instance, c) {
        const props = [
          ["locales", () => c.locales],
          ["localeCodes", () => c.localeCodes],
          ["baseUrl", () => c.baseUrl],
          ["strategy", () => c.strategy],
          ["localeProperties", () => c.localeProperties],
          ["setLocale", () => async (locale) => Reflect.apply(c.setLocale, c, [locale])],
          ["loadLocaleMessages", () => async (locale) => Reflect.apply(c.loadLocaleMessages, c, [locale])],
          ["differentDomains", () => c.differentDomains],
          ["defaultLocale", () => c.defaultLocale],
          ["getBrowserLocale", () => () => Reflect.apply(c.getBrowserLocale, c, [])],
          ["getLocaleCookie", () => () => Reflect.apply(c.getLocaleCookie, c, [])],
          ["setLocaleCookie", () => (locale) => Reflect.apply(c.setLocaleCookie, c, [locale])],
          [
            "onBeforeLanguageSwitch",
            () => (oldLocale, newLocale, initialSetup, context) => Reflect.apply(c.onBeforeLanguageSwitch, c, [oldLocale, newLocale, initialSetup, context])
          ],
          [
            "onLanguageSwitched",
            () => (oldLocale, newLocale) => Reflect.apply(c.onLanguageSwitched, c, [oldLocale, newLocale])
          ],
          ["finalizePendingLocaleChange", () => () => Reflect.apply(c.finalizePendingLocaleChange, c, [])],
          ["waitForPendingLocaleChange", () => () => Reflect.apply(c.waitForPendingLocaleChange, c, [])]
        ];
        for (const [key, get] of props) {
          Object.defineProperty(instance, key, { get });
        }
      }
    });
    nuxt.vueApp.use(i18n);
    defineGetter(nuxtApp, "$i18n", getI18nTarget(i18n));
    return {
      provide: {
        /**
         * TODO: remove type assertions while type narrowing based on generated types
         */
        localeHead: wrapComposable(localeHead),
        localePath: useLocalePath(),
        localeRoute: useLocaleRoute(),
        getRouteBaseName: useRouteBaseName(),
        switchLocalePath: useSwitchLocalePath(),
        // TODO: remove in v10
        resolveRoute: wrapComposable(resolveRoute),
        // TODO: remove in v10
        localeLocation: useLocaleLocation()
      }
    };
  }
});

const defaults$1 = Object.freeze({
  ignoreUnknown: false,
  respectType: false,
  respectFunctionNames: false,
  respectFunctionProperties: false,
  unorderedObjects: true,
  unorderedArrays: false,
  unorderedSets: false,
  excludeKeys: void 0,
  excludeValues: void 0,
  replacer: void 0
});
function objectHash(object, options) {
  if (options) {
    options = { ...defaults$1, ...options };
  } else {
    options = defaults$1;
  }
  const hasher = createHasher(options);
  hasher.dispatch(object);
  return hasher.toString();
}
const defaultPrototypesKeys = Object.freeze([
  "prototype",
  "__proto__",
  "constructor"
]);
function createHasher(options) {
  let buff = "";
  let context = /* @__PURE__ */ new Map();
  const write = (str) => {
    buff += str;
  };
  return {
    toString() {
      return buff;
    },
    getContext() {
      return context;
    },
    dispatch(value) {
      if (options.replacer) {
        value = options.replacer(value);
      }
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    },
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      if (objectLength < 10) {
        objType = "unknown:[" + objString + "]";
      } else {
        objType = objString.slice(8, objectLength - 1);
      }
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = context.get(object)) === void 0) {
        context.set(object, context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        write("buffer:");
        return write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else if (!options.ignoreUnknown) {
          this.unkown(object, objType);
        }
      } else {
        let keys = Object.keys(object);
        if (options.unorderedObjects) {
          keys = keys.sort();
        }
        let extraKeys = [];
        if (options.respectType !== false && !isNativeFunction(object)) {
          extraKeys = defaultPrototypesKeys;
        }
        if (options.excludeKeys) {
          keys = keys.filter((key) => {
            return !options.excludeKeys(key);
          });
          extraKeys = extraKeys.filter((key) => {
            return !options.excludeKeys(key);
          });
        }
        write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          write(":");
          if (!options.excludeValues) {
            this.dispatch(object[key]);
          }
          write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    },
    array(arr, unordered) {
      unordered = unordered === void 0 ? options.unorderedArrays !== false : unordered;
      write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = createHasher(options);
        hasher.dispatch(entry);
        for (const [key, value] of hasher.getContext()) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    },
    date(date) {
      return write("date:" + date.toJSON());
    },
    symbol(sym) {
      return write("symbol:" + sym.toString());
    },
    unkown(value, type) {
      write(type);
      if (!value) {
        return;
      }
      write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          Array.from(value.entries()),
          true
          /* ordered */
        );
      }
    },
    error(err) {
      return write("error:" + err.toString());
    },
    boolean(bool) {
      return write("bool:" + bool);
    },
    string(string) {
      write("string:" + string.length + ":");
      write(string);
    },
    function(fn) {
      write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
      if (options.respectFunctionNames !== false) {
        this.dispatch("function-name:" + String(fn.name));
      }
      if (options.respectFunctionProperties) {
        this.object(fn);
      }
    },
    number(number) {
      return write("number:" + number);
    },
    xml(xml) {
      return write("xml:" + xml.toString());
    },
    null() {
      return write("Null");
    },
    undefined() {
      return write("Undefined");
    },
    regexp(regex) {
      return write("regex:" + regex.toString());
    },
    uint8array(arr) {
      write("uint8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint8clampedarray(arr) {
      write("uint8clampedarray:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int8array(arr) {
      write("int8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint16array(arr) {
      write("uint16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int16array(arr) {
      write("int16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint32array(arr) {
      write("uint32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int32array(arr) {
      write("int32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    float32array(arr) {
      write("float32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    float64array(arr) {
      write("float64array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    arraybuffer(arr) {
      write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    },
    url(url) {
      return write("url:" + url.toString());
    },
    map(map) {
      write("map:");
      const arr = [...map];
      return this.array(arr, options.unorderedSets !== false);
    },
    set(set) {
      write("set:");
      const arr = [...set];
      return this.array(arr, options.unorderedSets !== false);
    },
    file(file) {
      write("file:");
      return this.dispatch([file.name, file.size, file.type, file.lastModfied]);
    },
    blob() {
      if (options.ignoreUnknown) {
        return write("[blob]");
      }
      throw new Error(
        'Hashing Blob objects is currently not supported\nUse "options.replacer" or "options.ignoreUnknown"\n'
      );
    },
    domwindow() {
      return write("domwindow");
    },
    bigint(number) {
      return write("bigint:" + number.toString());
    },
    /* Node.js standard native objects */
    process() {
      return write("process");
    },
    timer() {
      return write("timer");
    },
    pipe() {
      return write("pipe");
    },
    tcp() {
      return write("tcp");
    },
    udp() {
      return write("udp");
    },
    tty() {
      return write("tty");
    },
    statwatcher() {
      return write("statwatcher");
    },
    securecontext() {
      return write("securecontext");
    },
    connection() {
      return write("connection");
    },
    zlib() {
      return write("zlib");
    },
    context() {
      return write("context");
    },
    nodescript() {
      return write("nodescript");
    },
    httpparser() {
      return write("httpparser");
    },
    dataview() {
      return write("dataview");
    },
    signal() {
      return write("signal");
    },
    fsevent() {
      return write("fsevent");
    },
    tlswrap() {
      return write("tlswrap");
    }
  };
}
const nativeFunc = "[native code] }";
const nativeFuncLength = nativeFunc.length;
function isNativeFunction(f) {
  if (typeof f !== "function") {
    return false;
  }
  return Function.prototype.toString.call(f).slice(-nativeFuncLength) === nativeFunc;
}

class WordArray {
  words;
  sigBytes;
  constructor(words, sigBytes) {
    words = this.words = words || [];
    this.sigBytes = sigBytes === void 0 ? words.length * 4 : sigBytes;
  }
  toString(encoder) {
    return (encoder || Hex).stringify(this);
  }
  concat(wordArray) {
    this.clamp();
    if (this.sigBytes % 4) {
      for (let i = 0; i < wordArray.sigBytes; i++) {
        const thatByte = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
        this.words[this.sigBytes + i >>> 2] |= thatByte << 24 - (this.sigBytes + i) % 4 * 8;
      }
    } else {
      for (let j = 0; j < wordArray.sigBytes; j += 4) {
        this.words[this.sigBytes + j >>> 2] = wordArray.words[j >>> 2];
      }
    }
    this.sigBytes += wordArray.sigBytes;
    return this;
  }
  clamp() {
    this.words[this.sigBytes >>> 2] &= 4294967295 << 32 - this.sigBytes % 4 * 8;
    this.words.length = Math.ceil(this.sigBytes / 4);
  }
  clone() {
    return new WordArray([...this.words]);
  }
}
const Hex = {
  stringify(wordArray) {
    const hexChars = [];
    for (let i = 0; i < wordArray.sigBytes; i++) {
      const bite = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
      hexChars.push((bite >>> 4).toString(16), (bite & 15).toString(16));
    }
    return hexChars.join("");
  }
};
const Base64 = {
  stringify(wordArray) {
    const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const base64Chars = [];
    for (let i = 0; i < wordArray.sigBytes; i += 3) {
      const byte1 = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
      const byte2 = wordArray.words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
      const byte3 = wordArray.words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
      const triplet = byte1 << 16 | byte2 << 8 | byte3;
      for (let j = 0; j < 4 && i * 8 + j * 6 < wordArray.sigBytes * 8; j++) {
        base64Chars.push(keyStr.charAt(triplet >>> 6 * (3 - j) & 63));
      }
    }
    return base64Chars.join("");
  }
};
const Latin1 = {
  parse(latin1Str) {
    const latin1StrLength = latin1Str.length;
    const words = [];
    for (let i = 0; i < latin1StrLength; i++) {
      words[i >>> 2] |= (latin1Str.charCodeAt(i) & 255) << 24 - i % 4 * 8;
    }
    return new WordArray(words, latin1StrLength);
  }
};
const Utf8 = {
  parse(utf8Str) {
    return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
  }
};
class BufferedBlockAlgorithm {
  _data = new WordArray();
  _nDataBytes = 0;
  _minBufferSize = 0;
  blockSize = 512 / 32;
  reset() {
    this._data = new WordArray();
    this._nDataBytes = 0;
  }
  _append(data) {
    if (typeof data === "string") {
      data = Utf8.parse(data);
    }
    this._data.concat(data);
    this._nDataBytes += data.sigBytes;
  }
  _doProcessBlock(_dataWords, _offset) {
  }
  _process(doFlush) {
    let processedWords;
    let nBlocksReady = this._data.sigBytes / (this.blockSize * 4);
    if (doFlush) {
      nBlocksReady = Math.ceil(nBlocksReady);
    } else {
      nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
    }
    const nWordsReady = nBlocksReady * this.blockSize;
    const nBytesReady = Math.min(nWordsReady * 4, this._data.sigBytes);
    if (nWordsReady) {
      for (let offset = 0; offset < nWordsReady; offset += this.blockSize) {
        this._doProcessBlock(this._data.words, offset);
      }
      processedWords = this._data.words.splice(0, nWordsReady);
      this._data.sigBytes -= nBytesReady;
    }
    return new WordArray(processedWords, nBytesReady);
  }
}
class Hasher extends BufferedBlockAlgorithm {
  update(messageUpdate) {
    this._append(messageUpdate);
    this._process();
    return this;
  }
  finalize(messageUpdate) {
    if (messageUpdate) {
      this._append(messageUpdate);
    }
  }
}

const H = [
  1779033703,
  -1150833019,
  1013904242,
  -1521486534,
  1359893119,
  -1694144372,
  528734635,
  1541459225
];
const K = [
  1116352408,
  1899447441,
  -1245643825,
  -373957723,
  961987163,
  1508970993,
  -1841331548,
  -1424204075,
  -670586216,
  310598401,
  607225278,
  1426881987,
  1925078388,
  -2132889090,
  -1680079193,
  -1046744716,
  -459576895,
  -272742522,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  -1740746414,
  -1473132947,
  -1341970488,
  -1084653625,
  -958395405,
  -710438585,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  -2117940946,
  -1838011259,
  -1564481375,
  -1474664885,
  -1035236496,
  -949202525,
  -778901479,
  -694614492,
  -200395387,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  -2067236844,
  -1933114872,
  -1866530822,
  -1538233109,
  -1090935817,
  -965641998
];
const W = [];
class SHA256 extends Hasher {
  _hash = new WordArray([...H]);
  /**
   * Resets the internal state of the hash object to initial values.
   */
  reset() {
    super.reset();
    this._hash = new WordArray([...H]);
  }
  _doProcessBlock(M, offset) {
    const H2 = this._hash.words;
    let a = H2[0];
    let b = H2[1];
    let c = H2[2];
    let d = H2[3];
    let e = H2[4];
    let f = H2[5];
    let g = H2[6];
    let h = H2[7];
    for (let i = 0; i < 64; i++) {
      if (i < 16) {
        W[i] = M[offset + i] | 0;
      } else {
        const gamma0x = W[i - 15];
        const gamma0 = (gamma0x << 25 | gamma0x >>> 7) ^ (gamma0x << 14 | gamma0x >>> 18) ^ gamma0x >>> 3;
        const gamma1x = W[i - 2];
        const gamma1 = (gamma1x << 15 | gamma1x >>> 17) ^ (gamma1x << 13 | gamma1x >>> 19) ^ gamma1x >>> 10;
        W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
      }
      const ch = e & f ^ ~e & g;
      const maj = a & b ^ a & c ^ b & c;
      const sigma0 = (a << 30 | a >>> 2) ^ (a << 19 | a >>> 13) ^ (a << 10 | a >>> 22);
      const sigma1 = (e << 26 | e >>> 6) ^ (e << 21 | e >>> 11) ^ (e << 7 | e >>> 25);
      const t1 = h + sigma1 + ch + K[i] + W[i];
      const t2 = sigma0 + maj;
      h = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    H2[0] = H2[0] + a | 0;
    H2[1] = H2[1] + b | 0;
    H2[2] = H2[2] + c | 0;
    H2[3] = H2[3] + d | 0;
    H2[4] = H2[4] + e | 0;
    H2[5] = H2[5] + f | 0;
    H2[6] = H2[6] + g | 0;
    H2[7] = H2[7] + h | 0;
  }
  /**
   * Finishes the hash calculation and returns the hash as a WordArray.
   *
   * @param {string} messageUpdate - Additional message content to include in the hash.
   * @returns {WordArray} The finalised hash as a WordArray.
   */
  finalize(messageUpdate) {
    super.finalize(messageUpdate);
    const nBitsTotal = this._nDataBytes * 8;
    const nBitsLeft = this._data.sigBytes * 8;
    this._data.words[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
    this._data.words[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(
      nBitsTotal / 4294967296
    );
    this._data.words[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
    this._data.sigBytes = this._data.words.length * 4;
    this._process();
    return this._hash;
  }
}
function sha256base64(message) {
  return new SHA256().finalize(message).toString(Base64);
}

function hash(object, options = {}) {
  const hashed = typeof object === "string" ? object : objectHash(object, options);
  return sha256base64(hashed).slice(0, 10);
}

var cache = {}, symbol, hasRequiredSymbol;
function requireSymbol() {
  if (hasRequiredSymbol) return symbol;
  hasRequiredSymbol = 1;
  const kValues = Symbol("values"), kStorage = Symbol("kStorage"), kStorages = Symbol("kStorages"), kTransfromer = Symbol("kTransformer"), kTTL = Symbol("kTTL"), kOnDedupe = Symbol("kOnDedupe"), kOnError = Symbol("kOnError"), kOnHit = Symbol("kOnHit"), kOnMiss = Symbol("kOnMiss"), kStale = Symbol("kStale");
  return symbol = { kValues, kStorage, kStorages, kTransfromer, kTTL, kOnDedupe, kOnError, kOnHit, kOnMiss, kStale }, symbol;
}
var safeStableStringify = { exports: {} }, hasRequiredSafeStableStringify;
function requireSafeStableStringify() {
  return hasRequiredSafeStableStringify || (hasRequiredSafeStableStringify = 1, function(module, exports) {
    const { hasOwnProperty } = Object.prototype, stringify = configure();
    stringify.configure = configure, stringify.stringify = stringify, stringify.default = stringify, exports.stringify = stringify, exports.configure = configure, module.exports = stringify;
    const strEscapeSequencesRegExp = /[\u0000-\u001f\u0022\u005c\ud800-\udfff]/;
    function strEscape(str) {
      return str.length < 5e3 && !strEscapeSequencesRegExp.test(str) ? `"${str}"` : JSON.stringify(str);
    }
    function sort(array, comparator) {
      if (array.length > 200 || comparator)
        return array.sort(comparator);
      for (let i = 1; i < array.length; i++) {
        const currentValue = array[i];
        let position = i;
        for (; position !== 0 && array[position - 1] > currentValue; )
          array[position] = array[position - 1], position--;
        array[position] = currentValue;
      }
      return array;
    }
    const typedArrayPrototypeGetSymbolToStringTag = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(
        Object.getPrototypeOf(
          new Int8Array()
        )
      ),
      Symbol.toStringTag
    ).get;
    function isTypedArrayWithEntries(value) {
      return typedArrayPrototypeGetSymbolToStringTag.call(value) !== void 0 && value.length !== 0;
    }
    function stringifyTypedArray(array, separator, maximumBreadth) {
      array.length < maximumBreadth && (maximumBreadth = array.length);
      const whitespace = separator === "," ? "" : " ";
      let res = `"0":${whitespace}${array[0]}`;
      for (let i = 1; i < maximumBreadth; i++)
        res += `${separator}"${i}":${whitespace}${array[i]}`;
      return res;
    }
    function getCircularValueOption(options) {
      if (hasOwnProperty.call(options, "circularValue")) {
        const circularValue = options.circularValue;
        if (typeof circularValue == "string")
          return `"${circularValue}"`;
        if (circularValue == null)
          return circularValue;
        if (circularValue === Error || circularValue === TypeError)
          return {
            toString() {
              throw new TypeError("Converting circular structure to JSON");
            }
          };
        throw new TypeError('The "circularValue" argument must be of type string or the value null or undefined');
      }
      return '"[Circular]"';
    }
    function getDeterministicOption(options) {
      let value;
      if (hasOwnProperty.call(options, "deterministic") && (value = options.deterministic, typeof value != "boolean" && typeof value != "function"))
        throw new TypeError('The "deterministic" argument must be of type boolean or comparator function');
      return value === void 0 ? true : value;
    }
    function getBooleanOption(options, key) {
      let value;
      if (hasOwnProperty.call(options, key) && (value = options[key], typeof value != "boolean"))
        throw new TypeError(`The "${key}" argument must be of type boolean`);
      return value === void 0 ? true : value;
    }
    function getPositiveIntegerOption(options, key) {
      let value;
      if (hasOwnProperty.call(options, key)) {
        if (value = options[key], typeof value != "number")
          throw new TypeError(`The "${key}" argument must be of type number`);
        if (!Number.isInteger(value))
          throw new TypeError(`The "${key}" argument must be an integer`);
        if (value < 1)
          throw new RangeError(`The "${key}" argument must be >= 1`);
      }
      return value === void 0 ? 1 / 0 : value;
    }
    function getItemCount(number) {
      return number === 1 ? "1 item" : `${number} items`;
    }
    function getUniqueReplacerSet(replacerArray) {
      const replacerSet = /* @__PURE__ */ new Set();
      for (const value of replacerArray)
        (typeof value == "string" || typeof value == "number") && replacerSet.add(String(value));
      return replacerSet;
    }
    function getStrictOption(options) {
      if (hasOwnProperty.call(options, "strict")) {
        const value = options.strict;
        if (typeof value != "boolean")
          throw new TypeError('The "strict" argument must be of type boolean');
        if (value)
          return (value2) => {
            let message = `Object can not safely be stringified. Received type ${typeof value2}`;
            throw typeof value2 != "function" && (message += ` (${value2.toString()})`), new Error(message);
          };
      }
    }
    function configure(options) {
      options = { ...options };
      const fail = getStrictOption(options);
      fail && (options.bigint === void 0 && (options.bigint = false), "circularValue" in options || (options.circularValue = Error));
      const circularValue = getCircularValueOption(options), bigint = getBooleanOption(options, "bigint"), deterministic = getDeterministicOption(options), comparator = typeof deterministic == "function" ? deterministic : void 0, maximumDepth = getPositiveIntegerOption(options, "maximumDepth"), maximumBreadth = getPositiveIntegerOption(options, "maximumBreadth");
      function stringifyFnReplacer(key, parent, stack, replacer, spacer, indentation) {
        let value = parent[key];
        switch (typeof value == "object" && value !== null && typeof value.toJSON == "function" && (value = value.toJSON(key)), value = replacer.call(parent, key, value), typeof value) {
          case "string":
            return strEscape(value);
          case "object": {
            if (value === null)
              return "null";
            if (stack.indexOf(value) !== -1)
              return circularValue;
            let res = "", join = ",";
            const originalIndentation = indentation;
            if (Array.isArray(value)) {
              if (value.length === 0)
                return "[]";
              if (maximumDepth < stack.length + 1)
                return '"[Array]"';
              stack.push(value), spacer !== "" && (indentation += spacer, res += `
${indentation}`, join = `,
${indentation}`);
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
              let i = 0;
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifyFnReplacer(String(i), value, stack, replacer, spacer, indentation);
                res += tmp2 !== void 0 ? tmp2 : "null", res += join;
              }
              const tmp = stringifyFnReplacer(String(i), value, stack, replacer, spacer, indentation);
              if (res += tmp !== void 0 ? tmp : "null", value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1;
                res += `${join}"... ${getItemCount(removedKeys)} not stringified"`;
              }
              return spacer !== "" && (res += `
${originalIndentation}`), stack.pop(), `[${res}]`;
            }
            let keys = Object.keys(value);
            const keyLength = keys.length;
            if (keyLength === 0)
              return "{}";
            if (maximumDepth < stack.length + 1)
              return '"[Object]"';
            let whitespace = "", separator = "";
            spacer !== "" && (indentation += spacer, join = `,
${indentation}`, whitespace = " ");
            const maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth);
            deterministic && !isTypedArrayWithEntries(value) && (keys = sort(keys, comparator)), stack.push(value);
            for (let i = 0; i < maximumPropertiesToStringify; i++) {
              const key2 = keys[i], tmp = stringifyFnReplacer(key2, value, stack, replacer, spacer, indentation);
              tmp !== void 0 && (res += `${separator}${strEscape(key2)}:${whitespace}${tmp}`, separator = join);
            }
            if (keyLength > maximumBreadth) {
              const removedKeys = keyLength - maximumBreadth;
              res += `${separator}"...":${whitespace}"${getItemCount(removedKeys)} not stringified"`, separator = join;
            }
            return spacer !== "" && separator.length > 1 && (res = `
${indentation}${res}
${originalIndentation}`), stack.pop(), `{${res}}`;
          }
          case "number":
            return isFinite(value) ? String(value) : fail ? fail(value) : "null";
          case "boolean":
            return value === true ? "true" : "false";
          case "undefined":
            return;
          case "bigint":
            if (bigint)
              return String(value);
          // fallthrough
          default:
            return fail ? fail(value) : void 0;
        }
      }
      function stringifyArrayReplacer(key, value, stack, replacer, spacer, indentation) {
        switch (typeof value == "object" && value !== null && typeof value.toJSON == "function" && (value = value.toJSON(key)), typeof value) {
          case "string":
            return strEscape(value);
          case "object": {
            if (value === null)
              return "null";
            if (stack.indexOf(value) !== -1)
              return circularValue;
            const originalIndentation = indentation;
            let res = "", join = ",";
            if (Array.isArray(value)) {
              if (value.length === 0)
                return "[]";
              if (maximumDepth < stack.length + 1)
                return '"[Array]"';
              stack.push(value), spacer !== "" && (indentation += spacer, res += `
${indentation}`, join = `,
${indentation}`);
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
              let i = 0;
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifyArrayReplacer(String(i), value[i], stack, replacer, spacer, indentation);
                res += tmp2 !== void 0 ? tmp2 : "null", res += join;
              }
              const tmp = stringifyArrayReplacer(String(i), value[i], stack, replacer, spacer, indentation);
              if (res += tmp !== void 0 ? tmp : "null", value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1;
                res += `${join}"... ${getItemCount(removedKeys)} not stringified"`;
              }
              return spacer !== "" && (res += `
${originalIndentation}`), stack.pop(), `[${res}]`;
            }
            stack.push(value);
            let whitespace = "";
            spacer !== "" && (indentation += spacer, join = `,
${indentation}`, whitespace = " ");
            let separator = "";
            for (const key2 of replacer) {
              const tmp = stringifyArrayReplacer(key2, value[key2], stack, replacer, spacer, indentation);
              tmp !== void 0 && (res += `${separator}${strEscape(key2)}:${whitespace}${tmp}`, separator = join);
            }
            return spacer !== "" && separator.length > 1 && (res = `
${indentation}${res}
${originalIndentation}`), stack.pop(), `{${res}}`;
          }
          case "number":
            return isFinite(value) ? String(value) : fail ? fail(value) : "null";
          case "boolean":
            return value === true ? "true" : "false";
          case "undefined":
            return;
          case "bigint":
            if (bigint)
              return String(value);
          // fallthrough
          default:
            return fail ? fail(value) : void 0;
        }
      }
      function stringifyIndent(key, value, stack, spacer, indentation) {
        switch (typeof value) {
          case "string":
            return strEscape(value);
          case "object": {
            if (value === null)
              return "null";
            if (typeof value.toJSON == "function") {
              if (value = value.toJSON(key), typeof value != "object")
                return stringifyIndent(key, value, stack, spacer, indentation);
              if (value === null)
                return "null";
            }
            if (stack.indexOf(value) !== -1)
              return circularValue;
            const originalIndentation = indentation;
            if (Array.isArray(value)) {
              if (value.length === 0)
                return "[]";
              if (maximumDepth < stack.length + 1)
                return '"[Array]"';
              stack.push(value), indentation += spacer;
              let res2 = `
${indentation}`;
              const join2 = `,
${indentation}`, maximumValuesToStringify = Math.min(value.length, maximumBreadth);
              let i = 0;
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifyIndent(String(i), value[i], stack, spacer, indentation);
                res2 += tmp2 !== void 0 ? tmp2 : "null", res2 += join2;
              }
              const tmp = stringifyIndent(String(i), value[i], stack, spacer, indentation);
              if (res2 += tmp !== void 0 ? tmp : "null", value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1;
                res2 += `${join2}"... ${getItemCount(removedKeys)} not stringified"`;
              }
              return res2 += `
${originalIndentation}`, stack.pop(), `[${res2}]`;
            }
            let keys = Object.keys(value);
            const keyLength = keys.length;
            if (keyLength === 0)
              return "{}";
            if (maximumDepth < stack.length + 1)
              return '"[Object]"';
            indentation += spacer;
            const join = `,
${indentation}`;
            let res = "", separator = "", maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth);
            isTypedArrayWithEntries(value) && (res += stringifyTypedArray(value, join, maximumBreadth), keys = keys.slice(value.length), maximumPropertiesToStringify -= value.length, separator = join), deterministic && (keys = sort(keys, comparator)), stack.push(value);
            for (let i = 0; i < maximumPropertiesToStringify; i++) {
              const key2 = keys[i], tmp = stringifyIndent(key2, value[key2], stack, spacer, indentation);
              tmp !== void 0 && (res += `${separator}${strEscape(key2)}: ${tmp}`, separator = join);
            }
            if (keyLength > maximumBreadth) {
              const removedKeys = keyLength - maximumBreadth;
              res += `${separator}"...": "${getItemCount(removedKeys)} not stringified"`, separator = join;
            }
            return separator !== "" && (res = `
${indentation}${res}
${originalIndentation}`), stack.pop(), `{${res}}`;
          }
          case "number":
            return isFinite(value) ? String(value) : fail ? fail(value) : "null";
          case "boolean":
            return value === true ? "true" : "false";
          case "undefined":
            return;
          case "bigint":
            if (bigint)
              return String(value);
          // fallthrough
          default:
            return fail ? fail(value) : void 0;
        }
      }
      function stringifySimple(key, value, stack) {
        switch (typeof value) {
          case "string":
            return strEscape(value);
          case "object": {
            if (value === null)
              return "null";
            if (typeof value.toJSON == "function") {
              if (value = value.toJSON(key), typeof value != "object")
                return stringifySimple(key, value, stack);
              if (value === null)
                return "null";
            }
            if (stack.indexOf(value) !== -1)
              return circularValue;
            let res = "";
            const hasLength = value.length !== void 0;
            if (hasLength && Array.isArray(value)) {
              if (value.length === 0)
                return "[]";
              if (maximumDepth < stack.length + 1)
                return '"[Array]"';
              stack.push(value);
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
              let i = 0;
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifySimple(String(i), value[i], stack);
                res += tmp2 !== void 0 ? tmp2 : "null", res += ",";
              }
              const tmp = stringifySimple(String(i), value[i], stack);
              if (res += tmp !== void 0 ? tmp : "null", value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1;
                res += `,"... ${getItemCount(removedKeys)} not stringified"`;
              }
              return stack.pop(), `[${res}]`;
            }
            let keys = Object.keys(value);
            const keyLength = keys.length;
            if (keyLength === 0)
              return "{}";
            if (maximumDepth < stack.length + 1)
              return '"[Object]"';
            let separator = "", maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth);
            hasLength && isTypedArrayWithEntries(value) && (res += stringifyTypedArray(value, ",", maximumBreadth), keys = keys.slice(value.length), maximumPropertiesToStringify -= value.length, separator = ","), deterministic && (keys = sort(keys, comparator)), stack.push(value);
            for (let i = 0; i < maximumPropertiesToStringify; i++) {
              const key2 = keys[i], tmp = stringifySimple(key2, value[key2], stack);
              tmp !== void 0 && (res += `${separator}${strEscape(key2)}:${tmp}`, separator = ",");
            }
            if (keyLength > maximumBreadth) {
              const removedKeys = keyLength - maximumBreadth;
              res += `${separator}"...":"${getItemCount(removedKeys)} not stringified"`;
            }
            return stack.pop(), `{${res}}`;
          }
          case "number":
            return isFinite(value) ? String(value) : fail ? fail(value) : "null";
          case "boolean":
            return value === true ? "true" : "false";
          case "undefined":
            return;
          case "bigint":
            if (bigint)
              return String(value);
          // fallthrough
          default:
            return fail ? fail(value) : void 0;
        }
      }
      function stringify2(value, replacer, space) {
        if (arguments.length > 1) {
          let spacer = "";
          if (typeof space == "number" ? spacer = " ".repeat(Math.min(space, 10)) : typeof space == "string" && (spacer = space.slice(0, 10)), replacer != null) {
            if (typeof replacer == "function")
              return stringifyFnReplacer("", { "": value }, [], replacer, spacer, "");
            if (Array.isArray(replacer))
              return stringifyArrayReplacer("", value, [], getUniqueReplacerSet(replacer), spacer, "");
          }
          if (spacer.length !== 0)
            return stringifyIndent("", value, [], spacer, "");
        }
        return stringifySimple("", value, []);
      }
      return stringify2;
    }
  }(safeStableStringify, safeStableStringify.exports)), safeStableStringify.exports;
}
var util, hasRequiredUtil;
function requireUtil() {
  if (hasRequiredUtil) return util;
  hasRequiredUtil = 1;
  function findMatchingIndexes(arrayA, arrayB) {
    const found = [];
    let lastIndexB = 0;
    for (let indexA = 0; indexA < arrayA.length; indexA++)
      for (let indexB = lastIndexB; indexB < arrayB.length; indexB++)
        arrayA[indexA] === arrayB[indexB] && (found.push(indexB), lastIndexB = indexB + 1);
    return found;
  }
  function findNotMatching(arrayA, arrayB) {
    const found = [];
    let lastIndexB = 0;
    for (let indexA = 0; indexA < arrayA.length; indexA++)
      for (let indexB = lastIndexB; indexB < arrayB.length; indexB++)
        arrayA[indexA] !== arrayB[indexB] && (found.push(arrayB[indexB]), lastIndexB = indexB + 1);
    return found;
  }
  function bsearchIndex(array, value) {
    let start = 0, end = array.length - 1;
    for (; start <= end; ) {
      const index = (start + end) / 2 | 0;
      if (array[index] === value)
        return index;
      array[index] < value ? start = index + 1 : end = index - 1;
    }
    return -1;
  }
  function randomNumber(max) {
    return max * Math.random() | 0;
  }
  function randomInRange(min, max) {
    return min = Math.floor(min), max = Math.floor(max), min + randomNumber(1 + max - min);
  }
  function randomSubset(array, size) {
    if (array.length < 1 || size < 1) return [];
    const limit = Math.min(array.length, size), n = randomInRange(1, limit), indexes = /* @__PURE__ */ new Set();
    for (let i = 0; i < n; i++)
      indexes.add(randomNumber(array.length));
    const result = [];
    for (const i of indexes)
      result.push(array[i]);
    return result;
  }
  function wildcardMatch(value, content) {
    if (value === "*" || value.length === content.length && value === content) return true;
    let i = 0, j = 0;
    for (; i < value.length && j < content.length; ) {
      if (value[i] === content[j]) {
        i++, j++;
        continue;
      }
      if (value[i] === "*") {
        if (value[i + 1] === content[j]) {
          i++;
          continue;
        }
        j++;
        continue;
      }
      return false;
    }
    return i >= value.length - 1;
  }
  function abstractLogging() {
    const noop = () => {
    };
    return {
      fatal: noop,
      error: noop,
      warn: noop,
      info: noop,
      debug: noop,
      trace: noop
    };
  }
  return util = {
    findNotMatching,
    findMatchingIndexes,
    bsearchIndex,
    wildcardMatch,
    randomSubset,
    abstractLogging,
    isServerSide: "undefined" > "u"
  }, util;
}
var _interface, hasRequired_interface;
function require_interface() {
  if (hasRequired_interface) return _interface;
  hasRequired_interface = 1;
  class StorageInterface {
    constructor(options) {
      this.options = options;
    }
    /**
     * @param {string} key
     * @returns {undefined|*} undefined if key not found
     */
    async get(key) {
      throw new Error("storage get method not implemented");
    }
    /**
     * @param {string} key
     * @param {*} value
     * @param {number} ttl - ttl in seconds; zero means key will not be stored
     * @param {?string[]} references
     */
    async set(key, value, ttl, references) {
      throw new Error("storage set method not implemented");
    }
    /**
     * @param {string} key
     */
    async remove(key) {
      throw new Error("storage remove method not implemented");
    }
    /**
     * @param {string[]} references
     */
    async invalidate(references) {
      throw new Error("storage invalidate method not implemented");
    }
    /**
     * @param {string} name
     */
    async clear(name) {
      throw new Error("storage clear method not implemented");
    }
    async refresh() {
      throw new Error("storage refresh method not implemented");
    }
  }
  return _interface = StorageInterface, _interface;
}
var redis, hasRequiredRedis;
function requireRedis() {
  if (hasRequiredRedis) return redis;
  hasRequiredRedis = 1;
  const stringify = requireSafeStableStringify(), StorageInterface = require_interface(), { findNotMatching, randomSubset, abstractLogging } = requireUtil(), GC_DEFAULT_CHUNK = 64, GC_DEFAULT_LAZY_CHUNK = 64, REFERENCES_DEFAULT_TTL = 60;
  class StorageRedis extends StorageInterface {
    /**
     * @param {?StorageRedisOptions} options
     */
    constructor(options = {}) {
      if (!options.client || typeof options.client != "object")
        throw new Error("Redis client is required");
      if (super(options), options.invalidation && options.invalidation.referencesTTL && (typeof options.invalidation.referencesTTL != "number" || options.invalidation.referencesTTL < 1))
        throw new Error("invalidation.referencesTTL must be a positive integer greater than 1");
      this.log = options.log || abstractLogging(), this.store = options.client, this.invalidation = !!options.invalidation, this.referencesTTL = options.invalidation && options.invalidation.referencesTTL || REFERENCES_DEFAULT_TTL;
    }
    getReferenceKeyLabel(reference) {
      return `r:${reference}`;
    }
    getKeyReferenceLabel(key) {
      return `k:${key}`;
    }
    /**
     * @param {string} key
     * @returns {undefined|*} undefined if key not found
     */
    async get(key) {
      this.log.debug({ msg: "acd/storage/redis.get", key });
      try {
        const value = await this.store.get(key);
        if (!value) {
          if (!this.invalidation)
            return;
          this.clearReferences(key);
          return;
        }
        return JSON.parse(value);
      } catch (err) {
        this.log.error({ msg: "acd/storage/redis.get error", err, key });
      }
    }
    /**
     * retrieve the remaining TTL value by key
     * @param {string} key
     * @returns {undefined|*} undefined if key not found or expired
     */
    async getTTL(key) {
      this.log.debug({ msg: "acd/storage/memory.getTTL", key });
      let pttl = await this.store.pttl(key);
      return pttl < 0 ? 0 : (pttl = Math.ceil(pttl / 1e3), pttl);
    }
    /**
     * set value by key
     * @param {string} key
     * @param {*} value
     * @param {number} ttl - ttl in seconds; zero means key will not be stored
     * @param {?string[]} references
     */
    async set(key, value, ttl, references) {
      if (this.log.debug({ msg: "acd/storage/redis.set key", key, value, ttl, references }), ttl = Number(ttl), !(!ttl || ttl < 0))
        try {
          if (await this.store.set(key, stringify(value), "EX", ttl), !references || references.length < 1)
            return;
          if (!this.invalidation) {
            this.log.warn({ msg: "acd/storage/redis.set, invalidation is disabled, references are useless", key, references });
            return;
          }
          const writes = [], currentReferences = await this.store.smembers(this.getKeyReferenceLabel(key));
          if (this.log.debug({ msg: "acd/storage/redis.set current references", key, currentReferences }), currentReferences.length > 1) {
            currentReferences.sort(), references.sort();
            const referencesToRemove = findNotMatching(references, currentReferences);
            for (const reference of referencesToRemove)
              writes.push(["srem", this.getReferenceKeyLabel(reference), key]);
            writes.push(["del", this.getKeyReferenceLabel(key)]);
          }
          const referencesToAdd = currentReferences.length > 1 ? findNotMatching(currentReferences, references) : references;
          this.log.debug({ msg: "acd/storage/redis.set references to add", key, referencesToAdd });
          for (let i = 0; i < referencesToAdd.length; i++) {
            const reference = referencesToAdd[i], referenceKeyLabel = this.getReferenceKeyLabel(reference);
            writes.push(["sadd", referenceKeyLabel, key]), writes.push(["expire", referenceKeyLabel, this.referencesTTL]);
          }
          const keyReferenceLabel = this.getKeyReferenceLabel(key);
          writes.push(["sadd", keyReferenceLabel, references]), writes.push(["expire", keyReferenceLabel, ttl]), this.log.debug({ msg: "acd/storage/redis.set references writes", writes }), await this.store.pipeline(writes).exec();
        } catch (err) {
          this.log.error({ msg: "acd/storage/redis.set error", err, key, ttl, references });
        }
    }
    /**
     * remove an entry by key
     * @param {string} key
     * @returns {boolean} indicates if key was removed
     */
    async remove(key) {
      this.log.debug({ msg: "acd/storage/redis.remove", key });
      try {
        const removed = await this.store.del(key) > 0;
        return removed && this.invalidation && await this.clearReferences(key), removed;
      } catch (err) {
        this.log.error({ msg: "acd/storage/redis.remove error", err, key });
      }
    }
    /**
     * @param {string|string[]} references
     * @returns {string[]} removed keys
     */
    async invalidate(references) {
      if (!this.invalidation)
        return this.log.warn({ msg: "acd/storage/redis.invalidate, exit due invalidation is disabled" }), [];
      this.log.debug({ msg: "acd/storage/redis.invalidate", references });
      try {
        return Array.isArray(references) ? await this._invalidateReferences(references) : await this._invalidateReference(references);
      } catch (err) {
        return this.log.error({ msg: "acd/storage/redis.invalidate error", err, references }), [];
      }
    }
    /**
     * @param {string[]} references
     * @param {[bool=true]} mapReferences
     * @returns {string[]} removed keys
     */
    async _invalidateReferences(references, mapReferences = true) {
      const reads = references.map((reference) => ["smembers", mapReferences ? this.getReferenceKeyLabel(reference) : reference]), keys = await this.store.pipeline(reads).exec();
      this.log.debug({ msg: "acd/storage/redis._invalidateReferences keys", keys });
      const writes = [], removed = [];
      for (let i = 0; i < keys.length; i++) {
        const key0 = keys[i][1];
        if (key0) {
          this.log.debug({ msg: "acd/storage/redis._invalidateReferences got keys to be invalidated", keys: key0 });
          for (let j = 0; j < key0.length; j++) {
            const key1 = key0[j];
            this.log.debug({ msg: "acd/storage/redis._invalidateReferences del key" + key1 }), removed.push(key1), writes.push(["del", key1]);
          }
        }
      }
      return await this.store.pipeline(writes).exec(), await this.clearReferences(removed), removed;
    }
    /**
     * @param {string} reference
     * @returns {string[]} removed keys
     */
    async _invalidateReference(reference) {
      let keys;
      if (reference.includes("*")) {
        const references = await this.store.keys(this.getReferenceKeyLabel(reference));
        return this._invalidateReferences(references, false);
      } else
        keys = await this.store.smembers(this.getReferenceKeyLabel(reference));
      this.log.debug({ msg: "acd/storage/redis._invalidateReference keys", keys });
      const writes = [], removed = [];
      for (let i = 0; i < keys.length; i++) {
        const key0 = keys[i];
        this.log.debug({ msg: "acd/storage/redis._invalidateReference del key" + key0 }), removed.push(key0), writes.push(["del", key0]);
      }
      return await this.store.pipeline(writes).exec(), await this.clearReferences(removed), removed;
    }
    /**
     * @param {string} name
     */
    async clear(name) {
      this.log.debug({ msg: "acd/storage/redis.clear", name });
      try {
        if (!name) {
          await this.store.flushall();
          return;
        }
        const keys = await this.store.keys(`${name}*`);
        this.log.debug({ msg: "acd/storage/redis.clear keys", keys });
        const removes = keys.map((key) => ["del", key]);
        if (await this.store.pipeline(removes).exec(), !this.invalidation)
          return;
        await this.clearReferences(keys);
      } catch (err) {
        this.log.error({ msg: "acd/storage/redis.clear error", err, name });
      }
    }
    async refresh() {
      try {
        await this.store.flushall();
      } catch (err) {
        this.log.error({ msg: "acd/storage/redis.refresh error", err });
      }
    }
    /**
     * note: does not throw on error
     * @param {string|string[]} keys
     */
    async clearReferences(keys) {
      try {
        if (!keys) {
          this.log.warn({ msg: "acd/storage/redis.clearReferences invalid call due to empty key" });
          return;
        }
        Array.isArray(keys) || (keys = [keys]);
        const reads = keys.map((key) => ["smembers", this.getKeyReferenceLabel(key)]), referencesKeys = await this.store.pipeline(reads).exec();
        this.log.debug({ msg: "acd/storage/redis.clearReferences references", keys, referencesKeys });
        const writes = {};
        for (let i = 0; i < keys.length; i++) {
          for (let j = 0; j < referencesKeys[i][1].length; j++) {
            const reference = this.getReferenceKeyLabel(referencesKeys[i][1][j]);
            writes[reference] || (writes[reference] = ["srem", reference, keys]);
          }
          const key = this.getKeyReferenceLabel(keys[i]);
          writes[key] = ["del", key];
        }
        this.log.debug({ msg: "acd/storage/redis.clearReferences writes pipeline", writes }), await this.store.pipeline(Object.values(writes)).exec();
      } catch (err) {
        this.log.error({ msg: "acd/storage/redis.clearReferences error", err });
      }
    }
    /**
     * scan references and clean expired/evicted keys
     * @param {?string} [mode=lazy] lazy or strict
     * - in lazy mode, only `options.max` references are scanned every time, picking keys to check randomly
     *   so this operation is lighter while does not ensure references full clean up
     * - in strict mode, all references and keys are checked
     *   this operation scan the whole db and is slow
     * @param {?object} options
     * @param {number} [options.chunk=64] number of references to retrieve at once
     * @param {number|undefined} [options.lazy.cursor] cursor to start the scan; should be last cursor returned by scan; default start from the beginning
     * @param {number} [lazyChunk=64] number of references to check per gc cycle
     * @return {Object} report information of the operation
     *   references scanned/removed, keys scanned/removed, loops, cursor, error if any
     */
    async gc(mode = "lazy", options = {}) {
      if (this.log.debug({ msg: "acd/storage/redis.gc", mode, options }), !this.invalidation) {
        this.log.warn({ msg: "acd/storage/redis.gc does not run due to invalidation is disabled" });
        return;
      }
      mode !== "strict" && mode !== "lazy" && (mode = "lazy");
      const report = {
        references: { scanned: [], removed: [] },
        keys: { scanned: /* @__PURE__ */ new Set(), removed: /* @__PURE__ */ new Set() },
        loops: 0,
        cursor: 0,
        error: null
      };
      try {
        let cursor = 0, lazyChunk = GC_DEFAULT_LAZY_CHUNK;
        if (options.chunk && (typeof options.chunk != "number" || options.chunk < 1))
          return report.error = new Error("chunk must be a positive integer greater than 1"), report;
        if (options.lazy) {
          if (options.lazy.chunk) {
            if (typeof options.lazy.chunk != "number" || options.lazy.chunk < 1)
              return report.error = new Error("lazy.chunk must be a positive integer greater than 1"), report;
            lazyChunk = options.lazy.chunk;
          }
          if (options.lazy.cursor) {
            if (typeof options.lazy.cursor != "number" || options.lazy.cursor < 0)
              return report.error = new Error("lazy.cursor must be a positive integer greater than 0"), report;
            cursor = options.lazy.cursor;
          }
        }
        const chunk = options.chunk || GC_DEFAULT_CHUNK, scanCount = Math.min(lazyChunk, chunk), startingCursor = cursor;
        let lastScanLength = -1, lastRemoved = -1;
        do {
          report.loops++;
          const scan = await this.store.scan(cursor, "match", "r:*", "count", scanCount);
          cursor = Number(scan[0]), lastScanLength = scan[1].length;
          const references = mode === "lazy" ? randomSubset(scan[1], lazyChunk) : scan[1];
          report.references.scanned = report.references.scanned.concat(references);
          let reads = [];
          for (let i = 0; i < references.length; i++) {
            const reference = references[i];
            reads.push(["smembers", reference]);
          }
          const referencesKeys = await this.store.pipeline(reads).exec(), keysMap = {}, referencesKeysMap = {};
          for (let i = 0; i < referencesKeys.length; i++) {
            const keys2 = referencesKeys[i], reference = references[i];
            referencesKeysMap[reference] = keys2[1];
            for (let j = 0; j < keys2[1].length; j++) {
              const key = keys2[1][j];
              keysMap[key] ? keysMap[key].push(reference) : keysMap[key] = [reference], report.keys.scanned.add(key);
            }
          }
          const keys = Object.keys(keysMap);
          reads = keys.map((key) => ["exists", key]);
          const existingKeys = await this.store.pipeline(reads).exec(), removingKeys = {};
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (existingKeys[i][1] !== 1)
              for (let j = 0; j < keysMap[key].length; j++) {
                const reference = keysMap[key][j];
                removingKeys[reference] ? removingKeys[reference].push(key) : removingKeys[reference] = [key], report.keys.removed.add(key);
              }
          }
          const writeReferences = Object.keys(removingKeys), writes = [];
          for (let i = 0; i < writeReferences.length; i++) {
            const reference = writeReferences[i];
            referencesKeysMap[reference].length === removingKeys[reference].length ? (writes.push(["del", reference]), report.references.removed.push(reference)) : writes.push(["srem", reference, removingKeys[reference]]);
          }
          if (await this.store.pipeline(writes).exec(), lastRemoved = writes.length, mode === "lazy" && report.references.scanned.length >= lazyChunk)
            break;
        } while (startingCursor !== cursor && lastScanLength > 0 && lastRemoved > 0);
        report.cursor = cursor, report.keys.scanned = Array.from(report.keys.scanned), report.keys.removed = Array.from(report.keys.removed);
      } catch (err) {
        this.log.error({ msg: "acd/storage/redis.gc error", err }), report.error = err;
      }
      return report;
    }
  }
  return redis = StorageRedis, redis;
}
var iterator, hasRequiredIterator;
function requireIterator() {
  if (hasRequiredIterator) return iterator;
  hasRequiredIterator = 1;
  function Iterator(next) {
    if (typeof next != "function")
      throw new Error("obliterator/iterator: expecting a function!");
    this.next = next;
  }
  return typeof Symbol < "u" && (Iterator.prototype[Symbol.iterator] = function() {
    return this;
  }), Iterator.of = function() {
    var args = arguments, l = args.length, i = 0;
    return new Iterator(function() {
      return i >= l ? { done: true } : { done: false, value: args[i++] };
    });
  }, Iterator.empty = function() {
    var iterator2 = new Iterator(function() {
      return { done: true };
    });
    return iterator2;
  }, Iterator.fromSequence = function(sequence) {
    var i = 0, l = sequence.length;
    return new Iterator(function() {
      return i >= l ? { done: true } : { done: false, value: sequence[i++] };
    });
  }, Iterator.is = function(value) {
    return value instanceof Iterator ? true : typeof value == "object" && value !== null && typeof value.next == "function";
  }, iterator = Iterator, iterator;
}
var support = {}, hasRequiredSupport;
function requireSupport() {
  return hasRequiredSupport || (hasRequiredSupport = 1, support.ARRAY_BUFFER_SUPPORT = typeof ArrayBuffer < "u", support.SYMBOL_SUPPORT = typeof Symbol < "u"), support;
}
var foreach, hasRequiredForeach;
function requireForeach() {
  if (hasRequiredForeach) return foreach;
  hasRequiredForeach = 1;
  var support2 = requireSupport(), ARRAY_BUFFER_SUPPORT = support2.ARRAY_BUFFER_SUPPORT, SYMBOL_SUPPORT = support2.SYMBOL_SUPPORT;
  return foreach = function(iterable, callback) {
    var iterator2, k, i, l, s;
    if (!iterable) throw new Error("obliterator/forEach: invalid iterable.");
    if (typeof callback != "function")
      throw new Error("obliterator/forEach: expecting a callback.");
    if (Array.isArray(iterable) || ARRAY_BUFFER_SUPPORT && ArrayBuffer.isView(iterable) || typeof iterable == "string" || iterable.toString() === "[object Arguments]") {
      for (i = 0, l = iterable.length; i < l; i++) callback(iterable[i], i);
      return;
    }
    if (typeof iterable.forEach == "function") {
      iterable.forEach(callback);
      return;
    }
    if (SYMBOL_SUPPORT && Symbol.iterator in iterable && typeof iterable.next != "function" && (iterable = iterable[Symbol.iterator]()), typeof iterable.next == "function") {
      for (iterator2 = iterable, i = 0; s = iterator2.next(), s.done !== true; )
        callback(s.value, i), i++;
      return;
    }
    for (k in iterable)
      iterable.hasOwnProperty(k) && callback(iterable[k], k);
  }, foreach;
}
var typedArrays = {}, hasRequiredTypedArrays;
function requireTypedArrays() {
  return hasRequiredTypedArrays || (hasRequiredTypedArrays = 1, function(exports) {
    var MAX_8BIT_INTEGER = Math.pow(2, 8) - 1, MAX_16BIT_INTEGER = Math.pow(2, 16) - 1, MAX_32BIT_INTEGER = Math.pow(2, 32) - 1, MAX_SIGNED_8BIT_INTEGER = Math.pow(2, 7) - 1, MAX_SIGNED_16BIT_INTEGER = Math.pow(2, 15) - 1, MAX_SIGNED_32BIT_INTEGER = Math.pow(2, 31) - 1;
    exports.getPointerArray = function(size) {
      var maxIndex = size - 1;
      if (maxIndex <= MAX_8BIT_INTEGER)
        return Uint8Array;
      if (maxIndex <= MAX_16BIT_INTEGER)
        return Uint16Array;
      if (maxIndex <= MAX_32BIT_INTEGER)
        return Uint32Array;
      throw new Error("mnemonist: Pointer Array of size > 4294967295 is not supported.");
    }, exports.getSignedPointerArray = function(size) {
      var maxIndex = size - 1;
      return maxIndex <= MAX_SIGNED_8BIT_INTEGER ? Int8Array : maxIndex <= MAX_SIGNED_16BIT_INTEGER ? Int16Array : maxIndex <= MAX_SIGNED_32BIT_INTEGER ? Int32Array : Float64Array;
    }, exports.getNumberType = function(value) {
      return value === (value | 0) ? Math.sign(value) === -1 ? value <= 127 && value >= -128 ? Int8Array : value <= 32767 && value >= -32768 ? Int16Array : Int32Array : value <= 255 ? Uint8Array : value <= 65535 ? Uint16Array : Uint32Array : Float64Array;
    };
    var TYPE_PRIORITY = {
      Uint8Array: 1,
      Int8Array: 2,
      Uint16Array: 3,
      Int16Array: 4,
      Uint32Array: 5,
      Int32Array: 6,
      Float32Array: 7,
      Float64Array: 8
    };
    exports.getMinimalRepresentation = function(array, getter) {
      var maxType = null, maxPriority = 0, p, t, v, i, l;
      for (i = 0, l = array.length; i < l; i++)
        v = getter ? getter(array[i]) : array[i], t = exports.getNumberType(v), p = TYPE_PRIORITY[t.name], p > maxPriority && (maxPriority = p, maxType = t);
      return maxType;
    }, exports.isTypedArray = function(value) {
      return typeof ArrayBuffer < "u" && ArrayBuffer.isView(value);
    }, exports.concat = function() {
      var length = 0, i, o, l;
      for (i = 0, l = arguments.length; i < l; i++)
        length += arguments[i].length;
      var array = new arguments[0].constructor(length);
      for (i = 0, o = 0; i < l; i++)
        array.set(arguments[i], o), o += arguments[i].length;
      return array;
    }, exports.indices = function(length) {
      for (var PointerArray = exports.getPointerArray(length), array = new PointerArray(length), i = 0; i < length; i++)
        array[i] = i;
      return array;
    };
  }(typedArrays)), typedArrays;
}
var iterables = {}, hasRequiredIterables;
function requireIterables() {
  if (hasRequiredIterables) return iterables;
  hasRequiredIterables = 1;
  var forEach = requireForeach(), typed = requireTypedArrays();
  function isArrayLike(target) {
    return Array.isArray(target) || typed.isTypedArray(target);
  }
  function guessLength(target) {
    if (typeof target.length == "number")
      return target.length;
    if (typeof target.size == "number")
      return target.size;
  }
  function toArray(target) {
    var l = guessLength(target), array = typeof l == "number" ? new Array(l) : [], i = 0;
    return forEach(target, function(value) {
      array[i++] = value;
    }), array;
  }
  function toArrayWithIndices(target) {
    var l = guessLength(target), IndexArray = typeof l == "number" ? typed.getPointerArray(l) : Array, array = typeof l == "number" ? new Array(l) : [], indices = typeof l == "number" ? new IndexArray(l) : [], i = 0;
    return forEach(target, function(value) {
      array[i] = value, indices[i] = i++;
    }), [array, indices];
  }
  return iterables.isArrayLike = isArrayLike, iterables.guessLength = guessLength, iterables.toArray = toArray, iterables.toArrayWithIndices = toArrayWithIndices, iterables;
}
var lruCache, hasRequiredLruCache;
function requireLruCache() {
  if (hasRequiredLruCache) return lruCache;
  hasRequiredLruCache = 1;
  var Iterator = requireIterator(), forEach = requireForeach(), typed = requireTypedArrays(), iterables2 = requireIterables();
  function LRUCache(Keys, Values, capacity) {
    if (arguments.length < 2 && (capacity = Keys, Keys = null, Values = null), this.capacity = capacity, typeof this.capacity != "number" || this.capacity <= 0)
      throw new Error("mnemonist/lru-cache: capacity should be positive number.");
    if (!isFinite(this.capacity) || Math.floor(this.capacity) !== this.capacity)
      throw new Error("mnemonist/lru-cache: capacity should be a finite positive integer.");
    var PointerArray = typed.getPointerArray(capacity);
    this.forward = new PointerArray(capacity), this.backward = new PointerArray(capacity), this.K = typeof Keys == "function" ? new Keys(capacity) : new Array(capacity), this.V = typeof Values == "function" ? new Values(capacity) : new Array(capacity), this.size = 0, this.head = 0, this.tail = 0, this.items = {};
  }
  return LRUCache.prototype.clear = function() {
    this.size = 0, this.head = 0, this.tail = 0, this.items = {};
  }, LRUCache.prototype.splayOnTop = function(pointer) {
    var oldHead = this.head;
    if (this.head === pointer)
      return this;
    var previous = this.backward[pointer], next = this.forward[pointer];
    return this.tail === pointer ? this.tail = previous : this.backward[next] = previous, this.forward[previous] = next, this.backward[oldHead] = pointer, this.head = pointer, this.forward[pointer] = oldHead, this;
  }, LRUCache.prototype.set = function(key, value) {
    var pointer = this.items[key];
    if (typeof pointer < "u") {
      this.splayOnTop(pointer), this.V[pointer] = value;
      return;
    }
    this.size < this.capacity ? pointer = this.size++ : (pointer = this.tail, this.tail = this.backward[pointer], delete this.items[this.K[pointer]]), this.items[key] = pointer, this.K[pointer] = key, this.V[pointer] = value, this.forward[pointer] = this.head, this.backward[this.head] = pointer, this.head = pointer;
  }, LRUCache.prototype.setpop = function(key, value) {
    var oldValue = null, oldKey = null, pointer = this.items[key];
    return typeof pointer < "u" ? (this.splayOnTop(pointer), oldValue = this.V[pointer], this.V[pointer] = value, { evicted: false, key, value: oldValue }) : (this.size < this.capacity ? pointer = this.size++ : (pointer = this.tail, this.tail = this.backward[pointer], oldValue = this.V[pointer], oldKey = this.K[pointer], delete this.items[oldKey]), this.items[key] = pointer, this.K[pointer] = key, this.V[pointer] = value, this.forward[pointer] = this.head, this.backward[this.head] = pointer, this.head = pointer, oldKey ? { evicted: true, key: oldKey, value: oldValue } : null);
  }, LRUCache.prototype.has = function(key) {
    return key in this.items;
  }, LRUCache.prototype.get = function(key) {
    var pointer = this.items[key];
    if (!(typeof pointer > "u"))
      return this.splayOnTop(pointer), this.V[pointer];
  }, LRUCache.prototype.peek = function(key) {
    var pointer = this.items[key];
    if (!(typeof pointer > "u"))
      return this.V[pointer];
  }, LRUCache.prototype.forEach = function(callback, scope) {
    scope = arguments.length > 1 ? scope : this;
    for (var i = 0, l = this.size, pointer = this.head, keys = this.K, values = this.V, forward = this.forward; i < l; )
      callback.call(scope, values[pointer], keys[pointer], this), pointer = forward[pointer], i++;
  }, LRUCache.prototype.keys = function() {
    var i = 0, l = this.size, pointer = this.head, keys = this.K, forward = this.forward;
    return new Iterator(function() {
      if (i >= l)
        return { done: true };
      var key = keys[pointer];
      return i++, i < l && (pointer = forward[pointer]), {
        done: false,
        value: key
      };
    });
  }, LRUCache.prototype.values = function() {
    var i = 0, l = this.size, pointer = this.head, values = this.V, forward = this.forward;
    return new Iterator(function() {
      if (i >= l)
        return { done: true };
      var value = values[pointer];
      return i++, i < l && (pointer = forward[pointer]), {
        done: false,
        value
      };
    });
  }, LRUCache.prototype.entries = function() {
    var i = 0, l = this.size, pointer = this.head, keys = this.K, values = this.V, forward = this.forward;
    return new Iterator(function() {
      if (i >= l)
        return { done: true };
      var key = keys[pointer], value = values[pointer];
      return i++, i < l && (pointer = forward[pointer]), {
        done: false,
        value: [key, value]
      };
    });
  }, typeof Symbol < "u" && (LRUCache.prototype[Symbol.iterator] = LRUCache.prototype.entries), LRUCache.prototype.inspect = function() {
    for (var proxy = /* @__PURE__ */ new Map(), iterator2 = this.entries(), step; step = iterator2.next(), !step.done; )
      proxy.set(step.value[0], step.value[1]);
    return Object.defineProperty(proxy, "constructor", {
      value: LRUCache,
      enumerable: false
    }), proxy;
  }, typeof Symbol < "u" && (LRUCache.prototype[Symbol.for("nodejs.util.inspect.custom")] = LRUCache.prototype.inspect), LRUCache.from = function(iterable, Keys, Values, capacity) {
    if (arguments.length < 2) {
      if (capacity = iterables2.guessLength(iterable), typeof capacity != "number")
        throw new Error("mnemonist/lru-cache.from: could not guess iterable length. Please provide desired capacity as last argument.");
    } else arguments.length === 2 && (capacity = Keys, Keys = null, Values = null);
    var cache2 = new LRUCache(Keys, Values, capacity);
    return forEach(iterable, function(value, key) {
      cache2.set(key, value);
    }), cache2;
  }, lruCache = LRUCache, lruCache;
}
var memory, hasRequiredMemory;
function requireMemory() {
  if (hasRequiredMemory) return memory;
  hasRequiredMemory = 1;
  const LRUCache = requireLruCache(), { abstractLogging } = requireUtil(), StorageInterface = require_interface(), { findMatchingIndexes, findNotMatching, bsearchIndex, wildcardMatch } = requireUtil(), setImmediate = typeof globalThis.setImmediate < "u" ? globalThis.setImmediate : (fn, ...args) => setTimeout(fn, 0, ...args), DEFAULT_CACHE_SIZE = 1024;
  class StorageMemory extends StorageInterface {
    /**
     * in-memory storage
     * @param {StorageMemoryOptions} options
     */
    constructor(options = {}) {
      if (options.size && (typeof options.size != "number" || options.size < 1))
        throw new Error("size must be a positive integer greater than 0");
      super(options), this.size = options.size || DEFAULT_CACHE_SIZE, this.log = options.log || abstractLogging(), this.invalidation = options.invalidation || false, this.init();
    }
    init() {
      this.store = new LRUCache(this.size), this.invalidation && (this.keysReferences = /* @__PURE__ */ new Map(), this.referencesKeys = /* @__PURE__ */ new Map());
    }
    /**
     * retrieve the value by key
     * @param {string} key
     * @returns {undefined|*} undefined if key not found or expired
     */
    get(key) {
      this.log.debug({ msg: "acd/storage/memory.get", key });
      const entry = this.store.get(key);
      if (entry) {
        if (this.log.debug({ msg: "acd/storage/memory.get, entry", entry, now: now() }), entry.start + entry.ttl > now())
          return this.log.debug({ msg: "acd/storage/memory.get, key is NOT expired", key, entry }), entry.value;
        this.log.debug({ msg: "acd/storage/memory.get, key is EXPIRED", key, entry }), setImmediate(() => this.remove(key));
      }
    }
    /**
     * retrieve the remaining TTL value by key
     * @param {string} key
     * @returns {undefined|*} undefined if key not found or expired
     */
    getTTL(key) {
      this.log.debug({ msg: "acd/storage/memory.getTTL", key });
      const entry = this.store.peek(key);
      let ttl = 0;
      return entry && (ttl = entry.start + entry.ttl - now(), ttl < 0 && (ttl = 0)), ttl;
    }
    /**
     * set value by key
     * @param {string} key
     * @param {*} value
     * @param {?number} [ttl=0] - ttl in seconds; zero means key will not be stored
     * @param {?string[]} references
     */
    set(key, value, ttl, references) {
      if (this.log.debug({ msg: "acd/storage/memory.set", key, value, ttl, references }), ttl = Number(ttl), !ttl || ttl < 0)
        return;
      const existingKey = this.store.has(key), removed = this.store.setpop(key, { value, ttl, start: now() });
      if (this.log.debug({ msg: "acd/storage/memory.set, evicted", removed }), removed && removed.evicted && (this.log.debug({ msg: "acd/storage/memory.set, remove evicted key", key: removed.key }), this._removeReferences([removed.key])), !references || references.length < 1)
        return;
      if (!this.invalidation) {
        this.log.warn({ msg: "acd/storage/memory.set, invalidation is disabled, references are useless" });
        return;
      }
      references = [...new Set(references)];
      let currentReferences;
      if (existingKey && (currentReferences = this.keysReferences.get(key), this.log.debug({ msg: "acd/storage/memory.set, current keys-references", key, references: currentReferences }), currentReferences)) {
        currentReferences.sort(), references.sort();
        const referencesToRemove = findNotMatching(references, currentReferences);
        for (const reference of referencesToRemove) {
          const keys = this.referencesKeys.get(reference);
          if (!keys)
            continue;
          const index = bsearchIndex(keys, key);
          if (!(index < 0)) {
            if (keys.splice(index, 1), keys.length < 1) {
              this.referencesKeys.delete(reference);
              continue;
            }
            this.referencesKeys.set(reference, keys);
          }
        }
      }
      const referencesToAdd = currentReferences ? findNotMatching(currentReferences, references) : references;
      for (let i = 0; i < referencesToAdd.length; i++) {
        const reference = referencesToAdd[i];
        let keys = this.referencesKeys.get(reference);
        keys ? (this.log.debug({ msg: "acd/storage/memory.set, add reference-key", key, reference }), keys.push(key)) : keys = [key], this.log.debug({ msg: "acd/storage/memory.set, set reference-keys", keys, reference }), this.referencesKeys.set(reference, keys);
      }
      this.keysReferences.set(key, references);
    }
    /**
     * remove an entry by key
     * @param {string} key
     * @returns {boolean} indicates if key was removed
     */
    remove(key) {
      this.log.debug({ msg: "acd/storage/memory.remove", key });
      const removed = this._removeKey(key);
      return this._removeReferences([key]), removed;
    }
    /**
     * @param {string} key
     * @returns {boolean}
     */
    _removeKey(key) {
      return this.log.debug({ msg: "acd/storage/memory._removeKey", key }), this.store.has(key) ? (this.store.set(key, void 0), true) : false;
    }
    /**
     * @param {string[]} keys
     */
    _removeReferences(keys) {
      if (!this.invalidation)
        return;
      this.log.debug({ msg: "acd/storage/memory._removeReferences", keys });
      const referencesToRemove = /* @__PURE__ */ new Set();
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i], references = this.keysReferences.get(key);
        if (references) {
          for (let j = 0; j < references.length; j++)
            referencesToRemove.add(references[j]);
          this.log.debug({ msg: "acd/storage/memory._removeReferences, delete key-references", key }), this.keysReferences.delete(key);
        }
      }
      this._removeReferencesKeys([...referencesToRemove], keys);
    }
    /**
     * @param {!string[]} references
     * @param {string[]} keys
     */
    _removeReferencesKeys(references, keys) {
      keys.sort(), this.log.debug({ msg: "acd/storage/memory._removeReferencesKeys", references, keys });
      for (let i = 0; i < references.length; i++) {
        const reference = references[i], referencesKeys = this.referencesKeys.get(reference);
        if (this.log.debug({ msg: "acd/storage/memory._removeReferencesKeys, get reference-key", reference, keys, referencesKeys }), !referencesKeys) continue;
        const referencesToRemove = findMatchingIndexes(keys, referencesKeys);
        if (this.log.debug({ msg: "acd/storage/memory._removeReferencesKeys, removing", reference, referencesToRemove, referencesKeys }), referencesToRemove.length === referencesKeys.length) {
          this.log.debug({ msg: "acd/storage/memory._removeReferencesKeys, delete", reference }), this.referencesKeys.delete(reference);
          continue;
        }
        for (let j = referencesToRemove.length - 1; j >= 0; j--)
          this.log.debug({ msg: "acd/storage/memory._removeReferencesKeys, remove", reference, referencesKeys, at: referencesToRemove[j] }), referencesKeys.splice(referencesToRemove[j], 1);
      }
    }
    /**
     * @param {string|string[]} references
     * @returns {string[]} removed keys
     */
    invalidate(references) {
      return this.invalidation ? (this.log.debug({ msg: "acd/storage/memory.invalidate", references }), Array.isArray(references) ? this._invalidateReferences(references) : this._invalidateReference(references)) : (this.log.warn({ msg: "acd/storage/memory.invalidate, exit due invalidation is disabled" }), []);
    }
    /**
     * @param {string[]} references
     * @returns {string[]} removed keys
     */
    _invalidateReferences(references) {
      const removed = [];
      for (let i = 0; i < references.length; i++) {
        const reference = references[i], keys = this.referencesKeys.get(reference);
        if (this.log.debug({ msg: "acd/storage/memory._invalidateReferences, remove keys on reference", reference, keys }), !!keys) {
          for (let j = 0; j < keys.length; j++) {
            const key = keys[j];
            this.log.debug({ msg: "acd/storage/memory._invalidateReferences, remove key on reference", reference, key }), this._removeKey(key) && removed.push(key);
          }
          this.log.debug({ msg: "acd/storage/memory._invalidateReferences, remove references of", reference, keys }), this._removeReferences([...keys]);
        }
      }
      return removed;
    }
    /**
     * @param {string} reference
     * @returns {string[]} removed keys
     */
    _invalidateReference(reference) {
      if (reference.includes("*")) {
        const references = [];
        for (const key of this.referencesKeys.keys())
          wildcardMatch(reference, key) && references.push(key);
        return this._invalidateReferences(references);
      }
      const keys = this.referencesKeys.get(reference), removed = [];
      if (this.log.debug({ msg: "acd/storage/memory._invalidateReference, remove keys on reference", reference, keys }), !keys)
        return removed;
      for (let j = 0; j < keys.length; j++) {
        const key = keys[j];
        this.log.debug({ msg: "acd/storage/memory._invalidateReference, remove key on reference", reference, key }), this._removeKey(key) && removed.push(key);
      }
      return this.log.debug({ msg: "acd/storage/memory._invalidateReference, remove references of", reference, keys }), this._removeReferences([...keys]), removed;
    }
    /**
     * remove all entries if name is not provided
     * remove entries where key starts with name if provided
     * @param {?string} name
     * @return {string[]} removed keys
     */
    clear(name) {
      if (this.log.debug({ msg: "acd/storage/memory.clear", name }), !name) {
        if (this.store.clear(), !this.invalidation)
          return;
        this.referencesKeys.clear(), this.keysReferences.clear();
        return;
      }
      const keys = [];
      this.store.forEach((value, key) => {
        this.log.debug({ msg: "acd/storage/memory.clear, iterate key", key }), key.indexOf(name) === 0 && (this.log.debug({ msg: "acd/storage/memory.clear, remove key", key }), keys.push(key));
      });
      const removed = [];
      for (let i = 0; i < keys.length; i++)
        this._removeKey(keys[i]) && removed.push(keys[i]);
      return this._removeReferences(removed), removed;
    }
    refresh() {
      this.log.debug({ msg: "acd/storage/memory.refresh" }), this.init();
    }
  }
  let _timer;
  function now() {
    if (_timer !== void 0)
      return _timer;
    _timer = Math.floor(Date.now() / 1e3);
    const timeout = setTimeout(_clearTimer, 1e3);
    return typeof timeout.unref == "function" && timeout.unref(), _timer;
  }
  function _clearTimer() {
    _timer = void 0;
  }
  return memory = StorageMemory, memory;
}
var storage, hasRequiredStorage;
function requireStorage() {
  if (hasRequiredStorage) return storage;
  hasRequiredStorage = 1;
  const { isServerSide } = requireUtil();
  let StorageRedis;
  isServerSide && (StorageRedis = requireRedis());
  const StorageMemory = requireMemory(), StorageOptionsType = {
    redis: "redis"
  };
  function createStorage(type, options) {
    if (!isServerSide && type === StorageOptionsType.redis)
      throw new Error("Redis storage is not supported in the browser");
    return type === StorageOptionsType.redis ? new StorageRedis(options) : new StorageMemory(options);
  }
  return storage = createStorage, storage;
}
var hasRequiredCache;
function requireCache() {
  if (hasRequiredCache) return cache;
  hasRequiredCache = 1;
  const { kValues, kStorage, kStorages, kTransfromer, kTTL, kOnDedupe, kOnError, kOnHit, kOnMiss, kStale } = requireSymbol(), stringify = requireSafeStableStringify(), createStorage = requireStorage();
  class Cache {
    /**
     * @param {!Object} opts
     * @param {!Storage} opts.storage - the storage to use
     * @param {?Object} opts.transformer - the transformer to use
     * @param {?number} [opts.ttl=0] - in seconds; default is 0 seconds, so it only does dedupe without cache
     * @param {?function} opts.onDedupe
     * @param {?function} opts.onError
     * @param {?function} opts.onHit
     * @param {?function} opts.onMiss
     */
    constructor(options = {}) {
      if (!options.storage)
        throw new Error("storage is required");
      if (options.ttl && typeof options.ttl == "number" && (options.ttl < 0 || !Number.isInteger(options.ttl)))
        throw new Error("ttl must be a positive integer greater than 0");
      if (options.onDedupe && typeof options.onDedupe != "function")
        throw new Error("onDedupe must be a function");
      if (options.onError && typeof options.onError != "function")
        throw new Error("onError must be a function");
      if (options.onHit && typeof options.onHit != "function")
        throw new Error("onHit must be a function");
      if (options.onMiss && typeof options.onMiss != "function")
        throw new Error("onMiss must be a function");
      if (typeof options.stale == "number" && !(Math.floor(options.stale) === options.stale && options.stale >= 0))
        throw new Error("stale must be an integer greater or equal to 0");
      this[kValues] = {}, this[kStorage] = options.storage, this[kStorages] = /* @__PURE__ */ new Map(), this[kStorages].set("_default", options.storage), this[kTransfromer] = options.transformer, this[kTTL] = options.ttl || 0, this[kOnDedupe] = options.onDedupe || noop, this[kOnError] = options.onError || noop, this[kOnHit] = options.onHit || noop, this[kOnMiss] = options.onMiss || noop, this[kStale] = options.stale || 0;
    }
    /**
     * add a new function to dedupe (and cache)
     * @param {!string} name name of the function
     * @param {?Object} [opts]
     * @param {?Object} [opts.storage] storage to use; default is the main one
     * @param {?Object} opts.transformer - the transformer to use
     * @param {?number} [opts.ttl] ttl for the results; default ttl is the one passed to the constructor
     * @param {?function} [opts.onDedupe] function to call on dedupe; default is the one passed to the constructor
     * @param {?function} [opts.onError] function to call on error; default is the one passed to the constructor
     * @param {?function} [opts.onHit] function to call on hit; default is the one passed to the constructor
     * @param {?function} [opts.onMiss] function to call on miss; default is the one passed to the constructor
     * @param {?function} [opts.serialize] custom function to serialize the arguments of `func`, in order to create the key for deduping and caching
     * @param {?function} [opts.references] function to generate references
     * @param {!function} func the function to dedupe (and cache)
     **/
    define(name, opts, func) {
      if (typeof opts == "function" && (func = opts, opts = {}), name && this[name])
        throw new Error(`${name} is already defined in the cache or it is a forbidden name`);
      if (opts = opts || {}, typeof func != "function")
        throw new TypeError(`Missing the function parameter for '${name}'`);
      const serialize = opts.serialize;
      if (serialize && typeof serialize != "function")
        throw new TypeError("serialize must be a function");
      const references = opts.references;
      if (references && typeof references != "function")
        throw new TypeError("references must be a function");
      if (typeof opts.ttl != "function" && opts.ttl && (typeof opts.ttl != "number" || opts.ttl < 0 || !Number.isInteger(opts.ttl)))
        throw new Error("ttl must be a positive integer greater than 0");
      let storage2;
      opts.storage ? (storage2 = createStorage(opts.storage.type, opts.storage.options), this[kStorages].set(name, storage2)) : storage2 = this[kStorage];
      const ttl = opts.ttl !== void 0 ? opts.ttl : this[kTTL], stale = opts.stale !== void 0 ? opts.stale : this[kStale], onDedupe = opts.onDedupe || this[kOnDedupe], onError = opts.onError || this[kOnError], onHit = opts.onHit || this[kOnHit], onMiss = opts.onMiss || this[kOnMiss], transformer = opts.transformer || this[kTransfromer], wrapper = new Wrapper(func, name, serialize, references, storage2, transformer, ttl, onDedupe, onError, onHit, onMiss, stale);
      return this[kValues][name] = wrapper, this[name] = wrapper.add.bind(wrapper), this;
    }
    async clear(name, value) {
      if (name) {
        if (!this[kValues][name])
          throw new Error(`${name} is not defined in the cache`);
        await this[kValues][name].clear(value);
        return;
      }
      const clears = [];
      for (const wrapper of Object.values(this[kValues]))
        clears.push(wrapper.clear());
      await Promise.all(clears);
    }
    async get(name, key) {
      if (!this[kValues][name])
        throw new Error(`${name} is not defined in the cache`);
      return this[kValues][name].get(key);
    }
    async set(name, key, value, ttl, references) {
      if (!this[kValues][name])
        throw new Error(`${name} is not defined in the cache`);
      return this[kValues][name].set(key, value, ttl, references);
    }
    async invalidate(name, references) {
      if (!this[kValues][name])
        throw new Error(`${name} is not defined in the cache`);
      return this[kValues][name].invalidate(references);
    }
    async invalidateAll(references, storage2 = "_default") {
      if (!this[kStorages].has(storage2))
        throw new Error(`${storage2} storage is not defined in the cache`);
      await this[kStorages].get(storage2).invalidate(references);
    }
  }
  class Wrapper {
    /**
     * @param {function} func
     * @param {string} name
     * @param {function} serialize
     * @param {function} references
     * @param {Storage} storage
     * @param {Object} transformer
     * @param {number} ttl
     * @param {function} onDedupe
     * @param {function} onError
     * @param {function} onHit
     * @param {function} onMiss
     * @param {stale} ttl
     */
    constructor(func, name, serialize, references, storage2, transformer, ttl, onDedupe, onError, onHit, onMiss, stale) {
      this.dedupes = /* @__PURE__ */ new Map(), this.func = func, this.name = name, this.serialize = serialize, this.references = references, this.storage = storage2, this.transformer = transformer, this.ttl = ttl, this.onDedupe = onDedupe, this.onError = onError, this.onHit = onHit, this.onMiss = onMiss, this.stale = stale;
    }
    getKey(args) {
      const id = this.serialize ? this.serialize(args) : args;
      return typeof id == "string" ? id : stringify(id);
    }
    getStorageKey(key) {
      return `${this.name}~${key}`;
    }
    getStorageName() {
      return `${this.name}~`;
    }
    add(args) {
      try {
        const key = this.getKey(args);
        let query = this.dedupes.get(key);
        return query ? this.onDedupe(key) : (query = new Query(), this.buildPromise(query, args, key), this.dedupes.set(key, query)), query.promise;
      } catch (err) {
        this.onError(err);
      }
    }
    /**
     * wrap the original func to sync storage
     */
    async wrapFunction(args, key) {
      const storageKey = this.getStorageKey(key);
      if (this.ttl > 0 || typeof this.ttl == "function") {
        const data = await this.get(storageKey);
        if (data !== void 0) {
          this.onHit(key);
          const stale = typeof this.stale == "function" ? this.stale(data) : this.stale;
          return stale > 0 && await this.storage.getTTL(storageKey) <= stale && this._wrapFunction(storageKey, args, key).catch(noop), data;
        } else
          this.onMiss(key);
      }
      return this._wrapFunction(storageKey, args, key);
    }
    async _wrapFunction(storageKey, args, key) {
      const result = await this.func(args, key), stale = typeof this.stale == "function" ? this.stale(result) : this.stale;
      let ttl = typeof this.ttl == "function" ? this.ttl(result) : this.ttl;
      if (ttl == null || typeof ttl != "number" || !Number.isInteger(ttl))
        return this.onError(new Error("ttl must be an integer")), result;
      if (ttl += stale, ttl < 1)
        return result;
      if (!this.references)
        return await this.set(storageKey, result, ttl), result;
      try {
        let references = this.references(args, key, result), value = result;
        references && typeof references.then == "function" && (references = await references), this.transformer && (value = this.transformer.serialize(result)), await this.storage.set(storageKey, value, ttl, references);
      } catch (err) {
        this.onError(err);
      }
      return result;
    }
    buildPromise(query, args, key) {
      query.promise = this.wrapFunction(args, key), query.promise.then((result) => (this.dedupes.delete(key), result)).catch((err) => {
        this.onError(err), this.dedupes.delete(key);
        const r = this.storage.remove(this.getStorageKey(key));
        r && typeof r.catch == "function" && r.catch(noop);
      });
    }
    async clear(value) {
      if (value) {
        const key = this.getKey(value);
        this.dedupes.delete(key), await this.storage.remove(this.getStorageKey(key));
        return;
      }
      await this.storage.clear(this.getStorageName()), this.dedupes.clear();
    }
    async get(key) {
      const data = await this.storage.get(key);
      return this.transformer && data ? await this.transformer.deserialize(data) : data;
    }
    async set(key, value, ttl, references) {
      return this.transformer && (value = this.transformer.serialize(value)), this.storage.set(key, value, ttl, references);
    }
    async invalidate(references) {
      return this.storage.invalidate(references);
    }
  }
  class Query {
    constructor() {
      this.promise = null;
    }
  }
  function noop() {
  }
  return cache.Cache = Cache, cache;
}
var asyncCacheDedupe, hasRequiredAsyncCacheDedupe;
function requireAsyncCacheDedupe() {
  if (hasRequiredAsyncCacheDedupe) return asyncCacheDedupe;
  hasRequiredAsyncCacheDedupe = 1;
  const { Cache } = requireCache(), createStorage = requireStorage();
  function createCache(options) {
    options ? options.storage || (options.storage = { type: "memory" }) : options = { storage: { type: "memory" } };
    const storage2 = createStorage(options.storage.type, options.storage.options);
    return new Cache({
      ...options,
      storage: storage2
    });
  }
  return asyncCacheDedupe = {
    Cache,
    createCache,
    createStorage
  }, asyncCacheDedupe;
}
var asyncCacheDedupeExports = requireAsyncCacheDedupe();
let tasks = 0, resolves = [];
function startTask() {
  return tasks += 1, () => {
    if (tasks -= 1, tasks === 0) {
      let prevResolves = resolves;
      resolves = [];
      for (let i of prevResolves) i();
    }
  };
}
let listenerQueue = [], atom = (initialValue, level) => {
  let listeners = [], $atom = {
    get() {
      return $atom.lc || $atom.listen(() => {
      })(), $atom.value;
    },
    l: level || 0,
    lc: 0,
    listen(listener, listenerLevel) {
      return $atom.lc = listeners.push(listener, listenerLevel || $atom.l) / 2, () => {
        let index = listeners.indexOf(listener);
        ~index && (listeners.splice(index, 2), --$atom.lc || $atom.off());
      };
    },
    notify(oldValue, changedKey) {
      let runListenerQueue = !listenerQueue.length;
      for (let i = 0; i < listeners.length; i += 2)
        listenerQueue.push(
          listeners[i],
          listeners[i + 1],
          $atom.value,
          oldValue,
          changedKey
        );
      if (runListenerQueue) {
        for (let i = 0; i < listenerQueue.length; i += 5) {
          let skip;
          for (let j = i + 1; !skip && (j += 5) < listenerQueue.length; )
            listenerQueue[j] < listenerQueue[i + 1] && (skip = listenerQueue.push(
              listenerQueue[i],
              listenerQueue[i + 1],
              listenerQueue[i + 2],
              listenerQueue[i + 3],
              listenerQueue[i + 4]
            ));
          skip || listenerQueue[i](
            listenerQueue[i + 2],
            listenerQueue[i + 3],
            listenerQueue[i + 4]
          );
        }
        listenerQueue.length = 0;
      }
    },
    /* It will be called on last listener unsubscribing.
       We will redefine it in onMount and onStop. */
    off() {
    },
    set(newValue) {
      let oldValue = $atom.value;
      oldValue !== newValue && ($atom.value = newValue, $atom.notify(oldValue));
    },
    subscribe(listener, listenerLevel) {
      let unbind = $atom.listen(listener, listenerLevel);
      return listener($atom.value), unbind;
    },
    value: initialValue
  };
  return $atom;
};
const MOUNT = 5, UNMOUNT = 6, REVERT_MUTATION = 10;
let on = (object, listener, eventKey, mutateStore) => (object.events = object.events || {}, object.events[eventKey + REVERT_MUTATION] || (object.events[eventKey + REVERT_MUTATION] = mutateStore((eventProps) => {
  object.events[eventKey].reduceRight((event, l) => (l(event), event), {
    shared: {},
    ...eventProps
  });
})), object.events[eventKey] = object.events[eventKey] || [], object.events[eventKey].push(listener), () => {
  let currentListeners = object.events[eventKey], index = currentListeners.indexOf(listener);
  currentListeners.splice(index, 1), currentListeners.length || (delete object.events[eventKey], object.events[eventKey + REVERT_MUTATION](), delete object.events[eventKey + REVERT_MUTATION]);
}), STORE_UNMOUNT_DELAY = 1e3, onMount = ($store, initialize) => on($store, (payload) => {
  let destroy = initialize(payload);
  destroy && $store.events[UNMOUNT].push(destroy);
}, MOUNT, (runListeners) => {
  let originListen = $store.listen;
  $store.listen = (...args) => (!$store.lc && !$store.active && ($store.active = true, runListeners()), originListen(...args));
  let originOff = $store.off;
  if ($store.events[UNMOUNT] = [], $store.off = () => {
    originOff(), setTimeout(() => {
      if ($store.active && !$store.lc) {
        $store.active = false;
        for (let destroy of $store.events[UNMOUNT]) destroy();
        $store.events[UNMOUNT] = [];
      }
    }, STORE_UNMOUNT_DELAY);
  }, "production" !== "production") ;
  return () => {
    $store.listen = originListen, $store.off = originOff;
  };
}), map = (initial = {}) => {
  let $map = atom(initial);
  return $map.setKey = function(key, value) {
    let oldMap = $map.value;
    typeof value > "u" && key in $map.value ? ($map.value = { ...$map.value }, delete $map.value[key], $map.notify(oldMap, key)) : $map.value[key] !== value && ($map.value = {
      ...$map.value,
      [key]: value
    }, $map.notify(oldMap, key));
  }, $map;
};
const defineEnableLiveMode = (config) => {
  return (options) => {
    throw new Error("Live mode is not supported in server environments");
  };
};
function cloneClientWithConfig(newClient) {
  return newClient.withConfig({
    allowReconfigure: false
  });
}
const createQueryStore$1 = (options) => {
  const { ssr = false, tag = "core-loader" } = options;
  if (ssr && options.client)
    throw new TypeError(
      "`client` option is not allowed when `ssr: true`, use `setServerClient` from your server entry point instead"
    );
  if (!ssr && options.client === false)
    throw new TypeError("You must set `ssr: true` when `client: false` is used");
  if (!ssr && !options.client)
    throw new TypeError("`client` is required");
  let client = ssr ? void 0 : cloneClientWithConfig(options.client);
  function createDefaultCache(client2) {
    return asyncCacheDedupeExports.createCache().define("fetch", async (key) => {
      if (!client2)
        throw new Error(
          "You have to set the Sanity client with `setServerClient` before any data fetching is done"
        );
      const { query, params = {}, perspective, useCdn, stega } = JSON.parse(key), { result, resultSourceMap } = await client2.fetch(query, params, {
        tag,
        filterResponse: false,
        perspective,
        useCdn,
        stega
      });
      return { result, resultSourceMap };
    });
  }
  function createDefaultFetcher() {
    const initialPerspective = (client == null ? void 0 : client.config().perspective) || "published";
    return unstable__cache.instance = createDefaultCache(client), {
      hydrate: (_query, _params, initial) => ({
        loading: (initial == null ? void 0 : initial.data) === void 0 || (initial == null ? void 0 : initial.sourceMap) === void 0,
        error: void 0,
        data: initial == null ? void 0 : initial.data,
        sourceMap: initial == null ? void 0 : initial.sourceMap,
        perspective: initialPerspective
      }),
      fetch: (query, params, $fetch, controller) => {
        if (controller.signal.aborted) return;
        const finishTask = startTask();
        $fetch.setKey("loading", true), $fetch.setKey("error", void 0), unstable__cache.instance.fetch(JSON.stringify({ query, params })).then((response) => {
          controller.signal.aborted || ($fetch.setKey("data", response.result), $fetch.setKey("sourceMap", response.resultSourceMap), $fetch.setKey("perspective", initialPerspective));
        }).catch((reason) => {
          $fetch.setKey("error", reason);
        }).finally(() => {
          $fetch.setKey("loading", false), finishTask();
        });
      }
    };
  }
  const unstable__cache = {
    instance: createDefaultCache(client)
  }, $fetcher = atom(client ? createDefaultFetcher() : void 0), enableLiveMode = defineEnableLiveMode(), createFetcherStore = (query, params = {}, initial) => {
    const fetcher = $fetcher.get(), $fetch = map(
      fetcher ? fetcher.hydrate(query, params, initial) : {
        loading: false,
        error: typeof (initial == null ? void 0 : initial.data) > "u" ? new Error(
          "The `initial` option is required when `ssr: true`"
        ) : void 0,
        data: initial == null ? void 0 : initial.data,
        sourceMap: initial == null ? void 0 : initial.sourceMap,
        perspective: initial == null ? void 0 : initial.perspective
      }
    );
    return onMount($fetch, () => {
      let controller = new AbortController();
      const unsubscribe = $fetcher.subscribe((fetcher2) => {
        !fetcher2 || controller.signal.aborted || (controller.abort(), controller = new AbortController(), fetcher2.fetch(query, params, $fetch, controller));
      });
      return () => {
        controller.abort(), unsubscribe();
      };
    }), $fetch;
  }, unstable__serverClient = {
    instance: void 0,
    canPreviewDrafts: false
  };
  return {
    createFetcherStore,
    enableLiveMode,
    setServerClient: (newClient) => {
      if (!ssr)
        throw new Error("`setServerClient` can only be called when `ssr: true`");
      unstable__serverClient.instance = client = cloneClientWithConfig(newClient), unstable__serverClient.canPreviewDrafts = !!client.config().token, $fetcher.set(createDefaultFetcher());
    },
    unstable__cache,
    unstable__serverClient
  };
};

const encodeDataAttribute = (result, sourceMap, studioUrl, studioPathLike) => {
  if (!sourceMap || !studioUrl)
    return;
  const resultPath = studioPathToJsonPath(studioPathLike), editInfo = resolveEditInfo({
    resultPath,
    resultSourceMap: sourceMap,
    studioUrl
  });
  if (editInfo)
    return encodeSanityNodeData({
      baseUrl: editInfo.baseUrl,
      workspace: editInfo.workspace,
      tool: editInfo.tool,
      type: editInfo.type,
      id: editInfo.id,
      path: typeof editInfo.path == "string" ? editInfo.path : studioPath.toString(jsonPathToStudioPath(editInfo.path))
    });
};
function defineEncodeDataAttribute(result, sourceMap, studioUrl, basePath) {
  const parse = (path) => path ? typeof path == "string" ? studioPath.fromString(path) : path : [], parsedBasePath = parse(basePath);
  return Object.assign(
    (path) => encodeDataAttribute(result, sourceMap, studioUrl, [...parsedBasePath, ...parse(path)]),
    // The scope method creates a scoped version of encodeDataAttribute
    {
      scope: (scope) => defineEncodeDataAttribute(result, sourceMap, studioUrl, [
        ...parsedBasePath,
        ...parse(scope)
      ])
    }
  );
}

const isDefer = (dedupe) => dedupe === "defer" || dedupe === false;
function useAsyncData(...args) {
  var _b;
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  let [key, _handler, options = {}] = args;
  if (typeof key !== "string") {
    throw new TypeError("[nuxt] [asyncData] key must be a string.");
  }
  if (typeof _handler !== "function") {
    throw new TypeError("[nuxt] [asyncData] handler must be a function.");
  }
  const nuxtApp = useNuxtApp();
  const handler = _handler ;
  const getDefault = () => asyncDataDefaults.value;
  const getDefaultCachedData = () => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : nuxtApp.static.data[key];
  options.server ?? (options.server = true);
  options.default ?? (options.default = getDefault);
  options.getCachedData ?? (options.getCachedData = getDefaultCachedData);
  options.lazy ?? (options.lazy = false);
  options.immediate ?? (options.immediate = true);
  options.deep ?? (options.deep = asyncDataDefaults.deep);
  options.dedupe ?? (options.dedupe = "cancel");
  const initialCachedData = options.getCachedData(key, nuxtApp);
  const hasCachedData = initialCachedData != null;
  if (!nuxtApp._asyncData[key] || !options.immediate) {
    (_b = nuxtApp.payload._errors)[key] ?? (_b[key] = asyncDataDefaults.errorValue);
    const _ref = options.deep ? ref : shallowRef;
    nuxtApp._asyncData[key] = {
      data: _ref(hasCachedData ? initialCachedData : options.default()),
      pending: ref(!hasCachedData),
      error: toRef(nuxtApp.payload._errors, key),
      status: ref("idle"),
      _default: options.default
    };
  }
  const asyncData = { ...nuxtApp._asyncData[key] };
  delete asyncData._default;
  asyncData.refresh = asyncData.execute = (opts = {}) => {
    if (nuxtApp._asyncDataPromises[key]) {
      if (isDefer(opts.dedupe ?? options.dedupe)) {
        return nuxtApp._asyncDataPromises[key];
      }
      nuxtApp._asyncDataPromises[key].cancelled = true;
    }
    if (opts._initial || nuxtApp.isHydrating && opts._initial !== false) {
      const cachedData = opts._initial ? initialCachedData : options.getCachedData(key, nuxtApp);
      if (cachedData != null) {
        return Promise.resolve(cachedData);
      }
    }
    asyncData.pending.value = true;
    asyncData.status.value = "pending";
    const promise = new Promise(
      (resolve, reject) => {
        try {
          resolve(handler(nuxtApp));
        } catch (err) {
          reject(err);
        }
      }
    ).then(async (_result) => {
      if (promise.cancelled) {
        return nuxtApp._asyncDataPromises[key];
      }
      let result = _result;
      if (options.transform) {
        result = await options.transform(_result);
      }
      if (options.pick) {
        result = pick(result, options.pick);
      }
      nuxtApp.payload.data[key] = result;
      asyncData.data.value = result;
      asyncData.error.value = asyncDataDefaults.errorValue;
      asyncData.status.value = "success";
    }).catch((error) => {
      if (promise.cancelled) {
        return nuxtApp._asyncDataPromises[key];
      }
      asyncData.error.value = createError(error);
      asyncData.data.value = unref(options.default());
      asyncData.status.value = "error";
    }).finally(() => {
      if (promise.cancelled) {
        return;
      }
      asyncData.pending.value = false;
      delete nuxtApp._asyncDataPromises[key];
    });
    nuxtApp._asyncDataPromises[key] = promise;
    return nuxtApp._asyncDataPromises[key];
  };
  asyncData.clear = () => clearNuxtDataByKey(nuxtApp, key);
  const initialFetch = () => asyncData.refresh({ _initial: true });
  const fetchOnServer = options.server !== false && nuxtApp.payload.serverRendered;
  if (fetchOnServer && options.immediate) {
    const promise = initialFetch();
    if (getCurrentInstance()) {
      onServerPrefetch(() => promise);
    } else {
      nuxtApp.hook("app:created", async () => {
        await promise;
      });
    }
  }
  const asyncDataPromise = Promise.resolve(nuxtApp._asyncDataPromises[key]).then(() => asyncData);
  Object.assign(asyncDataPromise, asyncData);
  return asyncDataPromise;
}
function clearNuxtDataByKey(nuxtApp, key) {
  if (key in nuxtApp.payload.data) {
    nuxtApp.payload.data[key] = void 0;
  }
  if (key in nuxtApp.payload._errors) {
    nuxtApp.payload._errors[key] = asyncDataDefaults.errorValue;
  }
  if (nuxtApp._asyncData[key]) {
    nuxtApp._asyncData[key].data.value = unref(nuxtApp._asyncData[key]._default());
    nuxtApp._asyncData[key].error.value = asyncDataDefaults.errorValue;
    nuxtApp._asyncData[key].pending.value = false;
    nuxtApp._asyncData[key].status.value = "idle";
  }
  if (key in nuxtApp._asyncDataPromises) {
    if (nuxtApp._asyncDataPromises[key]) {
      nuxtApp._asyncDataPromises[key].cancelled = true;
    }
    nuxtApp._asyncDataPromises[key] = void 0;
  }
}
function pick(obj, keys) {
  const newObj = {};
  for (const key of keys) {
    newObj[key] = obj[key];
  }
  return newObj;
}

const createQueryStore = (visualEditing, client, tag) => {
  const queryStore = createQueryStore$1({
    tag: "nuxt-loader",
    client: false,
    ssr: true
  });
  {
    const serverClient = client.withConfig({
      perspective: "previewDrafts",
      token: visualEditing == null ? void 0 : visualEditing.token,
      useCdn: false
    });
    queryStore.setServerClient(serverClient);
  }
  return queryStore;
};
const createSanityHelper = (options) => {
  const config = { ...options };
  const { visualEditing, ...clientConfig } = config;
  const visualEditingState = useSanityVisualEditingState();
  const visualEditingEnabled = visualEditing && (!visualEditing.previewMode || visualEditingState.enabled);
  clientConfig.stega = visualEditingEnabled && clientConfig.stega;
  let client = createClient(clientConfig);
  let queryStore = visualEditingEnabled ? createQueryStore(visualEditing, client) : void 0;
  return {
    client,
    config,
    // @ts-expect-error untyped args
    fetch: (...args) => client.fetch(...args),
    queryStore,
    setToken(token) {
      config.token = token;
      client = createClient(clientConfig);
      if (queryStore && visualEditing) {
        queryStore = createQueryStore(visualEditing, client);
      }
    }
  };
};
const useSanityVisualEditingState = () => {
  const enabled = useState("_sanity_visualEditing", () => false);
  return reactive({
    enabled,
    inFrame: isInFrame()
  });
};
const isInFrame = () => {
  return void 0;
};
const useSanity = (client = "default") => {
  var _a;
  const nuxtApp = useNuxtApp();
  if ((_a = nuxtApp._sanity) == null ? void 0 : _a[client]) {
    return nuxtApp._sanity[client];
  }
  nuxtApp._sanity = nuxtApp._sanity || {};
  const $config = useRuntimeConfig();
  const sanityConfig = defu($config.sanity, $config.public.sanity);
  const { additionalClients = {}, visualEditing, ...options } = sanityConfig;
  if (client === "default") {
    nuxtApp._sanity.default = createSanityHelper({
      ...options,
      visualEditing: visualEditing || void 0
    });
    return nuxtApp._sanity.default;
  }
  nuxtApp._sanity[client] = createSanityHelper(
    defu(additionalClients[client], options)
  );
  return nuxtApp._sanity[client];
};
const useSanityQuery = (query, _params, _options = {}) => {
  const { client, perspective: _perspective, ...options } = _options;
  const sanity = useSanity(client);
  const params = _params ? reactive(_params) : void 0;
  if (params) {
    options.watch = options.watch || [];
    options.watch.push(params);
  }
  const perspective = _perspective || sanity.queryStore ? "previewDrafts" : "published";
  const queryKey = "sanity-" + hash(query + (params ? JSON.stringify(params) : ""));
  const data = ref(null);
  const sourceMap = ref(null);
  const encodeDataAttribute = ref(() => {
  });
  const updateRefs = (newData, newSourceMap) => {
    var _a;
    data.value = newData;
    sourceMap.value = newSourceMap || null;
    encodeDataAttribute.value = defineEncodeDataAttribute(
      newData,
      newSourceMap,
      (_a = sanity.config.visualEditing) == null ? void 0 : _a.studioUrl
    );
  };
  let result;
  if (!sanity.queryStore) {
    result = useAsyncData(
      queryKey,
      async () => {
        const data2 = await sanity.fetch(query, params || {}, { perspective });
        return { data: data2 };
      },
      options
    );
  } else {
    let unsubscribe = () => {
    };
    result = useAsyncData(
      queryKey,
      async () => {
        const client2 = sanity.queryStore.unstable__serverClient.instance || sanity.client;
        const { result: data2, resultSourceMap: sourceMap2 } = await client2.fetch(query, params || {}, {
          perspective,
          filterResponse: false,
          resultSourceMap: "withKeyArraySelector"
        });
        return sourceMap2 ? { data: data2, sourceMap: sourceMap2 } : { data: data2 };
      },
      options
    );
    onScopeDispose(unsubscribe);
  }
  return Object.assign(new Promise((resolve) => {
    result.then((value) => {
      updateRefs(value.data.value.data, value.data.value.sourceMap);
      resolve({
        ...result,
        data,
        sourceMap,
        encodeDataAttribute
      });
    });
  }), { ...result, data, sourceMap, encodeDataAttribute });
};

const visual_editing_server_GV1PAlhcTrckoo4znrRAD8UelndfNgps6yF7zv1Dnc0 = defineNuxtPlugin(() => {
  const visualEditingState = useSanityVisualEditingState();
  const $config = useRuntimeConfig();
  const { visualEditing } = defu($config.sanity, $config.public.sanity);
  if (visualEditing == null ? void 0 : visualEditing.previewMode) {
    const previewModeCookie = useCookie("__sanity_preview");
    visualEditingState.enabled = previewModeCookie.value === visualEditing.previewModeId;
  } else if (typeof visualEditing === "object" && !visualEditing.previewMode) {
    visualEditingState.enabled = true;
  }
});

/* empty css            */
const unocss_6Z4vW7S9aX_q2svWbGBc_X2b5QbQdkNmvzr_3kqqCd0 = defineNuxtPlugin(() => {
});

const IMAGE_QUERY = `{
  ...,
  "alt": asset->altText,
	asset->,
}`;
const LINK_QUERY = `
	...,
	type == "internal" => {
		"linkType": "linkInternal",
		"title": coalesce(
			title,
			reference->title
		),
		"route": select(
			reference->_type == "home" => "index",
			reference->_type == "page" => "slug",
            reference->_type == "showsArchive" => "shows",
            reference->_type == "show" => "shows-slug",
            reference->_type == "set" => "set-slug",
            reference->_type == "words" => "words",
            reference->_type == "article" => "words-slug",
            reference->_type == "pool" => "pool",
            reference->_type == "person" => "pool-slug",
            reference->_type == "venue" => "pool-slug",
            reference->_type == "timetable" => "schedule",
			"index"
		),
		"slug": reference->slug.current
	},
	type == "external" => {
		...,
		"href": url,
		"title": coalesce(title, url),
	},
	type == "download" => {
		"href": file.asset->url
	},
	_type == "linkCookie" => {
		"linkType": "linkCookie",
	},
`;
const SINGLE_LINK_OPTIONAL_QUERY = `{
    ...,
    type == "internal" => {
      "linkType": "linkInternal",
      "title": coalesce(
        title,
        reference->title
      ),
      "route": select(
        reference->_type == "home" => "index",
        reference->_type == "page" => "slug",
        reference->_type == "work" => "work",
        reference->_type == "project" => "work-slug",
        reference->_type == "about" => "about",
        reference->_type == "person" => "about-slug",
        "index"
      ),
      "slug": reference->slug.current
    },
    type == "external" => {
      ...,
      "href": url,
      "title": coalesce(title, url),
    },
    type == "download" => {
      "href": file.asset->url
    },
    type == "function" => {
      ...,
      "func": func
    },
  }`;
const RICH_TEXT_QUERY = `{
	...,
	_type == "block" => {
		...
	},
	markDefs[] {
		...,
		${LINK_QUERY}
	},
	_type == "module.media" => {
		...,
		image ${IMAGE_QUERY},
		video ${IMAGE_QUERY},
	},
	_type == "module.carousel" => {
		...,
		slides[] {
			...,
			image ${IMAGE_QUERY},
			video ${IMAGE_QUERY},
		}
	},
}`;
const TAG_QUERY = `
    "availableTags": {
        "genres": *[_type == 'tag.genre']| order(lower(title)) {
            _id,
            _type,
            title,
            "subGenres": subGenres[]->{
                _id,
                _type,
                title
            }
        },
        "subGenres": *[_type == 'tag.subGenre']| order(lower(title)) {
            _id,
            _type,
            title
        },
        "cities": *[_type == 'tag.city']| order(lower(title)) {
            _id,
            _type,
            title,
            short
        },
        "global": *[_type == 'tag.global']| order(lower(title)) {
            _id,
            _type,
            title
        },
        "mood": *[_type == 'tag.mood']| order(lower(title)) {
            _id,
            _type,
            title
        },
        "venue": *[_type == 'tag.venue']| order(lower(title)) {
            _id,
            _type,
            title,
            short
        },
        "musician": *[_type == 'tag.musician']| order(lower(title)) {
            _id,
            _type,
            title
        },
        "article": *[_type == 'tag.article']| order(lower(title)) {
            _id,
            _type,
            title
        },
        "service": *[_type == 'tag.service']| order(lower(title)) {
            _id,
            _type,
            title
        },
        "crafts": *[_type == 'tag.crafts']| order(lower(title)) {
            _id,
            _type,
            title
        }
    }`;
const MODULE_QUERY = `{
    _type == "module.heroSlider" => {
        ...,
        slides[] {
            ...,
        layout,
        type,
        title,
        text[] ${RICH_TEXT_QUERY},
        link ${SINGLE_LINK_OPTIONAL_QUERY},
        contentReference -> {
            ...,
            _type,
            _id,
            title,
            slug,
            image ${IMAGE_QUERY},
            bio ${RICH_TEXT_QUERY},
            text[] ${RICH_TEXT_QUERY},
            description[] ${RICH_TEXT_QUERY},
            "tags": tags[]->{
                ...,
                _id,
                title
            } | order(lower(title)),
            "soundcloud": soundcloud{
                    _type,
                    "tracks": tracks[]{
                        id,
                        created_at,
                        duration,
                        tag_list,
                        streamable,
                        purchase_url,
                        genre,
                        title,
                        description,
                        release_year,
                        release_month,
                        release_day,
                        license,
                        uri,
                        "user": user{
                            id,
                            username,
                            permalink_url
                        },
                        artwork_url,
                        waveform_url,
                        stream_url,
                        playback_count,
                        favoritings_count
                    }
            },
            persons[]->{
                    ...,
                    _id,
                    title
            },
            "parentShow": *[_type == "show" && references(^._id)][0]{
                    ...,
                    _id,
                    title,
                    slug,
                    image { asset-> },
            }
        }
        }
    },
    _type == "module.heroEntry" => {
        ...,
        layout,
        type,
        title,
        text[] ${RICH_TEXT_QUERY},
        link ${SINGLE_LINK_OPTIONAL_QUERY},
        contentReference -> {
            ...,
            _type,
            _id,
            title,
            slug,
            image ${IMAGE_QUERY},
            bio ${RICH_TEXT_QUERY},
            "tags": tags[]->{
                ...,
                _id,
                title
            }| order(lower(title)),
            "soundcloud": soundcloud{
                    _type,
                    "tracks": tracks[]{
                        id,
                        created_at,
                        duration,
                        tag_list,
                        streamable,
                        purchase_url,
                        genre,
                        title,
                        description,
                        release_year,
                        release_month,
                        release_day,
                        license,
                        uri,
                        "user": user{
                            id,
                            username,
                            permalink_url
                        },
                        artwork_url,
                        waveform_url,
                        stream_url,
                        playback_count,
                        favoritings_count
                    }
            },
            persons[]->{
                    ...,
                    _id,
                    title
            },
            "parentShow": *[_type == "show" && references(^._id)][0]{
                    ...,
                    _id,
                    title,
                    slug,
                    image { asset-> },
                     "city": *[_type == "show" && references(^._id)][0]{
                        ...,
                        title,
                    },
            }
        }
    },
	_type == "module.contentReferenceSlider" => {
        ...,
        title,
        type,
        style,
        count,
        poolContentType,
        showTags,
        autoLoad,
        setsContentType[]->{
            ...,
            _id,
            _type,
            title,
            slug,
        },
        // Content items removed - modules self-load with caching
        "poolItems": [],
        "articleItems": [],
        "showItems": [],
        "setItems": []
    },
    _type == "module.contentReferenceGrid" => {
        ...,
        title,
        type,
        style,
        count,
        poolContentType,
        showTags,
        autoLoad,
        ${TAG_QUERY},
        // Content items removed - modules self-load with caching
        "poolItems": [],
        "articleItems": [],
        "showItems": [],
        "setItems": []
    },
}`;
const SEO_QUERY = `
	"seo": {
		"pageTitle": *[_type == "siteSettings"][0].title,
		"title": coalesce(seo.title, title, *[_type == "siteSettings"][0].title),
		"metaDescription": coalesce(seo.description, *[_type == "siteSettings"][0].seo.description),
		"ogImage": coalesce(
			seo.image.asset->url + "?w=1200&h=630&fit=crop&auto=format&fm=jpg",
			*[_type == "siteSettings"][0].seo.image.asset->url + "?w=1200&h=630&fit=crop&auto=format&fm=jpg"
		)
	}
`;

const HOMEPAGE_QUERY = `
*[_type == "home"] | order(_updatedAt desc)[0] {
  ...,
  content[] ${RICH_TEXT_QUERY},
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY},
}`;
const SLUG_PAGE_QUERY = `
*[_type == "page" && slug.current == $slug] | order(_updatedAt desc)[0] {
  ...,
  content[] {
    ...,
    value[] ${RICH_TEXT_QUERY},
  },
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY}
}`;
const SCHEDULE_QUERY = `
*[_type == "timetable"] | order(_updatedAt desc)[0] {
  ...,
  backgroundImage ${IMAGE_QUERY},
  content[] ${RICH_TEXT_QUERY},
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY},
}`;
const POOLARCHIVE_QUERY = `
*[_type == "pool"] | order(_updatedAt desc)[0] {
  ...,
  backgroundImage ${IMAGE_QUERY},
  content[] ${RICH_TEXT_QUERY},
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY},
  slider{
    ...,
    count,
    "pool": select(
      autoLoad == true => *[_type in ['person', 'venue'] && poolVisibility == true] | order(_updatedAt desc)[0...20] {
          ...,
          _id,
          _type,
          title,
          name,
          slug,
          "tags": tags[]->{
              ...,
              _id,
              title
          }| order(lower(title)),
          location
      },
      pool[]->{
          ...,
          _id,
          _type,
          title,
          name,
          slug,
          "tags": tags[]->{
              ...,
              _id,
              title
          }| order(lower(title)),
          location,
      }
    ),
  }
}`;
const POOL_PROFILE_QUERY = `
  *[_type in ['person', 'venue'] && slug.current == $slug][0] {
    ...,
    _id,
    _type,
    title,
    name,
    slug,
    image ${IMAGE_QUERY},
    description[] ${RICH_TEXT_QUERY},
    "cityTags": *[_id in ^.tags[]._ref && _type == "tag.city"] {
      _id,
      _type,
      title,
      short
    }| order(lower(title)),
    "otherTags": *[_id in ^.tags[]._ref && _type != "tag.city"] {
      _id,
      _type,
      title,
      short
    }| order(lower(title)),
    "tags": tags[]->{
      ...,
      _id,
      _type,
      title,
      short
    }| order(lower(title)),
    location,
    // Kontaktdaten hinzufügen
    contact,
    // Social Media Profile hinzufügen
    socials {
      instagram,
      soundcloud,
      nina,
      bandcamp,
      web
    },
    // Shows für Personen und Veranstaltungsorte
    "shows": shows[]->{
      _id,
      _type,
      title,
      slug,
      image ${IMAGE_QUERY},
      "tags": tags[]->{
        _id,
        _type,
        title,
        short
      }| order(lower(title)),
       sets[]->{
                _id,
                _type,
                title,
                slug,
                "soundcloud": soundcloud{
                    _type,
                    "tracks": tracks[]{
                        id,
                        created_at,
                        duration,
                        tag_list,
                        streamable,
                        purchase_url,
                        genre,
                        title,
                        description,
                        release_year,
                        release_month,
                        release_day,
                        license,
                        uri,
                        "user": user{
                            id,
                            username,
                            permalink_url
                        },
                        artwork_url,
                        waveform_url,
                        stream_url,
                        playback_count,
                        favoritings_count
                    }
                },
                persons[]->{
                    ...,
                    _id,
                    title
                },
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }| order(lower(title)),
                "parentShow": *[_type == "show" && references(^._id)][0]{
                    ...,
                    _id,
                    title,
                    slug,
                    image { asset-> },
                }
            } | order(datetime desc)[0...3]
    },
    // Personen für Veranstaltungsorte hinzufügen
    _type == 'venue' => {
      "persons": persons[]->{
        _id,
        _type,
        title,
        slug,
        image ${IMAGE_QUERY},
        "tags": tags[]->{
          _id,
          _type,
          title,
          short
        }| order(lower(title))
      }
    },
    // Veranstaltungsorte für Personen hinzufügen
    _type == 'person' => {
      "venues": venues[]->{
        _id,
        _type,
        title,
        slug,
        image ${IMAGE_QUERY},
        location,
        "tags": tags[]->{
          _id,
          _type,
          title,
          short
        }| order(lower(title))
      }
    },
    modules[] ${MODULE_QUERY},
    "relatedSets": *[_type in ['set'] && references(^._id)] | order(datetime desc) [0...99] {
      ...,
      _id,
      _type,
      title,
      slug,
      image ${IMAGE_QUERY},
      datetime,
      "tags": tags[]->{
        _id,
        _type,
        title,
        short
      }| order(lower(title)),
      "parentShow": *[_type == "show" && references(^._id)][0]{
        ...,
        _id,
        title,
        slug
      },
      persons[]->{
        ...,
        _id,
        title
      },
  },
  "moreContent": *[_type in ['set',] && references(^._id)] | order(datetime desc) [0...99] {
      ...,
      _id,
      _type,
      title,
      slug,
      image ${IMAGE_QUERY},
      datetime,
      "tags": tags[]->{
        _id,
        _type,
        title,
        short
      }| order(lower(title)),
      "parentShow": *[_type == "show" && references(^._id)][0]{
        ...,
        _id,
        title,
        slug
      },
      persons[]->{
        ...,
        _id,
        title
      },
  },
"relatedContent": *[
    _type in ['person','venue'] && poolVisibility == true && 
    slug.current != $slug && 
    (
      count((tags[]->._id)[@ in ^.^.tags[]->._id]) > 0 || 
      count((persons[]->._id)[@ in ^.^.persons[]->._id]) > 0
    )
  ] | order(
    count((tags[]->._id)[@ in ^.^.tags[]->._id]) desc,
    count((persons[]->._id)[@ in ^.^.persons[]->._id]) desc,
    datetime desc
  )[0...12] {
    ...,
    _id,
    _type,
    title,
    slug,
    datetime,
    image ${IMAGE_QUERY},
    "soundcloud": soundcloud{
      _type,
      "tracks": tracks[]{
        id,
        artwork_url,
        waveform_url,
        stream_url,
        playback_count,
        title
      }
    },
    persons[]->{
      _id,
      title,
      slug,
      poolVisibility
    },
    "tags": tags[]->{
      _id,
      _type,
      title,
      short
    }| order(lower(title)),
    "parentShow": *[_type == "show" && references(^._id)][0]{
      _id,
      title,
      slug,
      image { asset-> },
    },
    "matchingTagsCount": count((tags[]->._id)[@ in ^.^.tags[]->._id]),
    "matchingArtistsCount": count((persons[]->._id)[@ in ^.^.persons[]->._id])
  },
    ${SEO_QUERY}
  }
`;
const SHOWSARCHIVE_QUERY = `
*[_type == "showsArchive"] | order(_updatedAt desc)[0] {
  ...,
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY},
  slider{
    ...,
    count,
    "sets": select(
            autoLoad == true => *[_type == 'set' && datetime != null] | order(datetime desc)[0...20] {
                ...,
                _id,
                _type,
                title,
                slug,
                "soundcloud": soundcloud{
                    _type,
                    "tracks": tracks[]{
                        id,
                        created_at,
                        duration,
                        tag_list,
                        streamable,
                        purchase_url,
                        genre,
                        title,
                        description,
                        release_year,
                        release_month,
                        release_day,
                        license,
                        uri,
                        "user": user{
                            id,
                            username,
                            permalink_url
                        },
                        artwork_url,
                        waveform_url,
                        stream_url,
                        playback_count,
                        favoritings_count
                    }
                },  
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }| order(lower(title)),
                persons[]->{
                    ...,
                    _id,
                    title
                },
                "parentShow": *[_type == "show" && references(^._id)][0]{
                    ...,
                    _id,
                    title,
                    slug,
                    image { asset-> },
                    "city": *[_type == "tag.city" && references(^._id)][0]{
                        _id,
                        _type,
                        title,
                        short
                    },
                }
            },
            sets[]->{
                _id,
                _type,
                title,
                slug,
                "soundcloud": soundcloud{
                    _type,
                    "tracks": tracks[]{
                        id,
                        created_at,
                        duration,
                        tag_list,
                        streamable,
                        purchase_url,
                        genre,
                        title,
                        description,
                        release_year,
                        release_month,
                        release_day,
                        license,
                        uri,
                        "user": user{
                            id,
                            username,
                            permalink_url
                        },
                        artwork_url,
                        waveform_url,
                        stream_url,
                        playback_count,
                        favoritings_count
                    }
                },
                persons[]->{
                    ...,
                    _id,
                    title
                },
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }| order(lower(title)),
                "parentShow": *[_type == "show" && references(^._id)][0]{
                    ...,
                    _id,
                    title,
                    slug,
                    image { asset-> },
                }
            }
        )
  }
}`;
const SHOW_QUERY = `
*[_type == "show" && slug.current == $slug] | order(_updatedAt desc)[0] {
  ...,
  _id,
  _type,
  title,
  slug,
  image ${IMAGE_QUERY},
  content[] ${RICH_TEXT_QUERY},
  modules [] ${MODULE_QUERY},
  sets[]->{
    ...,
    _id,
    _type,
    title,
    slug,
    datetime,
    image ${IMAGE_QUERY},
    "soundcloud": soundcloud{
      _type,
      "tracks": tracks[]{
        id,
        created_at,
        duration,
        tag_list,
        streamable,
        purchase_url,
        genre,
        title,
        description,
        release_year,
        release_month,
        release_day,
        license,
        uri,
        "user": user{
          id,
          username,
          permalink_url
        },
        artwork_url,
        waveform_url,
        stream_url,
        playback_count,
        favoritings_count
      },
    },
    "parentShow": *[_type == "show" && references(^._id)][0]{
          ...,
          _id,
          title,
          slug,
          image { asset-> },
          content[] ${RICH_TEXT_QUERY}
    },
    persons[]->{
      ...,
      _id,
      title,
      slug
    },
    "tags": tags[]->{
      _id,
      title,
      short
    }| order(lower(title))
  } | order(datetime desc),
  persons[]->{
    _id,
    _type,
    title,
    slug,
    image ${IMAGE_QUERY},
    "tags": tags[]->{
      _id,
      title,
      short
    }| order(lower(title))
  },
  venues[]->{
    ...,
    _id,
    _type,
    title,
    slug,
    image ${IMAGE_QUERY},
    location,
    "tags": tags[]->{
      _id,
      title,
      short
    }| order(lower(title))
  },
  "tags": tags[]->{
    _id,
    _type,
    title,
    short
  }| order(lower(title)),
  socials {
    instagram,
    soundcloud,
    nina,
    bandcamp,
    web
  },
  ${SEO_QUERY}
}`;
const SET_QUERY = `
*[_type == 'set' && slug.current == $slug] | order(_updatedAt desc)[0] {
  ...,
  _id,
  _type,
  title,
  additionalTitle,
  slug,
  datetime,
  image ${IMAGE_QUERY},
  content[] ${RICH_TEXT_QUERY},
  modules[] ${MODULE_QUERY},
  "soundcloud": soundcloud{
    _type,
    "tracks": tracks[]{
      id,
      created_at,
      duration,
      tag_list,
      streamable,
      purchase_url,
      genre,
      title,
      description,
      release_year,
      release_month,
      release_day,
      license,
      uri,
      "user": user{
        id,
        username,
        permalink_url
      },
      artwork_url,
      waveform_url,
      stream_url,
      playback_count,
      favoritings_count
    }
  },
  "tags": tags[]->{
    ...,
    _id,
    title,
    short
  }| order(lower(title)),
  persons[]->{
    ...,
    _id,
    title,
    slug
  },
  "parentShow": *[_type == "show" && references(^._id)][0]{
    ...,
    _id,
    title,
    slug,
    image { asset-> },
    sets[]->{
      ...,
      _id,
      _type,
      title,
      slug,
      "soundcloud": soundcloud{
          _type,
          "tracks": tracks[]{
              id,
              created_at,
              duration,
              tag_list,
              streamable,
              purchase_url,
              genre,
              title,
              description,
              release_year,
              release_month,
              release_day,
              license,
              uri,
              "user": user{
                  id,
                  username,
                  permalink_url
              },
              artwork_url,
              waveform_url,
              stream_url,
              playback_count,
              favoritings_count
          }
      },
      persons[]->{
          ...,
          _id,
          title
      },
      "tags": tags[]->{
          ...,
          _id,
          title
      }| order(lower(title)),
      "parentShow": *[_type == "show" && references(^._id)][0]{
          ...,
          _id,
          title,
          slug,
          image { asset-> },
      }
  }
  },
  "relatedContent": *[
    _type == 'set' && 
    slug.current != $slug && 
    (
      count((tags[]->._id)[@ in ^.^.tags[]->._id]) > 0 || 
      count((persons[]->._id)[@ in ^.^.persons[]->._id]) > 0
    )
  ] | order(
    count((tags[]->._id)[@ in ^.^.tags[]->._id]) desc,
    count((persons[]->._id)[@ in ^.^.persons[]->._id]) desc,
    datetime desc
  )[0...12] {
    ...,
    _id,
    _type,
    title,
    slug,
    datetime,
    image ${IMAGE_QUERY},
    "soundcloud": soundcloud{
      _type,
      "tracks": tracks[]{
        id,
        artwork_url,
        waveform_url,
        stream_url,
        playback_count,
        title
      }
    },
    persons[]->{
      _id,
      title,
      slug,
      poolVisibility
    },
    "tags": tags[]->{
      _id,
      _type,
      title,
      short
    }| order(lower(title)),
    "parentShow": *[_type == "show" && references(^._id)][0]{
      _id,
      title,
      slug,
      image { asset-> },
    },
    "matchingTagsCount": count((tags[]->._id)[@ in ^.^.tags[]->._id]),
    "matchingArtistsCount": count((persons[]->._id)[@ in ^.^.persons[]->._id])
  },
  ${SEO_QUERY}
}`;
const WORDS_QUERY = `
*[_type == "words"] | order(_updatedAt desc)[0] {
  ...,
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY},
  slider{
    ...,
    count,
    "articles": select(
            autoLoad == true => *[_type == 'article'] | order(datetime desc) {
                ...,
                _id,
                _type,
                title,
                slug,
                image ${IMAGE_QUERY},
                text[] ${RICH_TEXT_QUERY},
                datetime,
                useTeaserText,
                textTeaser[] ${RICH_TEXT_QUERY},
                contentReferences[]->{
                    ...,
                },
                autoRelatedArticles,
                relatedArticles[]->{
                    ...,
                },
                socials {
                  instagram,
                  soundcloud,
                  nina,
                  bandcamp,
                  web
                },
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }| order(lower(title)),
            },
            articles[]->{
                ...,
                _id,
                _type,
                title,
                slug,
                image ${IMAGE_QUERY},
                text[] ${RICH_TEXT_QUERY},
                datetime,
                useTeaserText,
                textTeaser[] ${RICH_TEXT_QUERY},
                contentReferences[]->{
                    ...,
                },
                autoRelatedArticles,
                relatedArticles[]->{
                    ...,
                },
                socials {
                  instagram,
                  soundcloud,
                  nina,
                  bandcamp,
                  web
                },
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }| order(lower(title)),
                persons[]->{
                    ...,
                    _id,
                    title
                },
            }
        )
  }
}`;
const ENTRY_QUERY = `
*[_type == "article" && slug.current == $slug] | order(_updatedAt desc)[0] {
    ...,
    _id,
    _type,
    title,
    slug,
    image ${IMAGE_QUERY},
    text[] {
      ...,
     value[] ${RICH_TEXT_QUERY},
    },
    datetime,
    useTeaserText,
    textTeaser[] ${RICH_TEXT_QUERY},
    contentReferences[]->{
        ...,
    },
    autoRelatedArticles,
    relatedArticles[]->{
        ...,
    },
    socials {
      instagram,
      soundcloud,
      nina,
      bandcamp,
      web
    },
    "tags": tags[]->{
        ...,
        _id,
        title
    }| order(lower(title)),
    persons[]->{
        ...,
        _id,
        title
    },
    modules[] ${MODULE_QUERY},
    "relatedContent": *[
        _type == 'article' && 
        slug.current != $slug && 
        count((tags[]->._id)[@ in ^.^.tags[]->._id]) > 0
    ] | order(
        count((tags[]->._id)[@ in ^.^.tags[]->._id]) desc,
        datetime desc
    )[0...12] {
        ...,
        _id,
        _type,
        title,
        slug,
        image ${IMAGE_QUERY},
        datetime,
        useTeaserText,
        textTeaser[] ${RICH_TEXT_QUERY},
        persons[]->{
            _id,
            title,
            slug
        },
        "tags": tags[]->{
            _id,
            _type,
            title
        }| order(lower(title)),
        "matchingTagsCount": count((tags[]->._id)[@ in ^.^.tags[]->._id])
    },
    ${SEO_QUERY}
}`;
const SITE_OPTIONS_QUERY = `{
  "siteCookieBanner" : *[_type == "siteCookieBanner"][0] {
    ...,
  },
  "siteNav" : *[_type == "siteNav"][0] {
    ...,
    mainMenu[] {
      ...,
      ${LINK_QUERY}
    },
    "schedulePageRoute": select(
			schedulePage->_type == "home" => "index",
			schedulePage->_type == "page" => "slug",
            schedulePage->_type == "showsArchive" => "shows",
            schedulePage->_type == "show" => "shows-slug",
            schedulePage->_type == "set" => "set-slug",
            schedulePage->_type == "words" => "words",
            schedulePage->_type == "article" => "words-slug",
            schedulePage->_type == "pool" => "pool",
            schedulePage->_type == "person" => "pool-slug",
            schedulePage->_type == "venue" => "pool-slug",
            schedulePage->_type == "timetable" => "schedule",
			"index"
		),
		"schedulePageSlug": schedulePage->slug.current,
    discordLink,
    footerMenu[] {
      ...,
      ${LINK_QUERY}
    }
  },
  "siteSettings" : *[_type == "siteSettings"][0] {
    ...,
    favicon {
      ...,
      asset->
    },
  },
  "siteFallbacks": *[_type == "fallbackGlobal"][0]{
    ...,
    fallbackArticle {
        ...,
        image { asset-> },
        description[] ${RICH_TEXT_QUERY},
    },
    fallbackPerson {
         ...,
        image { asset-> },
        description[] ${RICH_TEXT_QUERY},
    },
    fallbackSet {
      ...,
      image { asset-> },
      description[] ${RICH_TEXT_QUERY},
    },
    fallbackShow {
      ...,
      image { asset-> },
      description[] ${RICH_TEXT_QUERY},
    },
    fallbackVenue {
        ...,
        image { asset-> },
        description[] ${RICH_TEXT_QUERY},
    }
  }
}`;
const ERROR_PAGE_QUERY = `
*[_type == "error"][0] {
  ...,
  content[] ${RICH_TEXT_QUERY},
}
`;

const groq = String.raw || ((strings, ...keys) => {
  const lastIndex = strings.length - 1;
  return strings.slice(0, lastIndex).reduce(
    (query, currentString, index) => query + currentString + keys[index],
    ""
  ) + strings[lastIndex];
});

const useMainStore = defineStore("mainStore", () => {
  const siteCookieBanner = ref({});
  const siteNav = ref({});
  const siteSettings = ref({});
  const siteFallbacks = ref({});
  const link = ref("");
  const titel = ref("");
  const currentTrack = ref(null);
  const active = ref(false);
  const isPlayerPlaying = ref(false);
  const isPlayerVisible = ref(true);
  const activeScheduleLocation = ref("channelOne");
  const activeStreamingChannel = ref("channelOne");
  const currentHeroContentType = ref("");
  const isDarkMode = ref();
  const menuOpen = ref(false);
  async function nuxtServerInit() {
    const sanity = useSanity();
    const query = groq`${SITE_OPTIONS_QUERY}`;
    const data = await sanity.fetch(query);
    siteCookieBanner.value = data == null ? void 0 : data.siteCookieBanner;
    siteNav.value = data == null ? void 0 : data.siteNav;
    siteSettings.value = data == null ? void 0 : data.siteSettings;
    siteFallbacks.value = data == null ? void 0 : data.siteFallbacks;
  }
  function addToRepro(payload) {
    link.value = payload.link;
    titel.value = payload.name;
    active.value = payload.active;
  }
  function setPlayerStatus(isPlaying) {
    isPlayerPlaying.value = isPlaying;
  }
  function togglePlayerVisibility() {
    isPlayerVisible.value = !isPlayerVisible.value;
  }
  function resetSoundCloudPlayer() {
    currentTrack.value = null;
  }
  function setActiveScheduleLocation(location) {
    activeScheduleLocation.value = location;
  }
  function toggleMenu() {
    menuOpen.value = !menuOpen.value;
  }
  function setActiveStreamingChannel(channel) {
    activeStreamingChannel.value = channel;
  }
  function setCurrentHeroContentType(type) {
    currentHeroContentType.value = type;
  }
  function detectSystemDarkMode() {
  }
  function updateColors() {
    if (isDarkMode.value) {
      (void 0).documentElement.style.setProperty("--color-bg", "#000");
      (void 0).documentElement.style.setProperty("--color-text", "#fff");
    } else {
      (void 0).documentElement.style.setProperty("--color-bg", "#fff");
      (void 0).documentElement.style.setProperty("--color-text", "#000");
    }
  }
  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value;
    updateColors();
  }
  return {
    siteCookieBanner,
    siteNav,
    siteSettings,
    siteFallbacks,
    currentTrack,
    link,
    titel,
    active,
    isPlayerPlaying,
    isPlayerVisible,
    activeScheduleLocation,
    activeStreamingChannel,
    currentHeroContentType,
    // Neue Variable exportieren
    menuOpen,
    isDarkMode,
    detectSystemDarkMode,
    nuxtServerInit,
    addToRepro,
    setPlayerStatus,
    togglePlayerVisibility,
    resetSoundCloudPlayer,
    setActiveScheduleLocation,
    setCurrentHeroContentType,
    // Neue Funktion exportieren
    updateColors,
    toggleDarkMode,
    toggleMenu,
    setActiveStreamingChannel
  };
});

const nuxtServerInit_server__01HkGh53F8SQXhGSpB1NrWqTFNoopaMbntQDE6OwVQ = defineNuxtPlugin(async ({ $pinia }) => {
  let __temp, __restore;
  const mainStore = useMainStore($pinia);
  [__temp, __restore] = executeAsync(() => mainStore.nuxtServerInit()), await __temp, __restore();
});

const sanityImageUrl_iVkirotEnX38PjAvWYjfoBl_LiSh2uedGA9ahsG3_Dg = defineNuxtPlugin(() => {
  const builder = imageUrlBuilder(useSanity().config);
  function urlFor(source) {
    return builder.image(source).auto("format");
  }
  return {
    provide: { urlFor }
  };
});

const prerender_server__AJAqx0r_LckIr_UV_zhyfMZj1Pq0MnlGRdi7l3bBGw = defineNuxtPlugin(async () => {
  {
    return;
  }
});

const ssg_detect_UF4Nst39t0UMaSCKhdiI3ti9uHUzHwDPgMWmwbxO5Uw = defineNuxtPlugin({
  name: "i18n:plugin:ssg-detect",
  dependsOn: ["i18n:plugin", "i18n:plugin:route-locale-detect"],
  enforce: "post",
  setup(nuxt) {
    return;
  }
});

const plugins = [
  unhead_PtamfB47yqQY_Rh4zjrimgYJkXOrkZ_s7Rhm1JWaAcQ,
  plugin$1,
  _0_siteConfig_Mw2QuAhuRFPYVYqMlPmLPRQRiI_883v_N9WPOxZZuZY,
  revive_payload_server_Ws8SUMTo68XWM_TEhuJIQbORo_qC7bnyjJcGdGVwAYw,
  plugin,
  components_plugin_4kY4pyzJIYX99vmMAAIorFf3CnAaptHitJgf7JxiED8,
  i18n_server_9Ww3mBWgMvABCLimDvjSH_DVs_37h_2t7FOcwdX8N1o,
  switch_locale_path_ssr_Hk9vdM15aB_0VkdtA_Usx_xFCjk41oE2KO5i9C8RnMs,
  route_locale_detect_9xnjrvR2gs_Q4sLywtkwzH8IawzhEmfdVknj25um3og,
  i18n_aNMRN_VpxP5fGsesKfa8RtP7jI8L9qZpzOP_wk7xuAQ,
  visual_editing_server_GV1PAlhcTrckoo4znrRAD8UelndfNgps6yF7zv1Dnc0,
  unocss_6Z4vW7S9aX_q2svWbGBc_X2b5QbQdkNmvzr_3kqqCd0,
  nuxtServerInit_server__01HkGh53F8SQXhGSpB1NrWqTFNoopaMbntQDE6OwVQ,
  sanityImageUrl_iVkirotEnX38PjAvWYjfoBl_LiSh2uedGA9ahsG3_Dg,
  prerender_server__AJAqx0r_LckIr_UV_zhyfMZj1Pq0MnlGRdi7l3bBGw,
  ssg_detect_UF4Nst39t0UMaSCKhdiI3ti9uHUzHwDPgMWmwbxO5Uw
];

const firstNonUndefined = (...args) => args.find((arg) => arg !== void 0);
// @__NO_SIDE_EFFECTS__
function defineNuxtLink(options) {
  const componentName = options.componentName || "NuxtLink";
  function isHashLinkWithoutHashMode(link) {
    return typeof link === "string" && link.startsWith("#");
  }
  function resolveTrailingSlashBehavior(to, resolve) {
    if (!to || options.trailingSlash !== "append" && options.trailingSlash !== "remove") {
      return to;
    }
    if (typeof to === "string") {
      return applyTrailingSlashBehavior(to, options.trailingSlash);
    }
    const path = "path" in to && to.path !== void 0 ? to.path : resolve(to).path;
    const resolvedPath = {
      ...to,
      name: void 0,
      // named routes would otherwise always override trailing slash behavior
      path: applyTrailingSlashBehavior(path, options.trailingSlash)
    };
    return resolvedPath;
  }
  function useNuxtLink(props) {
    const router = useRouter();
    const config = useRuntimeConfig();
    const hasTarget = computed(() => !!props.target && props.target !== "_self");
    const isAbsoluteUrl = computed(() => {
      const path = props.to || props.href || "";
      return typeof path === "string" && hasProtocol(path, { acceptRelative: true });
    });
    const builtinRouterLink = resolveComponent("RouterLink");
    const useBuiltinLink = builtinRouterLink && typeof builtinRouterLink !== "string" ? builtinRouterLink.useLink : void 0;
    const isExternal = computed(() => {
      if (props.external) {
        return true;
      }
      const path = props.to || props.href || "";
      if (typeof path === "object") {
        return false;
      }
      return path === "" || isAbsoluteUrl.value;
    });
    const to = computed(() => {
      const path = props.to || props.href || "";
      if (isExternal.value) {
        return path;
      }
      return resolveTrailingSlashBehavior(path, router.resolve);
    });
    const link = isExternal.value ? void 0 : useBuiltinLink == null ? void 0 : useBuiltinLink({ ...props, to });
    const href = computed(() => {
      var _a;
      if (!to.value || isAbsoluteUrl.value || isHashLinkWithoutHashMode(to.value)) {
        return to.value;
      }
      if (isExternal.value) {
        const path = typeof to.value === "object" && "path" in to.value ? resolveRouteObject$1(to.value) : to.value;
        const href2 = typeof path === "object" ? router.resolve(path).href : path;
        return resolveTrailingSlashBehavior(
          href2,
          router.resolve
          /* will not be called */
        );
      }
      if (typeof to.value === "object") {
        return ((_a = router.resolve(to.value)) == null ? void 0 : _a.href) ?? null;
      }
      return resolveTrailingSlashBehavior(
        joinURL(config.app.baseURL, to.value),
        router.resolve
        /* will not be called */
      );
    });
    return {
      to,
      hasTarget,
      isAbsoluteUrl,
      isExternal,
      //
      href,
      isActive: (link == null ? void 0 : link.isActive) ?? computed(() => to.value === router.currentRoute.value.path),
      isExactActive: (link == null ? void 0 : link.isExactActive) ?? computed(() => to.value === router.currentRoute.value.path),
      route: (link == null ? void 0 : link.route) ?? computed(() => router.resolve(to.value)),
      async navigate(_e) {
        await navigateTo(href.value, { replace: props.replace, external: isExternal.value || hasTarget.value });
      }
    };
  }
  return defineComponent({
    name: componentName,
    props: {
      // Routing
      to: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      href: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      // Attributes
      target: {
        type: String,
        default: void 0,
        required: false
      },
      rel: {
        type: String,
        default: void 0,
        required: false
      },
      noRel: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Prefetching
      prefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      prefetchOn: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      noPrefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Styling
      activeClass: {
        type: String,
        default: void 0,
        required: false
      },
      exactActiveClass: {
        type: String,
        default: void 0,
        required: false
      },
      prefetchedClass: {
        type: String,
        default: void 0,
        required: false
      },
      // Vue Router's `<RouterLink>` additional props
      replace: {
        type: Boolean,
        default: void 0,
        required: false
      },
      ariaCurrentValue: {
        type: String,
        default: void 0,
        required: false
      },
      // Edge cases handling
      external: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Slot API
      custom: {
        type: Boolean,
        default: void 0,
        required: false
      }
    },
    useLink: useNuxtLink,
    setup(props, { slots }) {
      useRouter();
      const { to, href, navigate, isExternal, hasTarget, isAbsoluteUrl } = useNuxtLink(props);
      ref(false);
      const el = void 0;
      const elRef = void 0;
      async function prefetch(nuxtApp = useNuxtApp()) {
        {
          return;
        }
      }
      return () => {
        var _a;
        if (!isExternal.value && !hasTarget.value && !isHashLinkWithoutHashMode(to.value)) {
          const routerLinkProps = {
            ref: elRef,
            to: to.value,
            activeClass: props.activeClass || options.activeClass,
            exactActiveClass: props.exactActiveClass || options.exactActiveClass,
            replace: props.replace,
            ariaCurrentValue: props.ariaCurrentValue,
            custom: props.custom
          };
          if (!props.custom) {
            routerLinkProps.rel = props.rel || void 0;
          }
          return h(
            resolveComponent("RouterLink"),
            routerLinkProps,
            slots.default
          );
        }
        const target = props.target || null;
        const rel = firstNonUndefined(
          // converts `""` to `null` to prevent the attribute from being added as empty (`rel=""`)
          props.noRel ? "" : props.rel,
          options.externalRelAttribute,
          /*
          * A fallback rel of `noopener noreferrer` is applied for external links or links that open in a new tab.
          * This solves a reverse tabnapping security flaw in browsers pre-2021 as well as improving privacy.
          */
          isAbsoluteUrl.value || hasTarget.value ? "noopener noreferrer" : ""
        ) || null;
        if (props.custom) {
          if (!slots.default) {
            return null;
          }
          return slots.default({
            href: href.value,
            navigate,
            prefetch,
            get route() {
              if (!href.value) {
                return void 0;
              }
              const url = new URL(href.value, "http://localhost");
              return {
                path: url.pathname,
                fullPath: url.pathname,
                get query() {
                  return parseQuery(url.search);
                },
                hash: url.hash,
                params: {},
                name: void 0,
                matched: [],
                redirectedFrom: void 0,
                meta: {},
                href: href.value
              };
            },
            rel,
            target,
            isExternal: isExternal.value || hasTarget.value,
            isActive: false,
            isExactActive: false
          });
        }
        return h("a", { ref: el, href: href.value || null, rel, target }, (_a = slots.default) == null ? void 0 : _a.call(slots));
      };
    }
    // }) as unknown as DefineComponent<NuxtLinkProps, object, object, ComputedOptions, MethodOptions, object, object, EmitsOptions, string, object, NuxtLinkProps, object, SlotsType<NuxtLinkSlots>>
  });
}
const __nuxt_component_0$6 = /* @__PURE__ */ defineNuxtLink(nuxtLinkDefaults);
function applyTrailingSlashBehavior(to, trailingSlash) {
  const normalizeFn = trailingSlash === "append" ? withTrailingSlash : withoutTrailingSlash;
  const hasProtocolDifferentFromHttp = hasProtocol(to) && !to.startsWith("http");
  if (hasProtocolDifferentFromHttp) {
    return to;
  }
  return normalizeFn(to, true);
}

const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};

const _sfc_main$p = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "30",
    height: "28",
    viewBox: "0 0 30 28",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "xmlns:xlink": "http://www.w3.org/1999/xlink",
    class: "image-logo"
  }, _attrs))}><rect width="29.9765" height="28" fill="url(#pattern0_8177_318)"></rect><defs><pattern id="pattern0_8177_318" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image0_8177_318" transform="scale(0.000915751 0.000980392)"></use></pattern><image id="image0_8177_318" width="1092" height="1020" preserveAspectRatio="none" xlink:href="data:image/png;base64,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L788X/rSl5ru6ob+/fvn5z//eU4//fT06dOn7uffdNNNc/vtt2f77bev+7mhJwwiAABAwxg3blwefvjh/Ou//msGDRpU8/P1798/xx13XB555JHstttuNT9frXR0dOTYY4/NAw88kP33378u51x99dVz7rnn5s4778x73/veupwTAKBRfDVJxeFwOBzNdxx66KGVRjdr1qzKkUceWenVq1fVX39nZ2flk5/8ZOXxxx8v/TJrYurUqZVx48bV5PfOcsstVzn11FMr8+bNK/0y39VGG21U/M9alY5Zoep6lw4AAAB4O6uttlrOOuusfPGLX8yvfvWrTJw4MXfccUePPuY//uM/ZsKECdlvv/0ycuTIKpU2ntGjR2fKlCn53//931x88cWZNGlS/vSnPy3zx+vTp0/GjRuXCRMmZN99982wYcOqFwuFNNfNcQA0mq8mOal0BABL79BDD80555xTOmOpzZgxI5dddlmuuOKKTJ8+PTNmzMj8+fPf9tcOGDAgI0aMyHvf+97svvvu2XPPPbPmmmvWubgxVCqV3H333Zk0aVImT56cJ554IrNmzcrChQvf9tevsMIKGT58eDbZZJNMmDAhu+66a5Zbbrk6V/fcxhtvnHvuuad0RjU8lWR46YhWYxABoCcMIgBNqlkHkTerVCqZM2dOZs2alZkzZ6arqysjRozIiBEjMnTo0KZ7QGo9dXV15dlnn82sWbMya9asDB48OMOHD8/w4cMzYMCA0nlVYRDhnbhlBgAAaFodHR0ZOnRohg4d2tK3wNRCZ2dnVl555ay88srZZJNNSudA3XmXGQAAAKDtGEQAAACAtmMQAQAAANqOQQQAAABoOwYRAAAAoO0YRAAAAIC2YxABAAAA2o5BBAAAAGg7BhEAAACg7RhEAAAAgLZjEAEAAADajkEEAAAAaDsGEQAAAKDtGEQAAACAtmMQAQAAANpO79IBAABAe1u4cGGmTZuW22+/PfPmzXvtn/fr1y+jR4/O6NGj079//4KFvN7zzz+fW2+9Nffee2+6urpe++crrbRSttlmm6y//vrp6OgoWAhLxiACAADU3fz583Puuefm0ksvze2335758+cv9tf27ds3o0ePzu67755Pf/rTWX755etYSpI8+uijOfPMM/Pb3/429957byqVymJ/7bBhw7LNNtvk4IMPzl577ZXOTjcmAACt56tJKg6Hw+FovuPQQw+tlPDCCy9UTj311MrKK6+8TN1DhgypHH/88ZXZs2cX6W839913X+XAAw+s9OrVa5n+fY0aNary85//vLJw4cIi/RtttFHxP2tVOmYFAGgoBhGHw+Fo0qPEIHLdddct8xDy5mPQoEGVX/3qV3V/De1i0aJFla997WuVjo6Oqvz72nTTTSuPPPJI3V+HQYR34tolAACgpiqVSs4888zsuOOOeeaZZ6ryMefNm5f99tsvxx9/fBYtWlSVj0m3559/PuPHj883vvGNd7w1ZmlMmzYtW2yxRSZPnlyVjwfVYBABAABqplKp5NBDD83nP//5mgwXp59+enbdddf85S9/qfrHbkf33Xdfttxyy1xxxRVV/9h/+ctf8qEPfShnn3121T82LAuDCAAAUDOnn356fvrTn9b0HFOmTMnYsWMzY8aMmp6n1d18883Zdttt8/DDD9fsHF1dXfnMZz6TKVOm1OwcsKQMIgAAQE1cddVVOeGEE+pyrnvuuSfbbLNNHnjggbqcr9Vcfvnl2XHHHetypU1XV1f222+/PProozU/F7wTgwgAAFB1M2fOzP7771+1Z1Asiccffzzvf//7c+utt9btnK3gZz/7Wfbaa68sWLCgbud87rnnss8++3j+C0UZRAAAgKo744wz8vzzz9f9vM8991zGjRuXX//613U/d7Pp6urKSSedlEMOOaTIMPH73/8+l1xySd3PC39jEAEAAKrqmWeeyX/8x38UO/+CBQuy995753Of+1xeeumlYh2NbPbs2dl1113zta99rWjHySefXNeriOD1DCIAAEBV/fu//3tdb79YnO9///t53/vel4ceeqh0SkO55pprsummm+aaa64pnZK77767Ju9oA0vCIAIAAFTV+eefXzrhNXfddVc233zzhmoqZeHChfnyl7+cXXbZJbNnzy6d8xr/bijFIAIAAFTNE088kSeeeKJ0xhvMmzcvBx10UMaPH58//vGPpXOKuOmmmzJmzJicdtppDXeLys0339xwTbQHgwgAAFA1N998c+mExbrsssuy4YYb5mtf+1rmz59fOqcuZs6cmQMOOCAf+MAHctddd5XOeVszZsxouBGN9mAQAQAAquaWW24pnfCOXn755Zx00kkZNWpULr744pa9MuGVV17JGWeckZEjR+YXv/hF6Zx31chDGq3LIAIAAFTNc889VzphiTz++OPZd999M2bMmFx88cVF3na2FubNm5fvfe97WW+99XLsscdm7ty5pZOWSLP8vqG1GEQAAIC2NXXq1Oy7774ZNWpUfvzjHzft2/T++c9/zoknnpg111wz//zP/5zHH3+8dBI0PIMIAADQ9qZPn57DDz88a621Vk488cSmeKveSqWSW265JZ/+9Kfznve8J1//+tfz7LPPls6CpmEQAQAAqqazs7l/xJg9e3a+/vWvZ+TIkdliiy3yne98JzNmzCid9Qb33HNPTjjhhKyzzjrZZpttcvbZZ2fBggWls3qkV69epRNoQ71LBwAAAK1j4403Lp1QNXfeeWfuvPPOHHPMMfnABz6QHXfcMdttt13GjBmT/v37163j+eefz0033ZQbbrghv/nNb3LPPffU7dz10kq/b2geBhEAAKBq3v/+95dOqLpKpZIbbrghN9xwQ5KkX79+2WqrrTJ27NiMGTMm6623XtZZZ5307du3x+eaO3duHn744Tz44IO55ZZbcv3112fatGkt+244SdK3b9+MHj26dAZtyCACAABUzeabb55+/frl5ZdfLp1SMy+//PIbBpKk+1ahNddcM+utt17WXXfdrLTSShk8ePAbjv79+2f+/PmZO3du5syZk7lz52bu3Ll56qmnMn369EyfPj2zZs0q+MrK2GKLLdKvX7/SGbQhgwgAAFA1ffv2zXbbbZfJkyeXTqmrrq6uPProo3n00Ufb7rX31A477FA6gTbV3E88AgAAGs4xxxxTOoEmMWDAgHzmM58pnUGbMogAAABVteOOO2bMmDGlM2gChx12WFZZZZXSGbQpgwgAAFBVHR0d+cpXvlI6gwbXp0+ffOlLXyqdQRsziAAAAFW3xx575GMf+1jpDBrYt7/97ayxxhqlM2hjBhEAAKDqOjo6cs4552TTTTctnUIDOvjggz07hOIMIgAAQE0MHDgwv/71r7PiiiuWTqGBbL755jn77LPT0dFROoU2ZxABAABqZu21187kyZOz0korlU6hAWy22Wa58sorM2DAgNIpYBABAABqa/To0fnf//3frLXWWqVTKGj77bfP9ddfn1VXXbV0CiQxiAAAAHWw/vrr5+abb/ZMkTa177775je/+U2GDh1aOgVeYxABAADqYvjw4bn++uvzwQ9+sHQKdXTUUUflggsuSL9+/UqnwBsYRAAAgLpZbrnl8pvf/CYf+chHSqdQByeffHK+//3vp1evXqVT4C0MIgAAQF31798/v/zlL3PUUUeVTqFGOjs785Of/CQnnHCCd5OhYRlEAACAuuvVq1e+//3v54wzznD1QItZYYUVctlll+VTn/pU6RR4RwYRAACgiI6OjhxzzDG58cYbs+aaa5bOoQq23XbbTJs2LbvttlvpFJnn0FgAACAASURBVHhXBhEAAKCo973vfbnrrruyzz77lE5hGXV0dOSrX/1qrrvuuvzDP/xD6RxYIgYRAACguOWXXz4XXXRRzj77bO9G0mRWW221TJkyJSeddFJ69+5dOgeWmEEEAABoCB0dHTniiCNy++23Z4MNNiidwxLYddddM23atIwbN650Ciw1gwgAANBQNtlkk0ydOjWHHHJI6RQWo3fv3jnjjDPyP//zP1lllVVK58AyMYgAAAANZ9CgQTn33HNz9dVXZ+TIkaVzeJ0ddtgh06ZNyzHHHJPOTj9S0rz87gUAABrWzjvvnLvvvjtnnHFGBg8eXDqnrb3nPe/JxRdfnGuuuSYbbrhh6RzoMYMIAADQ0Pr27ZtjjjkmDz74YA444IDSOW2nX79++Zd/+Zfcf//92WeffdLR0VE6CarCIAIAADSFESNG5Pzzz8+NN96YzTbbrHROW9hzzz1z33335Rvf+EYGDhxYOgeqyiACAAA0lW233TZTp07NWWedldVWW610TkvaaKONcuWVV2bSpElZZ511SudATRhEAACAptOrV68ceeSRefTRR/PjH/846623XumklvCBD3wgV1xxRe6+++586EMfKp0DNWUQAQAAmlb//v1z2GGH5f7778/FF1+cLbfcsnRSUxo/fnxuvvnm3HDDDdltt908J4S2YBABAACaXq9evbLPPvvktttuy7XXXptddtmldFLD69OnTz75yU/mvvvuy8SJE/O+972vdBLUlUEEAABoGR0dHdl+++1z1VVX5fe//30OOeSQLLfccqWzGsoaa6yR4447Ln/84x/z05/+NKNGjSqdBEUYRAAAgJa02Wab5dxzz81TTz2VSy+9NB/5yEfSv3//0llFDBs2LEcccURuuOGGPPbYYznttNOyxhprlM6ConqXDgAAAKil/v37Z6+99spee+2VF198MRMnTsx///d/Z8qUKVm0aFHpvJoZNGhQJkyYkI997GPZ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enTHPXLUad8LtCeFCAAAUIlO+xBc1fX09PS4d9AEChEAAKASW221VekIDbXllltWtpZ7B42nEAEAACqx3377lY7QUFOnTq1srU66d4MHD85ee+1VOgYoRAAAgGq87nWvyxZbbFE6RkOstdZa2W233Spbr5MKkSlTpmTUqFGlY4BCBAAAqEZPT0+mTZtWOkZD7LXXXhk2bFhl640bNy4TJ06sbL1m6pTvAdqfQgQAAKhMp3wYLnEdnXLvOmm3C+1NIQIAAFTmjW98Y1772teWjrFa1l133ey7776Vr3vQQQdl8ODBla/bSG95y1uy8cYbl44BSRQiAABAhQYNGpQTTzyxdIzVcswxx2SdddapfN3x48fn8MMPr3zdRjrppJNKR4AlFCIAAECl9t9//7zxjW8sHWOVbLLJJjnyyCOLrf+v//qvGTFiRLH1V8eBBx7YMeeg0BkUIgAAQKV6enpy8sknl46xSj73uc9Vepjqi22wwQb55Cc/WWz9VTV48OB8/vOfLx0DXkAhAgAAVG6XXXZpu8M1t99++xx00EGlY+SjH/1oxo4dWzrGSjniiCOy+eabl44BL6AQAQAAijj99NOz6aablo6xQkaNGpVzzz03gwYNKh0lI0aMyA9/+MMMGTKkdJQVMnHixLbdEURnU4gAAABFvOpVr8oFF1yQtdZaq3SU5Ro0aFDOO++8lno7zpvf/OZ8/etfLx3jFY0dOzbTp0/P8OHDS0eBl1CIAAAAxWy77bb53ve+VzrGcv3Hf/xHdt9999IxXuIf//Ef89GPfrR0jGVaY401Mn369Gy00Ualo8DLUogAAABFTZs2rWVfx3r44YfnqKOOKh1jmb7whS9kn332KR3jJXp6evLtb387kyZNKh0FlkkhAgAAFPcv//Iv+da3vtVS52KccMIJOfXUU9PT01M6yjINHjw4559/fg4//PDSUZYYOXJkfvKTn7TEAbSwPAoRAACgJbzvfe/LFVdckVe96lVFc6y11lr58Y9/nGOPPbaly5DnDBkyJF/72tfyX//1X8UPfd18881z7bXXZu+99y6aA1aEQgQAAGgZO++8c2644YZst912RdbfZJNNcvXVV+ftb397kfVXx4c+9KFccsklWXfddYusv9tuu+W6667L1ltvXWR9WFkKEQAAoKVsuummmTlzZv793/+9sg/3w4cPzzHHHJPbb7+9WBnTCG95y1sya9asHHHEEZXtFhk3bly+/e1v59JLL83o0aMrWRMAoBXskKRmjDGmveaQQw6ptYPHHnus9i//8i+1YcOGNeU+DBo0qHbYYYfV/vjHP5a+1Ia7++67awcccEDTvofWWWed2kknnVRbsGBB6UtdpsmTJxf/s9agmRMAoOUoRIwxpg2nXQqR5/zhD3+offzjH69tscUWDbn+jTbaqHbEEUfUZs2aVfrSmm7mzJm19773vbXRo0c35N5tu+22teOPP772yCOPlL60V6QQYXla/4QgAFrdDkluLh0CgJVzyCGH5IwzzigdY6XVarXceeedmT59embMmJHrr79+hb/29a9/faZOnZpp06ZlwoQJbXFgaiMtXrw411xzzZJ7d++9967Q1w0aNCh/8zd/k6lTp2bq1KkZP358k5M2zpQpU3LllVeWjtEIDyUZWzpEp+mufwIA0AwKEYA21K6FyIstXLiHB+xjAAAgAElEQVQwDz30UGbPnr1kHn744YwePTp9fX0ZO3bskl9HjBhROm7LqNVqmT9//gvu2+zZs/PEE09kzJgx6evrWzJjxozJ0KFDS0deJQoRlmdw6QAAAACravjw4Rk/fnxb7VpoBT09PRk5cmRGjhyZrbbaqnQcKMJbZgAAAICuoxABAAAAuo5CBAAAAOg6ChEAAACg6yhEAAAAgK6jEAEAAAC6jkIEAAAA6DoKEQAAAKDrKEQAAACArqMQAQAAALqOQgQAAADoOgoRAAAAoOsMLh0AAABgVSxYsCA33HBDZs+e/YKZN29e1ltvvfT19WXs2LHp6+tLX19fJkyYkFGjRpWO3RLmzp2b22677SX3bv78+dlwww2X3LO+vr6MGzcuEydOzNChQ0vHhoZSiAAAAG1j3rx5ufDCCzNjxoxceumleeqpp1b4awcPHpwpU6Zk2rRp2W+//bLxxhs3MWnr+e1vf5vp06dnxowZufbaa1Or1Vb4a0eOHJm9994706ZNy1577ZWRI0c2MSkAQHvYIUnNGGNMe80hhxxSaxcDAwO1iy66qLbLLrvUent7G3YPJkyYUDvrrLNq/f39pS+xaZ5++unal7/85drrXve6ht23IUOG1Pbaa6/aNddcU/ryXtHkyZOL/1lr0MwJANByFCLGGNOG0y6FyPXXX1+bMmVKU+/F9ttvX7vkkktKX2pD9ff3184+++zaZptt1tR79/a3v7121113lb7cZVKIsDwOVQUAAFrOfffdlwMPPDCTJk3KL3/5y6audeutt+Ztb3tbdt999/z6179u6lpV+NWvfpVJkyblne98Z+69996mrnX++ednm222yeGHH5558+Y1dS1oNIUIAADQUi6//PLsuOOOOe+88ypfd9KkSfnBD35Q6bqNUqvVcsopp2TKlCm56aabKlu3v78/X//61zNhwoTccsstla0Lq0shAgAAtIRarZavfvWr2XPPPfPYY48VyfD000/n4IMPztFHH52BgYEiGVbFU089lfe85z355Cc/uVKHpTbSAw88kJ133jk/+tGPiqwPK0shAgAAFLdo0aIcfvjhOeqoo9Lf3186Tk466aRMmzYt8+fPLx3lFT300EPZddddc9ZZZ5WOkgULFuSAAw7IZz/72bYqlOhOChEAAKCoWq2W97znPfnGN75ROsoLXHjhhdlnn32yaNGi0lGW6c9//nOmTJmSmTNnlo7yAscff3w+/elPl44By6UQAQAAijrxxBNzzjnnlI7xsv7nf/4nRx55ZLHHUJZn8eLF+Yd/+IfcfffdpaO8rJNPPjnf+973SseAZVKIAAAAxUyfPj3HHnts6RjLdfrpp+crX/lK6Rgv8clPfjKXXHJJ6RjLdeihh+a6664rHQNelkIEAAAo4te//nXe9a53lY6xQj760Y/m0ksvLR1jie985zv5z//8z9IxXtHTTz+dadOm5cEHHywdBV5CIQIAAFRuYGAg733ve/OXv/yldJQV0kp5//jHP+bII48sHWOFPfTQQ/nwhz9cOga8hEIEAACo3Nlnn51bbrmldIyVMmfOnHzxi18sHSPHH398Fi5cWDrGSpkxY0auvvrq0jHgBRQiAABApZ5++umWPzdkWU4++eTMmzev2PqzZs3Kt7/97WLrr45PfOITLXk4Ld1LIQIAAFTq1FNPzX333Vc6xiqZP39+Pve5zxVb/+ijj87AwECx9VfHtddem+nTp5eOAUsoRAAAgMosXLiwaKHQCF/72teKHBJ6ww035IILLqh83UY69thj7RKhZShEAACAyvz85z/Po48+WjrGannmmWeK7HQ499xzK1+z0WbNmpU77rijdAxIohABAAAq1CmPTFR9HbVazb2DBlOIAAAAlejv78+FF15YOkZDXHnllXnssccqW2/WrFn53e9+V9l6zTRjxozSESCJQgQAAKjIzJkz8/DDD5eO0RCLFy/OT3/608rW66RdFTfeeGMeeOCB0jFAIQIAAFSjygKhClVeT6fdu5/97GelI4BCBAAAqMbvf//70hEaqsrrce+g8RQiAABAJebMmVM6QkPNnj27knX6+/szd+7cStaqSlX3DpZHIQIAAFSi0z4Ez549O7VarenrPPzwwxkYGGj6OlXqtHKM9qQQAQAAKtFphcgzzzyTP/3pT01fp9PuW9KZ10T7UYgAAABN9+STT+bJJ58sHaPhqvhg34m7KRQitAKFCAAA0HSDBw8uHaEphgwZ0hFrVK0Tr4n2oxABAACabtiwYVl33XVLx2i4vr6+pq8xduzYpq9RtSruG7wShQgAAFCJTvsQvOaaa2bkyJFNX6fT7lvSmddE+1GIAAAAlei0D8F9fX3p6elp+jqjR4/uuEdMOu17gfakEAEAACrRaR+Cq7qenp4e9w6aQCECAABUYquttiodoaGqvJ5Ou3dbbrll6QigEAEAAKrxt3/7t6UjNNR+++1X2VqddO8GDx6cvfbaq3QMUIgAAADV2HrrrbPFFluUjtEQa621Vt7ylrdUtl6V5UuzTZkyJaNGjSodAxQiAABANXp6ejJ16tTSMRpizz33zLBhwypbb+ONN86ECRMqW6+ZOuV7gPanEAEAACozbdq00hEaosR1dMq9U4jQKhQiAABAZd70pje1/WMzo0aNKnKmx0EHHZTBgwdXvm4j7brrrtl4441Lx4AkChEAAKBCgwYNyoknnlg6xmr59Kc/nXXWWafydTfbbLMcdthhla/bSCeddFLpCLCEQgQAAKjUAQcckEmTJpWOsUo23njjHHXUUcXWP+644zJixIhi66+Ov/u7v2vb/9/pTAoRAACgUj09PfnCF75QOsYqOeGEEyo9TPXFNtxww3z84x8vtv6qGjx4cNvvDKLzKEQAAIDKTZ48ucg5HKtju+22y7ve9a7SMfKxj30sY8aMKR1jpRx++OFtf3YMnUchAgAAFHH66adnk002KR1jhayzzjo599xzM2jQoNJRMmLEiPzwhz/MkCFDSkdZIRMmTMjJJ59cOga8hEIEAAAoYoMNNsgFF1yQtdZaq3SU5ert7c15552XLbfcsnSUJXbeeed87WtfKx3jFY0ZMybTp0/PmmuuWToKvIRCBAAAKGa77bbLWWedVTrGcv3Hf/xH9thjj9IxXuL9739/PvKRj5SOsUxrrLFGpk+fnnHjxpWOAi9LIQIAABT19re/vWUP3DzssMPyT//0T6VjLNMpp5ySvffeu3SMl+jp6cm3vvWt7LTTTqWjwDIpRAAAgOKOPvrofPOb32ypczE++9nP5rTTTktPT0/pKMs0ePDgnH/++TnssMNKR1lixIgRueCCC3LwwQeXjgLLpRABAABawqGHHprLL78866+/ftEca665Zv77v/87xx13XEuXIc8ZOnRoTjvttHzlK18pfujrZpttlpkzZ2bfffctmgNWhEIEAABoGbvssktuuOGG/NVf/VWR9TfeeONcffXVecc73lFk/VXV09OTD3/4w/nZz36WUaNGFckwZcqUXHfdddlmm22KrA8rSyECAAC0lFe/+tW5/vrrc8opp1T24X748OE5+uijc/vtt2f77bevZM1meOtb35pZs2blgx/8YGW7Rfr6+nL66afnsssuK767BwCgSjskqRljjGmvOeSQQ2rt4NFHH6194hOfqK2xxhpNuQ+9vb2197///bUHH3yw9KU23F133VXbf//9m/Y9NHLkyNqJJ55Y+8tf/lL6Updp8uTJxf+sNWjmBABoOQoRY4xpw2mXQuQ5999/f+2f//mfa5tttllDrn/s2LG1D37wg7U77rij9KU13TXXXFM75JBDauuuu25D7t3rX//62nHHHVebN29e6Ut7RQoRlqf1TwgCoNXtkOTm0iEAWDmHHHJIzjjjjNIxVlqtVssdd9yR6dOnZ8aMGbnxxhtX+Gu33nrrTJs2LVOnTs3EiRPT29tdJwgsXrw4V1111ZJ7d999963Q1/X29mbnnXfO1KlTM3Xq1Gy++ebNDdpAU6ZMyZVXXlk6RiM8lGRs6RCdRiECwOpSiAC0oXYtRF5swYIFmTNnTmbPnr1kHn744YwePTp9fX0ZO3bskl9HjhxZOm7LqNVqefzxx19w32bPnp0nnngiY8aMSV9f35IZM2ZMhg0bVjryKlGIsDyDSwcAAABYVWuuuWY233zzttq10Ap6enoyatSojBo1KltvvXXpOFBEd+0RAwAAAIhCBAAAAOhCChEAAACg6yhEAAAAgK6jEAEAAAC6jkIEAAAA6DoKEQAAAKDrKEQAAACArqMQAQAAALqOQgQAAADoOgoRAAAAoOsoRAAAAICuM7h0AAAAgFWxYMGC3HTTTZk9e/aSmTNnTubNm5d11103fX19S2bs2LHZcccds84665SO3RLmzZuX2267bck9e+7+zZ8/PxtuuOGSe9bX15dx48ZlwoQJGTJkSOnY0FAKEQAAoG088sgj+clPfpIZM2bkkksuycKFC1f4a4cMGZJdd90106ZNy3777ZeNNtqoiUlbzz333JPp06dnxowZufrqq1Or1Vb4a9dZZ53ss88+mTp1avbcc8+MHDmyiUkBANrDDklqxhhj2msOOeSQWrsYGBioXXzxxbUpU6bUent7G3YP3vCGN9S+//3v1/r7+0tfYtMsWrSo9tWvfrW2zTbbNOy+DR06tLbPPvvUZs6cWfryXtHkyZOL/1lr0MwJANByFCLGGNOG0y6FyI033ljbbbfdmnovdtxxx9pll11W+lIbamBgoHbuuefWtthii6beu3e84x21u+++u/TlLpNChOVxqCoAANBy7r///rzzne/MxIkTc8UVVzR1rZtvvjm777573va2t+X2229v6lpVuOqqq7LTTjvlwAMPzD333NPUtX70ox9l6623zoc+9KE88sgjTV0LGk0hAgAAtJQrrrgiO+ywQ84555xK17300kszadKknH322ZWu2yi1Wi3//u//nsmTJ+eGG26obN3+/v587Wtfy4QJE3LbbbdVti6sLoUIAADQMk499dTsscceeeyxx4qs/9RTT+Wggw7KMccck4GBgSIZVsXTTz+d973vffn4xz9eLPcf/vCH/PVf/3XOP//8IuvDylKIAAAAxT3zzDM54ogjcuSRR6a/v790nJx44onZf//9M3/+/NJRXtHcuXOz22675bvf/W7pKFmwYEH233//nHDCCSv1FhsoQSECAAAUVavV8t73vjennXZa6SgvMGPGjOy7775ZtGhR6SjL9Pjjj2fKlCm55pprSkd5geOOOy7HHHNM6RiwXAoRAACgqJNOOik/+MEPSsd4Wb/61a9y1FFHteRuh/7+/9/evQdHVeZpHH86BIZAgAjUhGQDhRVZkGEpRRgWFgmjo0IVYhQdKbksqMCWpSwUroiLtxUvgBe8oSCOrFPrEAslwUGEBcHltiCgIQYclYsbSCQSRWjAkHTO/tHKiETI5Zzz6z79/VS9Ff57n/OmQ7qfvO85EY0YMUKffvqpdZRaPf744zH7fQUk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"></image></defs></svg>`);
}
const _sfc_setup$p = _sfc_main$p.setup;
_sfc_main$p.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/elements/ElementsCallshopLogo.vue");
  return _sfc_setup$p ? _sfc_setup$p(props, ctx) : void 0;
};
const __nuxt_component_1$3 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$p, [["ssrRender", _sfc_ssrRender$1]]), { __name: "ElementsCallshopLogo" });

const _sfc_main$o = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "168",
    height: "13",
    viewBox: "0 0 168 13",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "xmlns:xlink": "http://www.w3.org/1999/xlink"
  }, _attrs))}><rect width="167.765" height="13" fill="url(#pattern0_8177_317)"></rect><defs><pattern id="pattern0_8177_317" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image0_8177_317" transform="scale(0.000350631 0.00452489)"></use></pattern><image id="image0_8177_317" width="2852" height="221" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"></image></defs></svg>`);
}
const _sfc_setup$o = _sfc_main$o.setup;
_sfc_main$o.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/elements/ElementsCallshopTextLogo.vue");
  return _sfc_setup$o ? _sfc_setup$o(props, ctx) : void 0;
};
const __nuxt_component_2$2 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$o, [["ssrRender", _sfc_ssrRender]]), { __name: "ElementsCallshopTextLogo" });

const _sfc_main$n = /* @__PURE__ */ defineComponent({
  __name: "SiteMobileChannelSwitch",
  __ssrInlineRender: true,
  setup(__props) {
    const mainStore = useMainStore();
    computed(() => {
      return mainStore.activeScheduleLocation === "channelOne";
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "location-switch" }, _attrs))} data-v-a3099db2><button class="${ssrRenderClass([
        "location-switch__btn",
        {
          "location-switch__btn--active": unref(mainStore).activeStreamingChannel === "channelOne"
        }
      ])}" data-v-a3099db2> 1 </button><button class="${ssrRenderClass([
        "location-switch__btn",
        {
          "location-switch__btn--active": unref(mainStore).activeStreamingChannel === "channelTwo"
        }
      ])}" data-v-a3099db2> 2 </button></div>`);
    };
  }
});

const _sfc_setup$n = _sfc_main$n.setup;
_sfc_main$n.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/site/SiteMobileChannelSwitch.vue");
  return _sfc_setup$n ? _sfc_setup$n(props, ctx) : void 0;
};
const __nuxt_component_3$1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$n, [["__scopeId", "data-v-a3099db2"]]), { __name: "SiteMobileChannelSwitch" });

const _sfc_main$m = {
  __name: "SiteDarkMode",
  __ssrInlineRender: true,
  setup(__props) {
    const mainStore = useMainStore();
    computed(() => mainStore == null ? void 0 : mainStore.isDarkMode);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "darkmodeswitch" }, _attrs))} data-v-c88b212f><svg width="24" height="15" viewBox="0 0 18 11" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-c88b212f><circle class="left" cx="5.5" cy="5.5" r="5.5" fill="var(--color-text)" data-v-c88b212f></circle><circle class="right" cx="12.5" cy="5.5" r="5" fill="var(--color-bg)" stroke="var(--color-text)" data-v-c88b212f></circle></svg></div>`);
    };
  }
};
const _sfc_setup$m = _sfc_main$m.setup;
_sfc_main$m.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/site/SiteDarkMode.vue");
  return _sfc_setup$m ? _sfc_setup$m(props, ctx) : void 0;
};
const __nuxt_component_4 = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["__scopeId", "data-v-c88b212f"]]);

const SEARCH_AUTOCOMPLETE_QUERY = `
*[
  _type in ["person", "set", "show", "venue", "article", "tag.genre", "tag.subGenre", "tag.global", "tag.mood", "tag.musician", "tag.venue", "tag.crafts", "tag.service", "tag.article"] &&
  title match "*" + $searchTerm + "*" &&
  // Hide venues and persons with poolVisibility:false
  !(_type in ["person", "venue"] && poolVisibility != true) &&
  // Hide shows with title "no-show"
  !(_type == "show" && title == "no-show")
] | order(_updatedAt desc)[0...$limit] {
  _id,
  _type,
  title,
  "slug": slug,
  "image": image {
    asset-> {
      _id,
      url
    }
  },
  datetime,
  additionalTitle,
  _type == "set" => {
    "parentShow": *[_type == "show" && references(^._id)][0]{
      _id,
      title,
      "slug": slug.current
    }
  }
}`;
function useSearch(options = {}) {
  const { maxResults = 20, debounceMs = 150 } = options;
  const searchQuery = ref("");
  const results = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const isOpen = ref(false);
  let debounceTimeout = null;
  let lastKeyTime = 0;
  let keyPressCount = 0;
  const hasResults = computed(() => results.value.length > 0);
  const hasQuery = computed(() => searchQuery.value.trim().length > 0);
  const calculateRelevanceScore = (title, query) => {
    if (!title || !query) return 0;
    const titleLower = title.toLowerCase();
    const queryLower = query.toLowerCase().trim();
    if (titleLower === queryLower) return 100;
    if (titleLower.startsWith(queryLower)) return 80;
    const words = titleLower.split(/\s+/);
    if (words.some((word) => word.startsWith(queryLower))) return 60;
    if (titleLower.includes(queryLower)) return 40;
    if (queryLower.length >= 2 && words.some((word) => word.startsWith(queryLower.substring(0, 2))))
      return 20;
    return 10;
  };
  const sortByRelevance = (searchResults, query) => {
    if (!query || !searchResults || searchResults.length === 0)
      return searchResults;
    return [...searchResults].map((result) => ({
      ...result,
      _relevanceScore: calculateRelevanceScore(result.title, query)
    })).sort((a, b) => {
      const scoreA = a._relevanceScore || 0;
      const scoreB = b._relevanceScore || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (a.title || "").localeCompare(b.title || "");
    });
  };
  const getAdaptiveDebounce = () => {
    const now = Date.now();
    const timeSinceLastKey = now - lastKeyTime;
    if (timeSinceLastKey < 100) {
      keyPressCount++;
      return Math.min(debounceMs + keyPressCount * 40, 400);
    } else {
      keyPressCount = Math.max(0, keyPressCount - 1);
      return debounceMs;
    }
  };
  const getResultPath = (result) => {
    var _a, _b, _c, _d, _e;
    if (result._type.startsWith("tag.")) {
      return `/search?q=${encodeURIComponent(result.title)}`;
    }
    switch (result._type) {
      case "person":
      case "venue":
        return `/pool/${(_a = result.slug) == null ? void 0 : _a.current}`;
      case "show":
        return `/shows/${(_b = result.slug) == null ? void 0 : _b.current}`;
      case "set":
        const parentSlug = (_c = result.parentShow) == null ? void 0 : _c.slug;
        const setSlug = (_d = result.slug) == null ? void 0 : _d.current;
        if (parentSlug && setSlug) {
          return `/shows/${parentSlug}/${setSlug}`;
        }
        return `/shows/${setSlug}`;
      case "article":
        return `/words/${(_e = result.slug) == null ? void 0 : _e.current}`;
      default:
        return "/";
    }
  };
  const getTypeLabel = (type) => {
    if (type.startsWith("tag.")) return "Tag";
    switch (type) {
      case "person":
      case "venue":
        return "Pool";
      case "show":
      case "set":
        return "Shows";
      case "article":
        return "Words";
      default:
        return "Content";
    }
  };
  const getTypeColor = (type) => {
    if (type.startsWith("tag.")) return "type-tag";
    switch (type) {
      case "person":
      case "venue":
        return "type-pool";
      case "show":
      case "set":
        return "type-shows";
      case "article":
        return "type-words";
      default:
        return "";
    }
  };
  const performSearch = async (query) => {
    if (!query.trim()) {
      results.value = [];
      return;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const sanity = useSanity();
      const fetchLimit = Math.max(maxResults * 3, 50);
      const searchResults = await sanity.fetch(
        SEARCH_AUTOCOMPLETE_QUERY,
        {
          searchTerm: query.trim(),
          limit: fetchLimit
        }
      );
      const sortedResults = sortByRelevance(searchResults || [], query);
      results.value = sortedResults.slice(0, maxResults);
    } catch (err) {
      console.error("Search error:", err);
      error.value = "Failed to perform search";
      results.value = [];
    } finally {
      isLoading.value = false;
    }
  };
  watch(searchQuery, (newQuery) => {
    const now = Date.now();
    const adaptiveDelay = getAdaptiveDebounce();
    lastKeyTime = now;
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    if (!newQuery.trim()) {
      results.value = [];
      isLoading.value = false;
      keyPressCount = 0;
      return;
    }
    isLoading.value = true;
    debounceTimeout = setTimeout(() => {
      performSearch(newQuery);
    }, adaptiveDelay);
  });
  const clearSearch = () => {
    searchQuery.value = "";
    results.value = [];
    error.value = null;
    keyPressCount = 0;
  };
  const openSearch = () => {
    isOpen.value = true;
  };
  const closeSearch = () => {
    isOpen.value = false;
    clearSearch();
  };
  const toggleSearch = () => {
    if (isOpen.value) {
      closeSearch();
    } else {
      openSearch();
    }
  };
  return {
    // State
    searchQuery,
    results,
    isLoading,
    error,
    isOpen,
    // Computed
    hasResults,
    hasQuery,
    // Methods
    getResultPath,
    getTypeLabel,
    getTypeColor,
    clearSearch,
    openSearch,
    closeSearch,
    toggleSearch,
    performSearch
  };
}

const _sfc_main$l = {
  __name: "SiteSearch",
  __ssrInlineRender: true,
  props: {
    // Whether this is rendered as a modal overlay (quick search) or inline
    isModal: {
      type: Boolean,
      default: false
    },
    // Auto-focus input when mounted/opened
    autoFocus: {
      type: Boolean,
      default: true
    }
  },
  emits: ["close", "select"],
  setup(__props, { emit: __emit }) {
    useLocalePath();
    const {
      searchQuery,
      results,
      isLoading,
      hasResults,
      hasQuery,
      getTypeLabel,
      getTypeColor
    } = useSearch({ maxResults: 20, debounceMs: 150 });
    ref(null);
    const activeIndex = ref(-1);
    watch(results, () => {
      activeIndex.value = -1;
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["site-search", { "is-modal": __props.isModal }]
      }, _attrs))} data-v-7873670f><div class="search-input-wrapper" data-v-7873670f><div class="search-icon" data-v-7873670f><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-7873670f><circle cx="11" cy="11" r="8" data-v-7873670f></circle><path d="m21 21-4.3-4.3" data-v-7873670f></path></svg></div><input${ssrRenderAttr("value", unref(searchQuery))} type="text" class="search-input" placeholder="Search shows, people, venues, articles..." autocomplete="off" data-v-7873670f>`);
      if (unref(hasQuery)) {
        _push(`<button class="clear-button" aria-label="Clear search" data-v-7873670f><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-7873670f><path d="M18 6 6 18" data-v-7873670f></path><path d="m6 6 12 12" data-v-7873670f></path></svg></button>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(isLoading)) {
        _push(`<div class="loading-spinner" data-v-7873670f></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(hasQuery)) {
        _push(`<div class="search-results" data-v-7873670f><button class="detailed-search-link" data-v-7873670f><span class="link-text" data-v-7873670f>Detailed search for &quot;${ssrInterpolate(unref(searchQuery))}&quot;</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-7873670f><path d="M5 12h14" data-v-7873670f></path><path d="m12 5 7 7-7 7" data-v-7873670f></path></svg></button>`);
        if (unref(hasResults)) {
          _push(`<div class="results-list" data-v-7873670f><!--[-->`);
          ssrRenderList(unref(results), (result, index) => {
            _push(`<button class="${ssrRenderClass([{
              "is-selected": index === unref(activeIndex)
            }, "autocomplete-item"])}" data-v-7873670f><span class="autocomplete-title" data-v-7873670f>${ssrInterpolate(result.title)}</span><span class="${ssrRenderClass([unref(getTypeColor)(result._type), "autocomplete-type"])}" data-v-7873670f>${ssrInterpolate(unref(getTypeLabel)(result._type))}</span></button>`);
          });
          _push(`<!--]--></div>`);
        } else if (!unref(isLoading)) {
          _push(`<div class="no-results" data-v-7873670f><p data-v-7873670f>No results found for &quot;${ssrInterpolate(unref(searchQuery))}&quot;</p><span data-v-7873670f>Try searching for shows, people, venues, or articles</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.isModal && !unref(hasQuery)) {
        _push(`<div class="keyboard-hints" data-v-7873670f><div class="hint" data-v-7873670f><kbd data-v-7873670f>↑</kbd><kbd data-v-7873670f>↓</kbd><span data-v-7873670f>to navigate</span></div><div class="hint" data-v-7873670f><kbd data-v-7873670f>↵</kbd><span data-v-7873670f>to select</span></div><div class="hint" data-v-7873670f><kbd data-v-7873670f>esc</kbd><span data-v-7873670f>to close</span></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$l = _sfc_main$l.setup;
_sfc_main$l.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/site/SiteSearch.vue");
  return _sfc_setup$l ? _sfc_setup$l(props, ctx) : void 0;
};
const __nuxt_component_0$5 = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["__scopeId", "data-v-7873670f"]]);

const _sfc_main$k = {
  __name: "SiteSearchModal",
  __ssrInlineRender: true,
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ["update:modelValue", "close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const isOpen = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value)
    });
    const handleClose = () => {
      isOpen.value = false;
      emit("close");
    };
    const handleSelect = (result) => {
      handleClose();
    };
    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    watch(isOpen, (newValue) => {
      if (newValue) {
        (void 0).addEventListener("keydown", handleKeydown);
        (void 0).body.style.overflow = "hidden";
      } else {
        (void 0).removeEventListener("keydown", handleKeydown);
        (void 0).body.style.overflow = "";
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_SiteSearch = __nuxt_component_0$5;
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(isOpen)) {
          _push2(`<div class="search-modal-overlay" data-v-6ab64a52><div class="search-modal-container" data-v-6ab64a52>`);
          _push2(ssrRenderComponent(_component_SiteSearch, {
            "is-modal": true,
            "auto-focus": true,
            onClose: handleClose,
            onSelect: handleSelect
          }, null, _parent));
          _push2(`</div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
};
const _sfc_setup$k = _sfc_main$k.setup;
_sfc_main$k.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/site/SiteSearchModal.vue");
  return _sfc_setup$k ? _sfc_setup$k(props, ctx) : void 0;
};
const __nuxt_component_0$4 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$k, [["__scopeId", "data-v-6ab64a52"]]), { __name: "SiteSearchModal" });

const _sfc_main$j = {
  __name: "SiteSearchButton",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const isSearchOpen = ref(false);
    const isOnSearchPage = computed(() => {
      return route.path.includes("/search");
    });
    const isActive = computed(() => {
      return isSearchOpen.value || isOnSearchPage.value;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_SiteSearchModal = __nuxt_component_0$4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "site-search-button-wrapper tags" }, _attrs))} data-v-fa653116><button class="${ssrRenderClass([{ "is-active": unref(isActive), "is-disabled": unref(isOnSearchPage) }, "search-button tag"])}"${ssrIncludeBooleanAttr(unref(isOnSearchPage)) ? " disabled" : ""} aria-label="Open search" data-v-fa653116><svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-fa653116><circle cx="5.33765" cy="4.59622" r="2.75002" transform="rotate(45 5.33765 4.59622)" data-v-fa653116></circle><path d="M0.159881 8.71358C-0.0425288 8.90142 -0.0543383 9.21779 0.133504 9.4202C0.321346 9.62261 0.637709 9.63442 0.840119 9.44657L0.159881 8.71358ZM3.08151 7.3665L3.44801 7.02638L2.76777 6.29339L2.40128 6.6335L3.08151 7.3665ZM0.840119 9.44657L3.08151 7.3665L2.40128 6.6335L0.159881 8.71358L0.840119 9.44657Z" data-v-fa653116></path></svg><span class="button-text" data-v-fa653116>Search</span></button>`);
      _push(ssrRenderComponent(_component_SiteSearchModal, {
        modelValue: unref(isSearchOpen),
        "onUpdate:modelValue": ($event) => isRef(isSearchOpen) ? isSearchOpen.value = $event : null
      }, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$j = _sfc_main$j.setup;
_sfc_main$j.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/site/SiteSearchButton.vue");
  return _sfc_setup$j ? _sfc_setup$j(props, ctx) : void 0;
};
const __nuxt_component_5 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$j, [["__scopeId", "data-v-fa653116"]]), { __name: "SiteSearchButton" });

const _sfc_main$i = {
  __name: "SiteDiscordButton",
  __ssrInlineRender: true,
  setup(__props) {
    const { locale, locales } = useI18n();
    useLocalePath();
    const mainStore = useMainStore();
    computed(() => {
      var _a;
      return (_a = mainStore == null ? void 0 : mainStore.siteNav) == null ? void 0 : _a.mainMenu;
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_NuxtLink = __nuxt_component_0$6;
      _push(ssrRenderComponent(_component_NuxtLink, mergeProps({
        to: `${(_b = (_a = unref(mainStore)) == null ? void 0 : _a.siteNav) == null ? void 0 : _b.discordLink}`,
        target: "_blank"
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-020f77d6${_scopeId}><circle cx="12" cy="12" r="11.5" stroke="var(--color-text)" data-v-020f77d6${_scopeId}></circle><path d="M9.33459 19C9.28538 19 9.23557 18.99 9.18752 18.9689C9.04397 18.9059 8.95081 18.757 8.95081 18.5919V16.7235H8.94495C7.32135 16.7235 6 15.3186 6 13.5921V10.1313C6 8.40497 7.32129 7 8.94495 7H15.055C16.6786 7 18 8.40491 18 10.1313V13.5921C18 15.3185 16.6787 16.7235 15.055 16.7235H11.6355L9.60645 18.8803C9.53321 18.9582 9.43478 18.9999 9.33516 18.9999L9.33459 19ZM8.94494 7.81686C7.74436 7.81686 6.76814 8.85543 6.76814 10.1314V13.5922C6.76814 14.8688 7.74489 15.9068 8.94494 15.9068H9.33518C9.54729 15.9068 9.71897 16.0893 9.71897 16.3149V17.6058L11.2049 16.0258C11.277 15.9492 11.3748 15.9062 11.4762 15.9062H15.0544C16.255 15.9062 17.2312 14.8676 17.2312 13.5916V10.1308C17.2312 8.85425 16.2545 7.81625 15.0544 7.81625L8.94494 7.81686ZM14.8782 13.4645H9.12194C8.90983 13.4645 8.73815 13.282 8.73815 13.0564C8.73815 12.8309 8.90983 12.6483 9.12194 12.6483H14.8776C15.0897 12.6483 15.2614 12.8309 15.2614 13.0564C15.2614 13.282 15.0897 13.4645 14.8776 13.4645H14.8782ZM14.8782 11.0758H9.12194C8.90983 11.0758 8.73815 10.8932 8.73815 10.6677C8.73815 10.4422 8.90983 10.2596 9.12194 10.2596H14.8776C15.0897 10.2596 15.2614 10.4422 15.2614 10.6677C15.2614 10.8932 15.0897 11.0758 14.8776 11.0758H14.8782Z" fill="var(--color-text)" data-v-020f77d6${_scopeId}></path></svg>`);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                width: "24",
                height: "24",
                viewBox: "0 0 24 24",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg"
              }, [
                createVNode("circle", {
                  cx: "12",
                  cy: "12",
                  r: "11.5",
                  stroke: "var(--color-text)"
                }),
                createVNode("path", {
                  d: "M9.33459 19C9.28538 19 9.23557 18.99 9.18752 18.9689C9.04397 18.9059 8.95081 18.757 8.95081 18.5919V16.7235H8.94495C7.32135 16.7235 6 15.3186 6 13.5921V10.1313C6 8.40497 7.32129 7 8.94495 7H15.055C16.6786 7 18 8.40491 18 10.1313V13.5921C18 15.3185 16.6787 16.7235 15.055 16.7235H11.6355L9.60645 18.8803C9.53321 18.9582 9.43478 18.9999 9.33516 18.9999L9.33459 19ZM8.94494 7.81686C7.74436 7.81686 6.76814 8.85543 6.76814 10.1314V13.5922C6.76814 14.8688 7.74489 15.9068 8.94494 15.9068H9.33518C9.54729 15.9068 9.71897 16.0893 9.71897 16.3149V17.6058L11.2049 16.0258C11.277 15.9492 11.3748 15.9062 11.4762 15.9062H15.0544C16.255 15.9062 17.2312 14.8676 17.2312 13.5916V10.1308C17.2312 8.85425 16.2545 7.81625 15.0544 7.81625L8.94494 7.81686ZM14.8782 13.4645H9.12194C8.90983 13.4645 8.73815 13.282 8.73815 13.0564C8.73815 12.8309 8.90983 12.6483 9.12194 12.6483H14.8776C15.0897 12.6483 15.2614 12.8309 15.2614 13.0564C15.2614 13.282 15.0897 13.4645 14.8776 13.4645H14.8782ZM14.8782 11.0758H9.12194C8.90983 11.0758 8.73815 10.8932 8.73815 10.6677C8.73815 10.4422 8.90983 10.2596 9.12194 10.2596H14.8776C15.0897 10.2596 15.2614 10.4422 15.2614 10.6677C15.2614 10.8932 15.0897 11.0758 14.8776 11.0758H14.8782Z",
                  fill: "var(--color-text)"
                })
              ]))
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
};
const _sfc_setup$i = _sfc_main$i.setup;
_sfc_main$i.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/site/SiteDiscordButton.vue");
  return _sfc_setup$i ? _sfc_setup$i(props, ctx) : void 0;
};
const __nuxt_component_6 = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["__scopeId", "data-v-020f77d6"]]);

const _sfc_main$h = {
  __name: "SiteScheduleButton",
  __ssrInlineRender: true,
  setup(__props) {
    const { locale, locales } = useI18n();
    const localePath = useLocalePath();
    const mainStore = useMainStore();
    computed(() => {
      var _a;
      return (_a = mainStore == null ? void 0 : mainStore.siteNav) == null ? void 0 : _a.mainMenu;
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_NuxtLink = __nuxt_component_0$6;
      _push(ssrRenderComponent(_component_NuxtLink, mergeProps({
        to: unref(localePath)(`/${(_b = (_a = unref(mainStore)) == null ? void 0 : _a.siteNav) == null ? void 0 : _b.schedulePageRoute}`)
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-cdcfd632${_scopeId}><circle cx="12" cy="12" r="11.5" stroke="var(--color-text)" data-v-cdcfd632${_scopeId}></circle><path d="M16.7143 6.91667H15.4286V6.45833C15.4286 6.20624 15.2357 6 15 6C14.7643 6 14.5714 6.20624 14.5714 6.45833V6.91667H9.42857V6.45833C9.42857 6.20624 9.23572 6 9 6C8.76428 6 8.57143 6.20624 8.57143 6.45833V6.91667H7.28571C6.57858 6.91667 6 7.53542 6 8.29167V15.625C6 16.3812 6.57858 17 7.28571 17H16.7143C17.4214 17 18 16.3812 18 15.625V8.29167C18 7.53542 17.4214 6.91667 16.7143 6.91667ZM6.85714 8.29167C6.85714 8.03958 7.04999 7.83333 7.28571 7.83333H8.57143V8.29167C8.57143 8.54376 8.76428 8.75 9 8.75C9.23572 8.75 9.42857 8.54376 9.42857 8.29167V7.83333H14.5714V8.29167C14.5714 8.54376 14.7643 8.75 15 8.75C15.2357 8.75 15.4286 8.54376 15.4286 8.29167V7.83333H16.7143C16.95 7.83333 17.1429 8.03958 17.1429 8.29167V9.66667H6.85714V8.29167ZM17.1429 15.625C17.1429 15.8771 16.95 16.0833 16.7143 16.0833H7.28571C7.04999 16.0833 6.85714 15.8771 6.85714 15.625V10.5833H17.1429V15.625Z" fill="var(--color-text)" data-v-cdcfd632${_scopeId}></path></svg>`);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                width: "24",
                height: "24",
                viewBox: "0 0 24 24",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg"
              }, [
                createVNode("circle", {
                  cx: "12",
                  cy: "12",
                  r: "11.5",
                  stroke: "var(--color-text)"
                }),
                createVNode("path", {
                  d: "M16.7143 6.91667H15.4286V6.45833C15.4286 6.20624 15.2357 6 15 6C14.7643 6 14.5714 6.20624 14.5714 6.45833V6.91667H9.42857V6.45833C9.42857 6.20624 9.23572 6 9 6C8.76428 6 8.57143 6.20624 8.57143 6.45833V6.91667H7.28571C6.57858 6.91667 6 7.53542 6 8.29167V15.625C6 16.3812 6.57858 17 7.28571 17H16.7143C17.4214 17 18 16.3812 18 15.625V8.29167C18 7.53542 17.4214 6.91667 16.7143 6.91667ZM6.85714 8.29167C6.85714 8.03958 7.04999 7.83333 7.28571 7.83333H8.57143V8.29167C8.57143 8.54376 8.76428 8.75 9 8.75C9.23572 8.75 9.42857 8.54376 9.42857 8.29167V7.83333H14.5714V8.29167C14.5714 8.54376 14.7643 8.75 15 8.75C15.2357 8.75 15.4286 8.54376 15.4286 8.29167V7.83333H16.7143C16.95 7.83333 17.1429 8.03958 17.1429 8.29167V9.66667H6.85714V8.29167ZM17.1429 15.625C17.1429 15.8771 16.95 16.0833 16.7143 16.0833H7.28571C7.04999 16.0833 6.85714 15.8771 6.85714 15.625V10.5833H17.1429V15.625Z",
                  fill: "var(--color-text)"
                })
              ]))
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
};
const _sfc_setup$h = _sfc_main$h.setup;
_sfc_main$h.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/site/SiteScheduleButton.vue");
  return _sfc_setup$h ? _sfc_setup$h(props, ctx) : void 0;
};
const __nuxt_component_7 = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["__scopeId", "data-v-cdcfd632"]]);

const _sfc_main$g = {
  __name: "SiteMenuButton",
  __ssrInlineRender: true,
  setup(__props) {
    const { locale, locales } = useI18n();
    useLocalePath();
    const mainStore = useMainStore();
    computed(() => {
      var _a;
      return (_a = mainStore == null ? void 0 : mainStore.siteNav) == null ? void 0 : _a.mainMenu;
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      _push(`<!--[-->`);
      if (!((_a = unref(mainStore)) == null ? void 0 : _a.menuOpen)) {
        _push(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="open" data-v-dab495fb> stroke=&quot;var(--color-text)&quot; <circle cx="12" cy="12" r="11.5" shape-rendering="geometricPrecision" stroke="var(--color-text)" data-v-dab495fb></circle><path d="M5 8.5H19" stroke-linecap="round" shape-rendering="optimizeQuality" stroke="var(--color-text)" data-v-dab495fb></path><path d="M5 12H19" stroke-linecap="round" shape-rendering="optimizeQuality" stroke="var(--color-text)" data-v-dab495fb></path><path d="M5 15.5H19" stroke-linecap="round" shape-rendering="optimizeQuality" stroke="var(--color-text)" data-v-dab495fb></path></svg>`);
      } else {
        _push(`<!---->`);
      }
      if ((_b = unref(mainStore)) == null ? void 0 : _b.menuOpen) {
        _push(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="close" data-v-dab495fb><circle cx="12" cy="12" r="11.5" fill="var(--color-text)" stroke="var(--color-text)" class="bg" data-v-dab495fb></circle><path d="M7 17L17 6.5" stroke="var(--color-bg)" data-v-dab495fb></path><line x1="7.12919" y1="6.87106" x2="17.1292" y2="16.8711" stroke="var(--color-bg)" data-v-dab495fb></line></svg>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--]-->`);
    };
  }
};
const _sfc_setup$g = _sfc_main$g.setup;
_sfc_main$g.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/site/SiteMenuButton.vue");
  return _sfc_setup$g ? _sfc_setup$g(props, ctx) : void 0;
};
const __nuxt_component_8 = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["__scopeId", "data-v-dab495fb"]]);

const _sfc_main$f = {
  __name: "ElementsLink",
  __ssrInlineRender: true,
  props: {
    type: {
      type: String,
      default: () => "external"
    },
    href: {
      type: String,
      default: () => ""
    },
    blank: {
      type: Boolean,
      default: () => false
    },
    route: {
      type: String,
      default: () => ""
    },
    slug: {
      type: String,
      default: () => ""
    },
    func: {
      type: String,
      default: () => ""
    },
    parentActive: {
      type: Boolean,
      default: () => true
    }
  },
  setup(__props) {
    const { locale, setLocale } = useI18n();
    const localePath = useLocalePath();
    const route = useRoute();
    const props = __props;
    const query = route.query;
    const internalRoute = computed(() => {
      return {
        name: (props == null ? void 0 : props.route) ?? "index",
        params: (props == null ? void 0 : props.slug) ? { slug: props == null ? void 0 : props.slug } : {},
        query
      };
    });
    const { $CC } = useNuxtApp();
    useMainStore();
    const isActive = computed(() => {
      if (props.type !== "internal" || !props.parentActive) return false;
      if (props.route === "index" || !props.route) {
        return route.path === "/" || route.path === `/${locale.value}/`;
      }
      const linkPath = localePath({
        name: props.route,
        params: props.slug ? { slug: props.slug } : {}
      });
      const normalizedLinkPath = linkPath.endsWith("/") ? linkPath.slice(0, -1) : linkPath;
      const normalizedRoutePath = route.path.endsWith("/") ? route.path.slice(0, -1) : route.path;
      if (normalizedRoutePath === normalizedLinkPath) {
        return true;
      }
      if (normalizedLinkPath !== "/" && normalizedRoutePath.startsWith(normalizedLinkPath + "/")) {
        return true;
      }
      const routeSegments = normalizedRoutePath.split("/").filter(Boolean);
      const linkSegments = normalizedLinkPath.split("/").filter(Boolean);
      if (routeSegments.length === 0 || linkSegments.length === 0) return false;
      if (routeSegments[0] === linkSegments[0]) {
        if (["shows", "pool", "words", "info", "schedule"].includes(linkSegments[0])) {
          return true;
        }
      }
      if (props.slug) {
        return normalizedRoutePath === normalizedLinkPath;
      }
      return false;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$6;
      if (__props.type !== "function") {
        _push(ssrRenderComponent(_component_NuxtLink, mergeProps({
          key: `rt-${unref(locale)}`,
          to: props.type !== "internal" ? props == null ? void 0 : props.href : unref(localePath)(unref(internalRoute)),
          target: (props == null ? void 0 : props.blank) && (props == null ? void 0 : props.type) !== "internal" ? "_blank" : void 0,
          download: props.type === "download" ? true : void 0,
          rel: (props == null ? void 0 : props.blank) && (props == null ? void 0 : props.type) !== "internal" ? "noopener" : void 0,
          class: { "parent-active": unref(isActive) }
        }, _attrs), {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "default", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "default", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent));
      } else {
        _push(`<button${ssrRenderAttrs(mergeProps({ class: "link-style" }, _attrs))} data-v-5a3a0964>`);
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
        _push(`</button>`);
      }
    };
  }
};
const _sfc_setup$f = _sfc_main$f.setup;
_sfc_main$f.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/elements/ElementsLink.vue");
  return _sfc_setup$f ? _sfc_setup$f(props, ctx) : void 0;
};
const ElementsLink = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["__scopeId", "data-v-5a3a0964"]]);

const _sfc_main$e = {
  __name: "SiteMenu",
  __ssrInlineRender: true,
  setup(__props) {
    const { locale, locales } = useI18n();
    useLocalePath();
    const mainStore = useMainStore();
    const mainMenu = computed(() => {
      var _a;
      return (_a = mainStore == null ? void 0 : mainStore.siteNav) == null ? void 0 : _a.mainMenu;
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_ElementsLink = ElementsLink;
      if ((_a = unref(mainStore)) == null ? void 0 : _a.menuOpen) {
        _push(`<nav${ssrRenderAttrs(mergeProps({ class: "menu tags" }, _attrs))} data-v-ef07714d><ul data-v-ef07714d><!--[-->`);
        ssrRenderList(unref(mainMenu), (item) => {
          _push(`<li data-v-ef07714d>`);
          _push(ssrRenderComponent(_component_ElementsLink, {
            type: item == null ? void 0 : item.type,
            href: item == null ? void 0 : item.url,
            blank: item == null ? void 0 : item.blank,
            route: item == null ? void 0 : item.route,
            slug: item == null ? void 0 : item.slug,
            func: item == null ? void 0 : item.func,
            class: `tag ${(item == null ? void 0 : item.route) ? item == null ? void 0 : item.route : ""}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(item == null ? void 0 : item.title)}`);
              } else {
                return [
                  createTextVNode(toDisplayString$1(item == null ? void 0 : item.title), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</li>`);
        });
        _push(`<!--]--></ul></nav>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
};
const _sfc_setup$e = _sfc_main$e.setup;
_sfc_main$e.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/site/SiteMenu.vue");
  return _sfc_setup$e ? _sfc_setup$e(props, ctx) : void 0;
};
const __nuxt_component_9 = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["__scopeId", "data-v-ef07714d"]]);

const streamUrl1 = "https://icecast.callshopradio.com/callshopradio";
const streamUrl2 = "https://icecast.callshopradio.com/callshopradio-wien";
const _sfc_main$d = {
  __name: "MusicController",
  __ssrInlineRender: true,
  setup(__props) {
    const mainStore = useMainStore();
    const apiKey = process.env.NUXT_LIBRETIME_API_KEY;
    const isPlaying1 = ref(false);
    const isPlaying2 = ref(false);
    const isLoading1 = ref(false);
    const isLoading2 = ref(false);
    const liveStatus = ref({
      stream1: {
        onAirLight: {},
        liveData: {},
        icecastData: {}
      },
      stream2: {
        onAirLight: {},
        liveData: {}
      }
    });
    const fetcher = async (url, apiKey2 = null) => {
      try {
        const headers = apiKey2 ? {
          Authorization: `Api-Key ${apiKey2}`,
          "Content-Type": "application/json"
        } : {};
        const response = await fetch(url, { headers });
        if (!response.ok)
          throw new Error(`Error fetching data: ${response.statusText}`);
        return await response.json();
      } catch (err) {
        return null;
      }
    };
    const updateLiveStatus = async () => {
      try {
        const liveInfoUrl1 = "https://libretime.callshopradio.com/api/live-info-v2";
        const onAirLightUrl1 = `https://libretime.callshopradio.com/api/on-air-light/format/json?api_key=${apiKey}`;
        const icecastUrl = "https://icecast.callshopradio.com/status-json.xsl";
        const liveInfoUrl2 = "https://wien.callshopradio.com/api/live-info-v2?days=7";
        const [liveData1, onAirLight1, icecastData, liveData2] = await Promise.all([
          fetcher(liveInfoUrl1),
          fetcher(onAirLightUrl1),
          fetcher(icecastUrl).catch(() => null),
          fetcher(liveInfoUrl2)
        ]);
        let onAirLight2 = null;
        if (liveData2) {
          onAirLight2 = {
            on_air_light: liveData2.sources.livedj === "on" || liveData2.sources.masterdj === "on",
            live_stream: liveData2.sources.livedj === "on",
            live_stream_on_air: liveData2.sources.livedj === "on",
            master_stream: liveData2.sources.masterdj === "on",
            master_stream_on_air: liveData2.sources.masterdj === "on"
          };
        }
        liveStatus.value = {
          stream1: {
            onAirLight: onAirLight1 || {},
            liveData: liveData1 || {},
            icecastData: icecastData || {}
          },
          stream2: {
            onAirLight: onAirLight2 || {},
            liveData: liveData2 || {}
          }
        };
      } catch (error) {
      }
    };
    const parseString = (string) => {
      if (!string) return "";
      return string.replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"');
    };
    const isCurrentShowLive1 = computed(() => {
      var _a;
      const { liveData } = liveStatus.value.stream1;
      if ((_a = liveData == null ? void 0 : liveData.shows) == null ? void 0 : _a.current) {
        const description = liveData.shows.current.description || "";
        return description.toLowerCase().includes("live");
      }
      return false;
    });
    const isCurrentShowLive2 = computed(() => {
      var _a;
      const { liveData } = liveStatus.value.stream2;
      if ((_a = liveData == null ? void 0 : liveData.shows) == null ? void 0 : _a.current) {
        const description = liveData.shows.current.description || "";
        return description.toLowerCase().includes("live");
      }
      return false;
    });
    const getActualLiveStatus1 = computed(() => {
      const { onAirLight } = liveStatus.value.stream1;
      return (onAirLight == null ? void 0 : onAirLight.on_air_light) && isCurrentShowLive1.value;
    });
    const getActualLiveStatus2 = computed(() => {
      const { onAirLight } = liveStatus.value.stream2;
      return (onAirLight == null ? void 0 : onAirLight.on_air_light) && isCurrentShowLive2.value;
    });
    const getCurrentName1 = computed(() => {
      var _a, _b, _c, _d, _e, _f, _g;
      const { onAirLight, liveData, icecastData } = liveStatus.value.stream1;
      if (onAirLight == null ? void 0 : onAirLight.on_air_light) {
        if (onAirLight == null ? void 0 : onAirLight.master_stream) {
          const title = ((_c = (_b = (_a = icecastData == null ? void 0 : icecastData.icestats) == null ? void 0 : _a.source) == null ? void 0 : _b[0]) == null ? void 0 : _c.title) || "";
          return title ? parseString(title) : "Live Stream 1";
        } else if ((_d = liveData == null ? void 0 : liveData.tracks) == null ? void 0 : _d.current) {
          if (liveData.tracks.current.metadata) {
            const artist = liveData.tracks.current.metadata.artist_name || "";
            const title = liveData.tracks.current.metadata.track_title || "";
            if (artist && artist !== title) {
              return parseString(`${title} - ${artist}`);
            }
            return parseString(title);
          } else if ((_e = liveData.shows) == null ? void 0 : _e.current) {
            return parseString(
              liveData.shows.current.name.replace(" - Live Stream", "")
            );
          }
        }
      }
      if (((_g = (_f = liveData == null ? void 0 : liveData.shows) == null ? void 0 : _f.next) == null ? void 0 : _g.length) > 0) {
        const nextShow = liveData.shows.next[0];
        const startSplitted = nextShow.starts.split(" ");
        const date = /* @__PURE__ */ new Date(`${startSplitted[0]}T${startSplitted[1]}Z`);
        const hoursNext = date.getUTCHours();
        const minutesNext = date.getUTCMinutes() < 10 ? "0" + date.getUTCMinutes() : date.getUTCMinutes();
        return `Next (${hoursNext}:${minutesNext}): ${parseString(nextShow.name)}`;
      }
      return "Stream 1";
    });
    const getCurrentName2 = computed(() => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      const { onAirLight, liveData } = liveStatus.value.stream2;
      if (onAirLight == null ? void 0 : onAirLight.on_air_light) {
        if (onAirLight == null ? void 0 : onAirLight.master_stream) {
          const title = ((_d = (_c = (_b = (_a = liveStatus.value.stream1.icecastData) == null ? void 0 : _a.icestats) == null ? void 0 : _b.source) == null ? void 0 : _c[1]) == null ? void 0 : _d.title) || "";
          return title ? parseString(title) : "Live Stream 2";
        } else if ((_e = liveData == null ? void 0 : liveData.tracks) == null ? void 0 : _e.current) {
          if (liveData.tracks.current.metadata) {
            const artist = liveData.tracks.current.metadata.artist_name || "";
            const title = liveData.tracks.current.metadata.track_title || "";
            if (artist && artist !== title) {
              return parseString(`${title} - ${artist}`);
            }
            return parseString(title);
          } else if ((_f = liveData.shows) == null ? void 0 : _f.current) {
            return parseString(
              liveData.shows.current.name.replace(" - Live Stream", "")
            );
          }
        }
      }
      if ((_g = liveData == null ? void 0 : liveData.tracks) == null ? void 0 : _g.current) {
        if (liveData.tracks.current.metadata) {
          const artist = liveData.tracks.current.metadata.artist_name || "";
          const title = liveData.tracks.current.metadata.track_title || "";
          if (artist && artist !== title) {
            return parseString(`${title} - ${artist}`);
          }
          return parseString(title);
        }
      }
      if ((_h = liveData == null ? void 0 : liveData.shows) == null ? void 0 : _h.current) {
        return parseString(
          liveData.shows.current.name.replace(" - Live Stream", "")
        );
      }
      if (((_j = (_i = liveData == null ? void 0 : liveData.shows) == null ? void 0 : _i.next) == null ? void 0 : _j.length) > 0) {
        const nextShow = liveData.shows.next[0];
        const startSplitted = nextShow.starts.split(" ");
        const date = /* @__PURE__ */ new Date(`${startSplitted[0]}T${startSplitted[1]}Z`);
        const hoursNext = date.getUTCHours();
        const minutesNext = date.getUTCMinutes() < 10 ? "0" + date.getUTCMinutes() : date.getUTCMinutes();
        return `Next (${hoursNext}:${minutesNext}): ${parseString(nextShow.name)}`;
      }
      return "Stream 2";
    });
    updateLiveStatus();
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "audio-player" }, _attrs))} data-v-a41314b8><div class="audio-player__wrapper" data-v-a41314b8><div class="${ssrRenderClass([{
        active: unref(mainStore).activeStreamingChannel === "channelOne" || isPlaying1.value && unref(mainStore).activeStreamingChannel === "channelOne" || isLoading1.value,
        inactive: unref(mainStore).activeStreamingChannel === "channelTwo" || isPlaying2.value && unref(mainStore).activeStreamingChannel === "channelTwo" || isPlaying1.value && unref(mainStore).activeStreamingChannel === "channelTwo" || isLoading2.value,
        offline: !getActualLiveStatus1.value && !((_b = (_a = liveStatus.value.stream1.liveData) == null ? void 0 : _a.tracks) == null ? void 0 : _b.current)
      }, "audio-player__music-controller track-one"])}" data-v-a41314b8><h2 data-v-a41314b8>1</h2><button data-v-a41314b8>`);
      if (isLoading1.value) {
        _push(`<div class="loading-indicator" data-v-a41314b8><span class="dot" data-v-a41314b8></span><span class="dot" data-v-a41314b8></span><span class="dot" data-v-a41314b8></span></div>`);
      } else if (isPlaying1.value) {
        _push(`<svg class="pause" width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-a41314b8><rect width="3" height="10" data-v-a41314b8></rect><rect x="5" width="3" height="10" data-v-a41314b8></rect></svg>`);
      } else {
        _push(`<svg class="play" width="9" height="12" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-a41314b8><path d="M9 6L-4.89399e-07 11.1962L-3.51373e-08 0.803847L9 6Z" fill="black" data-v-a41314b8></path></svg>`);
      }
      _push(`</button><p class="track-name" data-v-a41314b8>${ssrInterpolate(getCurrentName1.value)}</p><p class="${ssrRenderClass(`live-indicator ${getActualLiveStatus1.value ? "live" : ((_d = (_c = liveStatus.value.stream1.liveData) == null ? void 0 : _c.tracks) == null ? void 0 : _d.current) ? "track" : "offline"}`)}" data-v-a41314b8>`);
      if (getActualLiveStatus1.value) {
        _push(`<svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-a41314b8><circle cx="4.5" cy="4.5" r="4.5" fill="black" data-v-a41314b8></circle></svg>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<svg viewBox="0 0 512 512" enable-background="new 0 0 512 512" xmlns="http://www.w3.org/2000/svg" class="broadcast" data-v-a41314b8><g data-v-a41314b8><g data-v-a41314b8><g data-v-a41314b8><path clip-rule="evenodd" d="M415.698,192.641c-8.379-21.068-21.236-40.268-38.577-57.6      l36.309-36.364c26.971,26.989,45.555,57.456,55.745,91.404c6.226,20.683,9.349,42.655,9.367,65.919v0.06      c-0.008,34.011-6.66,65.254-19.957,93.729c-10.701,23.024-25.735,44.24-45.097,63.651l-36.427-36.422      c13.297-13.305,23.948-27.696,31.945-43.171c12.119-23.434,18.17-49.363,18.156-77.788V256      C427.19,233.287,423.372,212.168,415.698,192.641z" fill="#333333" fill-rule="evenodd" data-v-a41314b8></path></g><g data-v-a41314b8><path clip-rule="evenodd" d="M351.69,160.99c8.768,8.825,16.062,18.27,21.88,28.334h0.06      c11.449,19.798,17.17,41.983,17.165,66.56V256c-0.004,25.516-6.152,48.478-18.447,68.889h-0.057      c-5.676,9.334-12.638,18.139-20.892,26.414v-0.06l-0.057,0.06l-36.427-36.423c2.371-2.448,4.562-4.95,6.576-7.505v-0.06      c11.828-14.672,17.763-31.779,17.807-51.315v-0.116c-0.019-22.938-8.124-42.506-24.323-58.705l36.483-36.538      C351.541,160.752,351.618,160.868,351.69,160.99z" fill="#333333" fill-rule="evenodd" data-v-a41314b8></path></g><g data-v-a41314b8><path clip-rule="evenodd" d="M225.829,225.571c8.342-8.35,18.427-12.519,30.259-12.509      c11.851-0.01,21.956,4.159,30.316,12.509l0.059,0.059c8.313,8.348,12.463,18.433,12.451,30.254V256      c-0.016,11.798-4.187,21.863-12.51,30.197c-0.03,0.027-0.048,0.068-0.058,0.116c-8.364,8.272-18.447,12.402-30.259,12.394      c-11.817,0.009-21.884-4.142-30.201-12.452l-0.058-0.058c-8.311-8.317-12.481-18.365-12.511-30.138c0-0.06,0-0.117,0-0.176      c-0.012-11.787,4.121-21.854,12.395-30.196C225.747,225.653,225.786,225.615,225.829,225.571z" fill="#333333" fill-rule="evenodd" data-v-a41314b8></path></g><g data-v-a41314b8><path clip-rule="evenodd" d="M121.265,255.884c-0.006-1.646,0.014-3.273,0.059-4.887      c1.113-35.124,14.225-65.242,39.335-90.356l36.426,36.422c-16.217,16.235-24.306,35.842-24.265,58.821c0,0.059,0,0.116,0,0.176      c-0.015,2.561,0.083,5.084,0.291,7.563v0.057c1.61,19.688,9.602,36.736,23.974,51.143c0.035,0.037,0.073,0.075,0.117,0.116      l-36.485,36.423l-0.058-0.059c-26.237-26.289-39.368-58.037-39.394-95.243C121.265,256,121.265,255.942,121.265,255.884z" fill="#333333" fill-rule="evenodd" data-v-a41314b8></path></g><g data-v-a41314b8><path clip-rule="evenodd" d="M35.437,225.28c6.121-48.44,27.186-90.661,63.192-126.662      l36.425,36.423c-29.26,29.239-45.727,63.78-49.402,103.621c-0.51,5.681-0.763,11.479-0.756,17.397      c0.002,47.206,16.684,87.524,50.042,120.959l0.058,0.059l-36.426,36.421l-0.058-0.058      c-43.359-43.459-65.025-95.92-64.997-157.381C33.521,245.532,34.161,235.271,35.437,225.28z" fill="#333333" fill-rule="evenodd" data-v-a41314b8></path></g></g></g></svg> ${ssrInterpolate(getActualLiveStatus1.value ? "Live" : ((_f = (_e = liveStatus.value.stream1.liveData) == null ? void 0 : _e.tracks) == null ? void 0 : _f.current) ? "" : "Offline")}</p></div><div class="${ssrRenderClass([{
        active: unref(mainStore).activeStreamingChannel === "channelTwo" || isPlaying2.value && unref(mainStore).activeStreamingChannel === "channelTwo" || isLoading2.value,
        inactive: unref(mainStore).activeStreamingChannel === "channelOne" || isPlaying1.value && unref(mainStore).activeStreamingChannel === "channelOne" || isPlaying2.value && unref(mainStore).activeStreamingChannel === "channelOne" || isLoading1.value,
        offline: !getActualLiveStatus2.value && !((_h = (_g = liveStatus.value.stream2.liveData) == null ? void 0 : _g.tracks) == null ? void 0 : _h.current)
      }, "audio-player__music-controller track-two"])}" data-v-a41314b8><h2 data-v-a41314b8>2</h2><button data-v-a41314b8>`);
      if (isLoading2.value) {
        _push(`<div class="loading-indicator" data-v-a41314b8><span class="dot" data-v-a41314b8></span><span class="dot" data-v-a41314b8></span><span class="dot" data-v-a41314b8></span></div>`);
      } else if (isPlaying2.value) {
        _push(`<svg class="pause" width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-a41314b8><rect width="3" height="10" fill="black" data-v-a41314b8></rect><rect x="5" width="3" height="10" fill="black" data-v-a41314b8></rect></svg>`);
      } else {
        _push(`<svg class="play" width="9" height="12" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-a41314b8><path d="M9 6L-4.89399e-07 11.1962L-3.51373e-08 0.803847L9 6Z" fill="black" data-v-a41314b8></path></svg>`);
      }
      _push(`</button><p class="track-name" data-v-a41314b8>${ssrInterpolate(getCurrentName2.value)}</p><p class="${ssrRenderClass(`live-indicator ${getActualLiveStatus2.value ? "live" : ((_j = (_i = liveStatus.value.stream2.liveData) == null ? void 0 : _i.tracks) == null ? void 0 : _j.current) ? "track" : "offline"}`)}" data-v-a41314b8>`);
      if (getActualLiveStatus2.value) {
        _push(`<svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-a41314b8><circle cx="4.5" cy="4.5" r="4.5" fill="black" data-v-a41314b8></circle></svg>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<svg viewBox="0 0 512 512" enable-background="new 0 0 512 512" xmlns="http://www.w3.org/2000/svg" class="broadcast" data-v-a41314b8><g data-v-a41314b8><g data-v-a41314b8><g data-v-a41314b8><path clip-rule="evenodd" d="M415.698,192.641c-8.379-21.068-21.236-40.268-38.577-57.6      l36.309-36.364c26.971,26.989,45.555,57.456,55.745,91.404c6.226,20.683,9.349,42.655,9.367,65.919v0.06      c-0.008,34.011-6.66,65.254-19.957,93.729c-10.701,23.024-25.735,44.24-45.097,63.651l-36.427-36.422      c13.297-13.305,23.948-27.696,31.945-43.171c12.119-23.434,18.17-49.363,18.156-77.788V256      C427.19,233.287,423.372,212.168,415.698,192.641z" fill="#333333" fill-rule="evenodd" data-v-a41314b8></path></g><g data-v-a41314b8><path clip-rule="evenodd" d="M351.69,160.99c8.768,8.825,16.062,18.27,21.88,28.334h0.06      c11.449,19.798,17.17,41.983,17.165,66.56V256c-0.004,25.516-6.152,48.478-18.447,68.889h-0.057      c-5.676,9.334-12.638,18.139-20.892,26.414v-0.06l-0.057,0.06l-36.427-36.423c2.371-2.448,4.562-4.95,6.576-7.505v-0.06      c11.828-14.672,17.763-31.779,17.807-51.315v-0.116c-0.019-22.938-8.124-42.506-24.323-58.705l36.483-36.538      C351.541,160.752,351.618,160.868,351.69,160.99z" fill="#333333" fill-rule="evenodd" data-v-a41314b8></path></g><g data-v-a41314b8><path clip-rule="evenodd" d="M225.829,225.571c8.342-8.35,18.427-12.519,30.259-12.509      c11.851-0.01,21.956,4.159,30.316,12.509l0.059,0.059c8.313,8.348,12.463,18.433,12.451,30.254V256      c-0.016,11.798-4.187,21.863-12.51,30.197c-0.03,0.027-0.048,0.068-0.058,0.116c-8.364,8.272-18.447,12.402-30.259,12.394      c-11.817,0.009-21.884-4.142-30.201-12.452l-0.058-0.058c-8.311-8.317-12.481-18.365-12.511-30.138c0-0.06,0-0.117,0-0.176      c-0.012-11.787,4.121-21.854,12.395-30.196C225.747,225.653,225.786,225.615,225.829,225.571z" fill="#333333" fill-rule="evenodd" data-v-a41314b8></path></g><g data-v-a41314b8><path clip-rule="evenodd" d="M121.265,255.884c-0.006-1.646,0.014-3.273,0.059-4.887      c1.113-35.124,14.225-65.242,39.335-90.356l36.426,36.422c-16.217,16.235-24.306,35.842-24.265,58.821c0,0.059,0,0.116,0,0.176      c-0.015,2.561,0.083,5.084,0.291,7.563v0.057c1.61,19.688,9.602,36.736,23.974,51.143c0.035,0.037,0.073,0.075,0.117,0.116      l-36.485,36.423l-0.058-0.059c-26.237-26.289-39.368-58.037-39.394-95.243C121.265,256,121.265,255.942,121.265,255.884z" fill="#333333" fill-rule="evenodd" data-v-a41314b8></path></g><g data-v-a41314b8><path clip-rule="evenodd" d="M35.437,225.28c6.121-48.44,27.186-90.661,63.192-126.662      l36.425,36.423c-29.26,29.239-45.727,63.78-49.402,103.621c-0.51,5.681-0.763,11.479-0.756,17.397      c0.002,47.206,16.684,87.524,50.042,120.959l0.058,0.059l-36.426,36.421l-0.058-0.058      c-43.359-43.459-65.025-95.92-64.997-157.381C33.521,245.532,34.161,235.271,35.437,225.28z" fill="#333333" fill-rule="evenodd" data-v-a41314b8></path></g></g></g></svg> ${ssrInterpolate(getActualLiveStatus2.value ? "Live" : ((_l = (_k = liveStatus.value.stream2.liveData) == null ? void 0 : _k.tracks) == null ? void 0 : _l.current) ? "" : "Offline")}</p></div></div><audio id="audioPlayer1"${ssrRenderAttr("src", streamUrl1)} data-v-a41314b8></audio><audio id="audioPlayer2"${ssrRenderAttr("src", streamUrl2)} data-v-a41314b8></audio></div>`);
    };
  }
};
const _sfc_setup$d = _sfc_main$d.setup;
_sfc_main$d.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/media/MusicController.vue");
  return _sfc_setup$d ? _sfc_setup$d(props, ctx) : void 0;
};
const __nuxt_component_10 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$d, [["__scopeId", "data-v-a41314b8"]]), { __name: "MusicController" });

const clientOnlySymbol = Symbol.for("nuxt:client-only");
const __nuxt_component_0$3 = defineComponent({
  name: "ClientOnly",
  inheritAttrs: false,
  props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
  setup(_, { slots, attrs }) {
    const mounted = ref(false);
    provide(clientOnlySymbol, true);
    return (props) => {
      var _a;
      if (mounted.value) {
        return (_a = slots.default) == null ? void 0 : _a.call(slots);
      }
      const slot = slots.fallback || slots.placeholder;
      if (slot) {
        return slot();
      }
      const fallbackStr = props.fallback || props.placeholder || "";
      const fallbackTag = props.fallbackTag || props.placeholderTag || "span";
      return createElementBlock(fallbackTag, attrs, fallbackStr);
    };
  }
});

const _sfc_main$c = {
  __name: "SiteHead",
  __ssrInlineRender: true,
  setup(__props) {
    const { locale, locales } = useI18n();
    const localePath = useLocalePath();
    const mainStore = useMainStore();
    computed(() => {
      var _a;
      return (_a = mainStore == null ? void 0 : mainStore.siteNav) == null ? void 0 : _a.mainMenu;
    });
    const currentTrack = computed(() => mainStore.currentTrack);
    const trackTitle = computed(() => {
      var _a;
      return ((_a = currentTrack.value) == null ? void 0 : _a.title) || "";
    });
    const trackDuration = computed(() => {
      var _a;
      if (!((_a = currentTrack.value) == null ? void 0 : _a.duration)) return "";
      const totalSeconds = Math.floor(currentTrack.value.duration / 1e3);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    });
    computed(() => mainStore.isPlayerPlaying);
    const isVisible = computed(() => mainStore.isPlayerVisible);
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      const _component_NuxtLink = __nuxt_component_0$6;
      const _component_ElementsCallshopLogo = __nuxt_component_1$3;
      const _component_ElementsCallshopTextLogo = __nuxt_component_2$2;
      const _component_SiteMobileChannelSwitch = __nuxt_component_3$1;
      const _component_SiteDarkMode = __nuxt_component_4;
      const _component_SiteSearchButton = __nuxt_component_5;
      const _component_SiteDiscordButton = __nuxt_component_6;
      const _component_SiteScheduleButton = __nuxt_component_7;
      const _component_SiteMenuButton = __nuxt_component_8;
      const _component_SiteMenu = __nuxt_component_9;
      const _component_MusicController = __nuxt_component_10;
      const _component_ClientOnly = __nuxt_component_0$3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "header" }, _attrs))} data-v-3f5192b6><section class="header__title-section" data-v-3f5192b6>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref(localePath)("/"),
        class: "header__title-section__logo"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="header__title-section__logo" data-v-3f5192b6${_scopeId}>`);
            _push2(ssrRenderComponent(_component_ElementsCallshopLogo, { class: "logo" }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_ElementsCallshopTextLogo, { class: "text-logo" }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_SiteMobileChannelSwitch, { class: "channel-switch" }, null, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "header__title-section__logo" }, [
                createVNode(_component_ElementsCallshopLogo, { class: "logo" }),
                createVNode(_component_ElementsCallshopTextLogo, { class: "text-logo" }),
                createVNode(_component_SiteMobileChannelSwitch, { class: "channel-switch" })
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="header__toggle-section" data-v-3f5192b6>`);
      _push(ssrRenderComponent(_component_SiteDarkMode, null, null, _parent));
      _push(`<nav class="menu-main tags" data-v-3f5192b6><ul data-v-3f5192b6>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref(localePath)("/shows"),
        class: `tag shows`
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Shows `);
          } else {
            return [
              createTextVNode(" Shows ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref(localePath)("/pool"),
        class: `tag pool`
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Pool `);
          } else {
            return [
              createTextVNode(" Pool ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref(localePath)("/words"),
        class: `tag words`
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Words `);
          } else {
            return [
              createTextVNode(" Words ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</ul></nav>`);
      _push(ssrRenderComponent(_component_SiteSearchButton, { class: "mobile-hidden" }, null, _parent));
      if ((_b = (_a = unref(mainStore)) == null ? void 0 : _a.siteNav) == null ? void 0 : _b.discordLink) {
        _push(ssrRenderComponent(_component_SiteDiscordButton, { class: "mobile-hidden" }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if ((_d = (_c = unref(mainStore)) == null ? void 0 : _c.siteNav) == null ? void 0 : _d.schedulePage) {
        _push(ssrRenderComponent(_component_SiteScheduleButton, { class: "mobile-hidden" }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_SiteMenuButton, { class: "mobile-hidden" }, null, _parent));
      _push(`</div></section>`);
      _push(ssrRenderComponent(_component_SiteMenu, { class: "mobile-hidden" }, null, _parent));
      _push(`<section class="header__audio-player-section" data-v-3f5192b6>`);
      _push(ssrRenderComponent(_component_MusicController, null, null, _parent));
      _push(`</section>`);
      if (unref(currentTrack)) {
        _push(`<section class="${ssrRenderClass([{ "is-hidden": !unref(isVisible), "is-visible": unref(currentTrack) }, "header__soundcloud-player-section"])}" data-v-3f5192b6><div class="${ssrRenderClass([{ "is-loaded": unref(currentTrack) }, "player-controls"])}" data-v-3f5192b6><div class="track-info" data-v-3f5192b6><div class="track-details" data-v-3f5192b6><h4 class="track-source" data-v-3f5192b6>Playing from SoundCloud</h4><h3 class="track-title" data-v-3f5192b6>${ssrInterpolate(unref(trackTitle))}</h3>`);
        if (unref(trackDuration)) {
          _push(`<h4 class="track-duration" data-v-3f5192b6>${ssrInterpolate(unref(trackDuration))}</h4>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><nav class="player-nav" data-v-3f5192b6><button data-v-3f5192b6>${ssrInterpolate(unref(isVisible) ? "Hide" : "Show")}</button></nav></div>`);
        _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
        _push(`</section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/site/SiteHead.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const __nuxt_component_0$2 = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["__scopeId", "data-v-3f5192b6"]]);

const defineRouteProvider = (name = "RouteProvider") => defineComponent({
  name,
  props: {
    vnode: {
      type: Object,
      required: true
    },
    route: {
      type: Object,
      required: true
    },
    vnodeRef: Object,
    renderKey: String,
    trackRootNodes: Boolean
  },
  setup(props) {
    const previousKey = props.renderKey;
    const previousRoute = props.route;
    const route = {};
    for (const key in props.route) {
      Object.defineProperty(route, key, {
        get: () => previousKey === props.renderKey ? props.route[key] : previousRoute[key],
        enumerable: true
      });
    }
    provide(PageRouteSymbol, shallowReactive(route));
    return () => {
      return h(props.vnode, { ref: props.vnodeRef });
    };
  }
});
const RouteProvider = defineRouteProvider();

const __nuxt_component_1$2 = defineComponent({
  name: "NuxtPage",
  inheritAttrs: false,
  props: {
    name: {
      type: String
    },
    transition: {
      type: [Boolean, Object],
      default: void 0
    },
    keepalive: {
      type: [Boolean, Object],
      default: void 0
    },
    route: {
      type: Object
    },
    pageKey: {
      type: [Function, String],
      default: null
    }
  },
  setup(props, { attrs, slots, expose }) {
    const nuxtApp = useNuxtApp();
    const pageRef = ref();
    const forkRoute = inject(PageRouteSymbol, null);
    let previousPageKey;
    expose({ pageRef });
    inject(LayoutMetaSymbol, null);
    let vnode;
    const done = nuxtApp.deferHydration();
    if (props.pageKey) {
      watch(() => props.pageKey, (next, prev) => {
        if (next !== prev) {
          nuxtApp.callHook("page:loading:start");
        }
      });
    }
    return () => {
      return h(RouterView, { name: props.name, route: props.route, ...attrs }, {
        default: (routeProps) => {
          if (!routeProps.Component) {
            done();
            return;
          }
          const key = generateRouteKey$1(routeProps, props.pageKey);
          if (!nuxtApp.isHydrating && !hasChildrenRoutes(forkRoute, routeProps.route, routeProps.Component) && previousPageKey === key) {
            nuxtApp.callHook("page:loading:end");
          }
          previousPageKey = key;
          {
            vnode = h(Suspense, {
              suspensible: true
            }, {
              default: () => {
                const providerVNode = h(RouteProvider, {
                  key: key || void 0,
                  vnode: slots.default ? normalizeSlot(slots.default, routeProps) : routeProps.Component,
                  route: routeProps.route,
                  renderKey: key || void 0,
                  vnodeRef: pageRef
                });
                return providerVNode;
              }
            });
            return vnode;
          }
        }
      });
    };
  }
});
function hasChildrenRoutes(fork, newRoute, Component) {
  if (!fork) {
    return false;
  }
  const index = newRoute.matched.findIndex((m) => {
    var _a;
    return ((_a = m.components) == null ? void 0 : _a.default) === (Component == null ? void 0 : Component.type);
  });
  return index < newRoute.matched.length - 1;
}
function normalizeSlot(slot, data) {
  const slotContent = slot(data);
  return slotContent.length === 1 ? h(slotContent[0]) : h(Fragment, void 0, slotContent);
}

const _sfc_main$b = {
  __name: "SiteFoot",
  __ssrInlineRender: true,
  setup(__props) {
    const mainStore = useMainStore();
    const footerMenu = computed(() => {
      var _a;
      return (_a = mainStore == null ? void 0 : mainStore.siteNav) == null ? void 0 : _a.footerMenu;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ElementsLink = ElementsLink;
      _push(`<footer${ssrRenderAttrs(_attrs)} data-v-74012b2b><!--[-->`);
      ssrRenderList(unref(footerMenu), (item) => {
        _push(ssrRenderComponent(_component_ElementsLink, {
          key: item == null ? void 0 : item._key,
          type: item == null ? void 0 : item.type,
          href: item == null ? void 0 : item.url,
          blank: item == null ? void 0 : item.blank,
          route: item == null ? void 0 : item.route,
          slug: item == null ? void 0 : item.slug,
          func: item == null ? void 0 : item.func
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(item == null ? void 0 : item.title)}`);
            } else {
              return [
                createTextVNode(toDisplayString$1(item == null ? void 0 : item.title), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></footer>`);
    };
  }
};
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/site/SiteFoot.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const __nuxt_component_2$1 = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["__scopeId", "data-v-74012b2b"]]);

const _sfc_main$a = {
  __name: "ElementsPreviewMode",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const { enabled: previewEnabled, inFrame } = useSanityVisualEditingState();
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(previewEnabled) && !unref(inFrame)) {
        _push(`<a${ssrRenderAttrs(mergeProps({
          href: `/preview/disable?redirect=${unref(route).fullPath}`,
          class: "preview-toggle"
        }, _attrs))} data-v-1290da0f><span data-v-1290da0f>Preview Enabled</span><span data-v-1290da0f>Disable Preview</span></a>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
};
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/elements/ElementsPreviewMode.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const __nuxt_component_3 = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["__scopeId", "data-v-1290da0f"]]);

function injectHead(nuxtApp) {
  var _a;
  const nuxt = nuxtApp || useNuxtApp();
  return ((_a = nuxt.ssrContext) == null ? void 0 : _a.head) || nuxt.runWithContext(() => {
    if (hasInjectionContext()) {
      const head = inject(headSymbol);
      if (!head) {
        throw new Error("[nuxt] [unhead] Missing Unhead instance.");
      }
      return head;
    }
  });
}
function useHead(input, options = {}) {
  const head = injectHead(options.nuxt);
  return useHead$1(input, { head, ...options });
}
function useSeoMeta(input, options = {}) {
  const head = injectHead(options.nuxt);
  return useSeoMeta$1(input, { head, ...options });
}

const useUtils = () => {
  const creditLog = () => {
  };
  const favicon = () => {
    var _a, _b;
    const mainStore = useMainStore();
    const favicon2 = (_a = mainStore == null ? void 0 : mainStore.siteSettings) == null ? void 0 : _a.favicon;
    if (!(favicon2 == null ? void 0 : favicon2.asset)) {
      return;
    }
    const { $urlFor } = useNuxtApp();
    useHead({
      link: [
        {
          rel: "icon",
          href: favicon2 ? $urlFor(favicon2).width(32).height(32).format("png").fit("max").url() : void 0,
          sizes: "32x32"
        },
        {
          rel: "icon",
          href: favicon2 ? $urlFor(favicon2).url() : void 0,
          type: favicon2 ? (_b = favicon2 == null ? void 0 : favicon2.asset) == null ? void 0 : _b.mimeType : void 0
        },
        {
          rel: "apple-touch-icon",
          href: favicon2 ? $urlFor(favicon2).width(1024).height(1024).format("png").fit("max").url() : void 0
        }
      ]
    });
  };
  return {
    creditLog,
    favicon
  };
};

const _sfc_main$9 = {
  __name: "app",
  __ssrInlineRender: true,
  setup(__props) {
    const { favicon } = useUtils();
    favicon();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_SiteHead = __nuxt_component_0$2;
      const _component_NuxtPage = __nuxt_component_1$2;
      const _component_SiteFoot = __nuxt_component_2$1;
      const _component_ElementsPreviewMode = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "site" }, _attrs))} data-v-74e43dbf>`);
      _push(ssrRenderComponent(_component_SiteHead, null, null, _parent));
      _push(`<main data-v-74e43dbf>`);
      _push(ssrRenderComponent(_component_NuxtPage, null, null, _parent));
      _push(`</main>`);
      _push(ssrRenderComponent(_component_SiteFoot, { class: "footer" }, null, _parent));
      _push(ssrRenderComponent(_component_ElementsPreviewMode, null, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const AppComponent = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["__scopeId", "data-v-74e43dbf"]]);

const isSpan = (block) => block._type === "span";
const defaults = {
  types: {
    span: "span",
    image: "img"
  },
  marks: {
    strong: "strong",
    em: "em",
    link: "a"
  },
  styles: {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
    normal: "p",
    blockquote: "blockquote"
  },
  listItem: "li",
  container: "div"
};
const validAttrs = [
  "abbr",
  "accesskey",
  "accessKey",
  "action",
  "alt",
  "autocomplete",
  "autofocus",
  "autoplay",
  "charset",
  "checked",
  "cite",
  "class",
  "cols",
  "colspan",
  "command",
  "content",
  "datetime",
  "default",
  "disabled",
  "download",
  "draggable",
  "dropzone",
  "headers",
  "height",
  "hidden",
  "href",
  "hreflang",
  "id",
  "maxlength",
  "minlength",
  "muted",
  "placeholder",
  "preload",
  "radiogroup",
  "readonly",
  "required",
  "role",
  "selected",
  "src",
  "srcdoc",
  "srcset",
  "tabindex",
  "title",
  "value",
  "width",
  "wrap"
];
function findSerializer(item, serializers) {
  if ((item == null ? void 0 : item.listItem) && item._type !== "list") {
    return serializers.listItem || "li";
  }
  return (item == null ? void 0 : item._type) ? serializers.types[item._type] || serializers.marks[item._type] : void 0;
}
function renderStyle(item, serializers, children) {
  const serializer = item.style && serializers.styles[item.style];
  const isElement = typeof serializer === "string";
  const props = extractProps(item, isElement);
  if (!item.listItem && item.style && serializer) {
    return h(serializer, props, { default: children });
  }
  return children == null ? void 0 : children();
}
function renderInSerializer(item, serializers) {
  return render(serializers, item, () => (item.children || []).map((child) => {
    if (isSpan(child)) {
      return renderMarks(child.text, child.marks, serializers, item.markDefs);
    }
    return render(serializers, child, () => renderMarks(child.text, child.marks, serializers, item.markDefs));
  }));
}
function renderMarks(content, [mark, ...marks] = [], serializers, markDefs = []) {
  if (!mark) return content;
  const definition = mark in serializers.marks ? { _type: mark, _key: "" } : markDefs.find((m) => m._key === mark);
  return render(serializers, definition, () => renderMarks(content, marks, serializers, markDefs));
}
function walkList(blocks, block) {
  if (!block.listItem) {
    blocks.push(block);
    return blocks;
  }
  const lastBlock = blocks[blocks.length - 1] || {};
  if (lastBlock._type !== "list" || !lastBlock.children || block.level === 1 && block.listItem !== lastBlock.listItem) {
    blocks.push({
      _type: "list",
      listItem: block.listItem,
      level: block.level,
      children: [block]
    });
    return blocks;
  }
  if (block.level === lastBlock.level && block.listItem === lastBlock.listItem) {
    lastBlock.children.push(block);
    return blocks;
  }
  walkList(lastBlock.children, block);
  return blocks;
}
function render(serializers, item, children) {
  const serializer = findSerializer(item, serializers);
  if (!serializer) return children == null ? void 0 : children();
  if (!item) {
    return void 0;
  }
  const isElement = typeof serializer === "string";
  const props = extractProps(item, isElement);
  if (isElement) {
    return h(serializer, props, children == null ? void 0 : children());
  }
  return h(serializer, props, { default: () => children == null ? void 0 : children() });
}
function extractProps(item, isElement) {
  return Object.fromEntries(
    Object.entries(item).filter(([key]) => key !== "_type" && key !== "markDefs").map(
      ([key, value]) => {
        if (key === "_key") return ["key", value || null];
        if (!isElement || validAttrs.includes(key)) return [key, value];
        return [];
      }
    )
  );
}
function renderBlocks(blocks, serializers) {
  return blocks.map((block) => {
    const node = renderStyle(block, serializers, () => renderInSerializer(block, serializers));
    return node;
  });
}
const __nuxt_component_0$1 = defineComponent({
  name: "SanityContent",
  inheritAttrs: false,
  props: {
    blocks: {
      type: Array,
      default: () => []
    },
    serializers: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const serializers = defu(props.serializers, defaults);
    serializers.types.list = serializers.types.list || createListSerializer(serializers);
    return () => {
      var _a;
      return renderBlocks(((_a = props.blocks) == null ? void 0 : _a.reduce(walkList, [])) || [], serializers);
    };
  }
});
const createListSerializer = (serializers) => {
  return defineComponent({
    name: "ListComponent",
    inheritAttrs: false,
    props: {
      children: {
        type: Array,
        default: () => []
      },
      level: {
        type: Number,
        default: 1
      }
    },
    setup(props) {
      return () => {
        var _a;
        const isOrdered = ((_a = props.children[0]) == null ? void 0 : _a.listItem) === "number";
        if (props.level > 1) {
          return h(serializers.listItem || "li", [h(
            isOrdered ? "ol" : "ul",
            {},
            { default: () => renderBlocks(props.children, serializers) }
          )]);
        }
        return h(
          isOrdered ? "ol" : "ul",
          {},
          { default: () => renderBlocks(props.children, serializers) }
        );
      };
    }
  });
};

const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  ...{
    inheritAttrs: false
  },
  __name: "UnLazyImage",
  __ssrInlineRender: true,
  props: {
    src: { default: void 0 },
    srcSet: { default: void 0 },
    sources: { default: void 0 },
    autoSizes: { type: Boolean, default: false },
    blurhash: { default: void 0 },
    thumbhash: { default: void 0 },
    placeholderSrc: { default: void 0 },
    placeholderSize: { default: void 0 },
    placeholderRatio: { default: void 0 },
    lazyLoad: { type: Boolean, default: true },
    preload: { type: Boolean, default: false },
    ssr: { type: Boolean, default: void 0 }
  },
  emits: ["loaded", "error"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const unlazy = useRuntimeConfig().public.unlazy;
    const hash = computed(() => props.thumbhash || props.blurhash);
    const pngPlaceholder = (props.ssr ?? unlazy.ssr) && hash.value ? createPlaceholderFromHash({
      hash: hash.value,
      hashType: props.thumbhash ? "thumbhash" : "blurhash",
      size: props.placeholderSize || unlazy.placeholderSize,
      ratio: props.placeholderRatio
    }) : void 0;
    const target = ref();
    let cleanup;
    let lastHash;
    watchEffect(() => {
      cleanup == null ? void 0 : cleanup();
      if (!target.value)
        return;
      if (hash.value && hash.value !== lastHash) {
        const placeholder = createPlaceholderFromHash({
          image: target.value,
          hash: hash.value,
          hashType: props.thumbhash ? "thumbhash" : "blurhash",
          size: props.placeholderSize || unlazy.placeholderSize,
          ratio: props.placeholderRatio
        });
        if (placeholder)
          target.value.src = placeholder;
        lastHash = hash.value;
      }
      if (props.preload) {
        if (props.autoSizes)
          autoSizes(target.value);
        loadImage(target.value);
        emit("loaded", target.value);
        return;
      }
      if (!props.lazyLoad)
        return;
      cleanup = lazyLoad(target.value, {
        hash: false,
        onImageLoad(image) {
          emit("loaded", image);
        }
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      if ((_a = props.sources) == null ? void 0 : _a.length) {
        _push(`<picture${ssrRenderAttrs(_attrs)}><!--[-->`);
        ssrRenderList(props.sources, (source, index) => {
          _push(`<source${ssrRenderAttr("type", source.type)}${ssrRenderAttr("data-srcset", source.srcSet)}${ssrRenderAttr("data-sizes", source.sizes)}>`);
        });
        _push(`<!--]--><img${ssrRenderAttrs(mergeProps({
          ref_key: "target",
          ref: target
        }, _ctx.$attrs, {
          src: unref(pngPlaceholder) || _ctx.placeholderSrc,
          "data-src": _ctx.src,
          "data-srcset": _ctx.srcSet,
          "data-sizes": _ctx.autoSizes ? "auto" : void 0,
          loading: "lazy"
        }))}></picture>`);
      } else {
        _push(`<img${ssrRenderAttrs(mergeProps({
          ref_key: "target",
          ref: target
        }, _ctx.$attrs, {
          src: unref(pngPlaceholder) || _ctx.placeholderSrc,
          "data-src": _ctx.src,
          "data-srcset": _ctx.srcSet,
          "data-sizes": _ctx.autoSizes ? "auto" : void 0,
          loading: "lazy"
        }, _attrs))}>`);
      }
    };
  }
});

const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../../node_modules/@unlazy/nuxt/dist/runtime/components/UnLazyImage.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const __nuxt_component_0 = Object.assign(_sfc_main$8, { __name: "UnLazyImage" });

const _sfc_main$7 = {
  __name: "MediaImage",
  __ssrInlineRender: true,
  props: {
    expand: {
      type: Number,
      default: void 0
    },
    image: {
      type: Object,
      default: () => void 0
    },
    svgPlaceholder: {
      type: Boolean,
      default: () => false
    },
    lqipPlaceholder: {
      type: Boolean,
      default: () => true
    },
    dataSizes: {
      type: String,
      default: () => "auto"
    },
    dataParentFit: {
      type: String,
      default: () => ""
    },
    alt: {
      type: String,
      default: ""
    },
    auto: {
      default: "format",
      type: String
    },
    fit: {
      default: "max",
      type: String
    },
    preload: {
      type: Boolean,
      default: () => false
    }
  },
  emits: ["dimensions"],
  setup(__props, { emit: __emit }) {
    const { $urlFor } = useNuxtApp();
    const props = __props;
    const placeholderSrc = computed(() => {
      const svgColor = "rgb(230,230,230)";
      return props.svgPlaceholder ? `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cropWidth.value} ${cropHeight.value}'%3E%3Crect width='${cropWidth.value}' height='${cropHeight.value}' fill='${svgColor}' /%3E%3C/svg%3E` : props.lqipPlaceholder ? $urlFor(props.image).width(100).auto(props.auto).fit(props.fit).url() : "";
    });
    const srcSet = computed(() => {
      let srcSet2 = "";
      const widths = [250, 375, 500, 750, 1e3, 1400, 1800, 2400, 3e3];
      widths.forEach((width, index) => {
        var _a;
        if (!((_a = props.image) == null ? void 0 : _a.asset)) {
          return false;
        }
        srcSet2 += $urlFor(props.image).width(width).auto(props.auto).fit(props.fit) + ` ${width}w`;
        if (index + 1 !== widths.length) {
          srcSet2 += ",";
        }
        srcSet2 += " ";
      });
      return srcSet2;
    });
    const cropWidth = computed(() => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
      if (!((_c = (_b = (_a = props.image) == null ? void 0 : _a.asset) == null ? void 0 : _b.metadata) == null ? void 0 : _c.dimensions)) return 1920;
      const originalWidth = ((_g = (_f = (_e = (_d = props.image) == null ? void 0 : _d.asset) == null ? void 0 : _e.metadata) == null ? void 0 : _f.dimensions) == null ? void 0 : _g.width) || 1920;
      const cropLeft = ((_i = (_h = props.image) == null ? void 0 : _h.crop) == null ? void 0 : _i.left) ?? 0;
      const cropRight = ((_k = (_j = props.image) == null ? void 0 : _j.crop) == null ? void 0 : _k.right) ?? 0;
      const calculatedWidth = originalWidth - cropLeft * originalWidth - cropRight * originalWidth;
      return isNaN(calculatedWidth) ? 1920 : calculatedWidth;
    });
    const cropHeight = computed(() => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
      if (!((_c = (_b = (_a = props.image) == null ? void 0 : _a.asset) == null ? void 0 : _b.metadata) == null ? void 0 : _c.dimensions)) return 1080;
      const originalHeight = ((_g = (_f = (_e = (_d = props.image) == null ? void 0 : _d.asset) == null ? void 0 : _e.metadata) == null ? void 0 : _f.dimensions) == null ? void 0 : _g.height) || 1080;
      const cropTop = ((_i = (_h = props.image) == null ? void 0 : _h.crop) == null ? void 0 : _i.top) ?? 0;
      const cropBottom = ((_k = (_j = props.image) == null ? void 0 : _j.crop) == null ? void 0 : _k.bottom) ?? 0;
      const calculatedHeight = originalHeight - cropTop * originalHeight - cropBottom * originalHeight;
      return isNaN(calculatedHeight) ? 1080 : calculatedHeight;
    });
    const orientation = computed(() => {
      if (!cropWidth.value || !cropHeight.value) return void 0;
      return cropWidth.value > cropHeight.value ? "landscape" : cropWidth.value < cropHeight.value ? "portrait" : "square";
    });
    const altText = computed(() => {
      var _a, _b;
      return props.alt ?? ((_b = (_a = props.image) == null ? void 0 : _a.asset) == null ? void 0 : _b.altText);
    });
    const isLoaded = ref(false);
    const onLoad = () => {
      isLoaded.value = true;
    };
    const hasValidImage = computed(() => {
      return props.image && props.image.asset;
    });
    const emit = __emit;
    watchEffect(() => {
      if (cropWidth.value && cropHeight.value) {
        emit("dimensions", {
          width: cropWidth.value,
          height: cropHeight.value
        });
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UnLazyImage = __nuxt_component_0;
      if (unref(hasValidImage)) {
        _push(ssrRenderComponent(_component_UnLazyImage, mergeProps({
          style: { aspectRatio: `${unref(cropWidth)} / ${unref(cropHeight)}` },
          "placeholder-src": unref(placeholderSrc),
          "src-set": unref(srcSet),
          "auto-sizes": true,
          alt: unref(altText),
          width: unref(cropWidth),
          height: unref(cropHeight),
          class: [[unref(orientation), { loaded: unref(isLoaded) }], "fade"],
          preload: props.preload,
          draggable: "false",
          "lazy-load": true,
          onLoad
        }, _attrs), null, _parent));
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: "image-placeholder",
          style: { aspectRatio: "16/9" }
        }, _attrs))} data-v-838f32a6></div>`);
      }
    };
  }
};
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/media/MediaImage.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-838f32a6"]]);

function tryOnScopeDispose(fn) {
  if (getCurrentScope()) {
    onScopeDispose(fn);
    return true;
  }
  return false;
}
function toValue(r) {
  return typeof r === "function" ? r() : unref(r);
}
typeof WorkerGlobalScope !== "undefined" && globalThis instanceof WorkerGlobalScope;
const notNullish = (val) => val != null;
const toString = Object.prototype.toString;
const isObject = (val) => toString.call(val) === "[object Object]";
const noop = () => {
};
function createFilterWrapper(filter, fn) {
  function wrapper(...args) {
    return new Promise((resolve, reject) => {
      Promise.resolve(filter(() => fn.apply(this, args), { fn, thisArg: this, args })).then(resolve).catch(reject);
    });
  }
  return wrapper;
}
function throttleFilter(...args) {
  let lastExec = 0;
  let timer;
  let isLeading = true;
  let lastRejector = noop;
  let lastValue;
  let ms;
  let trailing;
  let leading;
  let rejectOnCancel;
  if (!isRef(args[0]) && typeof args[0] === "object")
    ({ delay: ms, trailing = true, leading = true, rejectOnCancel = false } = args[0]);
  else
    [ms, trailing = true, leading = true, rejectOnCancel = false] = args;
  const clear = () => {
    if (timer) {
      clearTimeout(timer);
      timer = void 0;
      lastRejector();
      lastRejector = noop;
    }
  };
  const filter = (_invoke) => {
    const duration = toValue(ms);
    const elapsed = Date.now() - lastExec;
    const invoke2 = () => {
      return lastValue = _invoke();
    };
    clear();
    if (duration <= 0) {
      lastExec = Date.now();
      return invoke2();
    }
    if (elapsed > duration && (leading || !isLeading)) {
      lastExec = Date.now();
      invoke2();
    } else if (trailing) {
      lastValue = new Promise((resolve, reject) => {
        lastRejector = rejectOnCancel ? reject : resolve;
        timer = setTimeout(() => {
          lastExec = Date.now();
          isLeading = true;
          resolve(invoke2());
          clear();
        }, Math.max(0, duration - elapsed));
      });
    }
    if (!leading && !timer)
      timer = setTimeout(() => isLeading = true, duration);
    isLeading = false;
    return lastValue;
  };
  return filter;
}
function useThrottleFn(fn, ms = 200, trailing = false, leading = true, rejectOnCancel = false) {
  return createFilterWrapper(
    throttleFilter(ms, trailing, leading, rejectOnCancel),
    fn
  );
}

function unrefElement(elRef) {
  var _a;
  const plain = toValue(elRef);
  return (_a = plain == null ? void 0 : plain.$el) != null ? _a : plain;
}
const defaultWindow = void 0;
function useEventListener(...args) {
  let target;
  let events2;
  let listeners;
  let options;
  if (typeof args[0] === "string" || Array.isArray(args[0])) {
    [events2, listeners, options] = args;
    target = defaultWindow;
  } else {
    [target, events2, listeners, options] = args;
  }
  if (!target)
    return noop;
  if (!Array.isArray(events2))
    events2 = [events2];
  if (!Array.isArray(listeners))
    listeners = [listeners];
  const cleanups = [];
  const cleanup = () => {
    cleanups.forEach((fn) => fn());
    cleanups.length = 0;
  };
  const register = (el, event, listener, options2) => {
    el.addEventListener(event, listener, options2);
    return () => el.removeEventListener(event, listener, options2);
  };
  const stopWatch = watch(
    () => [unrefElement(target), toValue(options)],
    ([el, options2]) => {
      cleanup();
      if (!el)
        return;
      const optionsClone = isObject(options2) ? { ...options2 } : options2;
      cleanups.push(
        ...events2.flatMap((event) => {
          return listeners.map((listener) => register(el, event, listener, optionsClone));
        })
      );
    },
    { immediate: true, flush: "post" }
  );
  const stop = () => {
    stopWatch();
    cleanup();
  };
  tryOnScopeDispose(stop);
  return stop;
}
function useMounted() {
  const isMounted = ref(false);
  getCurrentInstance();
  return isMounted;
}
function useSupported(callback) {
  const isMounted = useMounted();
  return computed(() => {
    isMounted.value;
    return Boolean(callback());
  });
}
function useIntersectionObserver(target, callback, options = {}) {
  const {
    root,
    rootMargin = "0px",
    threshold = 0.1,
    window: window2 = defaultWindow,
    immediate = true
  } = options;
  const isSupported = useSupported(() => window2 && "IntersectionObserver" in window2);
  const targets = computed(() => {
    const _target = toValue(target);
    return (Array.isArray(_target) ? _target : [_target]).map(unrefElement).filter(notNullish);
  });
  let cleanup = noop;
  const isActive = ref(immediate);
  const stopWatch = isSupported.value ? watch(
    () => [targets.value, unrefElement(root), isActive.value],
    ([targets2, root2]) => {
      cleanup();
      if (!isActive.value)
        return;
      if (!targets2.length)
        return;
      const observer = new IntersectionObserver(
        callback,
        {
          root: unrefElement(root2),
          rootMargin,
          threshold
        }
      );
      targets2.forEach((el) => el && observer.observe(el));
      cleanup = () => {
        observer.disconnect();
        cleanup = noop;
      };
    },
    { immediate, flush: "post" }
  ) : noop;
  const stop = () => {
    cleanup();
    stopWatch();
    isActive.value = false;
  };
  tryOnScopeDispose(stop);
  return {
    isSupported,
    isActive,
    pause() {
      cleanup();
      isActive.value = false;
    },
    resume() {
      isActive.value = true;
    },
    stop
  };
}
function useSwipe(target, options = {}) {
  const {
    threshold = 50,
    onSwipe,
    onSwipeEnd,
    onSwipeStart,
    passive = true,
    window: window2 = defaultWindow
  } = options;
  const coordsStart = reactive({ x: 0, y: 0 });
  const coordsEnd = reactive({ x: 0, y: 0 });
  const diffX = computed(() => coordsStart.x - coordsEnd.x);
  const diffY = computed(() => coordsStart.y - coordsEnd.y);
  const { max, abs } = Math;
  const isThresholdExceeded = computed(() => max(abs(diffX.value), abs(diffY.value)) >= threshold);
  const isSwiping = ref(false);
  const direction = computed(() => {
    if (!isThresholdExceeded.value)
      return "none";
    if (abs(diffX.value) > abs(diffY.value)) {
      return diffX.value > 0 ? "left" : "right";
    } else {
      return diffY.value > 0 ? "up" : "down";
    }
  });
  const getTouchEventCoords = (e) => [e.touches[0].clientX, e.touches[0].clientY];
  const updateCoordsStart = (x, y) => {
    coordsStart.x = x;
    coordsStart.y = y;
  };
  const updateCoordsEnd = (x, y) => {
    coordsEnd.x = x;
    coordsEnd.y = y;
  };
  let listenerOptions;
  const isPassiveEventSupported = checkPassiveEventSupport(window2 == null ? void 0 : window2.document);
  if (!passive)
    listenerOptions = isPassiveEventSupported ? { passive: false, capture: true } : { capture: true };
  else
    listenerOptions = isPassiveEventSupported ? { passive: true } : { capture: false };
  const onTouchEnd = (e) => {
    if (isSwiping.value)
      onSwipeEnd == null ? void 0 : onSwipeEnd(e, direction.value);
    isSwiping.value = false;
  };
  const stops = [
    useEventListener(target, "touchstart", (e) => {
      if (e.touches.length !== 1)
        return;
      if (listenerOptions.capture && !listenerOptions.passive)
        e.preventDefault();
      const [x, y] = getTouchEventCoords(e);
      updateCoordsStart(x, y);
      updateCoordsEnd(x, y);
      onSwipeStart == null ? void 0 : onSwipeStart(e);
    }, listenerOptions),
    useEventListener(target, "touchmove", (e) => {
      if (e.touches.length !== 1)
        return;
      const [x, y] = getTouchEventCoords(e);
      updateCoordsEnd(x, y);
      if (!isSwiping.value && isThresholdExceeded.value)
        isSwiping.value = true;
      if (isSwiping.value)
        onSwipe == null ? void 0 : onSwipe(e);
    }, listenerOptions),
    useEventListener(target, ["touchend", "touchcancel"], onTouchEnd, listenerOptions)
  ];
  const stop = () => stops.forEach((s) => s());
  return {
    isPassiveEventSupported,
    isSwiping,
    direction,
    coordsStart,
    coordsEnd,
    lengthX: diffX,
    lengthY: diffY,
    stop
  };
}
function checkPassiveEventSupport(document2) {
  if (!document2)
    return false;
  let supportsPassive = false;
  const optionsBlock = {
    get passive() {
      supportsPassive = true;
      return false;
    }
  };
  document2.addEventListener("x", noop, optionsBlock);
  document2.removeEventListener("x", noop);
  return supportsPassive;
}

function useMuxStream({
  muxVideo,
  videoEl,
  preferMp4 = false,
  useSmallResolution = false
}) {
  const video = unref(muxVideo);
  if (!(video == null ? void 0 : video.asset)) {
    return false;
  }
  let stream = "";
  const appendVideo = () => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (preferMp4 && ((_b = (_a = video.asset.data) == null ? void 0 : _a.static_renditions) == null ? void 0 : _b.status) === "ready") {
      const filesSortedByBitrate = [
        // eslint-disable-next-line no-unsafe-optional-chaining
        ...(_d = (_c = video.asset.data) == null ? void 0 : _c.static_renditions) == null ? void 0 : _d.files
      ].sort((a, b) => b.bitrate - a.bitrate);
      const versionString = useSmallResolution ? (_e = filesSortedByBitrate[1]) == null ? void 0 : _e.name : (_f = filesSortedByBitrate[0]) == null ? void 0 : _f.name;
      stream = `https://stream.mux.com/${(_g = video.asset) == null ? void 0 : _g.playbackId}/${versionString}`;
      videoEl.value.src = stream;
    } else {
      stream = `https://stream.mux.com/${(_h = video.asset) == null ? void 0 : _h.playbackId}.m3u8`;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(stream);
        hls.attachMedia(videoEl.value);
      } else if (videoEl.value.canPlayType("application/vnd.apple.mpegurl")) {
        videoEl.value.src = stream;
      }
    }
  };
  return { appendVideo };
}

const _sfc_main$6 = {
  __name: "MediaVideo",
  __ssrInlineRender: true,
  props: {
    video: {
      type: Object,
      required: true
    },
    posterImage: {
      type: Object,
      default: () => void 0
    },
    showTime: {
      type: Boolean,
      default: () => false
    },
    preferMp4: {
      type: Boolean,
      default: () => true
    },
    useSmallResolution: {
      type: Boolean,
      default: () => false
    },
    autoplay: {
      type: Boolean,
      default: () => false
    },
    controls: {
      type: Boolean,
      default: () => true
    }
  },
  async setup(__props) {
    const props = __props;
    const videoEl = ref(null);
    const player = ref(null);
    const isVisible = ref(false);
    const isLoaded = ref(false);
    useIntersectionObserver(
      videoEl,
      ([{ isIntersecting }]) => {
        var _a;
        isVisible.value = isIntersecting;
        if (isIntersecting && player.value) {
          if (props.autoplay) {
            (_a = player == null ? void 0 : player.value) == null ? void 0 : _a.play();
          }
        } else {
          setTimeout(() => {
            var _a2;
            (_a2 = player == null ? void 0 : player.value) == null ? void 0 : _a2.pause();
          }, 100);
        }
      },
      {
        threshold: 0
      }
    );
    const videoWidth = computed(() => {
      var _a, _b, _c, _d;
      const videoTrack = (_d = (_c = (_b = (_a = props.video) == null ? void 0 : _a.asset) == null ? void 0 : _b.data) == null ? void 0 : _c.tracks) == null ? void 0 : _d.find(
        (el) => el.type === "video"
      );
      return videoTrack ? videoTrack.max_width : void 0;
    });
    const videoHeight = computed(() => {
      var _a, _b, _c, _d;
      const videoTrack = (_d = (_c = (_b = (_a = props.video) == null ? void 0 : _a.asset) == null ? void 0 : _b.data) == null ? void 0 : _c.tracks) == null ? void 0 : _d.find(
        (el) => el.type === "video"
      );
      return videoTrack ? videoTrack.max_height : void 0;
    });
    const aspectRatioStyle = computed(
      () => videoWidth.value && videoHeight ? { "aspect-ratio": `${videoWidth.value} / ${videoHeight.value}` } : {}
    );
    const { $urlFor } = useNuxtApp();
    const posterSrc = computed(() => {
      var _a, _b, _c, _d, _e, _f;
      if (props.posterImage) {
        return $urlFor(props.posterImage).width(videoWidth.value ?? 1920).url();
      } else {
        return ((_b = (_a = props.video) == null ? void 0 : _a.asset) == null ? void 0 : _b.playbackId) ? `https://image.mux.com/${(_d = (_c = props.video) == null ? void 0 : _c.asset) == null ? void 0 : _d.playbackId}/thumbnail.jpg?time=${((_f = (_e = props.video) == null ? void 0 : _e.asset) == null ? void 0 : _f.thumbTime) ?? 0}` : "";
      }
    });
    const { appendVideo } = useMuxStream({
      muxVideo: props.video,
      videoEl,
      preferMp4: props.preferMp4,
      useSmallResolution: props.useSmallResolution
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["video-wrapper", { loaded: unref(isLoaded) }],
        style: unref(aspectRatioStyle)
      }, _attrs))} data-v-f92c00b9><video class="video"${ssrRenderAttr("poster", !props.autoplay ? unref(posterSrc) : void 0)}${ssrRenderAttr("width", unref(videoWidth))}${ssrRenderAttr("height", unref(videoHeight))} style="${ssrRenderStyle(unref(aspectRatioStyle))}" playsinline preload="metadata" crossorigin="anonymous" data-v-f92c00b9></video></div>`);
    };
  }
};
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/media/MediaVideo.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __nuxt_component_1$1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$6, [["__scopeId", "data-v-f92c00b9"]]), { __name: "MediaVideo" });

const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "ModuleCarousel",
  __ssrInlineRender: true,
  props: {
    slides: {
      type: Array,
      default: () => []
    }
  },
  setup(__props) {
    const props = __props;
    const [emblaNode, emblaApi] = emblaCarouselVue({
      align: "start"
    });
    const emblaContainer = ref();
    useThrottleFn(() => {
      if (!emblaContainer.value) {
        return;
      }
      emblaContainer.value.style.transform;
    }, 100);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_MediaImage = __nuxt_component_2;
      const _component_MediaVideo = __nuxt_component_1$1;
      const _component_ModuleCarouselSlide = resolveComponent("ModuleCarouselSlide");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "module-carousel" }, _attrs))} data-v-c05f8122><div class="embla" data-v-c05f8122><div class="embla__container" data-v-c05f8122><!--[-->`);
      ssrRenderList(props.slides ?? [], (slide) => {
        var _a, _b;
        _push(`<div class="embla__slide" data-v-c05f8122>`);
        if ((slide == null ? void 0 : slide.type) === "image" && (slide == null ? void 0 : slide.image)) {
          _push(ssrRenderComponent(_component_MediaImage, {
            image: slide == null ? void 0 : slide.image
          }, null, _parent));
        } else if ((slide == null ? void 0 : slide.type) === "video") {
          _push(ssrRenderComponent(_component_MediaVideo, {
            video: slide == null ? void 0 : slide.video,
            autoplay: ((_a = slide == null ? void 0 : slide.videoSettings) == null ? void 0 : _a.autoplay) ?? false,
            controls: ((_b = slide == null ? void 0 : slide.videoSettings) == null ? void 0 : _b.controls) ?? true,
            "poster-image": slide == null ? void 0 : slide.image
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--><!--[-->`);
      ssrRenderList(props.slides ?? [], (slide) => {
        _push(ssrRenderComponent(_component_ModuleCarouselSlide, {
          key: slide._key,
          data: slide
        }, null, _parent));
      });
      _push(`<!--]--></div></div></div>`);
    };
  }
});

const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/modules/ModuleCarousel.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const ModuleCarousel = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$5, [["__scopeId", "data-v-c05f8122"]]), { __name: "ModuleCarousel" });

const _sfc_main$4 = {
  __name: "ModuleMedia",
  __ssrInlineRender: true,
  props: {
    type: {
      type: String,
      default: "image",
      validator(value) {
        return ["image", "video"].includes(value);
      }
    },
    image: {
      type: Object,
      default: () => void 0
    },
    video: {
      type: Object,
      default: () => void 0
    },
    videoSettings: {
      type: Object,
      default: () => void 0
    },
    caption: {
      type: String,
      default: ""
    }
  },
  setup(__props) {
    const props = __props;
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_MediaImage = __nuxt_component_2;
      const _component_MediaVideo = __nuxt_component_1$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "module-media" }, _attrs))} data-v-cc4f014a><figure data-v-cc4f014a>`);
      if (props.type === "image" && props.image) {
        _push(ssrRenderComponent(_component_MediaImage, {
          image: props.image
        }, null, _parent));
      } else if (props.type === "video") {
        _push(ssrRenderComponent(_component_MediaVideo, {
          video: props.video,
          autoplay: ((_a = props.videoSettings) == null ? void 0 : _a.autoplay) ?? false,
          controls: ((_b = props.videoSettings) == null ? void 0 : _b.controls) ?? true,
          "poster-image": props.image
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (props.caption) {
        _push(`<figcaption data-v-cc4f014a>${ssrInterpolate(props.caption)}</figcaption>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</figure></div>`);
    };
  }
};
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/modules/ModuleMedia.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const ModuleMedia = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-cc4f014a"]]);

const _sfc_main$3 = {
  __name: "RichTextStyles",
  __ssrInlineRender: true,
  props: {
    style: {
      type: String,
      default: () => ""
    },
    children: {
      type: Object,
      default: () => {
      }
    }
  },
  setup(__props) {
    const props = __props;
    return (_ctx, _push, _parent, _attrs) => {
      if (props.style === "h1") {
        _push(`<h2${ssrRenderAttrs(_attrs)} data-v-295311f0>`);
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
        _push(`</h2>`);
      } else if (props.style === "h2") {
        _push(`<h2${ssrRenderAttrs(_attrs)} data-v-295311f0>`);
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
        _push(`</h2>`);
      } else if (props.style === "h3") {
        _push(`<h3${ssrRenderAttrs(_attrs)} data-v-295311f0>`);
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
        _push(`</h3>`);
      } else if (props.style === "h4") {
        _push(`<h4${ssrRenderAttrs(_attrs)} data-v-295311f0>`);
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
        _push(`</h4>`);
      } else if (props.style === "h5") {
        _push(`<h5${ssrRenderAttrs(_attrs)} data-v-295311f0>`);
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
        _push(`</h5>`);
      } else if (props.style === "h6") {
        _push(`<h6${ssrRenderAttrs(_attrs)} data-v-295311f0>`);
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
        _push(`</h6>`);
      } else if (props.style === "normal") {
        _push(`<p${ssrRenderAttrs(_attrs)} data-v-295311f0>`);
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
        _push(`</p>`);
      } else {
        _push(`<p${ssrRenderAttrs(_attrs)} data-v-295311f0>`);
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
        _push(`</p>`);
      }
    };
  }
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/text/RichTextStyles.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const RichTextStyles = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-295311f0"]]);

const _sfc_main$2 = {
  __name: "RichText",
  __ssrInlineRender: true,
  props: {
    blocks: {
      type: Array,
      default: () => []
    }
  },
  setup(__props) {
    const props = __props;
    const serializers = {
      types: {
        "module.media": ModuleMedia,
        "module.carousel": ModuleCarousel
      },
      marks: {
        link: ElementsLink,
        linkCookie: ElementsLink,
        underline: "u",
        "strike-through": "s"
      },
      styles: {
        normal: RichTextStyles,
        h1: RichTextStyles,
        h2: RichTextStyles,
        h3: RichTextStyles,
        h4: RichTextStyles,
        h5: RichTextStyles,
        h6: RichTextStyles
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_SanityContent = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "rich-text" }, _attrs))} data-v-00bdd038>`);
      _push(ssrRenderComponent(_component_SanityContent, {
        blocks: props.blocks,
        serializers
      }, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/text/RichText.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-00bdd038"]]);

const _sfc_main$1 = {
  __name: "error",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a;
    let __temp, __restore;
    const query = groq`${ERROR_PAGE_QUERY}`;
    const { data } = ([__temp, __restore] = withAsyncContext(() => useSanityQuery(query)), __temp = await __temp, __restore(), __temp);
    const { favicon } = useUtils();
    favicon();
    useSeoMeta({
      title: ((_a = data == null ? void 0 : data.value) == null ? void 0 : _a.title) || "Page Not Found"
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a2, _b;
      const _component_RichText = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "error-page" }, _attrs))} data-v-ec904797>`);
      _push(ssrRenderComponent(_component_RichText, {
        blocks: ((_a2 = unref(data)) == null ? void 0 : _a2.content) ?? []
      }, null, _parent));
      _push(`<button class="link-style" data-v-ec904797>${ssrInterpolate((_b = unref(data)) == null ? void 0 : _b.button)}</button></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("error.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const ErrorComponent = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-ec904797"]]);

const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = () => null;
    const nuxtApp = useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    const abortRender = error.value && !nuxtApp.ssrContext.error;
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(abortRender)) {
            _push(`<div></div>`);
          } else if (unref(error)) {
            _push(ssrRenderComponent(unref(ErrorComponent), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(AppComponent), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../../node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    var _a;
    const vueApp = createApp(_sfc_main);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (error) {
      await nuxt.hooks.callHook("app:error", error);
      (_a = nuxt.payload).error || (_a.error = createError(error));
    }
    if (ssrContext == null ? void 0 : ssrContext._renderResponse) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry$1 = (ssrContext) => entry(ssrContext);

const server = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: entry$1
});

export { ENTRY_QUERY as E, HOMEPAGE_QUERY as H, IMAGE_QUERY as I, POOLARCHIVE_QUERY as P, RICH_TEXT_QUERY as R, SLUG_PAGE_QUERY as S, WORDS_QUERY as W, _export_sfc as _, useHead as a, useRoute as b, createError as c, __nuxt_component_1 as d, useI18n as e, useLocalePath as f, groq as g, __nuxt_component_2 as h, __nuxt_component_0$6 as i, POOL_PROFILE_QUERY as j, SHOWSARCHIVE_QUERY as k, useSwipe as l, __nuxt_component_0$3 as m, useSanity as n, navigateTo as o, useRouter as p, useAsyncData as q, useThrottleFn as r, SCHEDULE_QUERY as s, SHOW_QUERY as t, useMainStore as u, SET_QUERY as v, useNuxtApp as w, useSanityQuery as x, useSeoMeta as y, server as z };

import { d as defineEventHandler, r as readBody, g as getHeader, u as useRuntimeConfig, c as createError, a as useStorage } from '../../nitro/nitro.mjs';
import { createHmac } from 'crypto';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'lru-cache';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue';
import '@sanity/client';

const revalidate = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e;
  const body = await readBody(event);
  const signature = getHeader(event, "sanity-webhook-signature");
  const config = useRuntimeConfig();
  const secret = config.sanityWebhookSecret;
  if (secret && signature) {
    const expectedSignature = createHmac("sha256", secret).update(JSON.stringify(body)).digest("hex");
    if (signature !== expectedSignature) {
      console.warn("\u26A0\uFE0F Invalid webhook signature received");
      throw createError({
        statusCode: 401,
        message: "Invalid webhook signature"
      });
    }
  }
  console.log(`\u{1F4E8} Webhook received: ${body._type} (${body._id})`);
  const routesToPurge = [];
  switch (body._type) {
    case "show":
      routesToPurge.push("/shows");
      if ((_a = body.slug) == null ? void 0 : _a.current) {
        routesToPurge.push(`/shows/${body.slug.current}`);
      }
      routesToPurge.push("/");
      break;
    case "set":
      routesToPurge.push("/shows");
      break;
    case "person":
      routesToPurge.push("/pool");
      if ((_b = body.slug) == null ? void 0 : _b.current) {
        routesToPurge.push(`/pool/${body.slug.current}`);
      }
      routesToPurge.push("/shows");
      break;
    case "venue":
      routesToPurge.push("/pool");
      if ((_c = body.slug) == null ? void 0 : _c.current) {
        routesToPurge.push(`/pool/${body.slug.current}`);
      }
      break;
    case "article":
      routesToPurge.push("/words");
      if ((_d = body.slug) == null ? void 0 : _d.current) {
        routesToPurge.push(`/words/${body.slug.current}`);
      }
      break;
    case "home":
      routesToPurge.push("/");
      break;
    case "page":
      if ((_e = body.slug) == null ? void 0 : _e.current) {
        routesToPurge.push(`/${body.slug.current}`);
      }
      break;
    case "pool":
    case "showsArchive":
    case "words":
    case "timetable":
      routesToPurge.push("/pool", "/shows", "/words", "/schedule");
      break;
    default:
      console.log(`\u26A0\uFE0F Unknown content type: ${body._type}`);
  }
  const uniqueRoutes = [...new Set(routesToPurge)];
  try {
    const storage = useStorage("cache");
    for (const route of uniqueRoutes) {
      const cacheKey = `nitro:routes:${route}.html`;
      await storage.removeItem(cacheKey);
      await storage.removeItem(`nitro:routes:${route}`);
      console.log(`\u{1F5D1}\uFE0F Purged cache for: ${route}`);
    }
  } catch (error) {
    console.error("\u274C Error purging cache:", error);
  }
  const response = {
    success: true,
    purged: uniqueRoutes,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    message: `Invalidated ${uniqueRoutes.length} route(s)`
  };
  console.log(`\u2705 Cache invalidation complete: ${uniqueRoutes.join(", ")}`);
  return response;
});

export { revalidate as default };

# Sanity Webhook Setup für Cache Revalidation

## Übersicht

Diese Dokumentation erklärt, wie du den Sanity Webhook einrichtest, um den Cache der Website automatisch zu invalidieren, wenn Inhalte veröffentlicht werden.

## Webhook einrichten

1. Gehe zu [sanity.io/manage](https://sanity.io/manage)
2. Wähle dein Projekt aus
3. Navigiere zu **API** → **Webhooks**
4. Klicke auf **"Create webhook"**

## Konfiguration

| Einstellung | Wert |
|-------------|------|
| **Name** | Cache Revalidation |
| **URL** | `https://callshopradio.com/api/revalidate` |
| **Dataset** | production |
| **Trigger on** | ✅ Create, ✅ Update, ✅ Delete |
| **Filter** | `_type in ["show", "set", "person", "venue", "article", "home", "page", "pool", "showsArchive", "words", "timetable"]` |
| **Projection** | `{_type, _id, slug, show}` |
| **HTTP method** | POST |
| **API version** | v2024-01-01 |

## HTTP Headers

| Header | Wert |
|--------|------|
| `Content-Type` | `application/json` |

## Secret (Empfohlen)

1. Klicke auf **"Enable secret"** und generiere ein Secret
2. Kopiere das Secret
3. Füge es in die `.env` Datei der Website ein:
   ```
   SANITY_WEBHOOK_SECRET=dein-generiertes-secret
   ```
4. Stelle sicher, dass das Secret auch auf Netlify als Environment Variable gesetzt ist

## Testen

Nach dem Einrichten kannst du den Webhook testen:

1. Öffne ein Dokument in Sanity Studio
2. Mache eine kleine Änderung
3. Klicke auf **"Publish"**
4. Prüfe die Webhook-Logs in Sanity (unter **API** → **Webhooks** → Dein Webhook → **Logs**)

Erwartete Antwort:
```json
{
  "success": true,
  "purged": ["/shows", "/shows/example-show"],
  "timestamp": "2024-12-14T23:40:00.000Z",
  "message": "Invalidated 2 route(s)"
}
```

## Cache-Invalidierung nach Content-Typ

| Content-Typ | Invalidierte Routes |
|-------------|---------------------|
| `show` | `/shows`, `/shows/[slug]`, `/` |
| `set` | `/shows` |
| `person` | `/pool`, `/pool/[slug]`, `/shows` |
| `venue` | `/pool`, `/pool/[slug]` |
| `article` | `/words`, `/words/[slug]` |
| `home` | `/` |
| `page` | `/[slug]` |
| `pool`, `showsArchive`, `words`, `timetable` | Alle Archive-Seiten |

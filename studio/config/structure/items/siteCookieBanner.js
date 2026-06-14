export const siteCookieBanner = (S) =>
  S.listItem()
    .title("Cookie Banner")
    .schemaType("siteCookieBanner")
    .child(
      S.editor()
        .title("Cookie Banner")
        .schemaType("siteCookieBanner")
        .documentId("siteCookieBanner"),
    );

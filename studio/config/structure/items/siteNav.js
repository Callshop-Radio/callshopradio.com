export const siteNav = (S) =>
  S.listItem()
    .title("Menus")
    .schemaType("siteNav")
    .child(
      S.editor().title("Menus").schemaType("siteNav").documentId("siteNav"),
    );

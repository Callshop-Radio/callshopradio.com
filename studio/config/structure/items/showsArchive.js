export const showsArchive = (S) =>
  S.listItem()
    .title("Shows Archive Page")
    .schemaType("showsArchive")
    .child(
      S.editor()
        .title("Shows")
        .schemaType("showsArchive")
        .documentId("showsArchive"),
    );

export const pool = (S) =>
  S.listItem()
    .title("Pool Page")
    .schemaType("pool")
    .child(S.editor().title("Pool").schemaType("pool").documentId("pool"));

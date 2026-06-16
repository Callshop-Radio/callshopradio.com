export const shows = (S) =>
  S.listItem()
    .title("Shows")
    .schemaType("show")
    .child(S.documentTypeList("show"));

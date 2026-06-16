export const venues = (S) =>
  S.listItem()
    .title("Venues")
    .schemaType("venue")
    .child(S.documentTypeList("venue"));

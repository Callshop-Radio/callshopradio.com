export const musicianTags = (S) =>
  S.listItem()
    .title("Musician")
    .schemaType("tag.musician")
    .child(S.documentTypeList("tag.musician"));

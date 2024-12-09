export const artistTags = (S) =>
    S.listItem().title('Artist').schemaType('tag.artist').child(S.documentTypeList('tag.artist'))
  
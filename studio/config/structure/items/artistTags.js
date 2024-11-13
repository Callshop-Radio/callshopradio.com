export const artistTags = (S) =>
    S.listItem().title('Artist Tags').schemaType('tag.artist').child(S.documentTypeList('tag.artist'))
  
export const genres = (S) =>
    S.listItem().title('Genres').schemaType('tag.genre').child(S.documentTypeList('tag.genre'))
  
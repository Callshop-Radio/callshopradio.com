export const localTags = (S) =>
    S.listItem().title('Venue').schemaType('tag.venue').child(S.documentTypeList('tag.venue'))
  
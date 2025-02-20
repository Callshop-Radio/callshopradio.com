export const craftTags = (S) =>
    S.listItem().title('Crafts').schemaType('tag.crafts').child(S.documentTypeList('tag.crafts'))
  
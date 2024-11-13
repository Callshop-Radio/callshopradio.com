export const cityTags = (S) =>
    S.listItem().title('Cities').schemaType('tag.city').child(S.documentTypeList('tag.city'))
  
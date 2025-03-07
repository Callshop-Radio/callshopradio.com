export const moodTags = (S) =>
    S.listItem().title('Mood').schemaType('tag.mood').child(S.documentTypeList('tag.mood'))
  
export const persons = (S) =>
    S.listItem().title('Persons').schemaType('person').child(S.documentTypeList('person'))
  
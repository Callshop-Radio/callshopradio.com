export const siteSettings = (S) =>
  S.listItem()
    .title('General')
    .schemaType('siteSettings')
    .child(S.editor().title('Settings').schemaType('siteSettings').documentId('siteSettings'))

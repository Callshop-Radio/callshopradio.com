export const siteFallbacks = (S) =>
    S.listItem()
      .title('Fallbacks')
      .schemaType('fallback.global')
      .child(S.editor().title('Fallback Content & SEO').schemaType('fallback.global').documentId('fallback.global'))
  
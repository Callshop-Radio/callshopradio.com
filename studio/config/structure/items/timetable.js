export const timetable = (S) =>
    S.listItem()
      .title('Timetable')
      .schemaType('timetable')
      .child(S.editor().title('Timetable').schemaType('timetable').documentId('timetable'))
  
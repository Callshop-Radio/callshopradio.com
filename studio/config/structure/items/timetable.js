export const timetable = (S) =>
    S.listItem()
      .title('Schedule')
      .schemaType('timetable')
      .child(S.editor().title('Schedule').schemaType('timetable').documentId('timetable'))
  
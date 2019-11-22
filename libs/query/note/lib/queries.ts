import { getModel } from '@abx/db-connection-utils'
import { Note } from '@abx-types/note'

export async function findAllNotes(): Promise<Note[]> {
  const notes = await getModel<Note>('depositRequest').findAll()

  return notes.map(note => note.get())
}

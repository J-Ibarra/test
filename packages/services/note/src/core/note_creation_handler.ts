import { getModel } from '@abx/db-connection-utils'
import { Note } from '@abx-types/note'
import { findAllNotes } from '@abx/note-query-lib'

export function createNote(title: string, description: string): Promise<Note> {
  findAllNotes()
  return getModel<Note>('note').create({
    title,
    description,
  }) as any
}

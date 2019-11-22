import { getModel } from '@abx/db-connection-utils'
import { Note } from '@abx-types/note'

export function createNote(title: string, description: string): Promise<Note> {
  return getModel<Note>('depositRequest').create({
    title,
    description,
  }) as any
}

import { getEpicurusInstance } from '@abx/db-connection-utils'
import { createNote } from '../core/note_creation_handler'

export function bootstrapNoteCreation() {
  const epicurus = getEpicurusInstance()

  epicurus.server('notes-service/create-note', async ({ title, description }, respond: (err: any, response?: any) => void) => {
    const note = createNote(title, description)
    respond(null, note)
  })
}

import { expect } from 'chai'

import { truncateTables } from '@abx/db-connection-utils'
import { findAllNotes } from '@abx/note-query-lib'
import { createNote } from '../../core/note_creation_handler'

describe('note_creation_handler', () => {
  beforeEach(async () => {
    await truncateTables(['note'])
  })

  it('should create a note when calling createNote', async () => {
    const note = await createNote('title', 'description')

    const notes = await findAllNotes()
    expect(notes.length).to.eql(1)
    expect(notes[0].title).to.eql(note.title)
  })
})

import { expect } from 'chai'
import { findAllNotes } from '../queries'
import { getModel, truncateTables } from '@abx/db-connection-utils'
import { Note } from '@abx-types/note'
import '../index'

describe('queries', () => {
  beforeEach(async () => {
    await truncateTables(['note'])
  })

  it('should retrieve all notes when calling findAllNotes', async () => {
    const title = 'foo'
    await getModel<Note>('note').create({
      title: 'foo',
      description: 'bar',
    })

    const notes = await findAllNotes()

    expect(notes.length).to.eql(1)
    expect(notes[0].title).to.eql(title)
  })
})

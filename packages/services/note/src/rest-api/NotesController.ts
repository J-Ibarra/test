import { Body, Post, Route } from 'tsoa'
import { Note } from '@abx-types/note'

import { createNote } from '../core/note_creation_handler'

interface NoteCreationRequest {
  title: string
  description: string
}

@Route()
export class NotesController {
  @Post('notes')
  public async createNote(@Body() { title, description }: NoteCreationRequest): Promise<Note> {
    return createNote(title, description)
  }
}

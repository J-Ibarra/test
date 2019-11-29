import { Body, Post, Route } from 'tsoa'

import { createNote } from '../core/note_creation_handler'
import { NoteResponse } from './response-model/note.response'

interface NoteCreationRequest {
  title: string
  description: string
}

@Route()
export class NotesController {
  @Post('notes')
  public async createNote(@Body() { title, description }: NoteCreationRequest): Promise<NoteResponse> {
    return createNote(title, description)
  }
}

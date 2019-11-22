import { setupModel } from '@abx/db-connection-utils'
import setupNoteModel from './model/note'

setupModel(setupNoteModel)

export * from './queries'

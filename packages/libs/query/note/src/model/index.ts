import { Sequelize } from 'sequelize'

import Note from './note'

export default function(sequelize: Sequelize) {
  const noteModel = Note(sequelize)

  return {
    note: noteModel,
  }
}

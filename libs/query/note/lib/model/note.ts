import * as Sequelize from 'sequelize'
import { Note } from '@abx-types/note'

export interface NoteInstance extends Sequelize.Instance<Note>, Note {}

export default function(sequelize: Sequelize.Sequelize) {
  const note = sequelize.define<NoteInstance, Note>('notes', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  })

  return note
}

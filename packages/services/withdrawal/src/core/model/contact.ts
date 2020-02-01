import * as Sequelize from 'sequelize'
import { Contact } from '@abx-types/withdrawal'

export interface ContactInstance extends Sequelize.Instance<Contact>, Contact {}

export default function(sequelize: Sequelize.Sequelize) {
  return sequelize.define<ContactInstance, Contact>(
    'contacts',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      accountId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      currencyCode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      publicKey: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'contacts',
    },
  )
}

import * as Sequelize from 'sequelize'
import { Session } from '@abx-types/account'

export interface SessionInstance extends Sequelize.Instance<Session>, Session {}

export default function(sequelize: Sequelize.Sequelize) {
  return sequelize.define<SessionInstance, Session>('session', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    expiry: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    deactivated: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  })
}

import * as Sequelize from 'sequelize'

import { Token } from '@abx-types/account'

export interface TokenInstance extends Sequelize.Instance<Token>, Token {}

export default function(sequelize: Sequelize.Sequelize) {
  return sequelize.define<TokenInstance, Token>('token', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    accountId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'account',
        key: 'id',
      },
    },
    expiry: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    token: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    deactivated: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  })
}

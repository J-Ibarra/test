import * as Sequelize from 'sequelize'
import { Account, AccountStatus } from '@abx-types/account'
import { UserInstance } from './user'

export interface AccountInstance extends Sequelize.Instance<Account>, Account {
  getUsers: Sequelize.HasManyGetAssociationsMixin<UserInstance>
}

export default function(sequelize: Sequelize.Sequelize) {
  return sequelize.define<AccountInstance, Account>('account', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    hin: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.ENUM,
      values: Object.keys(AccountStatus),
      allowNull: false,
    },
    suspended: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    hasTriggeredKycCheck: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  })
}

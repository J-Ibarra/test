import * as Sequelize from 'sequelize'
import { User } from '@abx-types/account'
import { AccountInstance } from './account'

export interface UserInstance extends Sequelize.Instance<User>, User {
  getAccount: Sequelize.BelongsToGetAssociationMixin<AccountInstance>
}

export default function(sequelize: Sequelize.Sequelize) {
  const user = sequelize.define<UserInstance, User>(
    'user',
    {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      accountId: {
        type: Sequelize.UUID,
        references: {
          model: 'account',
          key: 'id',
        },
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'individualEmail',
      },
      passwordHash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      activated: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      passwordResetKey: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      mfaTempSecret: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referredBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'account',
          key: 'id',
        },
      },
      mfaSecret: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      mfaTempSecretCreated: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      qrcodeUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      getterMethods: {
        publicView(this: UserInstance): Partial<User> {
          return {
            id: this.getDataValue('id'),
            accountId: this.getDataValue('accountId'),
            email: this.getDataValue('email'),
            firstName: this.getDataValue('firstName'),
            lastName: this.getDataValue('lastName'),
            lastLogin: this.getDataValue('lastLogin'),
            mfaEnabled: !!this.getDataValue('mfaSecret'),
            referredBy: this.getDataValue('referredBy'),
          }
        },
      },
    },
  )

  return user
}

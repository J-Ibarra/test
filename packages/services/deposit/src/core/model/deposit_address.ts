import * as Sequelize from 'sequelize'
import { DepositAddress } from '@abx-types/deposit'

export interface DepositAddressInstance extends Sequelize.Instance<DepositAddress>, DepositAddress {}

export default function depositAddressModel(sequelize: Sequelize.Sequelize) {
  return sequelize.define<DepositAddressInstance, DepositAddress>(
    'depositAddress',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      accountId: {
        type: Sequelize.UUID,
      },
      currencyId: {
        type: Sequelize.INTEGER,
      },
      encryptedPrivateKey: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      publicKey: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      encryptedWif: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      activated: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
    },
    {
      tableName: 'deposit_address',
    },
  )
}

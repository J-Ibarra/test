import * as Sequelize from 'sequelize'
import { VaultAddress } from '@abx-types/deposit'

export interface VaultAddressInstance extends Sequelize.Instance<VaultAddress>, VaultAddress {}

export default function vaultAddressModel(sequelize: Sequelize.Sequelize) {
  return sequelize.define<VaultAddressInstance, VaultAddress>(
    'vaultAddress',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      accountId: {
        type: Sequelize.UUID,
        unique: true,
      },
      publicKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'vault_address',
    },
  )
}

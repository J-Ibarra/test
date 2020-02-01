import * as Sequelize from 'sequelize'
import depositAddressModel from './deposit_address'
import depositRequestModel from './deposit_request'
import vaultModel from './vault_address'

export default function depositModels(sequelize: Sequelize.Sequelize): any {
  const DepositAddress = depositAddressModel(sequelize)
  const DepositRequest = depositRequestModel(sequelize)
  const VaultAddress = vaultModel(sequelize)

  DepositRequest.belongsTo(DepositAddress, { foreignKey: 'depositAddressId' })

  return {
    depositAddress: DepositAddress,
    depositRequest: DepositRequest,
    vaultAddress: VaultAddress,
  }
}

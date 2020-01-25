import { Sequelize } from 'sequelize'
import withdrawalRequest from './withdrawal_request'
import { withdrawalEmissionRequestModel } from './withdrawal_kinesis_coin_emission'

export default function withdrawalModels(sequelize: Sequelize): any {
  const WithdrawalRequest = withdrawalRequest(sequelize)
  const WithdrawalKinesisCoinEmission = withdrawalEmissionRequestModel(sequelize)

  WithdrawalKinesisCoinEmission.belongsTo(WithdrawalRequest, { foreignKey: 'withdrawalRequestId' })

  return {
    withdrawalRequest: WithdrawalRequest,
    withdrawalKinesisCoinEmission: WithdrawalKinesisCoinEmission,
  }
}

import { Sequelize } from 'sequelize'
import withdrawalRequest from './withdrawal_request'
import contact from './contact'
import { withdrawalEmissionRequestModel } from './withdrawal_kinesis_coin_emission'

export default function withdrawalModels(sequelize: Sequelize): any {
  const WithdrawalRequest = withdrawalRequest(sequelize)
  const WithdrawalKinesisCoinEmission = withdrawalEmissionRequestModel(sequelize)
  const Contact = contact(sequelize)

  WithdrawalKinesisCoinEmission.belongsTo(WithdrawalRequest, { foreignKey: 'withdrawalRequestId' })

  return {
    withdrawalRequest: WithdrawalRequest,
    withdrawalKinesisCoinEmission: WithdrawalKinesisCoinEmission,
    contact: Contact,
  }
}

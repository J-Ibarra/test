import { Instance, Sequelize } from 'sequelize'
import { Account } from '@abx-types/account'
import { Currency } from '@abx-types/reference-data'
import withdrawalRequest from './withdrawal_request'

export default function withdrawalModels(sequelize: Sequelize): any {
  const WithdrawalRequest = withdrawalRequest(sequelize)

  const CurrencyModel = sequelize.model<Instance<Currency>, Currency>('currency')
  const AccountModel = sequelize.model<Instance<Account>, Account>('account')

  WithdrawalRequest.belongsTo(CurrencyModel, { foreignKey: 'currencyId' })
  WithdrawalRequest.belongsTo(AccountModel, { foreignKey: 'accountId' })

  return {
    withdrawalRequest: WithdrawalRequest,
  }
}

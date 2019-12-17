import Balance from './balance'
import BalanceAdjustment from './balance_adjustment'
import BalanceType from './balance_type'

export default function balanceModels(sequelize): any {
  const balanceTypeModel = BalanceType(sequelize)
  const balanceModel = Balance(sequelize)

  const balanceAdjustmentModel = BalanceAdjustment(sequelize)
  balanceAdjustmentModel.belongsTo(balanceModel)
  balanceModel.belongsTo(balanceTypeModel)

  return {
    balance: balanceModel,
    BalanceAdjustment: balanceAdjustmentModel,
    BalanceType: balanceTypeModel,
  }
}

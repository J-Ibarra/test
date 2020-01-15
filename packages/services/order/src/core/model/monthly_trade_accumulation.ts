import * as Sequelize from 'sequelize'
import * as constants from '@abx-types/reference-data'
import { MonthlyTradeAccumulation } from '@abx-types/order'

export interface MonthlyTradeAccumulationInstance extends Sequelize.Instance<MonthlyTradeAccumulation>, MonthlyTradeAccumulation {}

export default function(sequelize: Sequelize.Sequelize) {
  const options = {
    tableName: 'monthly_trade_accumulation',
  }

  return sequelize.define<MonthlyTradeAccumulationInstance, MonthlyTradeAccumulation>(
    'monthlyTradeAccumulation',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      accountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'account',
          key: 'id',
        },
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total: {
        type: Sequelize.DECIMAL(constants.currencyPrecision, constants.currencyScale),
        allowNull: false,
        get(this: MonthlyTradeAccumulationInstance) {
          return parseFloat(this.getDataValue('total')) || 0
        },
      },
    },
    options,
  )
}

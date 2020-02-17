import * as Sequelize from 'sequelize'
import * as constants from '@abx-types/reference-data'
import { AccountFeeTier } from '@abx-types/order'

export interface AccountFeeTierInstance extends Sequelize.Instance<AccountFeeTier>, AccountFeeTier {}

export default function(sequelize: Sequelize.Sequelize) {
  const options = {
    tableName: 'account_execution_fee',
  }

  return sequelize.define<AccountFeeTierInstance, AccountFeeTier>(
    'accountExecutionFee',
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
      symbolId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'symbol',
          key: 'id',
        },
      },
      tier: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      threshold: {
        type: Sequelize.DECIMAL(constants.currencyPrecision, constants.currencyScale),
        allowNull: false,
        get(this: any) {
          return parseFloat(this.getDataValue('threshold')) || 0
        },
      },
      rate: {
        type: Sequelize.DECIMAL(constants.currencyPrecision, constants.currencyScale),
        allowNull: false,
        get(this: any) {
          return parseFloat(this.getDataValue('rate')) || 0
        },
      },
    },
    options,
  )
}

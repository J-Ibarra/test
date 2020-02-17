import * as Sequelize from 'sequelize'
import * as constants from '@abx-types/reference-data'
import { FeeTier } from '@abx-types/order'

export interface DefaultFeeTierInstance extends Sequelize.Instance<FeeTier>, FeeTier {}

export default function(sequelize: Sequelize.Sequelize) {
  const options = {
    tableName: 'default_execution_fee',
  }

  return sequelize.define<DefaultFeeTierInstance, FeeTier>(
    'defaultExecutionFee',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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

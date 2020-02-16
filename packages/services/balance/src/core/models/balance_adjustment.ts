import * as Sequelize from 'sequelize'

import { BalanceAdjustment } from '@abx-types/balance'
import { RawBalanceInstance } from './balance'

export interface BalanceAdjustmentInstance extends Sequelize.Instance<BalanceAdjustment>, BalanceAdjustment {
  getBalance: Sequelize.BelongsToGetAssociationMixin<RawBalanceInstance>
}

export default function(sequelize: Sequelize.Sequelize) {
  const options = {
    tableName: 'balance_adjustment',
  }

  return sequelize.define<BalanceAdjustmentInstance, BalanceAdjustment>(
    'balanceAdjustment',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      balanceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'balance',
          key: 'id',
        },
      },
      sourceEventType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sourceEventId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      delta: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
        get(this: any) {
          return parseFloat(this.getDataValue('delta')) || 0
        },
      },
      value: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
        get(this: any) {
          return parseFloat(this.getDataValue('value')) || 0
        },
      },
    },
    options,
  )
}

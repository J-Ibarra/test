import * as Sequelize from 'sequelize'
import { RawBalance } from '@abx-types/balance'
import { BalanceTypeInstance } from './balance_type'

export interface RawBalanceInstance extends Sequelize.Instance<RawBalance>, RawBalance {
  getBalanceType: Sequelize.BelongsToGetAssociationMixin<BalanceTypeInstance>
}

export default function(sequelize: Sequelize.Sequelize) {
  return sequelize.define<RawBalanceInstance, RawBalance>('balance', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    value: {
      type: Sequelize.DECIMAL,
      defaultValue: 0,
      get(this: any) {
        return parseFloat(this.getDataValue('value')) || 0
      },
    },
    accountId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    balanceTypeId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'balance_type',
        key: 'id',
      },
    },
    currencyId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  })
}

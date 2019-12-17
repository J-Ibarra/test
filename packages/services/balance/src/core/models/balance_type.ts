import * as Sequelize from 'sequelize'
import { IBalanceType } from '@abx-types/balance'

export interface BalanceTypeInstance extends Sequelize.Instance<IBalanceType>, IBalanceType {}

export default function (sequelize: Sequelize.Sequelize) {
  const options = {
    tableName: 'balance_type',
  }

  return sequelize.define<BalanceTypeInstance, IBalanceType>('balanceType', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false
    },
  }, options)
}

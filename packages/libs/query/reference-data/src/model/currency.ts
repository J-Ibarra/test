import * as Sequelize from 'sequelize'
import { Currency } from '@abx-types/reference-data'

export interface CurrencyInstance extends Sequelize.Instance<Currency>, Currency {}

export default function(sequelize: Sequelize.Sequelize) {
  return sequelize.define<CurrencyInstance, Currency>('currency', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  })
}

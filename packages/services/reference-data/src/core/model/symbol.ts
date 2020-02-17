import * as Sequelize from 'sequelize'
import { SymbolPairSummary } from '@abx-types/reference-data'
import { CurrencyInstance } from './currency'

export interface SymbolInstance extends Sequelize.Instance<SymbolPairSummary>, SymbolPairSummary {
  getBase: Sequelize.BelongsToGetAssociationMixin<CurrencyInstance>
  getQuote: Sequelize.BelongsToGetAssociationMixin<CurrencyInstance>
  getFee: Sequelize.BelongsToGetAssociationMixin<CurrencyInstance>
}

export default function(sequelize: Sequelize.Sequelize) {
  return sequelize.define<SymbolInstance, SymbolPairSummary>('symbol', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    baseId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'currency',
        key: 'id',
      },
    },
    quoteId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'currency',
        key: 'id',
      },
    },
    feeId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'currency',
        key: 'id',
      },
    },
    orderRange: {
      type: Sequelize.NUMERIC,
      defaultValue: 0.3,
      allowNull: true,
      get(this: any) {
        return parseFloat(this.getDataValue('orderRange')) || null
      },
    },
    sortOrder: {
      type: Sequelize.INTEGER,
      allowNull: true,
      get(this: any) {
        return parseFloat(this.getDataValue('sortOrder')) || null
      },
      unique: true,
    },
    isEnabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  })
}

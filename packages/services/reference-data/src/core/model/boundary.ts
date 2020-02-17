import * as Sequelize from 'sequelize'
import { currencyPrecision, currencyScale } from '@abx-types/reference-data'
import { CurrencyBoundary } from '@abx-types/reference-data'

export interface CurrencyBoundaryInstance extends Sequelize.Instance<CurrencyBoundary>, CurrencyBoundary {}

export default function(sequelize: Sequelize.Sequelize) {
  const boundary = sequelize.define<CurrencyBoundaryInstance, CurrencyBoundary>('boundary', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    currencyId: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: 'currency',
        key: 'id',
      },
    },
    currencyCode: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    minAmount: {
      type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
      allowNull: false,
      get(this: any) {
        return parseFloat(this.getDataValue('minAmount')) || 0
      },
    },
    maxDecimals: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  })

  return boundary
}

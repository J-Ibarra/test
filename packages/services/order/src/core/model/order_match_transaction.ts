import * as Sequelize from 'sequelize'
import { OrderMatch } from '@abx-types/order'
import { currencyPrecision, currencyScale } from '@abx-types/reference-data'

export interface OrderMatchInstance extends Sequelize.Instance<OrderMatch>, OrderMatch {}

export default function(sequelize: Sequelize.Sequelize) {
  const options = {
    tableName: 'order_match_transaction',
  }

  const orderMatchTransaction = sequelize.define<OrderMatchInstance, OrderMatch>(
    'orderMatchTransaction',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      symbolId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'symbol',
          key: 'id',
        },
      },
      sellAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'account',
          key: 'id',
        },
      },
      sellOrderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'order',
          key: 'id',
        },
      },
      sellOrderType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      buyAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'account',
          key: 'id',
        },
      },
      buyOrderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'order',
          key: 'id',
        },
      },
      buyOrderType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: false,
        get(this: any) {
          return parseFloat(this.getDataValue('amount')) || 0
        },
      },
      matchPrice: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: false,
        get(this: any) {
          return parseFloat(this.getDataValue('matchPrice')) || 0
        },
      },
      consideration: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: false,
        get(this: any) {
          return parseFloat(this.getDataValue('consideration')) || 0
        },
      },
    },
    options,
  )

  return orderMatchTransaction
}

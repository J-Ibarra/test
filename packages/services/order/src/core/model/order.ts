import * as Sequelize from 'sequelize'
import { Order } from '@abx-types/order'
import { currencyPrecision, currencyScale } from '@abx-types/reference-data'

export interface OrderInstance extends Sequelize.Instance<Order>, Order {}

export default function(sequelize: Sequelize.Sequelize) {
  const options = {
    tableName: 'order',
  }

  const order = sequelize.define<OrderInstance, Order>(
    'order',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      clientOrderId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      accountId: {
        type: Sequelize.UUID,
        references: {
          model: 'account',
          key: 'id',
        },
      },
      direction: {
        type: Sequelize.STRING,
        allowNull: false,
      }, // enum.OrderDirection
      symbolId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'symbol',
          key: 'id',
        },
      },
      amount: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: false,
        get(this: OrderInstance) {
          return parseFloat(this.getDataValue('amount')) || 0
        },
      },
      remaining: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: true,
        get(this: OrderInstance) {
          return parseFloat(this.getDataValue('remaining')) || 0
        },
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      }, // enum.OrderStatus
      orderType: {
        type: Sequelize.STRING,
        allowNull: false,
      }, // enum.OrderType
      validity: {
        type: Sequelize.STRING,
        allowNull: false,
      }, // enum.OrderType
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      limitPrice: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: true,
        get(this: OrderInstance) {
          return parseFloat(this.getDataValue('limitPrice')) || 0
        },
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      globalTransactionId: {
        type: Sequelize.STRING,
        unique: true,
      },
    },
    options,
  )

  return order
}

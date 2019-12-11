import * as Sequelize from 'sequelize'
import { OrderEvent } from '@abx-types/order'
import { OrderInstance } from './order'

export interface OrderEventInstance extends Sequelize.Instance<OrderEvent>, OrderEvent {
  getOrder: Sequelize.BelongsToGetAssociationMixin<OrderInstance>
}

export default function(sequelize: Sequelize.Sequelize) {
  return sequelize.define<OrderEventInstance, OrderEvent>(
    'orderEvent',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'order',
          key: 'id',
        },
      },
      remaining: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      data: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      updatedAt: false,
      deletedAt: false,
      tableName: 'order_event',
    },
  )
}

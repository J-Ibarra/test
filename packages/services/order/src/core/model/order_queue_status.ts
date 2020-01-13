import * as Sequelize from 'sequelize'
import { OrderQueueStatus } from '@abx-types/order'

export interface OrderQueueStatusInstance extends Sequelize.Instance<OrderQueueStatus>, OrderQueueStatus {}

export default function(sequelize: Sequelize.Sequelize) {
  const options = {
    tableName: 'order_queue_status',
    timestamps: false,
  }

  const orderQueueStatus = sequelize.define<OrderQueueStatusInstance, OrderQueueStatus>(
    'orderQueueStatus',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      symbolId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      processing: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      lastProcessed: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(),
      },
    },
    options,
  )

  return orderQueueStatus
}

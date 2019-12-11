import * as Sequelize from 'sequelize'

export interface ExchangeEvents {
  id?: number
  event: any
  eventName: string
  createdAt?: string
  updatedAt?: string
}

type ExchangeEventsInstance = Sequelize.Instance<ExchangeEvents> & ExchangeEvents
type ExchangeEventsModel = Sequelize.Model<ExchangeEventsInstance, ExchangeEvents>

export default function(sequelize: Sequelize.Sequelize): ExchangeEventsModel {
  return sequelize.define(
    'exchangeEvents',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      event: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      eventName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'exchange_events',
    },
  )
}

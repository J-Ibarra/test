import * as Sequelize from 'sequelize'
import { IExchangeConfigEntry } from '@abx-types/reference-data'

export interface ExchangeConfigInstance extends Sequelize.Instance<IExchangeConfigEntry>, IExchangeConfigEntry {}

export default function(sequelize: Sequelize.Sequelize) {
  const options = {
    tableName: 'exchange_config',
    createdAt: false,
    updatedAt: false,
  }

  return sequelize.define<ExchangeConfigInstance, IExchangeConfigEntry>(
    'exchangeConfig',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      value: {
        type: Sequelize.JSON,
        allowNull: false,
      },
    },
    options,
  )
}

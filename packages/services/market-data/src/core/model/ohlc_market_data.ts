import * as Sequelize from 'sequelize'

import * as constants from '../../config/constants'
import { OHLCMarketData } from '../interface'

export interface OHLCMarketDataInstance extends Sequelize.Instance<OHLCMarketData>, OHLCMarketData {
}

export default function (sequelize: Sequelize.Sequelize) {
  return sequelize.define<OHLCMarketDataInstance, OHLCMarketData>('ohlc_market_data', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    symbolId: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: 'symbol',
        key: 'id',
      }
    },
    open: {
      type: Sequelize.DECIMAL(constants.currencyPrecision, constants.currencyScale),
      allowNull: false,
      get(this: OHLCMarketDataInstance) {
        return parseFloat(this.getDataValue('open')) || 0
      }
    },
    high: {
      type: Sequelize.DECIMAL(constants.currencyPrecision, constants.currencyScale),
      allowNull: false,
      get(this: OHLCMarketDataInstance) {
        return parseFloat(this.getDataValue('high')) || 0
      }
    },
    low: {
      type: Sequelize.DECIMAL(constants.currencyPrecision, constants.currencyScale),
      allowNull: false,
      get(this: OHLCMarketDataInstance) {
        return parseFloat(this.getDataValue('low')) || 0
      }
    },
    close: {
      type: Sequelize.DECIMAL(constants.currencyPrecision, constants.currencyScale),
      allowNull: false,
      get(this: OHLCMarketDataInstance) {
        return parseFloat(this.getDataValue('close')) || 0
      }
    },
    timeFrame: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false
    },
  })
}

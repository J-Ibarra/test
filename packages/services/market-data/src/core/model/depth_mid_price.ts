import * as Sequelize from 'sequelize'

import * as constants from '../../config/constants'
import { DepthMidPrice, OHLCMarketData } from '../interface'

export interface DepthMidPriceInstance extends Sequelize.Instance<DepthMidPrice>, DepthMidPrice {
}

export default function (sequelize: Sequelize.Sequelize) {
  return sequelize.define<DepthMidPriceInstance, OHLCMarketData>('depth_mid_price', {
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
    price: {
      type: Sequelize.DECIMAL(constants.currencyPrecision, constants.currencyScale),
      allowNull: true,
      get(this: DepthMidPriceInstance) {
        return parseFloat(this.getDataValue('price')) || 0
      }
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false
    },
  })
}

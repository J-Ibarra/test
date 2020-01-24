import { Sequelize } from 'sequelize'

import DepthMidPrice from './depth_mid_price'
import OHLCMarketData from './ohlc_market_data'

export default function marketDataModels(sequelize: Sequelize) {
  const ohlcMarketData = OHLCMarketData(sequelize)
  const depthMidPrice = DepthMidPrice(sequelize)

  return {
    ohlcMarketData,
    depthMidPrice
  }
}

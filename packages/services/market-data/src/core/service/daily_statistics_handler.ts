import moment = require('moment')

import { getAllCompleteSymbolDetails } from '../../../symbols'
import { findAndStoreAskAndBidPrices, findAndStoreMidPrices, findAndStoreOrderMatchPrices } from '../repository/daily-statistics'

export const initialisePriceChangeStatistics = async () => {
  const timeFrame = moment()
    .subtract(24, 'hours')
    .toDate()
  const symbols = (await getAllCompleteSymbolDetails()).map(({ id }) => id)

  await findAndStoreOrderMatchPrices(symbols, timeFrame)
  await findAndStoreAskAndBidPrices(symbols)
  await findAndStoreMidPrices(symbols, timeFrame)
}

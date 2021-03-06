import moment = require('moment')

import { getAllCompleteSymbolDetails } from '@abx-service-clients/reference-data'
import { findAndStoreAskAndBidPrices, findAndStoreMidPrices, findAndStoreOrderMatchPrices } from '.'
import { SymbolPairStateFilter } from '@abx-types/reference-data'

export const initialisePriceChangeStatistics = async () => {
  const timeFrame = moment().subtract(24, 'hours').toDate()
  const symbols = (await getAllCompleteSymbolDetails(SymbolPairStateFilter.all)).map(({ id }) => id)

  await findAndStoreOrderMatchPrices(symbols, timeFrame)
  await findAndStoreAskAndBidPrices(symbols)
  await findAndStoreMidPrices(symbols, timeFrame)
}

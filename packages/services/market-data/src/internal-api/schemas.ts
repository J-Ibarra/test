export const getMidPricesForSymbolSchema = {
  type: 'object',
  event: 'get mid prices for symbol',
  properties: {
    symbolId: {
      type: 'string',
      required: true,
    },
    from: {
      type: 'string',
      required: true,
    },
    limit: {
      type: 'number',
      required: false,
    },
    createdAtOrder: {
      type: 'string',
      required: false,
    },
  },
}

export const cleanOldMidPricesSchema = {
  type: 'object',
  event: 'clean old mid prices',
  properties: {},
}

export const reconcileOHCLMarketDataSchema = {
  type: 'object',
  event: 'reconcile OHLC market data for time frame',
  properties: {
    timeFrame: {
      type: 'string',
      required: true,
    },
  },
}

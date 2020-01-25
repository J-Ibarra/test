export const findOrderById = {
  type: 'object',
  'x-persist-event': 'find order by id',
  properties: {
    orderId: {
      type: 'integer',
      required: false,
    },
  },
}

export const findOrderMatch = {
  type: 'object',
  'x-persist-event': 'find order match',
  properties: {
    id: {
      type: 'integer',
      required: false,
    },
    symbolId: {
      type: 'string',
      required: false,
    },
    amount: {
      type: 'integer',
      required: false,
    },
    matchPrice: {
      type: 'integer',
      required: false,
    },
    consideration: {
      type: 'number',
      required: false,
    },
    sellAccountId: {
      type: 'string',
      required: false,
    },
    sellOrderId: {
      type: 'number',
      required: false,
    },
    sellOrderType: {
      type: 'string',
      required: false,
    },
    buyAccountId: {
      type: 'string',
      required: false,
    },
    buyOrderId: {
      type: 'number',
      required: false,
    },
    buyOrderType: {
      type: 'string',
      required: false,
    },
    status: {
      type: 'string',
      required: false,
    },
  },
}

export const findLastOrderMatchForSymbol = {
  type: 'object',
  'x-persist-event': 'find last order match for symbol',
  properties: {
    symbolId: {
      type: 'string',
      required: true,
    },
  },
}

export const findLastOrderMatchForSymbols = {
  type: 'object',
  'x-persist-event': 'find last order match for symbols',
  properties: {
    symbolIds: {
      type: 'array',
      required: true,
    },
  },
}

export const getOpenOrders = {
  type: 'object',
  'x-persist-event': 'get open orders',
  properties: {
    symbolId: {
      type: 'string',
      required: true,
    },
    orderDirection: {
      type: 'string',
      required: true,
    },
    limit: {
      type: 'number',
      required: false,
    },
  },
}

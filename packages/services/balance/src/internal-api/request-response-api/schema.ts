export const emptyPayload = {
  type: 'object',
  properties: {},
}

export const findBalancePayloadSchema = {
  type: 'object',
  'x-persist-event': 'find balance',
  properties: {
    currencyId: {
      type: 'number',
      required: true,
    },
    accountId: {
      type: 'string',
      required: true,
    },
  },
}

export const findAllBalancesForAccountSchema = {
  type: 'object',
  'x-persist-event': 'find all balances for account and currencies',
  properties: {
    accountId: {
      type: 'string',
      required: true,
    },
    currencies: {
      type: 'array',
      required: true,
    },
  },
}

export const retrieveTotalOrderValueReceivedByAccountSchema = {
  type: 'object',
  'x-persist-event': 'retrieve total order value received by account',
  properties: {
    currencyReceivedId: {
      type: 'number',
      required: true,
    },
    accountId: {
      type: 'string',
      required: true,
    },
    tradeTransactionIds: {
      type: 'array',
      required: true,
    },
  },
}

export const getOrderBalanceReserveAdjustmentSchema = {
  type: 'object',
  'x-persist-event': 'get order balance reserve adjustment',
  properties: {
    orderId: {
      type: 'number',
      required: true,
    },
    balanceId: {
      type: 'number',
      required: true,
    },
  },
}

export const getBalanceAdjustmentsForBalanceAndTradeTransactionsSchema = {
  type: 'object',
  'x-persist-event': 'get balance adjustments for balance and trade transactions',
  properties: {
    balanceId: {
      type: 'number',
      required: true,
    },
    tradeTransactionIds: {
      type: 'number',
      required: true,
    },
  },
}

export const findCurrencyBalancesSchema = {
  type: 'object',
  'x-persist-event': 'find currency balances schema',
  properties: {
    accountId: {
      type: 'string',
      required: true,
    },
  },
}

export const findRawBalancePayloadSchema = {
  type: 'object',
  'x-persist-event': 'find raw balance',
  properties: {
    currency: {
      type: 'string',
      required: true,
    },
    accountId: {
      type: 'string',
      required: true,
    },
  },
}

export const balanceChangePayloadSchema = {
  type: 'object',
  'x-persist-event': 'balance change schema',
  properties: {
    sourceEventId: {
      type: 'number',
      required: true,
    },
    sourceEventType: {
      type: 'string',
      required: true,
    },
    currencyId: {
      type: 'number',
      required: true,
    },
    accountId: {
      type: 'string',
      required: true,
    },
    amount: {
      type: 'number',
      required: true,
    },
  },
}

export const createPendingWithdrawalPayloadSchema = {
  type: 'object',
  'x-persist-event': 'create pending withdrawal payload schema',
  properties: {
    pendingWithdrawalParams: {
      type: 'object',
      required: true,
    },
    pendingWithdrawalFeeParams: {
      type: 'object',
      required: false,
    },
  },
}

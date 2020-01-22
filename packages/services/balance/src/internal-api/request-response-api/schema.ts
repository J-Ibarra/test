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
  'x-persist-event': 'find all balances for account',
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

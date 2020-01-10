export const emptyPayload = {
  type: 'object',
  properties: {},
}

export const findBalancePayloadSchema = {
  type: 'object',
  'x-persist-event': 'find balance',
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

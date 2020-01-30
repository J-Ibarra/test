export const findDepositRequestByIdSchema = {
  type: 'object',
  'x-persist-event': 'find deposit request by id payload',
  properties: {
    id: {
      type: 'number',
      required: true,
    },
  },
}

export const findDepositRequestsByIdsSchema = {
  type: 'object',
  'x-persist-event': 'find deposit request by ids payload',
  properties: {
    ids: {
      type: 'array',
      required: true,
    },
  },
}

export const findDepositAddressesForAccountSchema = {
  type: 'object',
  'x-persist-event': 'find deposit addresses for account',
  properties: {
    accountId: {
      type: 'number',
      required: true,
    },
  },
}

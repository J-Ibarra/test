export const saveClientTriggeredFiatWithdrawalAdminRequestSchema = {
  type: 'object',
  properties: {
    accountId: {
      type: 'string',
      required: true,
    },
    currencyCode: {
      type: 'string',
      required: true,
    },
    amount: {
      type: 'number',
      required: true,
    },
    memo: {
      type: 'string',
      required: false,
    },
  },
}

export const findAdminRequestSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
      required: true,
    },
    globalTransactionId: {
      type: 'string',
      required: false,
    },
  },
}

export const updateAdminRequestSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
      required: false,
    },
    update: {
      amount: {
        type: 'number',
        required: false,
      },
      asset: {
        type: 'string',
        required: false,
      },
      description: {
        type: 'string',
        required: false,
      },
      admin: {
        type: 'string',
        required: false,
      },
    },
  },
}

export const findAdminRequestsSchema = {
  type: 'object',
  properties: {
    ids: {
      type: 'array',
      required: true,
    },
  },
}

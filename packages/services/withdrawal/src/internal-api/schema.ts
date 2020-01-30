export const findWithdrawalRequestForTransactionHashSchema = {
  type: 'object',
  properties: {
    txHash: {
      type: 'string',
      required: true,
    },
  },
}

export const findWithdrawalRequestsForTransactionHashesSchema = {
  type: 'object',
  properties: {
    txHashes: {
      type: 'array',
      required: true,
    },
  },
}

export const findWithdrawalRequestByIdSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
      required: true,
    },
  },
}

export const findWithdrawalRequestsByIdsSchema = {
  type: 'object',
  properties: {
    ids: {
      type: 'array',
      required: true,
    },
  },
}

export const getWithdrawalFeeSchema = {
  type: 'object',
  properties: {
    currencyCode: {
      type: 'string',
      required: true,
    },
    withdrawalAmount: {
      type: 'number',
      required: true,
    },
    adminRequestId: {
      type: 'number',
      required: true,
    },
  },
}

export const getWithdrawalFeesSchema = {
  type: 'object',
  properties: {
    currencyCode: {
      type: 'string',
      required: true,
    },
    withdrawalParams: {
      type: 'array',
      required: true,
    },
  },
}

export const completeFiatWithdrawalSchema = {
  type: 'object',
  properties: {
    adminRequestId: {
      type: 'number',
      required: true,
    },
    fee: {
      type: 'number',
      required: true,
    },
  },
}

export const emptyPayload = {
  type: 'object',
  properties: {},
}

export const findOrCreateKinesisRevenueAccountSchema = {
  type: 'object',
  'x-persist-event': 'find or create kinesis revenue account',
  properties: {},
}

export const findOrCreateOperatorAccountSchema = {
  type: 'object',
  'x-persist-event': 'find or create operator account',
  properties: {},
}

export const getAllKycVerifiedAccountIdsSchema = {
  type: 'object',
  'x-persist-event': 'get all kyc verified account ids schema',
  properties: {},
}

export const isAccountSuspendedSchema = {
  type: 'object',
  'x-persist-event': 'is account suspended',
  properties: {
    accountId: {
      type: 'string',
      required: true,
    },
  },
}

export const findAccountByIdSchema = {
  type: 'object',
  'x-persist-event': 'find account by id',
  properties: {
    accountId: {
      type: 'string',
      required: true,
    },
  },
}

export const findAccountWithUserDetailsSchema = {
  type: 'object',
  'x-persist-event': 'find account with user details',
  properties: {
    id: {
      type: 'string',
      required: false,
    },
    hin: {
      type: 'string',
      required: false,
    },
  },
}

export const findUserByAccountIdSchema = {
  type: 'object',
  'x-persist-event': 'find user by account id',
  properties: {
    accountId: {
      type: 'string',
      required: true,
    },
  },
}

export const findUsersByAccountIdSchema = {
  type: 'object',
  'x-persist-event': 'find users by account id schema',
  properties: {
    accountIds: {
      type: 'array',
      required: true,
    },
  },
}

export const findAccountsByIdWithUserDetailsSchema = {
  type: 'object',
  'x-persist-event': 'find accounts by user ids',
  properties: {
    accountIds: {
      type: 'array',
      required: true,
    },
  },
}

export const findUsersByAccountId = {
  type: 'object',
  'x-persist-event': 'find users by account id',
  properties: {
    accountId: {
      type: 'string',
      required: true,
    },
  },
}

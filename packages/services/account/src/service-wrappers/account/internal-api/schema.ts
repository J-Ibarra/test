export const emptyPayload = {
  type: 'object',
  properties: {},
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

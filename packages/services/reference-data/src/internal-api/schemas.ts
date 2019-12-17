export const emptyPayload = {
  type: 'object',
  properties: {},
}

export const findBoundaryForCurrency = {
  type: 'object',
  'x-persist-event': 'find boundary for currency',
  properties: {
    currency: {
      type: 'string',
      required: true,
    },
  },
}

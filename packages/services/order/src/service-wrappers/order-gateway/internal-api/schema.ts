import { OrderDirection, OrderValidity, OrderType } from '@abx-types/order'

export let marketOrderMessage = {
  type: 'object',
  'x-persist-event': 'place market order',
  properties: {
    accountId: {
      type: 'string',
      required: true,
    },
    direction: {
      enum: [OrderDirection.buy, OrderDirection.sell],
      required: true,
    },
    symbolId: {
      type: 'string',
      required: true,
    },
    amount: {
      type: 'number',
      required: true,
      minimum: 0.0000001,
    },
    orderType: {
      enum: [OrderType.market],
      required: true,
    },
    validity: {
      enum: [OrderValidity.GTC],
      required: true,
    },
    clientOrderId: {
      format: 'string',
      required: false,
    },
  },
}

export let limitOrderMessage = {
  type: 'object',
  'x-persist-event': 'place limit order',
  properties: {
    accountId: {
      type: 'string',
      required: true,
    },
    direction: {
      enum: [OrderDirection.buy, OrderDirection.sell],
      required: true,
    },
    symbolId: {
      type: 'string',
      required: true,
    },
    amount: {
      type: 'number',
      required: true,
      minimum: 0.0000001,
    },
    limitPrice: {
      type: 'number',
      required: true,
      minimum: 0.0000001,
    },
    orderType: {
      enum: [OrderType.limit],
      required: true,
    },
    validity: {
      enum: [OrderValidity.GTC, OrderValidity.GTD],
      required: true,
    },
    expiryDate: {
      format: 'date-time',
      required: false,
    },
    clientOrderId: {
      format: 'string',
      required: false,
    },
  },
}

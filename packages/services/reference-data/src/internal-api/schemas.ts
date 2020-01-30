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

export const isFeatureFlagEnabledSchema = {
  type: 'object',
  'x-persist-event': 'is feature flag enabled',
  properties: {
    flag: {
      type: 'string',
      required: true,
    },
  },
}

export const getExchangeHoldingsWalletsSchema = {
  ...emptyPayload,
  'x-persist-event': 'get exchange holdings wallet',
}

export const getTransactionFeeCapsSchema = {
  ...emptyPayload,
  'x-persist-event': 'get transaction fee caps',
}

export const getExchangeDepositPollingFrequencySchema = {
  ...emptyPayload,
  'x-persist-event': 'get exchange deposit polling frequency',
}

export const getVatRateSchema = {
  ...emptyPayload,
  'x-persist-event': 'get VAT rate',
}

export const getWithdrawalConfigForCurrencySchema = {
  type: 'object',
  'x-persist-event': 'get withdrawal config for currency',
  properties: {
    currencyCode: {
      type: 'string',
      required: false,
    },
  },
}

export const getWithdrawalConfigSchema = {
  ...emptyPayload,
  'x-persist-event': 'get withdrawal config schema',
}

export const getWithdrawalLimitSchema = {
  type: 'object',
  'x-persist-event': 'get withdrawal limit schema',
  properties: {
    accountType: {
      type: 'string',
      required: true,
    },
  },
}

export const getOperationsEmailSchema = {
  ...emptyPayload,
  'x-persist-event': 'get withdrawal email schema',
}

export const getEthereumDepositMaxBlockCheckSchema = {
  ...emptyPayload,
  'x-persist-event': 'get eth deposit max block schema',
}

export const getExcludedAccountTypesFromOrderRangeValidationsSchema = {
  ...emptyPayload,
  'x-persist-event': 'get excluded account types from order range validations',
}

export const getBoundariesForCurrenciesSchema = {
  type: 'object',
  'x-persist-event': 'get boundaries for currencies',
  properties: {
    currencies: {
      type: 'array',
      required: true,
    },
  },
}

export const getSymbolBoundariesSchema = {
  type: 'object',
  'x-persist-event': 'get symbol boundaries',
  properties: {
    symbolId: {
      type: 'string',
      required: true,
    },
  },
}

import { CurrencySetupParams } from './setup.utils'
import { CurrencyCode } from '@abx-types/reference-data'

export const ETH: CurrencySetupParams = {
  id: 1,
  currency: CurrencyCode.ethereum,
  boundary: {
    minAmount: 0.00001,
    maxDecimals: 6,
  },
}

export const USD: CurrencySetupParams = {
  id: 2,
  currency: CurrencyCode.usd,
  boundary: {
    minAmount: 0.01,
    maxDecimals: 2,
  },
}

export const EUR: CurrencySetupParams = {
  id: 3,
  currency: CurrencyCode.usd,
  boundary: {
    minAmount: 0.01,
    maxDecimals: 2,
  },
}

export const KAU: CurrencySetupParams = {
  id: 4,
  currency: CurrencyCode.kau,
  boundary: {
    minAmount: 0.000001,
    maxDecimals: 6,
  },
}

export const KAG: CurrencySetupParams = {
  id: 5,
  currency: CurrencyCode.kag,
  boundary: {
    minAmount: 0.000001,
    maxDecimals: 6,
  },
}

export const KVT: CurrencySetupParams = {
  id: 6,
  currency: CurrencyCode.kvt,
  boundary: {
    minAmount: 1,
    maxDecimals: 0,
  },
}

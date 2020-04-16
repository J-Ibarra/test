import Decimal from 'decimal.js'
import { CurrencyCode } from '@abx-types/reference-data'

export const ETH_MINIMUM_DEPOSIT_AMOUNT = 0.00042
export const KAU_KAG_MINIMUM_DEPOSIT_AMOUNT = 0.00001
export const KVT_MINIMUM_DEPOSIT_AMOUNT = 1
export const BTC_MINIMUM_DEPOSIT_AMOUNT = 0.0002
export const USDT_MINIMUM_DEPOSIT_AMOUNT = 0.5

// These Values can be found in confluence
export const minimumDepositAmountDictionary = {
  [CurrencyCode.ethereum]: ETH_MINIMUM_DEPOSIT_AMOUNT,
  [CurrencyCode.kag]: KAU_KAG_MINIMUM_DEPOSIT_AMOUNT,
  [CurrencyCode.kau]: KAU_KAG_MINIMUM_DEPOSIT_AMOUNT,
  [CurrencyCode.bitcoin]: BTC_MINIMUM_DEPOSIT_AMOUNT,
  [CurrencyCode.tether]: USDT_MINIMUM_DEPOSIT_AMOUNT,
}

export function depositAmountAboveMinimumForCurrency(amount: number, currency: CurrencyCode) {
  return new Decimal(amount).greaterThanOrEqualTo(getMinimumDepositAmountForCurrency(currency))
}

export const getMinimumDepositAmountForCurrency = (currency: CurrencyCode) => minimumDepositAmountDictionary[currency]

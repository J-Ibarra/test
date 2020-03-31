import Decimal from 'decimal.js'
import { CurrencyCode } from '@abx-types/reference-data'

// These Values can be found in confluence
export const ETH_MINIMUM_DEPOSIT_AMOUNT = 0.00042
const KAU_KAG_MINIMUM_DEPOSIT_AMOUNT = 0.00001
const KVT_MINIMUM_DEPOSIT_AMOUNT = 1
export const BTC_MINIMUM_DEPOSIT_AMOUNT = 0.0002
export const USDT_MINIMUM_DEPOSIT_AMOUNT = 0.5
export const YEENUS_MINIMUM_DEPOSIT_AMOUNT = 0.5

export function depositAmountAboveMinimumForCurrency(amount: number, currency: CurrencyCode) {
  return new Decimal(amount).greaterThanOrEqualTo(getMinimumDepositAmountForCurrency(currency))
}

export function getMinimumDepositAmountForCurrency(currency: CurrencyCode) {
  switch (currency) {
    case CurrencyCode.ethereum:
      return ETH_MINIMUM_DEPOSIT_AMOUNT
    case CurrencyCode.kag:
    case CurrencyCode.kau:
      return KAU_KAG_MINIMUM_DEPOSIT_AMOUNT
    case CurrencyCode.kvt:
      return KVT_MINIMUM_DEPOSIT_AMOUNT
    case CurrencyCode.bitcoin:
      return BTC_MINIMUM_DEPOSIT_AMOUNT
    case CurrencyCode.tether:
      return USDT_MINIMUM_DEPOSIT_AMOUNT
    case CurrencyCode.yeenus:
      return YEENUS_MINIMUM_DEPOSIT_AMOUNT
    default:
      return 0
  }
}

import Decimal from 'decimal.js'
import { CurrencyCode } from '@abx-types/reference-data'

// These Values can be found in confluence
export const ETH_MINIMUM_DEPOSIT_AMOUNT = 0.00042
const KAU_KAG_MINIMUM_DEPOSIT_AMOUNT = 0.00001
const KVT_MINIMUM_DEPOSIT_AMOUNT = 1

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
    default:
      return 0
  }
}

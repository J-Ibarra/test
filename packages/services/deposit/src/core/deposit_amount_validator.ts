import Decimal from 'decimal.js'
import { getDepositMinimumAmountForCurrency } from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'

export async function depositAmountAboveMinimumForCurrency(amount: number, currency: CurrencyCode) {
  const depositMinimumAmount = await getDepositMinimumAmountForCurrency(currency)
  return new Decimal(amount).greaterThanOrEqualTo(depositMinimumAmount)
}

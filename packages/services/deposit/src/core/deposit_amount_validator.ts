import Decimal from 'decimal.js'
import { getDepositMimimumAmountForCurrency } from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'

export async function depositAmountAboveMinimumForCurrency(amount: number, currency: CurrencyCode) {
  const depositMinimumAmount = await getDepositMimimumAmountForCurrency(currency)
  return new Decimal(amount).greaterThanOrEqualTo(depositMinimumAmount)
}
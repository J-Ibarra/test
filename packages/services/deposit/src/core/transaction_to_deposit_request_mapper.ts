import Decimal from 'decimal.js'
import { truncateCurrencyDecimals } from '@abx-service-clients/reference-data'
import { CurrencyBoundary, FiatCurrency } from '@abx-types/reference-data'
import { DepositAddress, DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { DepositTransaction } from '@abx-utils/blockchain-currency-gateway'
import { depositAmountAboveMinimumForCurrency } from './deposit_amount_validator'

export const FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION = FiatCurrency.usd

export async function convertTransactionToDepositRequest(
  depositAddress: DepositAddress,
  depositTransaction: DepositTransaction,
  fiatValueOfOneCryptoCurrency: number,
  currencyBoundary: CurrencyBoundary,
  desiredStatus: DepositRequestStatus = DepositRequestStatus.pendingHoldingsTransaction,
  existingDepositRequestsWithInsufficientAmount: DepositRequest[] = [],
) {
  const truncateToCurrencyDP = truncateCurrencyDecimals(currencyBoundary) as any
  const truncatedAmount = truncateToCurrencyDP(depositTransaction.amount)
  const isDepositAmountAboveMinimumForCurrency = await depositAmountAboveMinimumForCurrency(truncatedAmount, currencyBoundary.currencyCode)

  const existingDepositInsufficientAmount = existingDepositRequestsWithInsufficientAmount.reduce(
    (acc, { amount, status }) => (status === DepositRequestStatus.insufficientAmount ? acc.plus(amount) : acc),
    new Decimal(0),
  )

  let status = desiredStatus
  if (!isDepositAmountAboveMinimumForCurrency && existingDepositInsufficientAmount.greaterThan(0)) {
    const sufficientTotalDepositBalance = await depositAmountAboveMinimumForCurrency(
      truncateToCurrencyDP(existingDepositInsufficientAmount.plus(depositTransaction.amount).toNumber()),
      currencyBoundary.currencyCode,
    )

    status = sufficientTotalDepositBalance ? desiredStatus : DepositRequestStatus.insufficientAmount
  }

  return {
    depositAddress,
    from: depositTransaction.from,
    amount: truncatedAmount,
    depositTxHash: depositTransaction.txHash,
    fiatCurrencyCode: FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION,
    fiatConversion: new Decimal(truncatedAmount).times(fiatValueOfOneCryptoCurrency).toNumber(),
    status,
  } as DepositRequest
}

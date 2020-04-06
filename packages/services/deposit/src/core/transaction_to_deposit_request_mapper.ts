import Decimal from 'decimal.js'
import { truncateCurrencyDecimals } from '@abx-service-clients/reference-data'
import { CurrencyBoundary, FiatCurrency } from '@abx-types/reference-data'
import { DepositAddress, DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { DepositTransaction } from '@abx-utils/blockchain-currency-gateway'

export const FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION = FiatCurrency.usd

export function convertTransactionToDepositRequest(
  depositAddress: DepositAddress,
  depositTransaction: DepositTransaction,
  fiatValueOfOneCryptoCurrency: number,
  currencyBoundary: CurrencyBoundary,
) {
  const truncateToCurrencyDP = truncateCurrencyDecimals(currencyBoundary) as any
  const truncatedAmount = truncateToCurrencyDP(depositTransaction.amount)

  return {
    depositAddress,
    from: depositTransaction.from,
    amount: truncatedAmount,
    depositTxHash: depositTransaction.txHash,
    fiatCurrencyCode: FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION,
    fiatConversion: new Decimal(truncatedAmount).times(fiatValueOfOneCryptoCurrency).toNumber(),
    status: DepositRequestStatus.pendingHoldingsTransaction,
  } as DepositRequest
}
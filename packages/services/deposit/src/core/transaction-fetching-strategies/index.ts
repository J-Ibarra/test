import { findBoundaryForCurrency, truncateCurrencyDecimals } from '@abx-service-clients/reference-data'
import { CurrencyManager, DepositTransactionWithFiatConversion } from '@abx-query-libs/blockchain-currency-gateway'
import { DepositAddress } from '../../../interfaces'
import { fetchTransactionsForEachDepositAddress } from './fetch_for_each_address'

export interface TransactionRetrievalResult {
  success: boolean
  payload: {
    depositAddress: DepositAddress
    depositTransactions?: DepositTransactionWithFiatConversion[]
  }
}

export async function fetchTransactionsForDepositAddresses(
  manager: CurrencyManager,
  depositAddresses: DepositAddress[],
  fiatValueOfOneCryptoCurrency: number,
): Promise<TransactionRetrievalResult[]> {
  if (depositAddresses.length === 0) {
    return []
  }

  const currency = await manager.getCurrencyFromId(depositAddresses[0].currencyId)
  const currencyBoundary = await findBoundaryForCurrency(currency.ticker!)
  const truncateToCurrencyDP = truncateCurrencyDecimals(currencyBoundary)

  return fetchTransactionsForEachDepositAddress({
    currency,
    depositAddresses,
    fiatValueOfOneCryptoCurrency,
    truncateToCurrencyDP: truncateToCurrencyDP as any,
  })
}

export * from './fetch_for_each_address'
export * from './fetch_once_at_the_start'
export * from './new_transactions_retriever'

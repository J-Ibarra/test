import { findBoundaryForCurrency, truncateCurrencyDecimals } from '@abx-service-clients/reference-data'
import { DepositAddress } from '@abx-types/deposit'
import { fetchTransactionsForEachDepositAddress } from './fetch_for_each_address'
import { DepositTransactionWithFiatConversion, CurrencyManager } from '@abx-utils/blockchain-currency-gateway'

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
  const truncateToCurrencyDP = truncateCurrencyDecimals(currencyBoundary) as any

  return fetchTransactionsForEachDepositAddress({
    currency,
    depositAddresses,
    fiatValueOfOneCryptoCurrency,
    truncateToCurrencyDP,
  })
}

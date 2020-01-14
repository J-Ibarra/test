import { Logger } from '@abx/logging'
import { CurrencyManager } from '@abx-query-libs/blockchain-currency-gateway'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'
import { FiatCurrency } from '@abx-types/reference-data'
import { findCurrencyForId } from '@abx-service-clients/reference-data'
import { DepositAddress, DepositRequest, DepositRequestStatus } from '../../interfaces'
import { fetchTransactionsForDepositAddresses } from './transaction-fetching-strategies'

const logger = Logger.getInstance('deposit_transactions_fetcher', 'getPotentialDepositRequests')
export const FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION = FiatCurrency.usd

export async function getPotentialDepositRequests(manager: CurrencyManager, depositAddresses: DepositAddress[]): Promise<DepositRequest[]> {
  const { code: currencyCode } = await findCurrencyForId(depositAddresses[0].currencyId)
  const fiatValueOfOneCryptoCurrency = await calculateRealTimeMidPriceForSymbol(`${currencyCode}_${FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION}`)

  const newTransactionsForAddressesResults = await fetchTransactionsForDepositAddresses(manager, depositAddresses, fiatValueOfOneCryptoCurrency)

  const newTransactionRetrievalFailures = newTransactionsForAddressesResults.filter(({ success }) => !success)
  if (newTransactionRetrievalFailures.length > 0) {
    logger.warn(
      `${
        newTransactionRetrievalFailures.length
      } failures while attempting to retrieve new transactions, failed addresses: ${newTransactionRetrievalFailures
        .map(({ payload }) => payload.depositAddress.id)
        .join(',')}`,
    )
  }

  return newTransactionsForAddressesResults.reduce(
    (agg: DepositRequest[], { payload: { depositAddress, depositTransactions = [] } }) =>
      agg.concat(
        depositTransactions.map(dt => ({
          ...dt,
          status: DepositRequestStatus.pendingHoldingsTransaction,
          depositAddress,
        })),
      ),
    [],
  )
}

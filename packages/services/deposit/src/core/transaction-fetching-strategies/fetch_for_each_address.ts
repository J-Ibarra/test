import Decimal from 'decimal.js'
import util from 'util'
import { TransactionRetrievalResult } from '.'
import { CurrencyBoundary, CurrencyCode, FiatCurrency } from '@abx-types/reference-data'
import { Logger } from '@abx/logging'
import { OnChainCurrencyGateway } from '@abx-query-libs/blockchain-currency-gateway'
import { DepositAddress } from '@abx-types/deposit'
import { getDepositMinimumForCurrency } from '../deposit_request'
import { getDepositTransactionAndRecordLastSeenTransaction } from './new_transactions_retriever'

const logger = Logger.getInstance('deposit_transactions_fetcher', 'getPotentialDepositRequests')
export const FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION = FiatCurrency.usd

export async function fetchTransactionsForEachDepositAddress(params: {
  depositAddresses: DepositAddress[]
  fiatValueOfOneCryptoCurrency: number
  currency: OnChainCurrencyGateway
  truncateToCurrencyDP: (amount: number) => number
}): Promise<TransactionRetrievalResult[]> {
  const { depositAddresses, fiatValueOfOneCryptoCurrency, currency, truncateToCurrencyDP } = params

  return Promise.all(
    depositAddresses.map(depositAddress =>
      getNewTransactionForAddress({
        currency,
        depositAddress,
        fiatValueOfOneCryptoCurrency,
        truncateToCurrencyDP,
      }),
    ),
  )
}

async function getNewTransactionForAddress(params: {
  currency: OnChainCurrencyGateway
  depositAddress: DepositAddress
  fiatValueOfOneCryptoCurrency: number
  truncateToCurrencyDP: (amount: number) => number
}): Promise<TransactionRetrievalResult> {
  const { currency, depositAddress, fiatValueOfOneCryptoCurrency, truncateToCurrencyDP } = params

  const address = depositAddress.publicKey

  try {
    const balanceAtAddress = await currency.balanceAt(address)
    const minimumForCurrency = getDepositMinimumForCurrency(currency.ticker)

    if (balanceAtAddress > minimumForCurrency) {
      logger.debug(
        `Balance for address: ${address} for currency: ${currency.ticker} is greater than the minimum (${minimumForCurrency}${currency.ticker}), proceeding with a deposit`,
      )

      const depositTransactions = await getDepositTransactionAndRecordLastSeenTransaction(
        (onChainCurrency, lastSeenTxHash) => onChainCurrency.getDepositTransactions(address, lastSeenTxHash),
        currency,
      )
      logger.debug(`${depositTransactions.length} deposit transactions found for address ${address} and currency ${currency.ticker}`)

      return {
        success: true,
        payload: {
          depositAddress,
          depositTransactions: depositTransactions.map(({ amount, from, txHash }) => {
            const truncatedAmount = truncateToCurrencyDP(amount)
            return {
              from,
              amount: truncatedAmount,
              depositTxHash: txHash,
              fiatCurrencyCode: FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION,
              fiatConversion: new Decimal(truncatedAmount).times(fiatValueOfOneCryptoCurrency).toNumber(),
            }
          }),
        },
      }
    }
  } catch (error) {
    logger.error(`Error when getting deposit request for currency: ${currency.ticker} at address: ${address}`)
    logger.error(JSON.stringify(util.inspect(error)))
    return { success: false, payload: { depositAddress } }
  }

  return { success: true, payload: { depositAddress, depositTransactions: [] } }
}

function truncateAmountDecimal(amount: number, currencyCode: CurrencyCode, currencyBoundary: CurrencyBoundary) {
  if (currencyCode === CurrencyCode.ethereum) {
    return new Decimal(amount).toDP(currencyBoundary.maxDecimals, Decimal.ROUND_DOWN).toNumber()
  }

  return amount
}

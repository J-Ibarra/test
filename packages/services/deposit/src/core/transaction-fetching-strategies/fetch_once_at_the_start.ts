import Decimal from 'decimal.js'

import { TransactionRetrievalResult } from '.'
import { Logger } from '@abx/logging'
import { DepositTransaction, DepositTransactionWithFiatConversion, OnChainCurrencyGateway } from '@abx-query-libs/blockchain-currency-gateway'
import { FiatCurrency } from '@abx-types/reference-data'
import { DepositAddress } from '../../../interfaces'
import { getDepositTransactionAndRecordLastSeenTransaction } from './new_transactions_retriever'

const logger = Logger.getInstance('fetch_once_at_the_start', 'fetchTransactionsForEachDepositAddress')
const FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION = FiatCurrency.usd
export type AmountTruncationFunction = (amount: number) => number

export async function fetchAllNewTransactionsUpfront(params: {
  depositAddresses: DepositAddress[]
  fiatValueOfOneCryptoCurrency: number
  currency: OnChainCurrencyGateway
  truncateToCurrencyDP: AmountTruncationFunction
}): Promise<TransactionRetrievalResult[]> {
  const { currency, depositAddresses, fiatValueOfOneCryptoCurrency, truncateToCurrencyDP } = params

  let latestTransactions: DepositTransaction[]
  try {
    latestTransactions = await getDepositTransactionAndRecordLastSeenTransaction(
      (onChainCurrency, lastSeenTxHash) => onChainCurrency.getLatestTransactions(lastSeenTxHash),
      currency,
    )
    logger.debug(`Retrieved ${latestTransactions.length} new transactions  for ${currency.ticker}`)
  } catch (error) {
    logger.error(`Error when getting latest transactions for currency: ${currency.ticker}`)
    logger.error(JSON.stringify(error))

    latestTransactions = []
  }

  const transactionTargetAddressToTransaction = latestTransactions.reduce((acc, depositTransaction) => {
    const currentTransactionToAddress = acc.get(depositTransaction.to) || []

    return acc.set(depositTransaction.to, currentTransactionToAddress.concat(depositTransaction))
  }, new Map())

  return depositAddresses.map(depositAddress =>
    getNewTransactionForAddress({
      depositAddress,
      transactionTargetAddressToTransaction,
      fiatValueOfOneCryptoCurrency,
      truncateAmount: truncateToCurrencyDP,
    }),
  )
}

function getNewTransactionForAddress(params: {
  depositAddress: DepositAddress
  transactionTargetAddressToTransaction: Map<string, DepositTransaction[]>
  fiatValueOfOneCryptoCurrency: number
  truncateAmount: AmountTruncationFunction
}): TransactionRetrievalResult {
  const { depositAddress, transactionTargetAddressToTransaction, fiatValueOfOneCryptoCurrency, truncateAmount } = params

  const depositTransactionsForAddress = transactionTargetAddressToTransaction.get(depositAddress.publicKey) || []

  return {
    success: true,
    payload: {
      depositAddress,
      depositTransactions: depositTransactionsForAddress.map(transaction =>
        createDepositTransaction(transaction, fiatValueOfOneCryptoCurrency, truncateAmount),
      ),
    },
  }
}

export function createDepositTransaction(
  depositTransaction: DepositTransaction,
  fiatValueOfOneCryptoCurrency: number,
  truncateAmount: AmountTruncationFunction,
): DepositTransactionWithFiatConversion {
  const truncatedAmount = truncateAmount(depositTransaction.amount)
  return {
    from: depositTransaction.from,
    amount: truncatedAmount,
    depositTxHash: depositTransaction.txHash,
    fiatCurrencyCode: FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION,
    fiatConversion: new Decimal(truncatedAmount).times(fiatValueOfOneCryptoCurrency).toNumber(),
  }
}

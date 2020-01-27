import { Logger } from '@abx-utils/logging'
import { DepositTransaction, OnChainCurrencyGateway } from '@abx-query-libs/blockchain-currency-gateway'
import * as LastDepositHashRecorder from '../framework/deposit_hash_recorder/last_deposit_hash_recorder'

const logger = Logger.getInstance('new_transactions_retriever', 'getDepositTransactionAndRecordLastSeenTransaction')

export async function getDepositTransactionAndRecordLastSeenTransaction(
  transactionRetrievalFunction: (currency: OnChainCurrencyGateway, lastSeenTxHash?: string) => Promise<DepositTransaction[]>,
  currency: OnChainCurrencyGateway,
): Promise<DepositTransaction[]> {
  const lastSeenTransactionHash = LastDepositHashRecorder.getLastSeenTransactionHash(currency.ticker)
  const depositTransactions = await transactionRetrievalFunction(currency, lastSeenTransactionHash)

  if (depositTransactions.length > 0 && depositTransactions[0].txHash !== lastSeenTransactionHash) {
    logger.debug(`Persisting new last seen transaction hash for currency ${currency.ticker}`)

    await LastDepositHashRecorder.saveTransactionHash(currency.ticker, depositTransactions[0].txHash)
  }

  return depositTransactions
}

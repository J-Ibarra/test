import { orderBy } from 'lodash'
import { Logger } from '@abx/logging'
import { CurrencyCode, Currency, SymbolPair } from '@abx-types/reference-data'
import { TradeTransaction, TransactionDirection, CurrencyTransaction } from '@abx-types/order'
import { TransactionHistory } from './model'
import { formDepositCurrencyTransactionToHistory, formTradeTransactionToHistory, formWithdrawalCurrencyTransactionToHistory } from './'
import { findCurrencyTransactionForAccountAndCurrency, findTradeTransactionForAccountAndSymbols } from '../../../../core'
import { getAllCompleteSymbolDetails, getAllCurrencyBoundaries } from '@abx-service-clients/reference-data'
import { findWithdrawalRequestsByIds } from '@abx-service-clients/withdrawal'

const logger = Logger.getInstance('transaction', 'transaction_history')

export async function getAccountTransactionHistory(accountId: string, selectedCurrencyCode: CurrencyCode): Promise<TransactionHistory[]> {
  logger.debug(`Creating transaction history for ${accountId}`)
  const allSymbols = await getAllCompleteSymbolDetails()
  const allCurrencyBoundaries = await getAllCurrencyBoundaries()
  const selectedSymbols = allSymbols.filter(symbol => symbol.base.code === selectedCurrencyCode || symbol.quote.code === selectedCurrencyCode)

  const selectedSymbolIds = selectedSymbols.map(symbol => symbol.id)
  const tradeTransactionsPromise = findTradeTransactionForAccountAndSymbols(accountId, selectedSymbolIds)
  const currencyTransactionsPromise = findCurrencyTransactionForAccountAndCurrency(accountId, selectedCurrencyCode)
  const [tradeTransactions, currencyTransactions] = await Promise.all([tradeTransactionsPromise, currencyTransactionsPromise])

  const tradeTransactionsToHistory = tradeTransactions.reduce((acc: Array<TransactionHistory>, tradeTransaction: TradeTransaction) => {
    return acc.concat(formTradeTransactionToHistory(tradeTransaction, selectedCurrencyCode, allSymbols, Object.values(allCurrencyBoundaries)))
  }, [])

  const depositAndWithdrawalTransactions = await createDepositAndWithdrawalTransactions(currencyTransactions, selectedCurrencyCode, allSymbols)
  const existingTransactionHistories = [...tradeTransactionsToHistory, ...depositAndWithdrawalTransactions].filter(Boolean)

  return orderBy(existingTransactionHistories, history => history.createdAt, ['desc'])
}

async function createDepositAndWithdrawalTransactions(
  currencyTransactions: CurrencyTransaction[],
  selectedCurrencyCode: CurrencyCode,
  allSymbols: SymbolPair[],
) {
  const depositTransactionsToAdd = currencyTransactions.filter(({ direction }) => direction === TransactionDirection.deposit)
  const withdrawalTransactionsToAdd = currencyTransactions.filter(({ direction }) => direction === TransactionDirection.withdrawal)
  const withdrawaRequests = await findWithdrawalRequestsByIds(withdrawalTransactionsToAdd.map(({ id }) => id!))

  const [depositTransactionHistoryItems, withdrawalRequestTransactionHistoryItems] = await Promise.all([
    Promise.all(
      depositTransactionsToAdd.map(currencyTransaction =>
        formDepositCurrencyTransactionToHistory(
          currencyTransaction,
          selectedCurrencyCode,
          allSymbols.reduce((acc, { base, quote }) => acc.concat([base, quote]), [] as Currency[]),
        ),
      ),
    ),
    Promise.all(withdrawalTransactionsToAdd.map(transaction => formWithdrawalCurrencyTransactionToHistory(transaction, selectedCurrencyCode))),
  ])

  return depositTransactionHistoryItems.concat(withdrawalRequestTransactionHistoryItems)
}

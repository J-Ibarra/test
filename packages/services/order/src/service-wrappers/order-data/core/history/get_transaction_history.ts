import { orderBy } from 'lodash'
import { Logger } from '@abx/logging'
import { CurrencyCode, Currency } from '@abx-types/reference-data'
import { TradeTransaction, TransactionDirection } from '@abx-types/order'
import { TransactionHistory } from './model'
import { formDepositCurrencyTransactionToHistory, formTradeTransactionToHistory, formWithdrawalCurrencyTransactionToHistory } from './'
import { findCurrencyTransactionForAccountAndCurrency, findTradeTransactionForAccountAndSymbols } from '../../../../core'
import { getAllCompleteSymbolDetails, getAllCurrencyBoundaries } from '@abx-service-clients/reference-data'

const logger = Logger.getInstance('transaction', 'transaction_history')

export async function getAccountTransactionHistory(accountId: string, selectedCurrencyCode: CurrencyCode): Promise<TransactionHistory[]> {
  logger.debug(`Creating transaction history for ${accountId}`)
  const allSymbols = await getAllCompleteSymbolDetails()
  const allCurrencyBoundaries = await getAllCurrencyBoundaries()
  const selectedSymbols = allSymbols.filter(symbol => symbol.base.code === selectedCurrencyCode || symbol.quote.code === selectedCurrencyCode)

  const currencyTransactionsPromise = findCurrencyTransactionForAccountAndCurrency(accountId, selectedCurrencyCode)

  const selectedSymbolIds = selectedSymbols.map(symbol => symbol.id)
  const tradeTransactionsPromise = findTradeTransactionForAccountAndSymbols(accountId, selectedSymbolIds)

  const [tradeTransactions, currencyTransactions] = await Promise.all([tradeTransactionsPromise, currencyTransactionsPromise])

  const tradeTransactionsToHistory = tradeTransactions.reduce((acc: Array<Promise<TransactionHistory>>, tradeTransaction: TradeTransaction) => {
    return acc.concat(formTradeTransactionToHistory(tradeTransaction, selectedCurrencyCode, allSymbols, Object.values(allCurrencyBoundaries)))
  }, [])

  const depositTransactionsToAdd = currencyTransactions.filter(({ direction }) => direction === TransactionDirection.deposit)
  const withdrawalTransactionsToAdd = currencyTransactions.filter(({ direction }) => direction === TransactionDirection.withdrawal)

  // TODO
  // USE THE TRANSACTIONS ABOVE TO BUILD HISTORY MORE EFFICIENTLY

  const currencyTransactionToHistory = currencyTransactions.map(currencyTransaction => {
    if (currencyTransaction.direction === TransactionDirection.deposit) {
      return formDepositCurrencyTransactionToHistory(
        currencyTransaction,
        selectedCurrencyCode,
        allSymbols.reduce((acc, { base, quote }) => acc.concat([base, quote]), [] as Currency[]),
      )
    } else {
      return formWithdrawalCurrencyTransactionToHistory(currencyTransaction, selectedCurrencyCode)
    }
  })

  const transactionHistories = await Promise.all([...tradeTransactionsToHistory, ...currencyTransactionToHistory])

  const existingTransactionHistories = transactionHistories.filter(Boolean)

  return orderBy(existingTransactionHistories, history => history.createdAt, ['desc'])
}

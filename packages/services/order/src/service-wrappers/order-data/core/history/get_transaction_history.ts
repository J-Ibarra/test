import { Logger } from '@abx-utils/logging'
import { CurrencyCode, Currency, SymbolPairStateFilter } from '@abx-types/reference-data'
import { TradeTransaction, TransactionDirection, CurrencyTransaction } from '@abx-types/order'
import { TransactionHistory } from './model'
import { formTradeTransactionToHistory } from './'
import { findCurrencyTransactionForAccountAndCurrency, findTradeTransactionForAccountAndSymbols } from '../../../../core'
import { getAllCompleteSymbolDetails, getAllCurrencyBoundaries, findAllCurrencies } from '@abx-service-clients/reference-data'
import { buildDepositTransactionHistory } from './form_deposit_currency_transaction'
import { buildWithdrawalTransactionHistory } from './form_withdrawal_currency_transaction'
import moment from 'moment'

const logger = Logger.getInstance('transaction', 'transaction_history')

export async function getAccountTransactionHistory(accountId: string, selectedCurrencyCode: CurrencyCode): Promise<TransactionHistory[]> {
  logger.debug(`Creating transaction history for ${accountId}`)
  const [allSymbols, allCurrencies] = await Promise.all([
    getAllCompleteSymbolDetails(SymbolPairStateFilter.all),
    findAllCurrencies(SymbolPairStateFilter.all),
  ])
  const allCurrencyBoundaries = await getAllCurrencyBoundaries()
  const selectedSymbols = allSymbols.filter(symbol => symbol.base.code === selectedCurrencyCode || symbol.quote.code === selectedCurrencyCode)

  const selectedSymbolIds = selectedSymbols.map(symbol => symbol.id)
  const tradeTransactionsPromise = findTradeTransactionForAccountAndSymbols(accountId, selectedSymbolIds)
  const currencyTransactionsPromise = findCurrencyTransactionForAccountAndCurrency(accountId, selectedCurrencyCode)
  const [tradeTransactions, currencyTransactions] = await Promise.all([tradeTransactionsPromise, currencyTransactionsPromise])

  const tradeTransactionsToHistory = tradeTransactions.reduce((acc: Array<TransactionHistory>, tradeTransaction: TradeTransaction) => {
    return acc.concat(formTradeTransactionToHistory(tradeTransaction, selectedCurrencyCode, allSymbols, Object.values(allCurrencyBoundaries)))
  }, [])

  const depositAndWithdrawalTransactions = await createDepositAndWithdrawalTransactions(currencyTransactions, selectedCurrencyCode, allCurrencies)
  const existingTransactionHistories = [...tradeTransactionsToHistory, ...depositAndWithdrawalTransactions].filter(Boolean)

  existingTransactionHistories.sort((transactionA, transactionB) => (moment(transactionA.createdAt).isBefore(transactionB.createdAt) ? 1 : -1))

  return existingTransactionHistories
}

async function createDepositAndWithdrawalTransactions(
  currencyTransactions: CurrencyTransaction[],
  selectedCurrencyCode: CurrencyCode,
  allCurrencies: Currency[],
) {
  const depositTransactionsToAdd = currencyTransactions.filter(({ direction }) => direction === TransactionDirection.deposit)
  const withdrawalTransactionsToAdd = currencyTransactions.filter(({ direction }) => direction === TransactionDirection.withdrawal)

  const [depositTransactionHistoryItems, withdrawalRequestTransactionHistoryItems] = await Promise.all([
    buildDepositTransactionHistory(selectedCurrencyCode, depositTransactionsToAdd, allCurrencies),
    buildWithdrawalTransactionHistory(withdrawalTransactionsToAdd, selectedCurrencyCode),
  ])

  return depositTransactionHistoryItems.concat(withdrawalRequestTransactionHistoryItems)
}

import { orderBy } from 'lodash'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode, Currency, SymbolPair } from '@abx-types/reference-data'
import { TradeTransaction, TransactionDirection, CurrencyTransaction } from '@abx-types/order'
import { TransactionHistory } from './model'
import { formTradeTransactionToHistory } from './'
import { findCurrencyTransactionForAccountAndCurrency, findTradeTransactionForAccountAndSymbols } from '../../../../core'
import { getAllCompleteSymbolDetails, getAllCurrencyBoundaries } from '@abx-service-clients/reference-data'
import { buildDepositTransactionHistory } from './form_deposit_currency_transaction'
import { buildWithdrawalTransactionHistory } from './form_withdrawal_currency_transaction'

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

  const depositAndWithdrawalTransactions = await createDepositAndWithdrawalTransactions(
    accountId,
    currencyTransactions,
    selectedCurrencyCode,
    allSymbols,
  )
  const existingTransactionHistories = [...tradeTransactionsToHistory, ...depositAndWithdrawalTransactions].filter(Boolean)

  return orderBy(existingTransactionHistories, history => history.createdAt, ['desc'])
}

async function createDepositAndWithdrawalTransactions(
  accountId: string,
  currencyTransactions: CurrencyTransaction[],
  selectedCurrencyCode: CurrencyCode,
  allSymbols: SymbolPair[],
) {
  const symbolWithSelectedCurrency = allSymbols.find(({ base, quote }) => base.code === selectedCurrencyCode || quote.code === selectedCurrencyCode)
  const selectedCurrencyId =
    symbolWithSelectedCurrency!.base.code === selectedCurrencyCode ? symbolWithSelectedCurrency!.base.id! : symbolWithSelectedCurrency!.quote.id!
  const depositTransactionsToAdd = currencyTransactions.filter(({ direction }) => direction === TransactionDirection.deposit)

  const [depositTransactionHistoryItems, withdrawalRequestTransactionHistoryItems] = await Promise.all([
    buildDepositTransactionHistory(
      accountId,
      selectedCurrencyCode,
      depositTransactionsToAdd,
      allSymbols.reduce((acc, { base, quote }) => acc.concat([base, quote]), [] as Currency[]),
    ),
    buildWithdrawalTransactionHistory(accountId, selectedCurrencyId, selectedCurrencyCode),
  ])

  return depositTransactionHistoryItems.concat(withdrawalRequestTransactionHistoryItems)
}

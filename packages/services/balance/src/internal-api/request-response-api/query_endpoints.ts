import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import { BalanceRetrievalEndpoints } from '@abx-service-clients/balance'
import {
  findBalancePayloadSchema,
  findAllBalancesForAccountSchema,
  findCurrencyBalancesSchema,
  retrieveTotalOrderValueReceivedByAccountSchema,
  getBalanceAdjustmentsForBalanceAndTradeTransactionsSchema,
  getOrderBalanceReserveAdjustmentSchema,
} from './schema'
import { BalanceRetrievalFacade, BalanceRepository, BalanceRetrievalHandler, BalanceAdjustmentRepository } from '../../core'

export function bootstrapQueryEndpoints() {
  const epicurus = getEpicurusInstance()
  const balanceRetrievalFacade = new BalanceRetrievalFacade()
  const balanceRepository = new BalanceRepository()
  const balanceAdjustmentRepository = new BalanceAdjustmentRepository()
  const balanceRetrievalHandler = new BalanceRetrievalHandler()

  epicurus.server(
    BalanceRetrievalEndpoints.findBalance,
    messageFactory(findBalancePayloadSchema, ({ currency, accountId }) => balanceRetrievalFacade.findBalance(currency, accountId)),
  )

  epicurus.server(
    BalanceRetrievalEndpoints.findAllBalancesForAccount,
    messageFactory(findAllBalancesForAccountSchema, ({ accountId }) => balanceRetrievalHandler.findAllBalancesForAccount(accountId)),
  )

  epicurus.server(
    BalanceRetrievalEndpoints.findCurrencyAvailableBalances,
    messageFactory(findCurrencyBalancesSchema, ({ accountId, currencies }) =>
      balanceRetrievalHandler.findCurrencyAvailableBalances(accountId, currencies),
    ),
  )

  epicurus.server(
    BalanceRetrievalEndpoints.findRawBalances,
    messageFactory(findBalancePayloadSchema, ({ currencyId, accountId }) => balanceRepository.findRawBalances({ currencyId, accountId })),
  )

  epicurus.server(
    BalanceRetrievalEndpoints.retrieveTotalOrderValueReceivedByAccount,
    messageFactory(retrieveTotalOrderValueReceivedByAccountSchema, ({ currencyReceivedId, accountId, tradeTransactionIds }) =>
      balanceAdjustmentRepository.retrieveTotalOrderValueReceivedByAccount(currencyReceivedId, accountId, tradeTransactionIds),
    ),
  )

  epicurus.server(
    BalanceRetrievalEndpoints.getOrderBalanceReserveAdjustment,
    messageFactory(getOrderBalanceReserveAdjustmentSchema, ({ accountId, orderId }) =>
      balanceAdjustmentRepository.getOrderBalanceReserveAdjustment(accountId, orderId),
    ),
  )

  epicurus.server(
    BalanceRetrievalEndpoints.getBalanceAdjustmentsForBalanceAndTradeTransactions,
    messageFactory(getBalanceAdjustmentsForBalanceAndTradeTransactionsSchema, ({ balanceId, tradeTransactionIds }) =>
      balanceAdjustmentRepository.getBalanceAdjustmentsForBalanceAndTradeTransactions(balanceId, tradeTransactionIds),
    ),
  )
}

import { BalanceRetrievalEndpoints } from '@abx-service-clients/balance'
import { BalanceRetrievalFacade, BalanceRepository, BalanceRetrievalHandler, BalanceAdjustmentRepository } from '../../core'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createQueryEndpointHandlers(): InternalRoute<any, any>[] {
  const balanceRetrievalFacade = new BalanceRetrievalFacade()
  const balanceRepository = new BalanceRepository()
  const balanceAdjustmentRepository = new BalanceAdjustmentRepository()
  const balanceRetrievalHandler = new BalanceRetrievalHandler()

  return [
    {
      path: BalanceRetrievalEndpoints.findBalance,
      handler: ({ currency, accountId }) => balanceRetrievalFacade.findBalance(currency, accountId),
    },
    {
      path: BalanceRetrievalEndpoints.findAllBalancesForAccount,
      handler: ({ accountId }) => balanceRetrievalHandler.findAllBalancesForAccount(accountId),
    },
    {
      path: BalanceRetrievalEndpoints.findCurrencyAvailableBalances,
      handler: ({ accountId, currencies }) => balanceRetrievalHandler.findCurrencyAvailableBalances(accountId, currencies),
    },
    {
      path: BalanceRetrievalEndpoints.findRawBalances,
      handler: ({ currencyId, accountId }) => balanceRepository.findRawBalances({ currencyId, accountId }),
    },
    {
      path: BalanceRetrievalEndpoints.retrieveTotalOrderValueReceivedByAccount,
      handler: async ({ currencyReceivedId, accountId, tradeTransactionIds }) => {
        const amount = await balanceAdjustmentRepository.retrieveTotalOrderValueReceivedByAccount(currencyReceivedId, accountId, tradeTransactionIds)

        return { amount }
      },
    },
    {
      path: BalanceRetrievalEndpoints.getOrderBalanceReserveAdjustment,
      handler: ({ orderId }) => balanceAdjustmentRepository.getOrderBalanceReserveAdjustment(orderId),
    },
    {
      path: BalanceRetrievalEndpoints.getBalanceAdjustmentsForBalanceAndTradeTransactions,
      handler: ({ balanceId, tradeTransactionIds }) =>
        balanceAdjustmentRepository.getBalanceAdjustmentsForBalanceAndTradeTransactions(balanceId, tradeTransactionIds),
    },
  ]
}

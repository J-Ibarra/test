import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import { BalanceRetrievalEndpoints } from '@abx-service-clients/balance'
import { findBalancePayloadSchema, findAllBalancesForAccountSchema } from './schema'
import { BalanceRetrievalFacade, BalanceRepository, BalanceRetrievalHandler } from '../../core'

export function bootstrapQueryEndpoints() {
  const epicurus = getEpicurusInstance()
  const balanceRetrievalFacade = new BalanceRetrievalFacade()
  const balanceRepository = new BalanceRepository()
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
    BalanceRetrievalEndpoints.findRawBalances,
    messageFactory(findBalancePayloadSchema, ({ currencyId, accountId }) => balanceRepository.findRawBalances({ currencyId, accountId })),
  )
}

import { getEpicurusInstance, messageFactory } from '@abx/db-connection-utils'
import { BalanceRetrievalEndpoints } from '@abx-service-clients/balance'
import { findBalancePayloadSchema, findAllBalancesForAccountSchema } from './schema'
import { BalanceRetrievalFacade, BalanceRepository } from '../../core'

export function bootstrapQueryEndpoints() {
  const epicurus = getEpicurusInstance()
  const balanceRetrievalFacade = new BalanceRetrievalFacade()
  const balanceRepository = new BalanceRepository()

  epicurus.server(
    BalanceRetrievalEndpoints.findBalance,
    messageFactory(findBalancePayloadSchema, ({ currency, accountId }) => balanceRetrievalFacade.findBalance(currency, accountId)),
  )

  epicurus.server(
    BalanceRetrievalEndpoints.findAllBalancesForAccount,
    messageFactory(findAllBalancesForAccountSchema, ({ accountId }) => balanceRetrievalFacade.findAllBalancesForAccount(accountId)),
  )

  epicurus.server(
    BalanceRetrievalEndpoints.findRawBalances,
    messageFactory(findBalancePayloadSchema, ({ currencyId, accountId }) => balanceRepository.findRawBalances({ currencyId, accountId })),
  )
}

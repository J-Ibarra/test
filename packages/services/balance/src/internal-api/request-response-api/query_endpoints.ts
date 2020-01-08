import { getEpicurusInstance, messageFactory } from '@abx/db-connection-utils'
import { BalanceRetrievalEndpoints, findRawBalances } from '@abx-service-clients/balance'
import { findBalancePayloadSchema, findAllBalancesForAccountSchema } from './schema'
import { BalanceRetrievalFacade } from '../../core'

export function bootstrapQueryEndpoints() {
  const epicurus = getEpicurusInstance()
  const balanceRetrievalFacade = new BalanceRetrievalFacade()

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
    messageFactory(findBalancePayloadSchema, ({ currency, accountId }) => findRawBalances(currency, accountId)),
  )
}

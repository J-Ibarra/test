import { getEpicurusInstance } from '@abx/db-connection-utils'

// TODO add endpoint for fiat withdrawal completion
export function bootstrapChangeEndpoints() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    .findBalance,
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

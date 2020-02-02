import { CurrencyCode } from '@abx-types/reference-data'
import { BalanceRetrievalEndpoints } from './endpoints'
import { Balance, RawBalance, BalanceAdjustment } from '@abx-types/balance'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'

export const BALANCE_REST_API_PORT = 3102

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(BALANCE_REST_API_PORT)

export function findBalance(currency: CurrencyCode, accountId: string): Promise<Balance> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Balance>(BalanceRetrievalEndpoints.findBalance, { currency, accountId })
}

export function findCurrencyAvailableBalances(currencies: CurrencyCode[], accountId: string): Promise<Map<CurrencyCode, number>> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Map<CurrencyCode, number>>(BalanceRetrievalEndpoints.findCurrencyAvailableBalances, {
    currencies,
    accountId,
  })
}

export function findAllBalancesForAccount(accountId: string): Promise<Balance[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Balance[]>(BalanceRetrievalEndpoints.findAllBalancesForAccount, { accountId })
}

export function findRawBalances(currency: CurrencyCode, accountId: string): Promise<RawBalance[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<RawBalance[]>(BalanceRetrievalEndpoints.findRawBalances, {
    currency,
    accountId,
  })
}

export async function retrieveTotalOrderValueReceivedByAccount(
  accountId: string,
  currencyReceivedId: number,
  tradeTransactionIds: number[],
): Promise<number> {
  const { amount } = await internalApiRequestDispatcher.fireRequestToInternalApi<{ amount: number }>(
    BalanceRetrievalEndpoints.retrieveTotalOrderValueReceivedByAccount,
    {
      accountId,
      currencyReceivedId,
      tradeTransactionIds,
    },
  )

  return amount
}

/** Retrieves the balance adjustment corresponding to an order balance reserve. */
export function getOrderBalanceReserveAdjustment(currencyCode: CurrencyCode, accountId: string, orderId: number): Promise<BalanceAdjustment> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<BalanceAdjustment>(BalanceRetrievalEndpoints.getOrderBalanceReserveAdjustment, {
    currencyCode,
    accountId,
    orderId,
  })
}

export function getBalanceAdjustmentsForBalanceAndTradeTransactions(balanceId: number, tradeTransactionIds: number[]): Promise<BalanceAdjustment[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<BalanceAdjustment[]>(
    BalanceRetrievalEndpoints.getBalanceAdjustmentsForBalanceAndTradeTransactions,
    {
      balanceId,
      tradeTransactionIds,
    },
  )
}

export * from './endpoints'

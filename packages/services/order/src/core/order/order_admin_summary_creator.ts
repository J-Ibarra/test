import { Account } from '@abx-types/account'
import { getAllCompleteSymbolDetails } from '@abx-service-clients/reference-data'
import { buildTradeTransactionOrderAggregation } from '../transaction'
import { Order, OrderAdminSummary, OrderType } from '@abx-types/order'
import { findOrders } from './find_orders'
import { findAccountWithUserDetails, findAccountsByIdWithUserDetails } from '@abx-service-clients/account'
import { SymbolPairStateFilter } from '@abx-types/reference-data'

interface QueryLimitAndOffsetPair {
  limit?: number
  offset?: number
}
interface OrderWithOwnerAccount extends Order {
  account: Account
}

export async function getAllOrdersForAccountHin(hin: string, { limit, offset }: QueryLimitAndOffsetPair): Promise<OrderAdminSummary[]> {
  const account = await findAccountWithUserDetails({ hin })

  if (!account) {
    throw new Error(`Account not found for hin ${hin}`)
  }

  const allOrders = await findOrders({
    where: { accountId: account!.id },
    order: [['createdAt', 'DESC']],
    limit: limit || 50,
    offset: offset || 0,
  })

  return enrichWithTransactionDetails(
    allOrders.map((order) => ({
      ...order,
      account: account!,
    })),
  )
}

export async function getAllOrdersAdminSummary({ limit, offset }: QueryLimitAndOffsetPair): Promise<OrderAdminSummary[]> {
  const allOrders = await findOrders({
    order: [['createdAt', 'DESC']],
    limit: limit || 50,
    offset: offset || 0,
  })

  const allAccountsWithOrders = await findAccountsByIdWithUserDetails(allOrders.map(({ accountId }) => accountId))
  const accountIdToAccount = allAccountsWithOrders.reduce((acc, account) => acc.set(account.id, account), new Map())

  return enrichWithTransactionDetails(
    allOrders.map((order) => ({
      ...order,
      account: accountIdToAccount.get(order.accountId),
    })),
  )
}

export async function enrichWithTransactionDetails(orders: OrderWithOwnerAccount[]): Promise<OrderAdminSummary[]> {
  const orderIdToTradeTransactionAggregation = await buildTradeTransactionAggregation()
  const symbols = await getAllCompleteSymbolDetails(SymbolPairStateFilter.all)
  const symbolIdToSymbol = symbols.reduce((acc, symbol) => acc.set(symbol.id, symbol), new Map())

  return orders.map((order: OrderWithOwnerAccount) => ({
    orderId: order.id!,
    client: `${order.account.users![0].firstName} ${order.account.users![0].lastName}`,
    hin: order.account.hin!,
    direction: order.direction,
    symbolId: order.symbolId,
    amount: order.amount,
    price:
      order.orderType === OrderType.limit
        ? order.limitPrice!
        : (orderIdToTradeTransactionAggregation.get(order.id!) || { averagePrice: 0 }).averagePrice,
    fee: (orderIdToTradeTransactionAggregation.get(order.id!) || { feeSum: 0 }).feeSum,
    feeCurrency: symbolIdToSymbol.get(order.symbolId).fee.code,
    filled: order.amount - order.remaining,
    status: order.status,
    createdAt: order.createdAt as Date,
    globalTransactionId: order.globalTransactionId,
  }))
}

async function buildTradeTransactionAggregation(): Promise<
  Map<
    number,
    {
      orderId: number
      averagePrice: number
      feeSum: number
    }
  >
> {
  const tradeTransactionsAggregation = await buildTradeTransactionOrderAggregation()

  return tradeTransactionsAggregation.reduce((acc, aggregation) => acc.set(aggregation.orderId, aggregation), new Map())
}

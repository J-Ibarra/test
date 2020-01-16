import { FindOptions, WhereOptions } from 'sequelize'
import { isNullOrUndefined } from 'util'
import { getModel } from '@abx/db-connection-utils'
import { getApiCacheClient } from '@abx/db-connection-utils'
import { CurrencyCode, SymbolPair } from '@abx-types/reference-data'
import { getAllCompleteSymbolDetails, getAllSymbolsIncludingCurrency } from '@abx-service-clients/reference-data'
import { TradeTransaction } from '@abx-types/order'
import { CoreOrderDetails, Order, OrderStatus, OrderWithTradeTransactions } from '@abx-types/order'
import { findTradeTransactions } from '../transaction'

/** A container for all the transactions for a given order. */
interface OrderTransactionSummary {
  totalMatchPrice: number
  averageMatchPrice: number
  transactions: TradeTransaction[]
}

/**
 * Retrieves the records for all orders satisfying a query.
 * Uses an optional transformer to map the order details to a more relevant data structure for the client.
 * @param query the query to run
 * @param orderTransformer a mapping function used to transform the order instances
 */
export async function findOrders<T = Order>(query?: FindOptions, orderTransformer?: (orders: Order[]) => T[]): Promise<T[]> {
  const orderInstances = await getModel<Order>('order').findAll(query)
  const orders = orderInstances.map(order => order.get())
  return orderTransformer ? orderTransformer(orders) : (orders as any)
}

export const ACCOUNT_CURRENCY_ORDERS_CACHE_KEY = 'orders-account-currency'

/**
 * Retrieves orders for a specific account for all currency pairs with a given currency.
 * The limit price of all filled/cancelled orders is determined by the match price at which they were settled.
 * (In the cancel scenario this is only valid is some amount of the order was matched before cancelling.)
 * In the scenario where an order has been matched multiple times, the average match price is used.
 *
 * @param accountId the account ID
 * @param currency the currency to look up pairs for
 */
export async function findOrdersForCurrency(accountId: string, currency: CurrencyCode, where?: WhereOptions): Promise<OrderWithTradeTransactions[]> {
  const allSymbolsForCurrency = await getAllSymbolsIncludingCurrency(currency)

  const orders = await findOrdersWithTransactionsForAccount(accountId, allSymbolsForCurrency, where)
  await getApiCacheClient().setCache(`${ACCOUNT_CURRENCY_ORDERS_CACHE_KEY}-${currency}-${accountId}-${JSON.stringify(where)}`, orders, 10)

  return orders
}

export function findAllOrdersForAccountAndSymbols(
  accountId: string,
  symbols: SymbolPair[],
  where: WhereOptions = {},
  orderTransformer?: (orders: Order[]) => CoreOrderDetails[],
): Promise<CoreOrderDetails[]> {
  const whereOptions = {}

  // Whitelist allowed URL queryable fields
  Object.keys(where).forEach(key => {
    if (['createdAt', 'updatedAt'].includes(key)) {
      whereOptions[key] = where[key]
    }
  })

  return findOrders<CoreOrderDetails>(
    {
      where: {
        ...whereOptions,
        accountId,
        symbolId: {
          $in: symbols.map(({ id }) => id),
        },
      },
      limit: 500,
      order: [['createdAt', 'desc']],
    },
    orderTransformer,
  )
}

export const ACCOUNT_ALL_ORDERS_CACHE_KEY = 'orders-account'

/**
 * Retrieves all orders for a given account.
 *
 * @param accountId the account ID
 * @param orderTransformer a mapping function used to transform the order instances
 */
export async function findAllOrdersForAccount(accountId: string, where?: WhereOptions): Promise<OrderWithTradeTransactions[]> {
  const allSymbols = await getAllCompleteSymbolDetails()

  const orders = await findOrdersWithTransactionsForAccount(accountId, allSymbols, where)
  await getApiCacheClient().setCache(`${ACCOUNT_ALL_ORDERS_CACHE_KEY}-${accountId}-${JSON.stringify(where)}`, orders, 10)

  return orders
}

export function extractCoreOrderDetails(orders: Order[]): CoreOrderDetails[] {
  return orders.map(({ id, symbolId, createdAt, direction, orderType, amount, remaining, limitPrice, status, globalTransactionId }) => ({
    id,
    symbolId,
    createdAt,
    orderType,
    amount,
    direction,
    remaining,
    limitPrice,
    status,
    globalTransactionId,
  }))
}

/**
 * Find all the orders with their transactions based on the symbols passed in.
 * @param accountId
 * @param symbols
 */
export async function findOrdersWithTransactionsForAccount(
  accountId: string,
  symbols: SymbolPair[],
  whereOptions?: WhereOptions,
): Promise<OrderWithTradeTransactions[]> {
  const [transactions, orders] = await Promise.all([
    findTradeTransactions({
      where: { accountId },
      order: [
        ['orderId', 'desc'],
        ['updatedAt', 'desc'],
      ],
    }),
    findAllOrdersForAccountAndSymbols(accountId, symbols, whereOptions),
  ])

  const orderIdToTransactionSummary = groupTransactionsByOrderId(transactions.rows)

  return orders.map(({ id, symbolId, createdAt, updatedAt, direction, orderType, amount, remaining, status, limitPrice, globalTransactionId }) => ({
    id,
    symbolId,
    createdAt,
    updatedAt,
    orderType,
    amount,
    direction,
    remaining,
    limitPrice:
      status === OrderStatus.fill || status === OrderStatus.cancel
        ? (orderIdToTransactionSummary.get(id!) || { averageMatchPrice: limitPrice }).averageMatchPrice
        : limitPrice,
    status,
    transactions: getTransactionsForId(id!, orderIdToTransactionSummary),
    globalTransactionId,
  }))
}

/**
 * Grab transactions associated with the id passed in
 * @param id
 * @param transactionSummaries
 */
const getTransactionsForId = (id: number, transactionSummaries: Map<number, OrderTransactionSummary>): TradeTransaction[] => {
  const fetchedTransactions = transactionSummaries.get(id)
  if (isNullOrUndefined(fetchedTransactions)) {
    return []
  }

  return fetchedTransactions.transactions
}

/**
 * group the report url's with the appropriates transactions
 * @param transactions
 * @param transactionReportUrls
 */
function groupTransactionsByOrderId(transactions: TradeTransaction[]) {
  return transactions.reduce(
    (orderIdToTransactions, transaction) => calculateAccumulativeMatchPrice(orderIdToTransactions, transaction),
    new Map<number, OrderTransactionSummary>(),
  )
}

/**
 * For market orders we need to calculate the average price of all the transactions.
 * @param orderIdToTransactions
 * @param transaction
 */
function calculateAccumulativeMatchPrice(
  orderIdToTransactions: Map<number, OrderTransactionSummary>,
  transaction: TradeTransaction,
): Map<number, OrderTransactionSummary> {
  const { totalMatchPrice: currentTotal, transactions } = orderIdToTransactions.get(transaction.orderId) || { totalMatchPrice: 0, transactions: [] }

  const updatedMatchPrice = currentTotal + transaction.matchPrice
  orderIdToTransactions.set(transaction.orderId, {
    totalMatchPrice: updatedMatchPrice,
    averageMatchPrice: updatedMatchPrice / (transactions.length + 1),
    transactions: transactions.concat(transaction as any),
  })

  return orderIdToTransactions
}

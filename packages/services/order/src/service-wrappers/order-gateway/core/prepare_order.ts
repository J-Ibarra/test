import { Logger } from '@abx-utils/logging'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { getCompleteSymbolDetails, getAllCurrenciesEligibleForAccount } from '@abx-service-clients/reference-data'
import { Order } from '@abx-types/order'
import { saveOrder } from '../../../core'
import { allocateReserveBalance } from '../../../core/reserve-balance-allocators'
import { SymbolPairStateFilter } from '@abx-types/reference-data'
import { ValidationError } from '@abx-types/error'

const logger = Logger.getInstance('contract_exchange', 'prepareOrder')

export async function prepareOrder(order: Order): Promise<Order> {
  const symbol = await getCompleteSymbolDetails(order.symbolId, SymbolPairStateFilter.all)
  const allCurrencyCodesEligibleForAccount = (await getAllCurrenciesEligibleForAccount(order.accountId)).map(({ code }) => code)

  if (!allCurrencyCodesEligibleForAccount.includes(symbol.base.code) || !allCurrencyCodesEligibleForAccount.includes(symbol.quote.code)) {
    logger.error(
      `Error validating available balance for ${order.direction} order for ${order.amount} ${order.symbolId} and account ${order.accountId}`,
    )

    throw new ValidationError(`Account ${order.accountId} is not eligible for symbol ${order.symbolId}`)
  }

  return wrapInTransaction(sequelize, null, async (transaction) => {
    try {
      const savedOrder = await saveOrder({ order, transaction })

      await allocateReserveBalance(savedOrder, symbol, transaction)

      return savedOrder
    } catch (e) {
      logger.error(
        `Error validating available balance for ${order.direction} order for ${order.amount} ${order.symbolId} and account ${order.accountId}`,
      )

      throw e
    }
  })
}

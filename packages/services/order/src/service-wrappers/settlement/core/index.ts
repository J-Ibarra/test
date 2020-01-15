import { Logger } from '@abx/logging'
import { getEpicurusInstance, sequelize, wrapInTransaction } from '@abx/db-connection-utils'
import { OrderMatch, OrderMatchStatus, UsdMidPriceEnrichedOrderMatch } from '@abx-types/order'
import { OrderMatchRepository, setLastExecutedPrice } from '../../../core'
import { OrderSettlementGateway } from './order_settlement_gateway'
import { OrderPubSubChannels } from '@abx-service-clients/order'

const logger = Logger.getInstance('settlement', 'settle_order_match')

const orderMatchQueue: Record<string, UsdMidPriceEnrichedOrderMatch[]> = {}
// Stores orders failed for functional/business constraint reasons
const orderMatchDeadLetterQueue: UsdMidPriceEnrichedOrderMatch[] = []

let accountsSettlingOrdersFor: string[] = []

export function addOrderToSettleQueue(rawOrderMatch: UsdMidPriceEnrichedOrderMatch) {
  const ordersForSymbol = orderMatchQueue[rawOrderMatch.symbolId] || []
  logger.info(`Adding order match ${rawOrderMatch.id} for ${rawOrderMatch.symbolId} to order settlement queue`)

  orderMatchQueue[rawOrderMatch.symbolId] = ordersForSymbol.concat(rawOrderMatch)
}

export async function settleOrderMatchForPair(symbolId: string) {
  const orderMatchesForSymbol = orderMatchQueue[symbolId] || []

  // Picking an order match for an account that we are currently not settling another order for
  // to avoid deadlocks
  const orderMatchToSettle = orderMatchesForSymbol.find(
    ({ sellAccountId, buyAccountId }) => !accountsSettlingOrdersFor.includes(sellAccountId) && !accountsSettlingOrdersFor.includes(buyAccountId),
  )

  if (!orderMatchToSettle) {
    return setTimeout(() => settleOrderMatchForPair(symbolId), 15)
  }

  try {
    accountsSettlingOrdersFor = accountsSettlingOrdersFor.concat([orderMatchToSettle.sellAccountId, orderMatchToSettle.buyAccountId])
    logger.debug(`Locked accounts before settling match ${orderMatchToSettle.id} updated to ${JSON.stringify(accountsSettlingOrdersFor)}`)

    await runSettlementLogic(orderMatchToSettle)
  } catch (e) {
    logger.error(`Error ocurred while trying to settle order match ${orderMatchToSettle.id}`)
    logger.error(e)

    orderMatchDeadLetterQueue.push(orderMatchToSettle)
  } finally {
    accountsSettlingOrdersFor = accountsSettlingOrdersFor.filter(
      accountId => accountId !== orderMatchToSettle.buyAccountId && accountId !== orderMatchToSettle.sellAccountId,
    )
    orderMatchQueue[orderMatchToSettle.symbolId] = orderMatchQueue[orderMatchToSettle.symbolId].filter(({ id }) => id !== orderMatchToSettle.id)
  }

  return setTimeout(() => settleOrderMatchForPair(symbolId), 15)
}

/**
 * An unmanaged transaction is used here (i.e. sequelize.transaction({}).then())
 * because we want to manually rollback the transaction if the lock balance operation fails (within the 40sec timeout).
 * This is the done to cancel the actual lock query which has not succeeded during the timeout.
 */
export async function runSettlementLogic(rawOrderMatch: UsdMidPriceEnrichedOrderMatch) {
  return wrapInTransaction(sequelize, null, async transaction => {
    const orderMatch = await OrderMatchRepository.getInstance().lockOrderMatchTransaction(rawOrderMatch.id!, transaction)

    if (!orderMatch) {
      logger.warn(`Settlement: Could not find order match - Restarting Operation:  orderMatchId: ${rawOrderMatch.id} `)
      return unlockAccountsAndTriggerSettlement(rawOrderMatch)
    } else if (orderMatch.status === OrderMatchStatus.settled) {
      return
    }

    try {
      await OrderSettlementGateway.getInstance().settleOrderMatch(
        { ...orderMatch, feeCurrencyToUsdMidPrice: rawOrderMatch.feeCurrencyToUsdMidPrice },
        transaction,
      )

      const epicurus = getEpicurusInstance()
      epicurus.publish(OrderPubSubChannels.orderMatchSettled, orderMatch)

      return setLastExecutedPrice(orderMatch.symbolId, orderMatch.matchPrice)
    } catch (e) {
      logger.debug(`Transaction error ocurred while trying to settle order match ${rawOrderMatch.id}`)
      logger.error(e)

      return unlockAccountsAndTriggerSettlement(rawOrderMatch)
    }
  })
}

function unlockAccountsAndTriggerSettlement({ buyAccountId, sellAccountId, symbolId }: OrderMatch) {
  const orderMatches = orderMatchQueue[symbolId] || []
  const orderMatchIndex: number = orderMatches.findIndex(order => order.buyAccountId === buyAccountId && order.sellAccountId === sellAccountId)
  const orderMatchArr = orderMatches.splice(orderMatchIndex, 1)

  if (orderMatchArr.length) {
    const orderMatch = orderMatchArr[0]
    logger.debug(`Moving order for [SYMBOL: ${symbolId}, BUYER: ${buyAccountId}, SELLER: ${sellAccountId}] to back of settlement queue`)
    orderMatches.push(orderMatch)
  }

  return setTimeout(() => settleOrderMatchForPair(symbolId), 10)
}

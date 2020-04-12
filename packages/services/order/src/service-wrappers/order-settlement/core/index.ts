import { Logger } from '@abx-utils/logging'
import { getEpicurusInstance, sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { OrderMatch, OrderMatchStatus, UsdMidPriceEnrichedOrderMatch } from '@abx-types/order'
import { OrderMatchRepository } from '../../../core'
import { setLastExecutedPrice } from '../../../core/order-match/last_executed_price_redis'
import { OrderSettlementGateway } from './order_settlement_gateway'
import { OrderPubSubChannels } from '@abx-service-clients/order'
import { sendTradeConfirmationEmail } from './handler/trade-confirmation-email'
import { allMatchesSettledExceptForCurrentOne, balanceAdjustmentsCreatedForAllPreviousTradeTransactions } from './handler/shared.utils'
import { getCompleteSymbolDetails } from '@abx-service-clients/reference-data'
import { Transaction } from 'sequelize'
import { SymbolPairStateFilter } from '@abx-types/reference-data'

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
      (accountId) => accountId !== orderMatchToSettle.buyAccountId && accountId !== orderMatchToSettle.sellAccountId,
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
  return wrapInTransaction(sequelize, null, async (transaction) => {
    const orderMatch = await OrderMatchRepository.getInstance().lockOrderMatchTransaction(rawOrderMatch.id!, transaction)

    if (!orderMatch) {
      logger.warn(`Settlement: Could not find order match - Restarting Operation:  orderMatchId: ${rawOrderMatch.id} `)
      return unlockAccountsAndTriggerSettlement(rawOrderMatch)
    }

    const balanceUpdatesCompletedForAllOtherOrderMatches = await balanceAdjustmentsCreatedForAllOtherOrderMatches(orderMatch, transaction)
    if (!balanceUpdatesCompletedForAllOtherOrderMatches) {
      logger.warn(
        `Could not settle order match ${rawOrderMatch} because not all balance adjustments for previous matches for the same order were created`,
      )
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

      process.nextTick(() => sendTradeConfirmationEmail(orderMatch))
      return setLastExecutedPrice(orderMatch.symbolId, orderMatch.matchPrice)
    } catch (e) {
      logger.debug(`Transaction error ocurred while trying to settle order match ${rawOrderMatch.id}`)
      logger.error(e)

      return unlockAccountsAndTriggerSettlement(rawOrderMatch)
    }
  })
}

function unlockAccountsAndTriggerSettlement({ buyAccountId, sellAccountId, symbolId, id }: OrderMatch) {
  const orderMatches = orderMatchQueue[symbolId] || []
  const orderMatchIndex: number = orderMatches.findIndex(
    (order) => order.buyAccountId === buyAccountId && order.sellAccountId === sellAccountId && order.id === id,
  )
  const orderMatchArr = orderMatches.splice(orderMatchIndex, 1)

  if (orderMatchArr.length) {
    const orderMatch = orderMatchArr[0]
    logger.debug(`Moving order for [SYMBOL: ${symbolId}, BUYER: ${buyAccountId}, SELLER: ${sellAccountId}] to back of settlement queue`)

    setTimeout(() => orderMatchQueue[symbolId].push(orderMatch), 1000)
  }
}

async function balanceAdjustmentsCreatedForAllOtherOrderMatches(rawOrderMatch: OrderMatch, transaction: Transaction) {
  const allOderMatchesSettledExceptForCurrentOne = await allMatchesSettledExceptForCurrentOne(
    rawOrderMatch.id!,
    rawOrderMatch.buyOrderId,
    transaction,
  )
  const symbolDetails = await getCompleteSymbolDetails(rawOrderMatch.symbolId, SymbolPairStateFilter.all)
  const balanceAdjustmentsCreatedForAllOrderMatches = await balanceAdjustmentsCreatedForAllPreviousTradeTransactions(
    rawOrderMatch.buyOrderId,
    rawOrderMatch.buyAccountId,
    symbolDetails.quote.id,
  )

  return !allOderMatchesSettledExceptForCurrentOne || (allOderMatchesSettledExceptForCurrentOne && balanceAdjustmentsCreatedForAllOrderMatches)
}

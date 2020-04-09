import { Order, OrderDirection, OrderMatch, OrderStatus } from '@abx-types/order'
import { findUsersByAccountId } from '@abx-service-clients/account'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode, Environment, SymbolPairStateFilter } from '@abx-types/reference-data'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { ReportType, generateReport } from '@abx-service-clients/report'
import { getCurrencyCode, getSymbolPairSummary } from '@abx-service-clients/reference-data'
import { EmailOrderStatus } from '@abx-types/notification'
import { createEmail } from '@abx-service-clients/notification'

import { createTradeConfirmationEmail } from './create_trade_confirmation_email'
import { findOrderMatchTransactions, findOrder, generateTradeTransactionReportData } from '../../../../../core'
import { Transaction } from 'sequelize'

const logger = Logger.getInstance('report', 'report generation')

export async function sendTradeConfirmationEmail(orderMatch: OrderMatch) {
  if (process.env.NODE_ENV === Environment.test) {
    return
  }

  const tradeConfirmationEmails = await wrapInTransaction(sequelize, null, async (t) => {
    const { buyAccountId, sellAccountId, amount, consideration, buyOrderId, createdAt, sellOrderId } = orderMatch

    const [
      baseCurrency,
      quoteCurrency,
      usersForBuyAccount,
      usersForSellAccount,
      buyOrder,
      orderMatchesAgainstBuyOrder,
      sellOrder,
      orderMatchesAgainstSellOrder,
    ] = await retrieveCurrencyAccountAndOrderDetails(orderMatch, t)

    const [buyerAttachment, sellerAttachment] = await Promise.all([
      buildTradeTransactionReport(buyAccountId, OrderDirection.buy, orderMatch, baseCurrency!, quoteCurrency!),
      buildTradeTransactionReport(sellAccountId, OrderDirection.sell, orderMatch, baseCurrency!, quoteCurrency!),
    ])

    const buyerEmailOderStatus = getOrderStatusForTradeConfirmationEmail(orderMatch, orderMatchesAgainstBuyOrder || [], buyOrder!)
    const sellerEmailOderStatus = getOrderStatusForTradeConfirmationEmail(orderMatch, orderMatchesAgainstSellOrder || [], sellOrder!)

    const createTradingPartyConfirmationEmail = createTradeConfirmationEmail({
      baseCurrency: baseCurrency!,
      quoteCurrency: quoteCurrency!,
      amount,
      createdAt: createdAt!,
      consideration,
    })

    const buyerEmails = createTradingPartyConfirmationEmail({
      users: (usersForBuyAccount || []).map(({ firstName, lastName, email }) => ({ firstName, lastName, email })),
      orderId: buyOrderId,
      direction: OrderDirection.buy,
      attachments: buyerAttachment,
      orderType: orderMatch.buyOrderType,
      orderStatus: buyerEmailOderStatus,
    })
    const sellerEmails = createTradingPartyConfirmationEmail({
      users: (usersForSellAccount || []).map(({ firstName, lastName, email }) => ({ firstName, lastName, email })),
      orderId: sellOrderId,
      direction: OrderDirection.sell,
      attachments: sellerAttachment,
      orderType: orderMatch.sellOrderType,
      orderStatus: sellerEmailOderStatus,
    })

    return [...buyerEmails, ...sellerEmails]
  })

  await Promise.all(tradeConfirmationEmails.map(createEmail))
}

const retrieveCurrencyAccountAndOrderDetails = async (
  { buyAccountId, buyOrderId, symbolId, createdAt, sellAccountId, sellOrderId }: OrderMatch,
  transaction: Transaction,
) => {
  const { baseId, quoteId } = await getSymbolPairSummary(symbolId)

  const baseCurrencyPromise = getCurrencyCode(baseId, SymbolPairStateFilter.all)
  const quoteCurrencyPromise = getCurrencyCode(quoteId, SymbolPairStateFilter.all)
  const usersForBuyAccountPromise = findUsersByAccountId(buyAccountId)
  const usersForSellAccountPromise = findUsersByAccountId(sellAccountId)

  const orderMatchesAgainstBuyOrderPromise = findOrderMatchTransactions(
    {
      where: {
        buyOrderId,
        createdAt: {
          $lt: createdAt,
        },
      },
    },
    transaction,
  )
  const orderMatchesAgainstSellOrderPromise = findOrderMatchTransactions(
    {
      where: {
        sellOrderId,
        createdAt: {
          $lt: createdAt,
        },
      },
    },
    transaction,
  )

  const buyOrderPromise = findOrder(buyOrderId)
  const sellOrderPromise = findOrder(sellOrderId)

  return Promise.all([
    baseCurrencyPromise,
    quoteCurrencyPromise,
    usersForBuyAccountPromise,
    usersForSellAccountPromise,
    buyOrderPromise,
    orderMatchesAgainstBuyOrderPromise,
    sellOrderPromise,
    orderMatchesAgainstSellOrderPromise,
  ])
}

const buildTradeTransactionReport = async (
  accountId: string,
  orderDirection: OrderDirection,
  { id: orderMatchId, buyOrderId, amount, createdAt, sellOrderId, consideration, matchPrice }: OrderMatch,
  baseCurrency: CurrencyCode,
  quoteCurrency: CurrencyCode,
) => {
  const buyerReportData = await generateTradeTransactionReportData({
    orderMatchId: orderMatchId!,
    accountId,
    baseCurrency: baseCurrency!,
    quoteCurrency: quoteCurrency!,
    orderIds: {
      buyOrderId,
      sellOrderId,
    },
    direction: orderDirection,
    date: createdAt!,
    amount,
    matchPrice,
    consideration,
  })

  logger.debug(
    `Creating trading invoice for ${accountId} on ${orderDirection}ing ${amount} ${
      orderDirection === OrderDirection.sell ? baseCurrency : quoteCurrency
    }`,
  )

  return generateReport({
    data: buyerReportData,
    reportType: ReportType.tradeTransaction,
  })
}

const getOrderStatusForTradeConfirmationEmail = (orderMatch: OrderMatch, orderMatches: OrderMatch[], order: Order): EmailOrderStatus => {
  let totalMatchedAmount = orderMatches.reduce((acc, { amount }) => {
    return acc + Number(amount)
  }, 0)

  totalMatchedAmount += Number(orderMatch.amount)

  const remainingAmount = order.amount - totalMatchedAmount

  logger.debug(`getOrderStatusForTradeConfirmationEmail for orderMatch: ${orderMatch.id}`)
  logger.debug(`Before orderMatch ${orderMatch.id} for order ${order.id}, there were ${orderMatches.length} orderMatch created`)
  logger.debug(`Order ${order.id} got ${totalMatchedAmount} / ${order.amount} matched`)
  if (remainingAmount === 0) {
    return EmailOrderStatus.filled
  } else if (remainingAmount > 0 && (order.status === OrderStatus.cancel || order.status === OrderStatus.pendingCancel)) {
    return EmailOrderStatus.partialCancelled
  } else {
    return EmailOrderStatus.partialFilled
  }
}

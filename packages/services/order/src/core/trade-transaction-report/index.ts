import { findTradeTransaction } from '../transaction'
import { ReportData } from '@abx-service-clients/report'
import { generateTradeTransactionReportData } from './trade_transaction_report_generator'
import { findOrderMatch } from '@abx-service-clients/order'
import { OrderDirection } from '@abx-types/order'
import { CurrencyCode } from '@abx-types/reference-data'

export async function generateReportForTradeTransaction(tradeTransactionId: number): Promise<ReportData> {
  const tradeTransaction = (await findTradeTransaction({ where: { id: tradeTransactionId } }))!
  const counterTradeTransaction = (await findTradeTransaction({ where: { id: tradeTransaction.counterTradeTransactionId } }))!

  const buyOrderId = tradeTransaction.direction === OrderDirection.buy ? tradeTransaction.orderId : counterTradeTransaction.orderId
  const sellOrderId = tradeTransaction.direction === OrderDirection.sell ? tradeTransaction.orderId : counterTradeTransaction.orderId

  const orderMatch = await findOrderMatch({ where: { buyOrderId, sellOrderId } })

  const [baseCurrency, quoteCurrency] = tradeTransaction.symbolId.split('_')

  return generateTradeTransactionReportData({
    direction: tradeTransaction.direction,
    accountId: tradeTransaction.accountId,
    orderMatchId: orderMatch!.id!,
    orderIds: {
      buyOrderId,
      sellOrderId,
    },
    baseCurrency: baseCurrency as CurrencyCode,
    quoteCurrency: quoteCurrency as CurrencyCode,
    date: tradeTransaction.createdAt!,
    amount: tradeTransaction.amount,
    matchPrice: tradeTransaction.matchPrice,
    consideration: orderMatch!.consideration,
  })
}

export * from './trade_transaction_report_generator'

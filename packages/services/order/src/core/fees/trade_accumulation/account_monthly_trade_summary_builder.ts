import moment from 'moment'

import { TradeAccumulationRepository } from './trade_accumulation_repository'
import { AccountMonthlyTradeSummary, MonthlyTradeSummary } from '@abx-types/order'
import { findTradeTransactionsCount } from '../../transaction/find_trade_transactions'

const tradeAccumulationRepository = TradeAccumulationRepository.getInstance()

export async function buildAccountMonthlyTradeSummary(accountId: string): Promise<AccountMonthlyTradeSummary> {
  const [tradeSummaryForLastMonth, tradeSummaryForCurrentMonth] = await Promise.all([
    buildMonthlyTradeSummary(
      accountId,
      moment()
        .subtract(1, 'months')
        .toDate(),
    ),
    buildMonthlyTradeSummary(accountId, new Date()),
  ])

  return {
    currentMonth: tradeSummaryForCurrentMonth,
    lastMonth: tradeSummaryForLastMonth,
  }
}

async function buildMonthlyTradeSummary(accountId: string, date: Date): Promise<MonthlyTradeSummary> {
  const [tradesForMonth, accumulatedTradeVolumeForMonth] = await Promise.all([
    findTradeTransactionCountForMonth(accountId, date),
    tradeAccumulationRepository.getMonthlyTradeAccumulationForAccount(accountId, date),
  ])

  return {
    trades: tradesForMonth,
    volume: accumulatedTradeVolumeForMonth,
  }
}
function findTradeTransactionCountForMonth(accountId: string, date: Date) {
  const startOfTheMonth = moment(date)
    .startOf('month')
    .toDate()
  const endOfTheMonth = moment(date)
    .endOf('month')
    .toDate()

  return findTradeTransactionsCount({
    accountId,
    $and: [
      {
        createdAt: {
          $gte: startOfTheMonth,
        },
      },
      {
        createdAt: {
          $lte: endOfTheMonth,
        },
      },
    ],
  })
}

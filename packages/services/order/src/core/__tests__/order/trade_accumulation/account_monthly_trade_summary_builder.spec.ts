import { expect } from 'chai'
import sinon from 'sinon'

import * as tradeTransactionOperations from '../../../../core/transaction/find_trade_transactions'
import { TradeAccumulationRepository } from '../../../fees/trade_accumulation/trade_accumulation_repository'
import { buildAccountMonthlyTradeSummary } from '../../../fees'

const accountId = 'AB12'
const previousMonthTradeTransactionsCount = 10
const previousMonthAccumulatedTradeVolume = 12_123
const currentMonthTradeTransactionsCount = 20
const currentMonthAccumulatedTradeVolume = 21_123

describe('account_monthly_trade_summary_builder', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('buildAccountMonthlyTradeSummary should return the trade summary for current and last month', async () => {
    sinon
      .stub(tradeTransactionOperations, 'findTradeTransactionsCount')
      .onFirstCall()
      .resolves(previousMonthTradeTransactionsCount)
      .onSecondCall()
      .resolves(currentMonthTradeTransactionsCount)

    sinon
      .stub(TradeAccumulationRepository.prototype, 'getMonthlyTradeAccumulationForAccount')
      .onFirstCall()
      .resolves(previousMonthAccumulatedTradeVolume)
      .onSecondCall()
      .resolves(currentMonthAccumulatedTradeVolume)

    const result = await buildAccountMonthlyTradeSummary(accountId)

    expect(result.currentMonth).to.eql({
      trades: currentMonthTradeTransactionsCount,
      volume: currentMonthAccumulatedTradeVolume,
    })
    expect(result.lastMonth).to.eql({
      trades: previousMonthTradeTransactionsCount,
      volume: previousMonthAccumulatedTradeVolume,
    })
  })
})

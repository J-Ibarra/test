import { expect } from 'chai'
import sinon from 'sinon'
import { CurrencyCode } from '@abx-types/reference-data'
import { MarketDataFacade } from '../market_data_facade'
import * as statisticsForSymbols from '../repository/daily-statistics'

const currency = CurrencyCode.kag
const accountId = '1'

describe('market_data_facade', () => {
  describe('getMarketDataSnapshot', () => {
    beforeEach(() => {
      sinon.restore()
    })

    afterEach(() => {
      sinon.restore()
    })

    it(`getMarketDataSnapshotForCurrency`, async () => {
      const getPriceChangeStatisticsForCurrencyStub = sinon
        .stub(statisticsForSymbols, 'getDailyMarketDataStatsForCurrency')
        .returns(Promise.resolve([{ symbolId: currency, bidPrice: 1, askPrice: 2, dailyChange: 1001, dailyVolume: 100 }]))

      const marketSnapshots = await MarketDataFacade.getInstance().getMarketDataSnapshotForCurrency(currency, accountId)

      expect(getPriceChangeStatisticsForCurrencyStub.calledWith(currency, accountId)).to.eql(true)
      expect(getPriceChangeStatisticsForCurrencyStub.calledOnce).to.eql(true)
      expect(marketSnapshots.length).to.eql(1)
      expect(marketSnapshots[0]).to.eql({ symbolId: currency, bidPrice: 1, askPrice: 2, dailyChange: 1001, dailyVolume: 100 })
    })

    it(`getMarketDataSnapshotForAllSymbols`, async () => {
      const getPriceChangeStatisticsForSymbolsStub = sinon
        .stub(statisticsForSymbols, 'getDailyMarketDataStatsForAllSymbols')
        .returns(Promise.resolve([{ symbolId: currency, bidPrice: 1, askPrice: 2, dailyChange: 1001, dailyVolume: 100 }]))

      const marketSnapshots = await MarketDataFacade.getInstance().getMarketDataSnapshotForAllSymbols(accountId)

      expect(getPriceChangeStatisticsForSymbolsStub.calledOnce).to.eql(true)
      expect(marketSnapshots.length).to.eql(1)
      expect(marketSnapshots[0]).to.eql({ symbolId: currency, bidPrice: 1, askPrice: 2, dailyChange: 1001, dailyVolume: 100 })
    })
  })
})

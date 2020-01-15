import { expect } from 'chai'
import Decimal from 'decimal.js'
import sinon from 'sinon'
import { OrderMatchStatus, OrderType, UsdMidPriceEnrichedOrderMatch } from '@abx-types/order'
import { CurrencyCode, SymbolPair } from '@abx-types/reference-data'
import * as fxRateProviderOperations from '@abx-utils/fx-rate'
import { calculateVatUsdValue, getExecutionFeeInUsd, getVatFees } from '../vat_handler'
import '../../../../core'

const currencyUsd = { id: 1, code: CurrencyCode.usd, sortPriority: 1, orderPriority: 5 }
const currencyKau = { id: 2, code: CurrencyCode.kau, sortPriority: 2, orderPriority: 1 }
const currencyKvt = { id: 3, code: CurrencyCode.kvt, sortPriority: 6, orderPriority: 4 }

const symbolKvtGbp = {
  id: 'KVT_GBP',
  base: currencyKvt,
  quote: { id: 7, code: CurrencyCode.gbp, sortPriority: 7, orderPriority: 7 },
  fee: { id: 7, code: CurrencyCode.gbp, sortPriority: 7, orderPriority: 7 },
  orderRange: 0.3,
}

const symbolKvtEur = {
  id: 'KVT_EUR',
  base: currencyKvt,
  quote: { id: 4, code: CurrencyCode.euro, sortPriority: 5, orderPriority: 6 },
  fee: { id: 4, code: CurrencyCode.euro, sortPriority: 5, orderPriority: 6 },
  orderRange: 0.3,
}
const symbolKauUsd = {
  id: 'KAU_USD',
  base: currencyKau,
  quote: currencyUsd,
  fee: currencyKau,
  orderRange: 0.3,
}
const symbolKvtUsd = {
  id: 'KVT_USD',
  base: currencyKvt,
  quote: currencyUsd,
  fee: currencyUsd,
  orderRange: 0.3,
}
const symbolKvtKau = {
  id: 'KVT_KAU',
  base: currencyKvt,
  quote: currencyKau,
  fee: currencyKau,
  orderRange: 0.3,
}

const feeCurrencyToUsdDepthMidPrice = 20
const vatRate = 0.1

const orderAmount = 10

const sellOrderId = 2
const sellAccountId = 'sell-account-id'
const sellerExecutionFee = 0.3

const buyOrderId = 1
const buyAccountId = 'buy-account-id'
const buyerExecutionFee = 0.2

describe('vat_handler', () => {
  beforeEach(async () => {
    sinon.restore()
  })

  after(async () => {
    sinon.restore()
  })

  describe('getExecutionFeeInUsd', () => {
    it('USD is in the symbol pair and fee currency is base currency', async () => {
      const feeInUsd = await getExecutionFeeInUsd(buyerExecutionFee, symbolKauUsd, feeCurrencyToUsdDepthMidPrice)
      expect(feeInUsd).to.eql(new Decimal(feeCurrencyToUsdDepthMidPrice).times(buyerExecutionFee))
    })

    it('USD is in the symbol pair and fee currency is quote currency', async () => {
      const feeInUsd = await getExecutionFeeInUsd(buyerExecutionFee, symbolKvtUsd, feeCurrencyToUsdDepthMidPrice)
      expect(feeInUsd).to.eql(new Decimal(buyerExecutionFee))
    })

    it('USD is not in the symbol pair, fee currency is not EUR', async () => {
      const feeInUsd = await getExecutionFeeInUsd(buyerExecutionFee, symbolKvtKau, feeCurrencyToUsdDepthMidPrice)
      expect(feeInUsd.toNumber()).to.eql(new Decimal(buyerExecutionFee).times(feeCurrencyToUsdDepthMidPrice).toNumber())
    })

    it('USD is not in the symbol pair, fee currency is EUR', async () => {
      const latestEurUsdRate = 1.21
      sinon.stub(fxRateProviderOperations, 'getQuoteFor').callsFake(() => Promise.resolve(new Decimal(latestEurUsdRate)))
      const feeInUsd = await getExecutionFeeInUsd(buyerExecutionFee, symbolKvtEur, feeCurrencyToUsdDepthMidPrice)
      expect(feeInUsd).to.eql(new Decimal(buyerExecutionFee).times(latestEurUsdRate))
    })

    it('USD is not in the symbol pair, fee currency is GBP', async () => {
      const latestGbpUsdRate = 1.21
      sinon.stub(fxRateProviderOperations, 'getQuoteFor').callsFake(() => Promise.resolve(new Decimal(latestGbpUsdRate)))
      const feeInUsd = await getExecutionFeeInUsd(buyerExecutionFee, symbolKvtGbp, feeCurrencyToUsdDepthMidPrice)
      expect(feeInUsd).to.eql(new Decimal(buyerExecutionFee).times(latestGbpUsdRate))
    })
  })

  describe('calculateVatUsdValue', () => {
    it('USD is in the symbol pair and fee currency is base currency', async () => {
      const fee = await calculateVatUsdValue(buyerExecutionFee, symbolKauUsd, feeCurrencyToUsdDepthMidPrice, vatRate)
      const expectResult = new Decimal(feeCurrencyToUsdDepthMidPrice)
        .times(buyerExecutionFee)
        .times(vatRate)
        .dividedBy(new Decimal(1).plus(vatRate))
      expect(fee).to.eql(expectResult)
    })

    it('USD is in the symbol pair and fee currency is quote currency', async () => {
      const fee = await calculateVatUsdValue(buyerExecutionFee, symbolKvtUsd, feeCurrencyToUsdDepthMidPrice, vatRate)
      const expectResult = new Decimal(buyerExecutionFee).times(vatRate).dividedBy(new Decimal(1).plus(vatRate))
      expect(fee).to.eql(expectResult)
    })

    it('USD is not in the symbol pair', async () => {
      const fee = await calculateVatUsdValue(buyerExecutionFee, symbolKvtKau, feeCurrencyToUsdDepthMidPrice, vatRate)
      const expectResult = new Decimal(buyerExecutionFee)
        .times(feeCurrencyToUsdDepthMidPrice)
        .times(vatRate)
        .dividedBy(new Decimal(1).plus(vatRate))
      expect(fee).to.eql(expectResult)
    })
  })
  describe('getVatFees', () => {
    const chfForOneUsd = 12.3

    it('USD is in the symbol pair and fee currency is base currency', async () => {
      sinon.stub(fxRateProviderOperations, 'getQuoteFor').callsFake(() => Promise.resolve(new Decimal(chfForOneUsd)))

      const orderMatch = createOrderMatch(symbolKauUsd)

      const expectBuyerTaxInFeeCurrency = new Decimal(vatRate)
        .times(buyerExecutionFee)
        .dividedBy(new Decimal(1).plus(vatRate))
        .toDP(20, Decimal.ROUND_DOWN)
        .toString()

      const expectBuyerTaxInChf = new Decimal(feeCurrencyToUsdDepthMidPrice)
        .times(buyerExecutionFee)
        .times(vatRate)
        .dividedBy(new Decimal(1).plus(vatRate))
        .times(chfForOneUsd)
        .toDP(20, Decimal.ROUND_DOWN)
        .toString()

      const expectSellerTaxInFeeCurrency = new Decimal(vatRate)
        .times(sellerExecutionFee)
        .dividedBy(new Decimal(1).plus(vatRate))
        .toDP(20, Decimal.ROUND_DOWN)
        .toString()

      const expectSellerTaxInChf = new Decimal(feeCurrencyToUsdDepthMidPrice)
        .times(sellerExecutionFee)
        .times(vatRate)
        .dividedBy(new Decimal(1).plus(vatRate))
        .times(chfForOneUsd)
        .toDP(20, Decimal.ROUND_DOWN)
        .toString()

      const { buyerVatAmount, sellerVatAmount } = await getVatFees({
        buyerExecutionFee,
        sellerExecutionFee,
        orderMatch,
        symbol: symbolKauUsd,
        vatRate,
      })
      expect(buyerVatAmount.valueInCHF.toString()).to.eql(expectBuyerTaxInChf)
      expect(buyerVatAmount.valueInFeeCurrency.toString()).to.eql(expectBuyerTaxInFeeCurrency)
      expect(sellerVatAmount.valueInCHF.toString()).to.eql(expectSellerTaxInChf)
      expect(sellerVatAmount.valueInFeeCurrency.toString()).to.eql(expectSellerTaxInFeeCurrency)
    })

    it('USD is in the symbol pair and fee currency is quote currency', async () => {
      sinon.stub(fxRateProviderOperations, 'getQuoteFor').callsFake(() => Promise.resolve(new Decimal(chfForOneUsd)))

      const orderMatch = createOrderMatch(symbolKvtUsd)
      const expectBuyerTaxInFeeCurrency = new Decimal(buyerExecutionFee)
        .times(vatRate)
        .dividedBy(new Decimal(1).plus(vatRate))
        .toDP(20, Decimal.ROUND_DOWN)
        .toString()
      const expectBuyerTaxInChf = new Decimal(buyerExecutionFee)
        .times(vatRate)
        .dividedBy(new Decimal(1).plus(vatRate))
        .times(chfForOneUsd)
        .toDP(20, Decimal.ROUND_DOWN)
        .toString()

      const expectSellerTaxInFeeCurrency = new Decimal(sellerExecutionFee)
        .times(vatRate)
        .dividedBy(new Decimal(1).plus(vatRate))
        .toDP(20, Decimal.ROUND_DOWN)
        .toString()
      const expectSellerTaxInChf = new Decimal(sellerExecutionFee)
        .times(vatRate)
        .dividedBy(new Decimal(1).plus(vatRate))
        .times(chfForOneUsd)
        .toDP(20, Decimal.ROUND_DOWN)
        .toString()
      const { buyerVatAmount, sellerVatAmount } = await getVatFees({
        buyerExecutionFee,
        sellerExecutionFee,
        orderMatch,
        symbol: symbolKvtUsd,
        vatRate,
      })
      expect(buyerVatAmount.valueInCHF.toString()).to.eql(expectBuyerTaxInChf)
      expect(buyerVatAmount.valueInFeeCurrency.toString()).to.eql(expectBuyerTaxInFeeCurrency)
      expect(sellerVatAmount.valueInCHF.toString()).to.eql(expectSellerTaxInChf)
      expect(sellerVatAmount.valueInFeeCurrency.toString()).to.eql(expectSellerTaxInFeeCurrency)
    })

    it('USD is not in the symbol pair', async () => {
      sinon.stub(fxRateProviderOperations, 'getQuoteFor').callsFake(() => Promise.resolve(new Decimal(chfForOneUsd)))

      const orderMatch = createOrderMatch(symbolKvtKau)

      const expectBuyerTaxInFeeCurrency = new Decimal(vatRate)
        .times(buyerExecutionFee)
        .dividedBy(new Decimal(1).plus(vatRate))
        .toDP(20, Decimal.ROUND_DOWN)
        .toString()
      const expectBuyerTaxInChf = new Decimal(feeCurrencyToUsdDepthMidPrice)
        .times(buyerExecutionFee)
        .times(vatRate)
        .dividedBy(new Decimal(1).plus(vatRate))
        .times(chfForOneUsd)
        .toDP(20, Decimal.ROUND_DOWN)
        .toString()

      const expectSellerTaxInFeeCurrency = new Decimal(vatRate)
        .times(sellerExecutionFee)
        .dividedBy(new Decimal(1).plus(vatRate))
        .toDP(20, Decimal.ROUND_DOWN)
        .toString()
      const expectSellerTaxInChf = new Decimal(feeCurrencyToUsdDepthMidPrice)
        .times(sellerExecutionFee)
        .times(vatRate)
        .dividedBy(new Decimal(1).plus(vatRate))
        .times(chfForOneUsd)
        .toDP(20, Decimal.ROUND_DOWN)
        .toString()
      const { buyerVatAmount, sellerVatAmount } = await getVatFees({
        buyerExecutionFee,
        sellerExecutionFee,
        orderMatch,
        symbol: symbolKvtKau,
        vatRate,
      })
      expect(buyerVatAmount.valueInCHF.toString()).to.eql(expectBuyerTaxInChf)
      expect(buyerVatAmount.valueInFeeCurrency.toString()).to.eql(expectBuyerTaxInFeeCurrency)
      expect(sellerVatAmount.valueInCHF.toString()).to.eql(expectSellerTaxInChf)
      expect(sellerVatAmount.valueInFeeCurrency.toString()).to.eql(expectSellerTaxInFeeCurrency)
    })
  })
})

const createOrderMatch = (symbol: SymbolPair): UsdMidPriceEnrichedOrderMatch => ({
  id: 1,
  symbolId: symbol.id,
  amount: orderAmount,
  matchPrice: feeCurrencyToUsdDepthMidPrice,
  consideration: 1,
  sellAccountId,
  sellOrderId,
  sellOrderType: OrderType.limit,
  buyAccountId,
  buyOrderId,
  buyOrderType: OrderType.limit,
  status: OrderMatchStatus.matched,
  feeCurrencyToUsdMidPrice: feeCurrencyToUsdDepthMidPrice,
})

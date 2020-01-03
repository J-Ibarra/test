import { expect } from 'chai'
import Decimal from 'decimal.js'
import sinon from 'sinon'
import * as realTimeCalculationOperations from '@abx-service-clients/market-data'
import * as symbolOperations from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import * as fxRateOperations from '@abx-utils/fx-rate'
import { PreferredCurrencyEnrichedBalance } from '@abx-types/balance'
import { BalanceRetrievalFacade, BalanceRetrievalHandler } from '../../core'
import { createBalance } from '../test_utils'

const balanceRetrievalFacade = BalanceRetrievalFacade.getInstance()

const accountId = 'f3123f'
const kagCurrency = {
  id: 1,
  code: CurrencyCode.kag,
}
const kagAvailableBalance = 10
const kagToUsdSymbolId = 'KAG_USD'
const kagUsdPairLatestPrice = 12

const kauCurrency = {
  id: 2,
  code: CurrencyCode.kau,
}
const kauAvailableBalance = 20
const kauUsdSymbolId = 'KAU_USD'
const kauUsdPairLatestPrice = 14

describe('BalanceRetrievalFacade', () => {
  afterEach(async () => {
    sinon.restore()
  })

  it('findAllBalancesForAccount should retrieve all balances for an account and compute the preferred currency amount for each balance', async () => {
    stubBalanceRetrieval()
    stubSymbolsForUSDRetrieval()

    sinon.stub(realTimeCalculationOperations, 'calculateRealTimeMidPriceForSymbols').callsFake(() =>
      Promise.resolve(
        new Map<string, number>([
          [kagToUsdSymbolId, kagUsdPairLatestPrice],
          [kauUsdSymbolId, kauUsdPairLatestPrice],
        ]),
      ),
    )

    const completeBalance = await balanceRetrievalFacade.findAllBalancesForAccount(accountId)
    expect(completeBalance.preferredCurrencyTotal).to.eql(kagAvailableBalance * kagUsdPairLatestPrice + kauAvailableBalance * kauUsdPairLatestPrice)
    expect(completeBalance.balances.length).to.eql(2)

    const currency1Balance = completeBalance.balances.find(({ currency }) => currency === kagCurrency.code)
    verifyBalanceAmountsMatchExpected(currency1Balance!, kagAvailableBalance, kagUsdPairLatestPrice, kagCurrency.code)

    const currency2Balance = completeBalance.balances.find(({ currency }) => currency === kauCurrency.code)
    verifyBalanceAmountsMatchExpected(currency2Balance!, kauAvailableBalance, kauUsdPairLatestPrice, kauCurrency.code)
  })

  it('findAllBalancesForAccount should use fx provider for EUR rate', async () => {
    const eurAvailableBalance = 10
    const eurCurrencyId = 4
    const eurToUsdRate = 1.12
    stubBalanceRetrieval([
      createBalance({
        accountId,
        currencyId: eurCurrencyId,
        currency: (CurrencyCode.euro as unknown) as undefined,
        availableBalance: eurAvailableBalance,
        pendingDepositBalance: 0,
        pendingDebitCardTopUpBalance: 0,
        pendingWithdrawalBalance: 0,
        pendingRedemptionBalance: 0,
        reservedBalance: 0,
      }),
    ])
    stubSymbolsForUSDRetrieval()

    sinon.stub(realTimeCalculationOperations, 'calculateRealTimeMidPriceForSymbols').callsFake(() => Promise.resolve(new Map<string, number>()))
    sinon.stub(fxRateOperations, 'getQuoteFor').callsFake(() => Promise.resolve(new Decimal(eurToUsdRate)))

    const completeBalance = await balanceRetrievalFacade.findAllBalancesForAccount(accountId)
    expect(completeBalance.preferredCurrencyTotal).to.eql(new Decimal(eurAvailableBalance).times(eurToUsdRate).toNumber())
    expect(completeBalance.balances.length).to.eql(1)

    verifyBalanceAmountsMatchExpected(completeBalance.balances[0], eurAvailableBalance, eurToUsdRate, CurrencyCode.euro)
  })
})

const verifyBalanceAmountsMatchExpected = (
  balance: PreferredCurrencyEnrichedBalance,
  availableBalance: number,
  lastestMidPrice: number,
  currency: CurrencyCode,
) => {
  expect(balance).to.eql({
    currency,
    total: {
      amount: availableBalance,
      preferredCurrencyAmount: new Decimal(availableBalance).times(lastestMidPrice).toNumber(),
    },
    available: {
      amount: availableBalance,
      preferredCurrencyAmount: new Decimal(availableBalance).times(lastestMidPrice).toNumber(),
    },
    reserved: {
      amount: 0,
      preferredCurrencyAmount: 0,
    },
    pendingDeposit: {
      amount: 0,
      preferredCurrencyAmount: 0,
    },
    pendingWithdrawal: {
      amount: 0,
      preferredCurrencyAmount: 0,
    },
    pendingDebitCardTopUp: {
      amount: 0,
      preferredCurrencyAmount: 0,
    },
    pendingRedemption: {
      amount: 0,
      preferredCurrencyAmount: 0,
    },
    displayFormat: balance.displayFormat,
  })
}

const defaultBalances = [
  createBalance({
    accountId,
    currencyId: kagCurrency.id,
    currency: (kagCurrency.code as unknown) as undefined,
    availableBalance: kagAvailableBalance,
    pendingDepositBalance: 0,
    pendingWithdrawalBalance: 0,
    pendingRedemptionBalance: 0,
    pendingDebitCardTopUpBalance: 0,
    reservedBalance: 0,
  }),
  createBalance({
    accountId,
    currencyId: kauCurrency.id,
    currency: (kauCurrency.code as unknown) as undefined,
    availableBalance: kauAvailableBalance,
    pendingDepositBalance: 0,
    pendingWithdrawalBalance: 0,
    pendingRedemptionBalance: 0,
    pendingDebitCardTopUpBalance: 0,
    reservedBalance: 0,
  }),
]

const stubBalanceRetrieval = (balances = defaultBalances) => {
  sinon.stub(BalanceRetrievalHandler.prototype, 'findAllBalancesForAccount').callsFake(() => Promise.resolve(balances))
}

const stubSymbolsForUSDRetrieval = () => {
  sinon.stub(symbolOperations, 'getSymbolsForQuoteCurrency').callsFake(() =>
    Promise.resolve([
      {
        id: kagToUsdSymbolId,
        base: kagCurrency,
        quote: {
          id: 3,
          code: CurrencyCode.usd,
        },
        fee: kagCurrency,
        orderRange: 0.3,
      },
      {
        id: kauUsdSymbolId,
        base: kauCurrency,
        quote: {
          id: 3,
          code: CurrencyCode.usd,
        },
        fee: kauCurrency,
        orderRange: 0.3,
      },
    ]),
  )
}

import { SourceEventType } from '@abx-types/balance'
import { sequelize } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as marketDataOperations from '@abx-service-clients/market-data'
import { createAccountAndSession } from '@abx-query-libs/account'
import { expect } from 'chai'
import sinon from 'sinon'
import request from 'supertest'
import { bootstrapRestApi } from '..'
import { BalanceMovementFacade } from '../../core'

const balanceMovementFacade = BalanceMovementFacade.getInstance()
const kauToUsdLatestBuyPrice = 12
const kauToUsdLatestSellPrice = 12
const expectedKauUsdMidPrice = (kauToUsdLatestBuyPrice + kauToUsdLatestSellPrice) / 2

const ethToUsdLatestBuyPrice = 10
const ethToUsdLatestSellPrice = 10
const expectedEthToUsdMidPrice = (ethToUsdLatestBuyPrice + ethToUsdLatestSellPrice) / 2

const kauAvailableBalance = 50
const ethereumAvailableBalance = 100

describe.skip('api:balances', function() {
  let app
  const kauId = 1
  const ethId = 3
  const symbols = [{ id: 'KAU_USD' }, { id: 'ETH_USD' }]
  const currencies = [
    {
      id: 1,
      code: CurrencyCode.kau,
    },
    {
      id: 2,
      code: CurrencyCode.kag,
    },
    {
      id: 3,
      code: CurrencyCode.ethereum,
    },
    {
      id: 4,
      code: CurrencyCode.usd,
    },
  ]

  before(async () => {
    sinon.restore()
    sinon.stub(referenceDataOperations, 'findAllCurrencies').resolves(currencies)
    sinon.stub(referenceDataOperations, 'getSymbolsForQuoteCurrency').resolves(symbols)
    sinon.stub(marketDataOperations, 'calculateRealTimeMidPriceForSymbols').resolves(
      new Map([
        ['KAU_USD', expectedKauUsdMidPrice],
        ['KAG_USD', expectedKauUsdMidPrice],
        ['ETH_USD', expectedEthToUsdMidPrice],
      ]),
    )
  })

  beforeEach(async () => {
    app = bootstrapRestApi()
  })

  afterEach(async () => {
    await app.close()
  })

  it.skip('returns a 401 error if not logged in', async () => {
    const { body, status } = await request(app).get(`/api/balances`)

    expect(status).to.eql(401)
    expect(Object.keys(body)).to.have.lengthOf(1)
    expect(body.error).to.eql('Authorization header not present')
  })

  it('retrieves the balance of all currencies including the preferred currency price(initially hardcoded to USD)', async () => {
    const { account, cookie } = await createAccountAndSession()

    await setupAvailableBalance(account.id, ethId, kauId)

    const { body: completeBalanceDetails, status } = await request(app)
      .get(`/api/balances`)
      .set('Cookie', cookie)

    expect(status).to.eql(200)

    expect(completeBalanceDetails).to.have.property('accountId', account.id)
    expect(completeBalanceDetails.balances).to.have.property('length', currencies.length)

    const kauBalance = completeBalanceDetails.balances.find(balance => balance.currency === CurrencyCode.kau)

    expect(kauBalance.available).to.have.property('amount', kauAvailableBalance)
    expect(kauBalance.available).to.have.property('preferredCurrencyAmount', kauAvailableBalance * expectedKauUsdMidPrice)

    const ethereumBalance = completeBalanceDetails.balances.find(balance => balance.currency === CurrencyCode.ethereum)

    expect(ethereumBalance.available).to.have.property('amount', ethereumAvailableBalance)
    expect(ethereumBalance.available).to.have.property('preferredCurrencyAmount', ethereumAvailableBalance * expectedEthToUsdMidPrice)
  })
})

const setupAvailableBalance = (accountId: string, ethereumId: number, kauId: number) => {
  return sequelize.transaction(async t => {
    await balanceMovementFacade.updateAvailable({
      t,
      accountId,
      amount: ethereumAvailableBalance,
      currencyId: ethereumId,
      sourceEventId: 1,
      sourceEventType: 'trade' as SourceEventType,
    })

    return balanceMovementFacade.updateAvailable({
      t,
      accountId,
      amount: kauAvailableBalance,
      currencyId: kauId,
      sourceEventId: 1,
      sourceEventType: 'trade' as SourceEventType,
    })
  })
}

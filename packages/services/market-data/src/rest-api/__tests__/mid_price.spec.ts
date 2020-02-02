import { expect } from 'chai'
import * as sinon from 'sinon'
import request from 'supertest'
import * as realTimeMidPriceCalculatorFunctions from '@abx-service-clients/market-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { bootstrapRestApi as bootstrapApi, MARKET_DATA_REST_API_PORT } from '..'
import { createAccountAndSession } from '@abx-utils/account'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as depthCacheUtils from '@abx-utils/in-memory-depth-cache'
import * as midPriceOperations from '../../core'
import { truncateTables, getCacheClient } from '@abx/db-connection-utils'

describe('api:mid-price', () => {
  let app
  let targetSymbolId = `${CurrencyCode.kau}_${CurrencyCode.usd}`

  beforeEach(async () => {
    app = bootstrapApi().listen(MARKET_DATA_REST_API_PORT)
    sinon.stub(referenceDataOperations, 'getAllSymbolPairSummaries').resolves([
      {
        id: targetSymbolId,
      },
    ])
  })

  afterEach(async () => {
    await app.close()
    await truncateTables()
    await getCacheClient().flush()
    sinon.restore()
  })

  describe('getMidPriceForSymbolPair', () => {
    it('return 401 when client is not login', async () => {
      await request(app)
        .get(`/api/mid-price?symbolPairId=${targetSymbolId}`)
        .set('Accept', 'application/json')
        .expect(401)
    })

    it('return 400 when the symbol pair id is not provided', async () => {
      const { cookie } = await createAccountAndSession()

      await request(app)
        .get(`/api/mid-price`)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .expect(400)
    })

    it('return 200 when the symbol pair is provided', async () => {
      const { cookie } = await createAccountAndSession()

      const { body, status } = await request(app)
        .get(`/api/mid-price?symbolPairId=${targetSymbolId}`)
        .set('Cookie', cookie)
        .set('Accept', 'application/json')

      expect(status).to.eql(200)
      expect(body).to.eql([])
    })
  })

  describe('getRealTimeMidPriceForWalletSymbols', () => {
    it('return 401 when client is not login', async () => {
      await request(app)
        .get('/api/mid-price/real-time')
        .set('Accept', 'application/json')
        .expect(401)
    })

    it('returns 200 and the midprices for all symbols', async function() {
      const { cookie } = await createAccountAndSession()
      const midPrices = {
        KAU: 42,
        KAG: 21,
      }

      const realTimeMidpriceForWalletSymbolsStub = sinon.stub(midPriceOperations, 'convertRealTimeMidPriceForSymbolsToObject').resolves(midPrices)

      const { body, status } = await request(app)
        .get('/api/mid-price/real-time')
        .set('Cookie', cookie)
        .set('Accept', 'application/json')

      expect(status).to.eql(200)
      expect(body).to.eql(midPrices)
      expect(realTimeMidpriceForWalletSymbolsStub.calledOnce).to.eql(true)
    })
  })

  describe('getRealTimeMidPriceForSymbol', () => {
    it('return 401 when client is not login', async () => {
      await request(app)
        .get('/api/mid-price/real-time/KAU_KAG')
        .set('Accept', 'application/json')
        .expect(401)
    })

    it('returns 200 and the midprices for all symbols', async function() {
      const { cookie } = await createAccountAndSession()
      const midPrice = 21

      const depth = {} as any
      sinon.stub(depthCacheUtils.DepthCacheFacade.prototype, 'getDepthForCurrencyPair').resolves(depth)

      const realTimeMidpriceForSymbolStub = sinon.stub(realTimeMidPriceCalculatorFunctions, 'calculateRealTimeMidPriceForSymbol').resolves(midPrice)

      const { body, status } = await request(app)
        .get('/api/mid-price/real-time/KAU_KAG')
        .set('Cookie', cookie)
        .set('Accept', 'application/json')

      expect(status).to.eql(200)
      expect(body).to.eql({ price: midPrice })
      expect(realTimeMidpriceForSymbolStub.calledOnceWith('KAU_KAG')).to.eql(true)
    })
  })
})

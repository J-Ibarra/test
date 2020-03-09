import sinon from 'sinon'
import { expect } from 'chai'

import { reactToBidDepthUpdate, reactToAskDepthUpdate } from '../depth_update_recorders'
import { DepthUpdate } from '@abx-types/order'
import { CacheFirstMidPriceRepository } from '../../core'
import * as coreOperations from '../../core'

describe('depth_update_recorders', () => {
  afterEach(() => sinon.restore())

  describe('reactToBidDepthUpdate', () => {
    it('should record mid price change when top of depth updated and depth > 0', async () => {
      const topOfDepthUpdate = { amount: 10, price: 10 }

      const depthUpdate: DepthUpdate = {
        topOfDepthUpdated: true,
        symbolId: 'KAU_USD',
        aggregateDepth: [topOfDepthUpdate],
        oppositeDepthTopOrder: undefined as any,
        ordersFromDepth: [],
      }

      const recordDepthMidPriceChangeStub = sinon.stub(CacheFirstMidPriceRepository.prototype, 'recordDepthMidPriceChange')
      const storeBidPriceStub = sinon.stub(coreOperations, 'storeBidPrice').resolves()

      await reactToBidDepthUpdate(depthUpdate)

      expect(storeBidPriceStub.calledWith(topOfDepthUpdate.price, depthUpdate.symbolId)).to.eql(true)
      expect(recordDepthMidPriceChangeStub.calledWith(depthUpdate.symbolId, topOfDepthUpdate, depthUpdate.oppositeDepthTopOrder)).to.eql(true)
    })

    it('should record bid price change when depth is empty', async () => {
      const depthUpdate: DepthUpdate = {
        topOfDepthUpdated: true,
        symbolId: 'KAU_USD',
        aggregateDepth: [],
        oppositeDepthTopOrder: undefined as any,
        ordersFromDepth: [],
      }

      const recordDepthMidPriceChangeStub = sinon.stub(CacheFirstMidPriceRepository.prototype, 'recordDepthMidPriceChange')
      const storeBidPriceStub = sinon.stub(coreOperations, 'storeBidPrice').resolves()

      await reactToBidDepthUpdate(depthUpdate)

      expect(storeBidPriceStub.calledWith(0, depthUpdate.symbolId)).to.eql(true)
      expect(recordDepthMidPriceChangeStub.calledOnce).to.eql(false)
    })
  })

  describe('reactToAskDepthUpdate', () => {
    it('should record mid price change when top of depth updated and depth > 0', async () => {
      const topOfDepthUpdate = { amount: 10, price: 10 }

      const depthUpdate: DepthUpdate = {
        topOfDepthUpdated: true,
        symbolId: 'KAU_USD',
        aggregateDepth: [topOfDepthUpdate],
        oppositeDepthTopOrder: undefined as any,
        ordersFromDepth: [],
      }

      const recordDepthMidPriceChangeStub = sinon.stub(CacheFirstMidPriceRepository.prototype, 'recordDepthMidPriceChange')
      const storeBidPriceStub = sinon.stub(coreOperations, 'storeAskPrice').resolves()

      await reactToAskDepthUpdate(depthUpdate)

      expect(storeBidPriceStub.calledWith(topOfDepthUpdate.price, depthUpdate.symbolId)).to.eql(true)
      expect(recordDepthMidPriceChangeStub.calledWith(depthUpdate.symbolId, depthUpdate.oppositeDepthTopOrder, topOfDepthUpdate)).to.eql(true)
    })

    it('should record ask price change when depth is empty', async () => {
      const depthUpdate: DepthUpdate = {
        topOfDepthUpdated: true,
        symbolId: 'KAU_USD',
        aggregateDepth: [],
        oppositeDepthTopOrder: undefined as any,
        ordersFromDepth: [],
      }

      const recordDepthMidPriceChangeStub = sinon.stub(CacheFirstMidPriceRepository.prototype, 'recordDepthMidPriceChange')
      const storeBidPriceStub = sinon.stub(coreOperations, 'storeAskPrice').resolves()

      await reactToAskDepthUpdate(depthUpdate)

      expect(storeBidPriceStub.calledWith(0, depthUpdate.symbolId)).to.eql(true)
      expect(recordDepthMidPriceChangeStub.calledOnce).to.eql(false)
    })
  })
})

import { expect } from 'chai'
import { OrderDirection } from '@abx-types/order'
import { getDepthForSymbol } from '../../order-matcher/core/order-match-handling/depth'
import { SymbolPair } from '@abx-types/reference-data'
import { getDepthFromCache } from '../../order-matcher/core/order-match-handling/depth/redis'

export async function verifySellOrderAtDepthLevel({ orderId, pair, expectedRemaining = 0, level }): Promise<void> {
  const depthForSymbol = await getDepthForSymbol(pair.id)

  const askDepthTop = depthForSymbol[OrderDirection.sell][level]

  expect(askDepthTop.id === orderId && askDepthTop.remaining === expectedRemaining).to.eql(true)
}

export async function verifySellOrderPresentInDepth({ orderId, pair, expectedRemaining = 0 }): Promise<void> {
  const depthForSymbol = await getDepthForSymbol(pair.id)

  expect(depthForSymbol[OrderDirection.sell].some(({ id, remaining }) => id === orderId && remaining === expectedRemaining)).to.eql(true)
}

export async function waitForSellOrderToAppearInDepth({ orderId, pair, account }) {
  const depthForSymbol = await getDepthFromCache(pair.id)

  const orderPresentInDepth = depthForSymbol[OrderDirection.sell].some(({ id, accountId }) => id === orderId && accountId === account)

  if (!orderPresentInDepth) {
    await new Promise(res => setTimeout(res, 100))
    return waitForSellOrderToAppearInDepth({ orderId, pair, account })
  }

  return
}

export async function waitForBuyOrderToAppearInDepth({ orderId, pair, account }) {
  const depthForSymbol = await getDepthFromCache(pair.id)

  const orderPresentInDepth = depthForSymbol[OrderDirection.buy].some(({ id, accountId }) => id === orderId && accountId === account)

  if (!orderPresentInDepth) {
    await new Promise(res => setTimeout(res, 100))
    return waitForBuyOrderToAppearInDepth({ orderId, pair, account })
  }

  return
}

export async function verifyBuyOrderPresentInDepth({ orderId, pair, expectedRemaining = 0 }): Promise<void> {
  const depthForSymbol = await getDepthForSymbol(pair.id)

  expect(depthForSymbol[OrderDirection.buy].some(({ id, remaining }) => id === orderId && remaining === expectedRemaining)).to.eql(true)
}

export async function verifyBuyOrderAtDepthLevel({ orderId, pair, expectedRemaining = 0, level }): Promise<void> {
  const depthForSymbol = await getDepthForSymbol(pair.id)

  const bidDepthTop = depthForSymbol[OrderDirection.buy][level] || { id: '', remaining: undefined }

  expect(bidDepthTop.id === orderId && bidDepthTop.remaining === expectedRemaining).to.eql(true)
}

export async function waitForOrderToAppearInBuyDepth(pair: SymbolPair, orderId: number) {
  return waitForOrderToAppearInDepth(OrderDirection.buy, pair, orderId)
}

export async function waitForOrderToAppearInSellDepth(pair: SymbolPair, orderId: number) {
  return waitForOrderToAppearInDepth(OrderDirection.sell, pair, orderId)
}

async function waitForOrderToAppearInDepth(direction: OrderDirection, pair: SymbolPair, orderId: number) {
  const depthForSymbol = await getDepthForSymbol(pair.id)

  const orderInDepth = depthForSymbol[direction].some(({ id }) => id === orderId)
  if (orderInDepth) {
    return true
  }

  await new Promise(res => setTimeout(res, 100))
  return waitForOrderToAppearInDepth(direction, pair, orderId)
}

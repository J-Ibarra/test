import { Controller, Get, Query, Request, Route, Security } from 'tsoa'

import { getApiCacheClient } from '@abx/db-connection-utils'
import { ACCOUNT_ALL_ORDERS_CACHE_KEY, findOrders } from '../../../core'
import { Order, OrderDirection, OrderStatus } from '@abx-types/order'
import { DepthCacheFacade, enrichWithOwnedAmount } from '@abx-utils/in-memory-depth-cache'
import { OverloadedRequest } from '@abx-types/account'

@Route('depth')
export class DepthController extends Controller {
  private depthCacheFacade: DepthCacheFacade

  private async initialiseDepthCache() {
    this.depthCacheFacade = await DepthCacheFacade.createDepthCacheForAllSymbols()
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/{symbolId}/{direction}/top')
  public async getTopOfDepthForCurrencyPairAndDirection(symbolId: string, direction: OrderDirection) {
    return this.depthCacheFacade.getTopOfDepthForDirectionAndCurrencyPair(direction, symbolId)
  }

  @Get('/{symbolId}')
  public async getDepthForCurrencyPair(
    symbolId: string,
    @Query() limit = 100,
    @Request() request: OverloadedRequest,
    @Query() direction?: OrderDirection,
  ) {
    await this.initialiseDepthCache()
    const symbolDepth = await this.depthCacheFacade.getDepthForCurrencyPair(symbolId, limit)
    const openOrdersForAccount = await this.getOpenOrdersForAccount(request.account!.id, symbolId, direction)

    if (!!direction) {
      return {
        buy:
          direction === OrderDirection.buy
            ? enrichWithOwnedAmount(
                symbolDepth.buy,
                openOrdersForAccount.filter(({ direction: orderDirection }) => orderDirection === OrderDirection.buy),
              )
            : [],
        sell:
          direction === OrderDirection.sell
            ? enrichWithOwnedAmount(
                symbolDepth.sell,
                openOrdersForAccount.filter(({ direction: orderDirection }) => orderDirection === OrderDirection.sell),
              )
            : [],
      }
    }

    return {
      buy: enrichWithOwnedAmount(
        symbolDepth.buy,
        openOrdersForAccount.filter(({ direction: orderDirection }) => orderDirection === OrderDirection.buy),
      ),
      sell: enrichWithOwnedAmount(
        symbolDepth.sell,
        openOrdersForAccount.filter(({ direction: orderDirection }) => orderDirection === OrderDirection.sell),
      ),
    }
  }

  private async getOpenOrdersForAccount(accountId: string, symbolId: string, direction?: OrderDirection) {
    const openOrdersQuery = direction
      ? {
          direction,
          status: [OrderStatus.partialFill, OrderStatus.submit],
        }
      : {
          status: [OrderStatus.partialFill, OrderStatus.submit],
        }

    let cachedOrdersQueryResponse: Order[] | null = await getApiCacheClient().getCache(
      `${ACCOUNT_ALL_ORDERS_CACHE_KEY}-${accountId}-${JSON.stringify(openOrdersQuery)}`,
    )

    if (!cachedOrdersQueryResponse) {
      cachedOrdersQueryResponse = await findOrders({
        where: {
          accountId,
          ...openOrdersQuery,
        } as any,
      })
    }

    return cachedOrdersQueryResponse.filter(({ symbolId: orderSymbolId }) => orderSymbolId === symbolId)
  }
}

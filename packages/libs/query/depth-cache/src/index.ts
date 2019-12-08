import { getCacheClient } from '@abx/db-connection-utils'
import { OrderDirection, SymbolDepth } from '@abx-types/order'
import { DepthCache, DepthCacheState, DepthCacheSymbol } from '@abx-types/depth-cache'

import { get, head, isEmpty } from 'lodash'
import moment from 'moment'

import { getAggregateDepth } from './depth_aggregator'

/**
 * Defines a facade which can be used to retrieve a depth aggregation {@link  DepthItem} for buys and sell orders for different symbols.
 * It is intended to be used by clients who need a high level view of the current depth, retrieved in an effective way, without the need to access specific order details.
 */
export class DepthCacheFacade {
  constructor(private state: DepthCacheState) {}

  /**
   * Retrieves the aggregated view of the current depth cache.
   * For better efficiency the depth aggregation is kept in memory and is considered fresh if it has been updated less than 3 seconds. If more than 3 seconds have passed the aggregation is refreshed from cache.
   * @returns the aggregated view of the depth cache
   */
  public async getAggregatedDepth(): Promise<DepthCache | {}> {
    if (this.cacheRefreshedMoreThan3SecondsAgo()) {
      await this.refreshStateFromCache()
    }

    return this.state.depthCache || {}
  }

  /**
   * Retrieves the top of the depth price for a given symbol and order direction.
   *
   * @param orderDirection the order direction
   * @param symbolId the ID of the currency pair
   */
  public async getDepthForCurrencyPair(symbolId: string, limit: number, direction?: OrderDirection): Promise<DepthCacheSymbol> {
    const depth = await this.getAggregatedDepth()
    const symbolDepth = depth[symbolId] || { buy: [], sell: [] }

    const aggregatedDepthForSymbol = {
      buy: symbolDepth.buy.slice(0, limit),
      sell: symbolDepth.sell.slice(0, limit),
    }

    return !!direction ? aggregatedDepthForSymbol[direction] : aggregatedDepthForSymbol
  }

  /**
   * Retrieves the top of the depth price for a set of symbolIds
   *
   * @param symbolIds the IDs of the currency pairs
   */
  public async getDepthForCurrencyPairs(symbolIds: string[], limit: number): Promise<DepthCache> {
    const depth = await this.getAggregatedDepth()

    return symbolIds.reduce((depthAcc, symbolId) => {
      const symbolDepth = depth[symbolId] || { buy: [], sell: [] }

      return {
        ...depthAcc,
        [symbolId]: {
          buy: symbolDepth.buy.slice(0, limit),
          sell: symbolDepth.sell.slice(0, limit),
        },
      }
    }, {} as DepthCache)
  }

  /**
   * Retrieves the top of the depth price for a given symbol and order direction.
   *
   * @param orderDirection the order direction
   * @param symbolId the ID of the currency pair
   */
  public async getTopOfDepthForDirectionAndCurrencyPair(orderDirection: OrderDirection, symbolId: string): Promise<{ price: number }> {
    const depth = await this.getAggregatedDepth()

    return {
      price: get(head(depth[symbolId][orderDirection]), 'price', 0),
    }
  }

  private cacheRefreshedMoreThan3SecondsAgo(): boolean {
    return !this.state.lastCacheFetch || moment(this.state.lastCacheFetch).isBefore(moment().subtract(3, 'seconds'))
  }

  private async refreshStateFromCache() {
    const cachedDepthForAllSymbols = await getCacheClient().getAll<SymbolDepth>(
      this.state.symbolIds.map(symbolId => `exchange:symbol:depth:${symbolId}`),
    )

    if (!isEmpty(cachedDepthForAllSymbols)) {
      this.state.depthCache = this.createFreshDepthAggregation(cachedDepthForAllSymbols)
    }
  }

  private createFreshDepthAggregation(depth: SymbolDepth[]): DepthCache {
    return depth.reduce((aggregate: DepthCache, currentDepth, index) => {
      const currentSymbolId = this.state.symbolIds[index]

      aggregate[currentSymbolId] = {
        buy: getAggregateDepth(get(currentDepth, OrderDirection.buy, [])),
        sell: getAggregateDepth(get(currentDepth, OrderDirection.sell, [])),
      }

      return aggregate
    }, {} as DepthCache)
  }
}

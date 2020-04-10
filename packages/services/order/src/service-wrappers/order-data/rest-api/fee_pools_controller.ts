import { Controller, Route, Get, Tags } from 'tsoa'
import { getApiCacheClient } from '@abx-utils/db-connection-utils'
import { FeePool } from '@abx-types/order'
import { findAllFeePools, findFeePool } from '../core/fee_pool_retrieval'

@Tags('order')
@Route('fee-pools')
export class FeePoolsController extends Controller {
  @Get()
  public async getFeePools(): Promise<FeePool[]> {
    const cacheClient = getApiCacheClient()
    const cacheKey = 'fee-pools'
    const cachedResponse = await cacheClient.getCache<FeePool[]>(cacheKey)

    if (cachedResponse) {
      return cachedResponse
    }

    return findAllFeePools()
  }

  @Get('/{currencyCode}')
  public async getFeePool(currencyCode: string): Promise<FeePool> {
    const cacheClient = getApiCacheClient()
    const cacheKey = `fee-pools-${currencyCode}`
    const cachedResponse = await cacheClient.getCache<FeePool>(cacheKey)

    if (cachedResponse) {
      return cachedResponse
    }

    return findFeePool(currencyCode)
  }
}

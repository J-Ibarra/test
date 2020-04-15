import { Controller, Get, Route, Security, Tags, Hidden, Query } from 'tsoa'
import { OrderAdminSummary } from '@abx-types/order'
import { getOrdersCount, getOrderCountForAccountHin, getAllOrdersAdminSummary, getAllOrdersForAccountHin } from '../../../core'
import { getApiCacheClient } from '@abx-utils/db-connection-utils'

@Tags('order')
@Route('admin')
export class AdminOrdersController extends Controller {
  private readonly ADMIN_ORDER_COUNT_CACHE_KEY = 'admin-orders-count'

  @Get('orders/count')
  public async retrieveAllOrdersCount(@Query() accountHin?: string): Promise<{ total: number }> {
    let cachedResponse = await getApiCacheClient().getCache<{ adminOrdersCount: number }>(this.constructOrderCountCacheKey(accountHin))

    if (!cachedResponse) {
      const adminOrdersCount = !!accountHin ? await getOrderCountForAccountHin(accountHin) : await getOrdersCount()
      cachedResponse = { adminOrdersCount }

      await getApiCacheClient().setCache(this.constructOrderCountCacheKey(accountHin), { adminOrdersCount }, 30_000)
    }

    return {
      total: cachedResponse.adminOrdersCount,
    }
  }

  private constructOrderCountCacheKey(accountHin?: string) {
    return accountHin ? `${this.ADMIN_ORDER_COUNT_CACHE_KEY}-${accountHin}` : this.ADMIN_ORDER_COUNT_CACHE_KEY
  }

  @Security('adminAuth')
  @Get('orders')
  @Hidden()
  public async getAllOrders(@Query() limit?: number, @Query() offset?: number): Promise<OrderAdminSummary[]> {
    return getAllOrdersAdminSummary({ limit, offset })
  }

  @Security('adminAuth')
  @Get('orders/accounts/{accountHin}')
  @Hidden()
  public async getOrdersForAccount(accountHin: string, @Query() limit?: number, @Query() offset?: number): Promise<OrderAdminSummary[]> {
    return getAllOrdersForAccountHin(accountHin, { limit, offset })
  }
}

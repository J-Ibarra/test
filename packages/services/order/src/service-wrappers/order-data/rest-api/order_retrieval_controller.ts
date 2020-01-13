import { Controller, Get, Request, Route, Security } from 'tsoa'
import { OverloadedRequest } from '@abx-types/account'
import { Logger } from '@abx/logging'
import { getApiCacheClient } from '@abx/db-connection-utils'
import * as orderRetrieval from '../../../core'
import { CoreOrderDetails, OrderWithTradeTransactions } from '@abx-types/order'
import { CurrencyCode } from '@abx-types/reference-data'

@Route('orders')
export class OrderRetrievalController extends Controller {
  private logger = Logger.getInstance('api', 'OrderRetrievalController')

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get()
  public async getOrdersForCurrentAccount(@Request() request: OverloadedRequest): Promise<OrderWithTradeTransactions[]> {
    this.logger.debug(`Retrieving orders for ${request.account!.id}`)
    const cachedResponse: OrderWithTradeTransactions[] | false | null = await getApiCacheClient().getCache(
      `${orderRetrieval.ACCOUNT_ALL_ORDERS_CACHE_KEY}-${request.account!.id}-${JSON.stringify(request.where)}`,
    )

    if (cachedResponse) {
      return cachedResponse
    }

    return orderRetrieval.findAllOrdersForAccount(request.account!.id, request.where)
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('{orderId}')
  public async getOrder(orderId: number, @Request() request: OverloadedRequest): Promise<CoreOrderDetails | void> {
    const requestingUserId = request.account!.id

    const order = await orderRetrieval.findOrder(orderId)

    if (!order) {
      this.setStatus(400)
      return
    } else if (order.accountId !== requestingUserId) {
      this.setStatus(403)
      return
    }

    this.setStatus(200)
    return order
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/currencies/{currency}')
  public async getOrdersForCurrency(currency: CurrencyCode, @Request() request: OverloadedRequest): Promise<OrderWithTradeTransactions[]> {
    this.logger.debug(`Retrieving orders for currency ${currency}, requested by ${request.account!.id}`)
    const cachedResponse: OrderWithTradeTransactions[] | false | null = await getApiCacheClient().getCache(
      `${orderRetrieval.ACCOUNT_CURRENCY_ORDERS_CACHE_KEY}-${currency}-${request.account!.id}-${JSON.stringify(request.where)}`,
    )

    if (cachedResponse) {
      return cachedResponse
    }

    return orderRetrieval.findOrdersForCurrency(request.account!.id, currency)
  }
}

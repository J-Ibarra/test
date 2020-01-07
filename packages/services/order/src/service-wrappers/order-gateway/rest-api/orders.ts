import { noticeError } from 'newrelic'
import { Body, Controller, Delete, Get, Post, Request, Response, Route, Security, SuccessResponse } from 'tsoa'
import util from 'util'
import { findAccountById } from '@abx-service-clients/account'
import { AccountStatus, OverloadedRequest } from '@abx-types/account'
import { Logger } from '@abx/logging'
import { getApiCacheClient } from '@abx/db-connection-utils'
import * as orderRetrieval from '../../../core'
import { CancelOrderRequest, CoreOrderDetails, Order, OrderWithTradeTransactions, PlaceOrderRequest } from '@abx-types/order'
import { isFiatCurrency } from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { ApiErrorPayload } from '@abx-types/error'
import { findOrdersForCurrency, findAllOrdersForAccount } from '../../../core'
import { placeOrder } from '../core/place_order'
import { OrderCancellationGateway } from '../core/order_cancellation_gateway'

@Route('orders')
export class OrdersController extends Controller {
  private logger = Logger.getInstance('api', 'OrdersController')

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

    return findAllOrdersForAccount(request.account!.id, request.where)
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

    return findOrdersForCurrency(request.account!.id, currency)
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @SuccessResponse('201', 'Created')
  @Response('403', 'Forbidden')
  @Post()
  public async createOrder(
    @Body() requestBody: Partial<PlaceOrderRequest>,
    @Request() request: OverloadedRequest,
  ): Promise<Order | ApiErrorPayload | void> {
    const completeReq: PlaceOrderRequest = {
      ...requestBody,
      accountId: request.account!.id,
    } as any

    const { suspended: isSuspended, status } = await findAccountById(request.account!.id)
    if (isSuspended) {
      this.setStatus(403)
      return
    }

    const currency = completeReq.symbolId!.split('_') as CurrencyCode[]
    if (status !== AccountStatus.kycVerified && (isFiatCurrency(currency[0]) || isFiatCurrency(currency[1]))) {
      this.setStatus(403)
      return { message: 'non-kycVerified user cannot place order in fiat pair.' }
    }

    this.logger.debug(`Placing a ${requestBody.direction} order for account ${request.account!.id} and symbol id ${requestBody.symbolId}`)
    this.logger.debug(`Order: ${JSON.stringify(completeReq)}`)

    try {
      const order = await placeOrder(completeReq)

      this.logger.debug(`Created order ${order.id}`)
      this.logger.debug(util.inspect(order))
      this.setStatus(200)

      return order
    } catch (e) {
      this.logger.error(`Error thrown trying to place order for ${requestBody.amount} ${requestBody.symbolId} for account ${request.account!.id}`)
      this.logger.error(e)
      if (e.context && e.context.name === 'ValidationError') {
        this.setStatus(400)
      } else {
        this.setStatus(500)
      }

      return { message: e.message }
    }
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @SuccessResponse('204', 'No Response')
  @Delete('{id}')
  public async cancelOrder(id: number, @Request() request: OverloadedRequest): Promise<{ orderId: number } | ApiErrorPayload> {
    this.logger.debug(`Cancelling order ${id} for account ${request.account!.id}`)

    const query = {
      where: { id, accountId: request.account!.id },
    }

    try {
      const orders = await orderRetrieval.findOrders(query)
      this.logger.debug(`Orders found: ${JSON.stringify(orders)}`)
      if (!orders.length) {
        this.logger.warn(`User ${request.account!.id} tried to cancel invalid order ${id}`)
        this.setStatus(400)
        return {
          message: 'Invalid order',
        }
      }

      const cancellationQuery: CancelOrderRequest = { orderId: orders[0].id!, cancellationReason: 'Order cancelled by client' }
      const cancelledOrder = await OrderCancellationGateway.getInstance().cancelOrder(cancellationQuery)

      this.setStatus(200)

      return {
        orderId: cancelledOrder.id!,
      }
    } catch (e) {
      this.logger.error(`Error thrown trying to cancel order id ${id} for account ${request.account!.id}`)
      noticeError(e)
      if (e.context && e.context.name === 'ValidationError') {
        this.setStatus(400)
      } else {
        this.setStatus(500)
      }

      return { message: `Cancellation of order id ${id} has hit an issue. Please try again.` }
    }
  }
}

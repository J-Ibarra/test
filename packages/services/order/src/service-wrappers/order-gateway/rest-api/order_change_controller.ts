import { noticeError } from 'newrelic'
import { Body, Controller, Delete, Post, Request, Response, Route, Security, SuccessResponse } from 'tsoa'
import util from 'util'
import { findAccountById } from '@abx-service-clients/account'
import { AccountStatus, OverloadedRequest } from '@abx-types/account'
import { Logger } from '@abx-utils/logging'
import * as orderRetrieval from '../../../core'
import { CancelOrderRequest, Order, PlaceOrderRequest } from '@abx-types/order'
import { isFiatCurrency } from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { ApiErrorPayload } from '@abx-types/error'
import { placeOrder } from '../core/place_order'
import { OrderCancellationGateway } from '../core/order_cancellation_gateway'

@Route('orders')
export class OrderChangeController extends Controller {
  private logger = Logger.getInstance('api', 'OrderChangeController')

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

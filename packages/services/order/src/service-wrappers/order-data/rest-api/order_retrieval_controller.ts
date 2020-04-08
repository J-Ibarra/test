import { Controller, Get, Request, Route, Security, Tags } from 'tsoa'
import { OverloadedRequest } from '@abx-types/account'
import { Logger } from '@abx-utils/logging'
import * as orderRetrieval from '../../../core'
import { CoreOrderDetails, OrderWithTradeTransactions } from '@abx-types/order'
import { CurrencyCode } from '@abx-types/reference-data'

@Tags('order')
@Route('orders')
export class OrderRetrievalController extends Controller {
  private logger = Logger.getInstance('api', 'OrderRetrievalController')

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get()
  public async getOrdersForCurrentAccount(@Request() request: OverloadedRequest): Promise<OrderWithTradeTransactions[]> {
    this.logger.debug(`Retrieving orders for ${request.account!.id}`)

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

    return orderRetrieval.findOrdersForCurrency(request.account!.id, currency)
  }
}

import { Controller, Get, Request, Route, Security, Tags } from 'tsoa'
import { OverloadedRequest } from '@abx-types/account'
import { Logger } from '@abx-utils/logging'
import * as orderRetrieval from '../../../core'
import { CoreOrderDetails, OrderWithTradeTransactions, TradeTransaction } from '@abx-types/order'
import { CurrencyCode } from '@abx-types/reference-data'
import { findTradeTransactions } from '../../../core'
import { DBOrder } from '@abx-utils/db-connection-utils'

export type OrderExecutionSummary = Pick<TradeTransaction, 'id' | 'amount' | 'matchPrice'>

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
  @Get('{orderId}/executions')
  public async getOrderExecutions(orderId: number, @Request() request: OverloadedRequest): Promise<OrderExecutionSummary[] | void> {
    const requestingUserId = request.account!.id

    const { rows: tradeTransactions } = await findTradeTransactions({
      where: {
        orderId,
      },
      order: [['createdAt', DBOrder.ASC]],
    })

    if (tradeTransactions.length > 0 && tradeTransactions[0].accountId !== requestingUserId) {
      this.setStatus(403)
      return
    }

    return tradeTransactions.map(({ id, matchPrice, amount }) => ({
      id: id!,
      amount,
      matchPrice,
    }))
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

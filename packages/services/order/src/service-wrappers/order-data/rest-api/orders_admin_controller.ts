import { Controller, Delete, Get, Route, Security } from 'tsoa'
import { Logger } from '@abx/logging'
import { OrderAdminSummary } from '@abx-types/order'
import { getAllOrdersAdminSummary, getAllOrdersForAccountHin } from '../../../core'
import { cancelOrder } from '@abx-service-clients/order'

@Route('admin')
export class AdminOrdersController extends Controller {
  private logger = Logger.getInstance('api', 'AdminOrdersController')

  @Security('adminAuth')
  @Get('orders')
  public async getAllOrders(): Promise<OrderAdminSummary[]> {
    return getAllOrdersAdminSummary()
  }

  @Security('adminAuth')
  @Get('/orders/accounts/{accountHin}')
  public async getOrdersForAccount(accountHin: string): Promise<OrderAdminSummary[]> {
    return getAllOrdersForAccountHin(accountHin)
  }

  @Security('adminAuth')
  @Delete('/orders/{id}')
  public async cancelOrder(id: number): Promise<{ orderId: number }> {
    this.logger.debug(`Cancelling order ${id}`)

    return cancelOder(id, 'Order cancelled by admin')
  }
}

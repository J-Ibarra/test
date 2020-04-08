import { Controller, Get, Route, Security, Tags } from 'tsoa'
import { OrderAdminSummary } from '@abx-types/order'
import { getAllOrdersAdminSummary, getAllOrdersForAccountHin } from '../../../core'

@Tags('order')
@Route('admin')
export class AdminOrdersController extends Controller {
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
}

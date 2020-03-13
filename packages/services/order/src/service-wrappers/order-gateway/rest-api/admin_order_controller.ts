import { Controller, Security, Delete, Route } from 'tsoa'
import { Logger } from '@abx-utils/logging'
import { OrderCancellationGateway } from '../core/order_cancellation_gateway'

@Route()
export class AdminOrderChangeController extends Controller {
  private logger = Logger.getInstance('api', 'AdminOrderChangeController')
  private orderCancellationGateway: OrderCancellationGateway = OrderCancellationGateway.getInstance()

  @Security('adminAuth')
  @Delete('/admin/orders/{id}')
  public async cancelOrder(id: number): Promise<{ orderId: number }> {
    this.logger.debug(`Cancelling order ${id}`)

    const cancelledOrder = await this.orderCancellationGateway.cancelOrder({
      orderId: id,
      cancellationReason: 'Order cancelled by admin',
    })

    return { orderId: cancelledOrder.id! }
  }
}

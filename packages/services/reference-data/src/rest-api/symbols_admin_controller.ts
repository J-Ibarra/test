import { Controller, Patch, Route, Security, Body } from 'tsoa'
import { Logger } from '@abx-utils/logging'
import { ApiErrorPayload } from '@abx-types/error'
import { updateOrderRangeForSymbol } from '../core'

@Route('symbols/admin')
export class AdminSymbolsController extends Controller {
  private logger = Logger.getInstance('reference-data', 'AdminSymbolsController')

  @Security({
    cookieAuth: [],
    adminAuth: [],
  })
  @Patch('/{symbolId}')
  public async setOrderRangeForSymbol(symbolId: string, @Body() { amount }: { amount: number }): Promise<void | ApiErrorPayload> {
    try {
      this.setStatus(200)

      await updateOrderRangeForSymbol(symbolId, amount)
    } catch (e) {
      this.logger.error(`failed to update symbol order range ${e.message}`)

      this.setStatus(400)
      return { message: `Failed to update the order range for the symbol: ${symbolId}` }
    }
  }
}

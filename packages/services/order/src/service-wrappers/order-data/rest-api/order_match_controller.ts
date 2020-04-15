import { Controller, Get, Query, Route, Tags } from 'tsoa'
import { Logger } from '@abx-utils/logging'
import { findOrderMatchTransactions } from '../../../core'

@Tags('order')
@Route('order-matches')
export class OrderMatchesController extends Controller {
  private logger = Logger.getInstance('api', 'OrderMatchesController')

  @Get()
  public async getOrderMatches(@Query() symbolPairId: string, @Query() limit?: number) {
    if (!symbolPairId) {
      this.setStatus(400)
      return
    }

    try {
      const query = {
        where: {
          symbolId: symbolPairId,
        },
        order: [['createdAt', 'DESC']],
        limit: limit || 1,
      }

      this.logger.debug(`Retrieving order match transaction for symbol pair: ${symbolPairId}`)
      return await findOrderMatchTransactions(query)
    } catch (error) {
      this.setStatus(error.status || 400)
      this.logger.error(`Retrieving order match transaction for symbol pair ${symbolPairId} errors: ${error.status || 400} - ${error.message}`)
      return {
        message: error.message as string,
      }
    }
  }
}

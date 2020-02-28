import { EntityManager } from 'typeorm'
import { Logger, Inject, Injectable } from '@nestjs/common'
import util from 'util'

import { CardRepository, TopUpRequestRepository } from '../../shared-components/repositories'
import { TopUpDebitCardResponse } from './models/top-up-debit-card-response.model'
import { PLACE_ORDER_FACADE_TOKEN, ExchangeOrderPlacementFacade } from '../../shared-components/providers'
import { KinesisCryptoCurrency } from '../../shared-components/models'

@Injectable()
export class TopUpRecorder {
  private logger = new Logger('TopUpRecorder')

  constructor(
    private cardRepository: CardRepository,
    private topUpRequestRepository: TopUpRequestRepository,
    @Inject(PLACE_ORDER_FACADE_TOKEN)
    private placeOrderFacade: ExchangeOrderPlacementFacade,
  ) {}

  /**
   * Handles the workflow of loading an account with a certain amount of money.
   *
   * @param amount the amount to be loaded into the account
   * @param accountId the id of the account to be loaded
   * @param currency the kinesis krypto currency which is going to converted to real money
   * @param entityManager allows for a parent entityManager to be passed in, propagating a parent transaction
   */
  async recordTopUpRequest(
    amount: number,
    currency: KinesisCryptoCurrency,
    accountId: string,
    entityManager?: EntityManager,
  ): Promise<TopUpDebitCardResponse> {
    try {
      this.logger.debug(`Creating top up request for ${amount} ${currency} for account ${accountId}`)
      const debitCard = await this.cardRepository.getDebitCardForAccount(accountId, entityManager)

      this.logger.debug(`Placing sell market order for ${amount} ${currency} top up for account ${accountId}`)
      const orderId = await this.placeOrderFacade.createSellMarketOrder(accountId, currency, amount, debitCard.currency)

      const topUpRequest = await this.topUpRequestRepository.createTopUpRequest(debitCard, orderId, amount, currency, entityManager)

      return { topUpId: topUpRequest.id }
    } catch (e) {
      this.logger.error(`Error occured trying to top up debit card for ${accountId}`)
      this.logger.error(JSON.stringify(util.inspect(e)))
      throw e
    }
  }

  getTopUpRequest(topUpRequestId: number) {
    return this.topUpRequestRepository.getTopUpRequest({ topUpRequestId })
  }
}

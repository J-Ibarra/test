import { Logger, Injectable } from '@nestjs/common'

import { TopUpRequestRepository } from '../../../shared-components/repositories'
import { TopUpRequestStatus } from '../../../shared-components/models'
import { TopUpExecutor } from '../TopUpExecutor'

const THREE_MINUTES_IN_MILLIS = 3 * 60 * 1000

/** A mechanism which re-attempts top up requests that have previously failed. */
@Injectable()
export class BalanceReserverRetryHandler {
  private retryInProgress = false
  private logger = new Logger('BalanceReserverRetryHandler')

  constructor(private readonly topUpRequestRepository: TopUpRequestRepository, private readonly topUpExecutor: TopUpExecutor) {
    setInterval(() => {
      if (!this.retryInProgress) {
        this.retryInProgress = true
        this.retryFailedTopUpRequests()
      }
    }, Number(process.env.DEBIT_CARD_TOP_UP_RETRY_INTERVAL || THREE_MINUTES_IN_MILLIS))
  }

  async retryFailedTopUpRequests() {
    const failedProviderRequests = await this.topUpRequestRepository.find({
      where: { status: TopUpRequestStatus.balanceReserveFailed },
      relations: ['debitCard'],
    })

    if (failedProviderRequests.length > 0) {
      this.logger.log(`${failedProviderRequests.length} top up requests with failed provider request will be retried.`)

      await Promise.all(
        failedProviderRequests.map(failedProviderRequest => {
          this.logger.log(`Retrying failed balance reserve top up request ${failedProviderRequest.id}`)

          return this.topUpExecutor.executeTopUp(
            failedProviderRequest.id,
            failedProviderRequest.debitCard.accountId,
            failedProviderRequest.amountFilled!,
          )
        }),
      )
    }

    this.retryInProgress = false
  }
}

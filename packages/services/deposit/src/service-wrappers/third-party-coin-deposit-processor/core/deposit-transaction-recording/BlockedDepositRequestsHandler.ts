import { findDepositRequestsForStatus } from '../../../../core'
import { DepositRequestStatus } from '@abx-types/deposit'
import { HoldingsTransactionDispatcher } from '../holdings-transaction-creation/HoldingsTransactionDispatcher'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode } from '@abx-types/reference-data'

export class BlockedDepositRequestsHandler {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'BlockedDepositRequestsHandler')
  private readonly holdingsTransactionDispatcher = new HoldingsTransactionDispatcher()

  public async dispatchHoldingsTransactionForBlockedRequests(depositAddressId: number, currencyCode: CurrencyCode) {
    const blockedDepositRequests = await findDepositRequestsForStatus(
      depositAddressId!,
      DepositRequestStatus.blockedForHoldingsTransactionConfirmation,
    )

    if (blockedDepositRequests.length > 0) {
      this.logger.info(
        `${blockedDepositRequests.length} blocked ${currencyCode} requests found to be processed for deposit address ${depositAddressId}`,
      )
      await this.holdingsTransactionDispatcher.dispatchHoldingsTransactionForDepositRequests(blockedDepositRequests, currencyCode)
    }
  }
}

import { findDepositRequestsForStatuses, updateDepositRequestForHoldingsTxHash, HoldingsTransactionDispatcher } from '../../../../core'
import { DepositRequestStatus } from '@abx-types/deposit'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode } from '@abx-types/reference-data'

export class HoldingsTransactionConfirmationHandler {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'BlockedDepositRequestsHandler')
  private readonly holdingsTransactionDispatcher = new HoldingsTransactionDispatcher()

  public async handleHoldingsTransactionConfirmation(txid: string, depositAddressId: number, currencyCode: CurrencyCode) {
    const blockedDepositRequests = await findDepositRequestsForStatuses(depositAddressId!, [
      DepositRequestStatus.blockedForHoldingsTransactionConfirmation,
    ])

    await updateDepositRequestForHoldingsTxHash(txid, { status: DepositRequestStatus.completed })

    if (blockedDepositRequests.length > 0) {
      this.logger.info(
        `${blockedDepositRequests.length} blocked ${currencyCode} requests found to be processed for deposit address ${depositAddressId}`,
      )
      await this.holdingsTransactionDispatcher.dispatchHoldingsTransactionForDepositRequests(blockedDepositRequests, currencyCode)
    }
  }
}

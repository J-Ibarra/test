import { DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { updateDepositRequest, findDepositRequestByDepositTransactionHash, findDepositRequestsForStatus } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode } from '@abx-types/reference-data'
import { HoldingsTransactionDispatcher } from './HoldingsTransactionDispatcher'

export class HoldingsTransactionGateway {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'HoldingsTransactionGateway')
  private readonly holdingsTransactionDispatcher = new HoldingsTransactionDispatcher()

  public async dispatchHoldingsTransactionForConfirmedDepositRequest(txid: string, currency: CurrencyCode) {
    this.logger.info(`Received a deposit transaction confirmation for currency ${currency} and transaction hash ${txid}`)
    const depositRequest = await findDepositRequestByDepositTransactionHash(txid)

    if (!depositRequest) {
      this.logger.warn(`Deposit request not found for transaction ${txid}, not processing any further`)
      return
    }

    const isDepositTransactionCurrentlyProcessedForAddress = await this.checkIfPendingHoldingsTransactionIsAvailable(depositRequest)
    if (isDepositTransactionCurrentlyProcessedForAddress) {
      this.logger.info(
        `Attempted to process deposit request ${depositRequest.id} but requests already exist with pendingHoldingsTransaction status for the same address, current request will not be processed`,
      )
      await updateDepositRequest(depositRequest.id!, {
        status: DepositRequestStatus.blockedForHoldingsTransactionConfirmation,
      })

      return
    }

    await updateDepositRequest(depositRequest.id!, { status: DepositRequestStatus.pendingHoldingsTransaction })

    this.holdingsTransactionDispatcher.dispatchHoldingsTransactionForDepositRequests([depositRequest], currency)
  }

  private async checkIfPendingHoldingsTransactionIsAvailable(depositRequest: DepositRequest): Promise<boolean> {
    const depositRequests = await findDepositRequestsForStatus(depositRequest.depositAddressId!, DepositRequestStatus.pendingHoldingsTransaction)

    return depositRequests.length > 0
  }
}

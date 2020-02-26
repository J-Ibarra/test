import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { IConfirmedTransactionEventPayload } from '@abx-utils/blockchain-currency-gateway'
import { HoldingsTransactionDispatcher } from './HoldingsTransactionDispatcher'
import { findDepositRequestByDepositTransactionHash, updateDepositRequest } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { DepositRequestStatus } from '@abx-types/deposit'

export class DepositTransactionConfirmationQueuePoller {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'DepositTransactionConfirmationQueuePoller')

  private holdingsTransactionDispatcher = new HoldingsTransactionDispatcher()

  public bootstrapPoller() {
    const queuePoller = getQueuePoller()

    queuePoller.subscribeToQueueMessages<IConfirmedTransactionEventPayload>(
      process.env.DEPOSIT_ADDRESS_TRANSACTION_QUEUE__URL! || 'local-deposit-transaction-queue',
      this.processDepositAddressTransaction,
    )
  }

  private async processDepositAddressTransaction({ currency, txid }: IConfirmedTransactionEventPayload) {
    this.logger.info(`Received a deposit transaction confirmation for currency ${currency} and transaction hash ${txid}`)
    const depositRequest = await findDepositRequestByDepositTransactionHash(txid)

    if (!depositRequest) {
      this.logger.warn(`Deposit request not found for transaction ${txid}, not processing any further`)
      return
    }

    await this.holdingsTransactionDispatcher.transferTransactionAmountToHoldingsWallet(currency, txid, depositRequest)
    await updateDepositRequest(depositRequest.id!, { status: DepositRequestStatus.pendingHoldingsTransactionConfirmation })
  }
}

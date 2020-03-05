import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { IConfirmedTransactionEventPayload } from '@abx-utils/blockchain-currency-gateway'
import { findDepositRequestByHoldingsTransactionHash } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { DepositCompleter } from './DepositCompleter'
import { DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL } from '../constants'

export class HoldingsTransactionConfirmationQueuePoller {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'HoldingsTransactionConfirmationQueuePoller')
  private depositCompleter = new DepositCompleter()

  public bootstrapPoller() {
    const queuePoller = getQueuePoller()

    queuePoller.subscribeToQueueMessages<IConfirmedTransactionEventPayload>(
      DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL,
      this.completeDepositRequest.bind(this),
    )
  }

  private async completeDepositRequest({ currency, txid }: IConfirmedTransactionEventPayload) {
    this.logger.info(`Received a deposit transaction confirmation for currency ${currency} and transaction hash ${txid}`)
    const depositRequest = await findDepositRequestByHoldingsTransactionHash(txid)

    if (!depositRequest) {
      this.logger.warn(`Deposit request not found for holdings transaction ${txid}, not processing any further`)
      return
    }

    await this.depositCompleter.completeDepositRequest(depositRequest)
    this.logger.info(`Completed deposit request ${depositRequest.id}`)
  }
}

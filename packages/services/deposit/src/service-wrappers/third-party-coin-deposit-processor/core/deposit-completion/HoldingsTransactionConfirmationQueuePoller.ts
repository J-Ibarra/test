import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { IConfirmedTransactionEventPayload } from '@abx-utils/blockchain-currency-gateway'
import { findDepositRequestByHoldingsTransactionHash } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { DepositCompleter } from './DepositCompleter'

export class HoldingsTransactionConfirmationQueuePoller {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'HoldingsTransactionConfirmationQueuePoller')
  private depositCompleter = new DepositCompleter()

  public bootstrapPoller() {
    const queuePoller = getQueuePoller()

    queuePoller.subscribeToQueueMessages<IConfirmedTransactionEventPayload>(
      process.env.DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE__URL! || 'local-holdings-transactions-queue',
      this.completeDepositRequest,
    )
  }

  private async completeDepositRequest({ currency, txid }: IConfirmedTransactionEventPayload) {
    this.logger.info(`Received a deposit transaction confirmation for currency ${currency} and transaction hash ${txid}`)
    const depositRequest = await findDepositRequestByHoldingsTransactionHash(txid)

    if (!depositRequest) {
      this.logger.warn(`Deposit request not found for holdings transaction ${txid}, not processing any further`)
      return
    }

    return this.depositCompleter.completeDepositRequest(depositRequest)
  }
}

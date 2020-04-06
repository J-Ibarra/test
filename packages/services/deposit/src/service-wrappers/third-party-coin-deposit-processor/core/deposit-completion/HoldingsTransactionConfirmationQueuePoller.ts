import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { IConfirmedTransactionEventPayload } from '@abx-utils/blockchain-currency-gateway'
import { findDepositRequestsByHoldingsTransactionHash } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { DepositCompleter } from './DepositCompleter'
import { DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL } from '../constants'
import { CurrencyCode } from '@abx-types/reference-data'

export interface CompletionPendingTransactionDetails {
  currency: CurrencyCode
  txid: string
}

/**
 * The final step of the deposit flow, messages are queued after the holdings transactions are created.
 * The logic needs to make sure the right amount is credited to the user's available balance.
 * Any pre-existing deposit requests with amount < minimum deposit amount are added up to the current one.
 */
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

  private async completeDepositRequest({ currency, txid }: CompletionPendingTransactionDetails) {
    this.logger.info(`Received a deposit holdings transaction confirmation for currency ${currency} and transaction hash ${txid}`)
    const depositRequests = await findDepositRequestsByHoldingsTransactionHash(txid)

    if (depositRequests.length === 0) {
      this.logger.warn(`Deposit request not found for holdings transaction ${txid}, not processing any further`)
      return
    }

    await this.depositCompleter.completeDepositRequests(depositRequests)
    this.logger.info(`Completed deposit requests ${JSON.stringify(depositRequests)}`)
  }
}

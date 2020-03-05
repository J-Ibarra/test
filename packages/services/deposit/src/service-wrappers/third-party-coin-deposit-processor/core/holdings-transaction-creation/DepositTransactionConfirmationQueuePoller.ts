import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { IConfirmedTransactionEventPayload } from '@abx-utils/blockchain-currency-gateway'
import { HoldingsTransactionDispatcher } from './HoldingsTransactionDispatcher'
import { findDepositRequestByDepositTransactionHash } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { DEPOSIT_CONFIRMED_TRANSACTION_QUEUE_URL } from '../constants'

export class DepositTransactionConfirmationQueuePoller {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'DepositTransactionConfirmationQueuePoller')

  private holdingsTransactionDispatcher = new HoldingsTransactionDispatcher()

  public bootstrapPoller() {
    const queuePoller = getQueuePoller()

    queuePoller.subscribeToQueueMessages<IConfirmedTransactionEventPayload>(
      DEPOSIT_CONFIRMED_TRANSACTION_QUEUE_URL,
      this.processDepositAddressTransaction.bind(this),
    )
  }

  private async processDepositAddressTransaction({ currency, txid }: IConfirmedTransactionEventPayload) {
    this.logger.info(`Received a deposit transaction confirmation for currency ${currency} and transaction hash ${txid}`)
    const depositRequest = await findDepositRequestByDepositTransactionHash(txid)

    if (!depositRequest) {
      this.logger.warn(`Deposit request not found for transaction ${txid}, not processing any further`)
      return
    }

    await this.holdingsTransactionDispatcher.transferTransactionAmountToHoldingsWallet(currency, depositRequest)
  }
}

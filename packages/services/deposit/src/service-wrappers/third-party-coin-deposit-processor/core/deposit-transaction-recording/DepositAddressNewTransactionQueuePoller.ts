import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { IAddressTransactionEventPayload, BlockchainFacade } from '@abx-utils/blockchain-currency-gateway'
import { findDepositAddress } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { DEPOSIT_ADDRESS_UNCONFIRMED_TRANSACTION_QUEUE_URL } from '../constants'
import { NewTransactionRecorder } from './NewTransactionRecorder'

export class DepositAddressNewTransactionQueuePoller {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'NewDepositTransactionQueuePoller')
  private readonly newTransactionRecorder = new NewTransactionRecorder()

  public bootstrapPoller() {
    const queuePoller = getQueuePoller()

    queuePoller.subscribeToQueueMessages<IAddressTransactionEventPayload>(
      DEPOSIT_ADDRESS_UNCONFIRMED_TRANSACTION_QUEUE_URL,
      this.processDepositAddressTransaction.bind(this),
    )
  }

  private async processDepositAddressTransaction({ currency, address, txid }: IAddressTransactionEventPayload) {
    this.logger.info(`Received a new deposit transaction notification for currency ${currency} with address ${address}. Transaction ID: ${txid}`)

    const providerFacade = BlockchainFacade.getInstance(currency)
    const depositAddress = await findDepositAddress({ address })

    if (!depositAddress) {
      this.logger.warn(`Deposit address not found for transaction ${txid}, not processing deposit`)
      return
    }

    const depositTransactionDetails = await providerFacade.getTransaction(txid, address)

    this.newTransactionRecorder.recordDepositTransaction({
      currency,
      depositAddress,
      depositTransactionDetails,
    })
  }
}

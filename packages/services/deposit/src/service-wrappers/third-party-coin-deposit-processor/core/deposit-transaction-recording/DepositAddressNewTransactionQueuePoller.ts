import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { IAddressTransactionEventPayload, getOnChainCurrencyManagerForEnvironment } from '@abx-utils/blockchain-currency-gateway'
import { findDepositAddress } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { DEPOSIT_ADDRESS_UNCONFIRMED_TRANSACTION_QUEUE_URL } from '../constants'
import { NewTransactionRecorder } from './NewTransactionRecorder'
import { Environment } from '@abx-types/reference-data'
import { findCryptoCurrencies } from '@abx-service-clients/reference-data'

/**
 * Handles the first step of the deposit processing flow where new unconfirmed transaction
 * notifications are received. The transaction details are used to create a new `deposit_request` entry.
 * The deposit request is then queued for holdings transaction creations (Step 2).
 */
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

    const cryptoCurrencies = await findCryptoCurrencies()
    const onChainCurrencyManager = getOnChainCurrencyManagerForEnvironment(
      process.env.NODE_ENV as Environment,
      cryptoCurrencies.map(({ code }) => code),
    )
    const depositAddress = await findDepositAddress({ address })

    if (!depositAddress) {
      this.logger.warn(`Deposit address not found for transaction ${txid}, not processing deposit`)
      return
    }

    const depositTransactionDetails = await onChainCurrencyManager.getCurrencyFromTicker(currency).getTransaction(txid, address)

    this.newTransactionRecorder.recordDepositTransaction({
      currency,
      depositAddress,
      depositTransactionDetails,
    })
  }
}

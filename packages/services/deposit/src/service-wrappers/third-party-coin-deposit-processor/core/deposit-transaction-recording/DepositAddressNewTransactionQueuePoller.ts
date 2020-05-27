import { getQueuePoller, QueueConsumerOutput } from '@abx-utils/async-message-consumer'
import { IAddressTransactionEventPayload, IAddressTokenTransactionEventPayload } from '@abx-utils/blockchain-currency-gateway'
import { findDepositAddressByAddressOrPublicKey } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { DEPOSIT_ADDRESS_TRANSACTION_QUEUE_URL } from '../constants'
import { CurrencyCode, SymbolPairStateFilter } from '@abx-types/reference-data'
import { DepositAddressTransactionHandler } from './DepositAddressTransactionHandler'
import { findCurrencyForCode, getTokenForTransaction } from '@abx-service-clients/reference-data'

/**
 * Handles the first step of the deposit processing flow where new unconfirmed transaction
 * notifications are received. The transaction details are used to create a new `deposit_request` entry.
 * The deposit request is then queued for holdings transaction creations (Step 2).
 */
export class DepositAddressNewTransactionQueuePoller {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'NewDepositTransactionQueuePoller')
  private readonly depositAddressTransactionHandler = new DepositAddressTransactionHandler()
  private readonly currenciesSupported = [CurrencyCode.bitcoin, CurrencyCode.tether]

  public bootstrapPoller() {
    const queuePoller = getQueuePoller()

    queuePoller.subscribeToQueueMessages<IAddressTransactionEventPayload>(
      DEPOSIT_ADDRESS_TRANSACTION_QUEUE_URL,
      this.processNewDepositAddressTransaction.bind(this),
    )
  }

  private async processNewDepositAddressTransaction(
    payload: IAddressTransactionEventPayload | IAddressTokenTransactionEventPayload,
  ): Promise<void | QueueConsumerOutput> {
    try {
      // Checking if the transaction is an ECR20 token transaction
      if (!!payload['token_symbol']) {
        const tokenTransaction = payload as IAddressTokenTransactionEventPayload
        await this.processDepositAddressTransaction(
          getTokenForTransaction(tokenTransaction.token_symbol),
          tokenTransaction.address,
          tokenTransaction.txHash,
        )
      }

      const coinTransaction = payload as IAddressTransactionEventPayload
      await this.processDepositAddressTransaction(coinTransaction.currency, coinTransaction.address, coinTransaction.txid)
    } catch (e) {
      this.logger.error(`An error has ocurred while processing deposit request, skipping deletion.`)

      // Skipping deletion so message can be added to DLQ
      return { skipMessageDeletion: true }
    }
  }

  private async processDepositAddressTransaction(currency: CurrencyCode, address: string, txid: string) {
    this.logger.info(`Received a new deposit transaction notification for currency ${currency} with address ${address}. Transaction ID: ${txid}`)
    const depositCurrency = await findCurrencyForCode(currency, SymbolPairStateFilter.all)
    const depositAddress = await findDepositAddressByAddressOrPublicKey(address, depositCurrency.id)

    if (!depositAddress) {
      this.logger.warn(`Deposit address not found for transaction ${txid}, not processing deposit`)
      return
    } else if (!this.currenciesSupported.includes(currency)) {
      this.logger.warn(`Transaction notification received for ${currency} which is not supported and will not be processed`)
      return
    }

    await this.depositAddressTransactionHandler.handleDepositAddressTransaction(txid, depositAddress, currency)
  }
}

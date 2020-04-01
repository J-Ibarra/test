import { getQueuePoller } from '@abx-utils/async-message-consumer'
import {
  IAddressTransactionEventPayload,
  getOnChainCurrencyManagerForEnvironment,
  IAddressTokenTransactionEventPayload,
} from '@abx-utils/blockchain-currency-gateway'
import { findDepositAddressByAddressOrPublicKey } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { DEPOSIT_ADDRESS_UNCONFIRMED_TRANSACTION_QUEUE_URL } from '../constants'
import { NewTransactionRecorder } from './NewTransactionRecorder'
import { Environment, CurrencyCode } from '@abx-types/reference-data'

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
      this.processNewDepositAddressTransaction.bind(this),
    )
  }

  private processNewDepositAddressTransaction(payload: IAddressTransactionEventPayload | IAddressTokenTransactionEventPayload) {
    // Checking if the transaction is an ECR20 token transaction
    if (!!payload['token_symbol']) {
      const tokenTransaction = payload as IAddressTokenTransactionEventPayload
      return this.processDepositAddressTransaction(tokenTransaction.token_symbol as CurrencyCode, tokenTransaction.address, tokenTransaction.txHash)
    }

    const coinTransaction = payload as IAddressTransactionEventPayload
    return this.processDepositAddressTransaction(coinTransaction.currency, coinTransaction.address, coinTransaction.txid)
  }

  private async processDepositAddressTransaction(currency: CurrencyCode, address: string, txid: string) {
    this.logger.info(`Received a new deposit transaction notification for currency ${currency} with address ${address}. Transaction ID: ${txid}`)
    const depositAddress = await findDepositAddressByAddressOrPublicKey(address)

    if (!depositAddress) {
      this.logger.warn(`Deposit address not found for transaction ${txid}, not processing deposit`)
      return
    }

    const onChainCurrencyManager = getOnChainCurrencyManagerForEnvironment(process.env.NODE_ENV as Environment, [currency])
    const depositTransactionDetails = await onChainCurrencyManager.getCurrencyFromTicker(currency).getTransaction(txid, address)

    if (!!depositTransactionDetails) {
      this.newTransactionRecorder.recordDepositTransaction({
        currency,
        depositAddress,
        depositTransactionDetails,
      })
    }
  }
}

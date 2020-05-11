import { getQueuePoller, QueueConsumerOutput } from '@abx-utils/async-message-consumer'
import { IAddressTransactionEventPayload, IAddressTokenTransactionEventPayload } from '@abx-utils/blockchain-currency-gateway'
import { findDepositAddressByAddressOrPublicKey } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { DEPOSIT_ADDRESS_TRANSACTION_QUEUE_URL } from '../constants'
import { Environment, CurrencyCode } from '@abx-types/reference-data'
import { DepositAddressTransactionHandler } from './DepositAddressTransactionHandler'

/**
 * Handles the first step of the deposit processing flow where new unconfirmed transaction
 * notifications are received. The transaction details are used to create a new `deposit_request` entry.
 * The deposit request is then queued for holdings transaction creations (Step 2).
 */
export class DepositAddressNewTransactionQueuePoller {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'NewDepositTransactionQueuePoller')
  private readonly depositAddressTransactionHandler = new DepositAddressTransactionHandler()

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
        await this.processDepositAddressTransaction(this.getTokenForTransaction(tokenTransaction), tokenTransaction.address, tokenTransaction.txHash)
      }

      const coinTransaction = payload as IAddressTransactionEventPayload
      await this.processDepositAddressTransaction(coinTransaction.currency, coinTransaction.address, coinTransaction.txid)
    } catch (e) {
      this.logger.error(`An error has ocurred while processing deposit request, skipping deletion.`)

      // Skipping deletion so message can be added to DLQ
      return { skipMessageDeletion: true }
    }
  }

  /**
   * For ERC20 tokens (e.g Tether) when tests are executed we actually test with the YEENUS ERC20 token.
   * So, the transactions that we receive will be YEENUS token transactions which we want to process as tether.
   */
  private getTokenForTransaction({ token_symbol }: IAddressTokenTransactionEventPayload): CurrencyCode {
    return token_symbol === 'YEENUS' && process.env.NODE_EN !== Environment.production ? CurrencyCode.tether : (token_symbol as CurrencyCode)
  }

  private async processDepositAddressTransaction(currency: CurrencyCode, address: string, txid: string) {
    this.logger.info(`Received a new deposit transaction notification for currency ${currency} with address ${address}. Transaction ID: ${txid}`)
    const depositAddress = await findDepositAddressByAddressOrPublicKey(address)

    if (!depositAddress) {
      this.logger.warn(`Deposit address not found for transaction ${txid}, not processing deposit`)
      return
    }

    await this.depositAddressTransactionHandler.handleDepositAddressTransaction(txid, depositAddress, currency)
  }
}

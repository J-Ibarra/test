import { getQueuePoller } from '@abx-utils/async-message-consumer'
import {
  IAddressTransactionEventPayload,
  getOnChainCurrencyManagerForEnvironment,
  IAddressTokenTransactionEventPayload,
  Transaction,
} from '@abx-utils/blockchain-currency-gateway'
import { findDepositAddressByAddressOrPublicKey, getMinimumDepositAmountForCurrency } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { DEPOSIT_ADDRESS_TRANSACTION_QUEUE_URL } from '../constants'
import { NewTransactionRecorder } from './NewTransactionRecorder'
import { Environment, CurrencyCode } from '@abx-types/reference-data'
import { HoldingsTransactionDispatcher } from '../holdings-transaction-creation/HoldingsTransactionDispatcher'
import { DepositAddress } from '@abx-types/deposit'
import { DepositCompleter } from '../deposit-completion/DepositCompleter'

/**
 * Handles the first step of the deposit processing flow where new unconfirmed transaction
 * notifications are received. The transaction details are used to create a new `deposit_request` entry.
 * The deposit request is then queued for holdings transaction creations (Step 2).
 */
export class DepositAddressNewTransactionQueuePoller {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'NewDepositTransactionQueuePoller')
  
  private DEFAULT_REQUIRED_DEPOSIT_TRANSACTION_CONFIRMATIONS = 1

  public bootstrapPoller() {
    const queuePoller = getQueuePoller()
    
    queuePoller.subscribeToQueueMessages<IAddressTransactionEventPayload>(
      DEPOSIT_ADDRESS_TRANSACTION_QUEUE_URL,
      this.processNewDepositAddressTransaction.bind(this),
    )
  }

  private processNewDepositAddressTransaction(payload: IAddressTransactionEventPayload | IAddressTokenTransactionEventPayload) {
    // Checking if the transaction is an ECR20 token transaction
    if (!!payload['token_symbol']) {
      const tokenTransaction = payload as IAddressTokenTransactionEventPayload
      return this.processDepositAddressTransaction(this.getTokenForTransaction(tokenTransaction), tokenTransaction.address, tokenTransaction.txHash)
    }

    const coinTransaction = payload as IAddressTransactionEventPayload
    return this.processDepositAddressTransaction(coinTransaction.currency, coinTransaction.address, coinTransaction.txid)
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

    const onChainCurrencyManager = getOnChainCurrencyManagerForEnvironment(process.env.NODE_ENV as Environment, [currency])
    const depositTransactionDetails = await onChainCurrencyManager.getCurrencyFromTicker(currency).getTransaction(txid, address)

    if (!!depositTransactionDetails && depositTransactionDetails.receiverAddress === address) {
      await this.handleDepositAddressTransaction(depositTransactionDetails, depositAddress, txid, currency)
    } else if (!!depositTransactionDetails && depositTransactionDetails.senderAddress === address && 
      depositTransactionDetails.receiverAddress === process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS) {
        await this.handleHoldingsConfirmation(depositTransactionDetails, currency, txid)
      }
  }

  private async handleHoldingsConfirmation(depositTransactionDetails: Transaction, currency: CurrencyCode, txid: string) {
    if ((depositTransactionDetails.confirmations || 0) >= this.getRequiredConfirmationsForDepositTransaction(currency)) { 
      const depositCompleter = new DepositCompleter()
      await depositCompleter.completeDepositRequest(txid)
    }
  }

  private async handleDepositAddressTransaction(depositTransactionDetails: Transaction, 
    depositAddress: DepositAddress, txid: string, currency: CurrencyCode) {

    // the deposit request will be created only once
    const newTransactionRecorder = new NewTransactionRecorder()
    await newTransactionRecorder.recordDepositTransaction({
      currency,
      depositAddress,
      depositTransactionDetails,
    })
    if ((depositTransactionDetails.confirmations || 0) >= this.getRequiredConfirmationsForDepositTransaction(currency)) { 
      await this.processHoldingsTransaction(depositTransactionDetails.amount, currency, txid)
    }
  }

  private async processHoldingsTransaction(depositAmount: number, currency: CurrencyCode, txid: string) {
    const depositAmountAboveMinimumForCurrency = getMinimumDepositAmountForCurrency(currency) <= depositAmount
    if (depositAmountAboveMinimumForCurrency) {
      const holdingsTransactionDispatcher = new HoldingsTransactionDispatcher()
      await holdingsTransactionDispatcher.processDepositAddressTransaction(txid, currency)
    }
  }

  private getRequiredConfirmationsForDepositTransaction(currency: CurrencyCode) {
    if (currency === CurrencyCode.bitcoin) {
      return Number(process.env.BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS)
    }

    return this.DEFAULT_REQUIRED_DEPOSIT_TRANSACTION_CONFIRMATIONS
  }
}

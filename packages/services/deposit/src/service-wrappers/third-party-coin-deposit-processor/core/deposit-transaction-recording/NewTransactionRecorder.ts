import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'
import {
  FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION,
  findDepositRequestsWhereTransactionHashPresent,
  createNewDepositRequest,
  getMinimumDepositAmountForCurrency,
} from '../../../../core'
import { Transaction, BlockchainFacade } from '@abx-utils/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositAddress, DepositRequestStatus } from '@abx-types/deposit'
import { Logger } from '@abx-utils/logging'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'
import { DEPOSIT_CONFIRMED_TRANSACTION_QUEUE_URL } from '../constants'
import { ConfirmedDepositTransactionPayload } from '../holdings-transaction-creation/DepositTransactionConfirmationQueuePoller'

interface NewTransactionDetails {
  currency: CurrencyCode
  depositAddress: DepositAddress
  depositTransactionDetails: Transaction
}

const logger = Logger.getInstance('public-coin-deposit-processor', 'NewTransactionRecorder')

/**
 * Responsible for
 */
export class NewTransactionRecorder {
  private DEFAULT_REQUIRED_DEPOSIT_TRANSACTION_CONFIRMATIONS = 1

  async recordDepositTransaction({ currency, depositTransactionDetails, depositAddress }: NewTransactionDetails) {
    const transactionToBePersisted = await this.shouldPersistTransaction(depositTransactionDetails)

    if (transactionToBePersisted) {
      await this.persistTransactionDetails(currency, depositTransactionDetails, depositAddress)
    }
  }

  /**
   * We want to process the current address transaction as a deposit request if:
   * - we have not already recorded the deposit request for that transaction hash
   * - amount > 0
   */
  private async shouldPersistTransaction({ transactionHash, amount }: Transaction) {
    const existingDepositRequests = await findDepositRequestsWhereTransactionHashPresent(transactionHash)

    if (existingDepositRequests.length > 0) {
      logger.debug(`Attempted to process deposit address transaction ${transactionHash} which has already been recorded`)
    }

    return existingDepositRequests.length === 0 && amount > 0
  }

  /**
   * Creates a deposit request entry for the deposit transaction details.
   * In the case where the deposited amount is less than the defined minimum for the currency,
   * a 'insufficientAmount' status is used for the new record and it is not processed any further.
   */
  private async persistTransactionDetails(currency: CurrencyCode, depositTransactionDetails: Transaction, depositAddress: DepositAddress) {
    const providerFacade = BlockchainFacade.getInstance(currency)
    const fiatValueOfOneCryptoCurrency = await calculateRealTimeMidPriceForSymbol(`${currency}_${FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION}`)
    let depositAmountAboveMinimumForCurrency = getMinimumDepositAmountForCurrency(currency) <= depositTransactionDetails.amount

    if (!depositAmountAboveMinimumForCurrency) {
      logger.debug(`Attempted to process deposit address transaction ${depositTransactionDetails.transactionHash} which has already been recorded`)
      await createNewDepositRequest(depositTransactionDetails, depositAddress, fiatValueOfOneCryptoCurrency, DepositRequestStatus.insufficientAmount)
    } else {
      await createNewDepositRequest(depositTransactionDetails, depositAddress, fiatValueOfOneCryptoCurrency)
      await this.subscribeForDepositConfirmation(currency, depositTransactionDetails, providerFacade)
    }
  }

  private async subscribeForDepositConfirmation(
    currency: CurrencyCode,
    { transactionHash, confirmations }: Transaction,
    providerFacade: BlockchainFacade,
  ) {
    if (confirmations === this.getRequiredConfirmationsForDepositTransaction(currency)) {
      await this.queueForHoldingsTransactionCreation(transactionHash, currency)
      logger.info(`Transaction ${transactionHash} already confirmed ${confirmations} times, pushing message to confirmed transaction queue`)
    } else {
      await providerFacade.subscribeToTransactionConfirmationEvents(transactionHash, process.env.DEPOSIT_CONFIRMED_TRANSACTION_CALLBACK_URL!)
      logger.info(`Subscribed for transaction confirmation events for deposit transaction ${transactionHash}`)
    }
  }

  private queueForHoldingsTransactionCreation(txid: string, currency: CurrencyCode) {
    return sendAsyncChangeMessage<ConfirmedDepositTransactionPayload>({
      type: `deposit-transaction-confirmed-${txid}`,
      target: {
        local: DEPOSIT_CONFIRMED_TRANSACTION_QUEUE_URL!,
        deployedEnvironment: DEPOSIT_CONFIRMED_TRANSACTION_QUEUE_URL!,
      },
      payload: {
        txid,
        currency,
      },
    })
  }

  private getRequiredConfirmationsForDepositTransaction(currency: CurrencyCode) {
    if (currency === CurrencyCode.bitcoin) {
      return Number(process.env.BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS)
    }

    return this.DEFAULT_REQUIRED_DEPOSIT_TRANSACTION_CONFIRMATIONS
  }
}

import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { IAddressTransactionEventPayload, BlockchainFacade } from '@abx-utils/blockchain-currency-gateway'
import { findDepositAddress, createNewDepositRequest, findMostRecentlyUpdatedDepositRequest } from '../../../../core'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'
import { FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION } from '../../../kinesis-and-eth-coin-deposit-processor/core/deposit_transactions_fetcher'
import { Logger } from '@abx-utils/logging'
import { DEPOSIT_ADDRESS_UNCONFIRMED_TRANSACTION_QUEUE_URL } from '../constants'

export class DepositAddressNewTransactionQueuePoller {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'NewDepositTransactionQueuePoller')

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
    const shouldProcessTransaction = await this.shouldProcessTransaction(txid)

    if (shouldProcessTransaction) {
      const fiatValueOfOneCryptoCurrency = await calculateRealTimeMidPriceForSymbol(`${currency}_${FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION}`)

      await createNewDepositRequest(depositTransactionDetails, depositAddress, fiatValueOfOneCryptoCurrency)
      await this.subscribeForDepositConfirmation(txid, providerFacade)
    }
  }

  private async subscribeForDepositConfirmation(txid: string, providerFacade: BlockchainFacade) {
    await providerFacade.subscribeToTransactionConfirmationEvents(txid, process.env.DEPOSIT_CONFIRMED_TRANSACTION_CALLBACK_URL!)

    this.logger.info(`Subscribed for transaction confirmation events for deposit transaction ${txid}`)
  }

  private async shouldProcessTransaction(txid: string) {
    const existingDepositRequest = await findMostRecentlyUpdatedDepositRequest({ depositTxHash: txid, holdingsTxHash: txid })

    if (!!existingDepositRequest) {
      this.logger.debug(`Attempted to process deposit address transaction ${txid} which has already been recorded`)
    }

    return !existingDepositRequest
  }
}

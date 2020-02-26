import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { IAddressTransactionEventPayload, BlockchainFacade } from '@abx-utils/blockchain-currency-gateway'
import { findDepositAddress, createNewDepositRequest } from '../../../../core'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'
import { FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION } from '../../../kinesis-and-eth-coin-deposit-processor/core/deposit_transactions_fetcher'
import { Logger } from '@abx-utils/logging'

export class DepositAddressNewTransactionQueuePoller {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'NewDepositTransactionQueuePoller')

  public bootstrapPoller() {
    const queuePoller = getQueuePoller()

    queuePoller.subscribeToQueueMessages<IAddressTransactionEventPayload>(
      process.env.DEPOSIT_ADDRESS_NEW_TRANSACTION_QUEUE__URL! || 'local-deposit-transaction-queue',
      this.processDepositAddressTransaction,
    )
  }

  private async processDepositAddressTransaction({ currency, address, txid }: IAddressTransactionEventPayload) {
    this.logger.info(`Received a new deposit transaction notification for currency ${currency} with address ${address}. Transaction ID: ${txid}`)

    const depositAddress = await findDepositAddress({ address })

    if (!depositAddress) {
      this.logger.warn(`Deposit address not found for transaction ${txid}, not processing deposit`)
      return
    }

    const providerFacade = BlockchainFacade.getInstance(currency)
    const depositTransactionDetails = await providerFacade.getTransaction(txid)

    const fiatValueOfOneCryptoCurrency = await calculateRealTimeMidPriceForSymbol(`${currency}_${FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION}`)

    await createNewDepositRequest(depositTransactionDetails, depositAddress, fiatValueOfOneCryptoCurrency)
    await providerFacade.subscribeToTransactionConfirmationEvents(
      txid,
      process.env.DEPOSIT_CONFIRMED_TRANSACTION_QUEUE__URL! || 'local-deposit-transaction-queue',
    )
    this.logger.info(`Subscribed for transaction confirmation events for deposit transaction ${txid}`)
  }
}

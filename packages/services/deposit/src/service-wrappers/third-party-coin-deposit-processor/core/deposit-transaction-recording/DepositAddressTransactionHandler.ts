import { getOnChainCurrencyManagerForEnvironment, Transaction } from '@abx-utils/blockchain-currency-gateway'
import { Environment, CurrencyCode } from '@abx-types/reference-data'
import { DepositAddress } from '@abx-types/deposit'
import { getRequiredConfirmationsForDepositTransaction } from '../utils'
import { getMinimumDepositAmountForCurrency } from '../../../../core'
import { NewTransactionRecorder } from './NewTransactionRecorder'
import { HoldingsTransactionGateway } from '../holdings-transaction-creation/HoldingsTransactionGateway'
import { Logger } from '@abx-utils/logging'
import { BlockedDepositRequestsHandler } from './BlockedDepositRequestsHandler'

export class DepositAddressTransactionHandler {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'DepositAddressTransactionHandler')

  private newTransactionRecorder = new NewTransactionRecorder()
  private holdingsTransactionGateway = new HoldingsTransactionGateway()
  private blockedDepositRequestsHandler = new BlockedDepositRequestsHandler()

  public async handleDepositAddressTransaction(txid: string, depositAddress: DepositAddress, currency: CurrencyCode) {
    const onChainCurrencyManager = getOnChainCurrencyManagerForEnvironment(process.env.NODE_ENV as Environment, [currency])
    const depositTransactionDetails = await onChainCurrencyManager.getCurrencyFromTicker(currency).getTransaction(txid, depositAddress.address!)

    const isOutgoingTransactionToKinesisHoldings =
      !!depositTransactionDetails && depositTransactionDetails.receiverAddress === process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS

    if (!!depositTransactionDetails && depositTransactionDetails.receiverAddress === depositAddress.address) {
      await this.handleNewDepositAddressTransaction(depositTransactionDetails, depositAddress, txid, currency)
    } else if (isOutgoingTransactionToKinesisHoldings) {
      await this.handleHoldingsConfirmation(depositTransactionDetails!, currency, depositAddress.id!)
    }
  }

  private async handleHoldingsConfirmation(depositTransactionDetails: Transaction, currency: CurrencyCode, depositAddressId: number) {
    if ((depositTransactionDetails.confirmations || 0) >= getRequiredConfirmationsForDepositTransaction(currency)) {
      this.logger.info(
        `Confirmation received for ${currency} holdings transaction ${depositTransactionDetails.transactionHash}, triggering completion`,
      )

      await this.blockedDepositRequestsHandler.dispatchHoldingsTransactionForBlockedRequests(depositAddressId, currency)
    }
  }

  private async handleNewDepositAddressTransaction(
    depositTransactionDetails: Transaction,
    depositAddress: DepositAddress,
    txid: string,
    currency: CurrencyCode,
  ) {
    this.logger.info(`Handling new ${currency} deposit address ${depositAddress} transaction with id ${txid}`)
    // the deposit request will be created only once
    await this.newTransactionRecorder.recordDepositTransaction({
      currency,
      depositAddress,
      depositTransactionDetails,
    })

    if ((depositTransactionDetails.confirmations || 0) >= getRequiredConfirmationsForDepositTransaction(currency)) {
      this.logger.info(
        `${currency} deposit transaction with id (${txid}) to deposit address ${depositAddress} has ${depositTransactionDetails.confirmations} confirmations, holdings transaction to be dispatched`,
      )

      await this.processHoldingsTransaction(depositTransactionDetails.amount, currency, txid)
    }
  }

  private async processHoldingsTransaction(depositAmount: number, currency: CurrencyCode, txid: string) {
    const depositAmountAboveMinimumForCurrency = getMinimumDepositAmountForCurrency(currency) <= depositAmount

    if (depositAmountAboveMinimumForCurrency) {
      await this.holdingsTransactionGateway.dispatchHoldingsTransactionForConfirmedDepositRequest(txid, currency)
    }
  }
}

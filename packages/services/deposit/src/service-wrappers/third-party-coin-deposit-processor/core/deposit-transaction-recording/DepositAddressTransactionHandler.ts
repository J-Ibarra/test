import Decimal from 'decimal.js'
import { getOnChainCurrencyManagerForEnvironment, Transaction } from '@abx-utils/blockchain-currency-gateway'
import { Environment, CurrencyCode } from '@abx-types/reference-data'
import { DepositAddress, DepositRequest } from '@abx-types/deposit'
import { getRequiredConfirmationsForDepositTransaction, findDepositRequestsWithInsufficientAmount } from '../../../../core'
import { NewTransactionRecorder } from './NewTransactionRecorder'
import { HoldingsTransactionGateway } from '../holdings-transaction-creation/HoldingsTransactionGateway'
import { Logger } from '@abx-utils/logging'
import { HoldingsTransactionConfirmationHandler } from './HoldingsTransactionConfirmationHandler'
import { getDepositMinimumAmountForCurrency } from '@abx-service-clients/reference-data'

export class DepositAddressTransactionHandler {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'DepositAddressTransactionHandler')

  private newTransactionRecorder = new NewTransactionRecorder()
  private holdingsTransactionGateway = new HoldingsTransactionGateway()
  private holdingsTransactionConfirmationHandler = new HoldingsTransactionConfirmationHandler()

  public async handleDepositAddressTransaction(txid: string, depositAddress: DepositAddress, currency: CurrencyCode) {
    const onChainCurrencyGateway = getOnChainCurrencyManagerForEnvironment(process.env.NODE_ENV as Environment).getCurrencyFromTicker(currency)

    const depositTransactionDetails = await onChainCurrencyGateway.getTransaction(txid, depositAddress.address!)
    this.logger.debug(`Successfully retrieved transaction details ${JSON.stringify(depositTransactionDetails)}`)

    const holdingsPublicAddress = await onChainCurrencyGateway.getHoldingPublicAddress()

    const isOutgoingTransactionToKinesisHoldings =
      !!depositTransactionDetails && depositTransactionDetails.receiverAddress.toLowerCase() === holdingsPublicAddress.toLowerCase()
    this.logger.debug(`Transaction ${txid} is ${isOutgoingTransactionToKinesisHoldings ? 'outgoing' : 'incoming'}`)

    if (!!depositTransactionDetails && depositTransactionDetails.receiverAddress.toLowerCase() === depositAddress.address!.toLowerCase()) {
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

      await this.holdingsTransactionConfirmationHandler.handleHoldingsTransactionConfirmation(
        depositTransactionDetails.transactionHash,
        depositAddressId,
        currency,
      )
    }
  }

  private async handleNewDepositAddressTransaction(
    depositTransactionDetails: Transaction,
    depositAddress: DepositAddress,
    txid: string,
    currency: CurrencyCode,
  ) {
    this.logger.info(`Handling new ${currency} deposit address ${depositAddress.address!} transaction with id ${txid}`)
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

      await this.processHoldingsTransaction({
        depositAddressId: depositAddress.id,
        depositAmount: depositTransactionDetails.amount,
        currency,
        txid,
      })
    }
  }

  private async processHoldingsTransaction({ depositAddressId, depositAmount, currency, txid }) {
    const depositMinimumAmount = await getDepositMinimumAmountForCurrency(currency)
    const depositRequestsWithInsufficientAmount: DepositRequest[] = await findDepositRequestsWithInsufficientAmount(depositAddressId)
    const depositRequestsWithCurrentOneFilteredOut = depositRequestsWithInsufficientAmount.filter(({ depositTxHash }) => depositTxHash !== txid)

    const amountPlusPreviousInsufficientAmounts: Decimal = depositRequestsWithCurrentOneFilteredOut.reduce(
      (sum, { amount }) => sum.plus(amount),
      new Decimal(depositAmount),
    )

    if (amountPlusPreviousInsufficientAmounts.greaterThanOrEqualTo(depositMinimumAmount)) {
      await this.holdingsTransactionGateway.dispatchHoldingsTransactionForConfirmedDepositRequest(txid, currency)
    }
  }
}

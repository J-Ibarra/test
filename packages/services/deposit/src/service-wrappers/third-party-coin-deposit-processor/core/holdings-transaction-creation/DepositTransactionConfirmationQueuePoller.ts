import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { IConfirmedTransactionEventPayload, getOnChainCurrencyManagerForEnvironment } from '@abx-utils/blockchain-currency-gateway'
import { HoldingsTransactionDispatcher } from './HoldingsTransactionDispatcher'
import { findDepositRequestByDepositTransactionHash, findDepositRequestsWithInsufficientAmount } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { DEPOSIT_CONFIRMED_TRANSACTION_QUEUE_URL } from '../constants'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'
import { DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL } from '../constants'
import { CurrencyCode, Environment } from '@abx-types/reference-data'
import { CompletionPendingTransactionDetails } from '../deposit-completion/HoldingsTransactionConfirmationQueuePoller'
import Decimal from 'decimal.js'
import { DepositRequest } from '@abx-types/deposit'
import { findCryptoCurrencies } from '@abx-service-clients/reference-data'

export interface ConfirmedDepositTransactionPayload {
  currency: CurrencyCode
  txid: string
}

/**
 * The mechanism for handling confirmed deposit transactions.
 * This is step2 of the deposit flow where the deposit address -> kinesis holdings transaction is created.
 * After the transaction is created the deposit request would be ready for the final - completion step.
 */
export class DepositTransactionConfirmationQueuePoller {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'DepositTransactionConfirmationQueuePoller')

  private holdingsTransactionDispatcher = new HoldingsTransactionDispatcher()

  public bootstrapPoller() {
    const queuePoller = getQueuePoller()

    queuePoller.subscribeToQueueMessages<ConfirmedDepositTransactionPayload>(
      DEPOSIT_CONFIRMED_TRANSACTION_QUEUE_URL,
      this.processDepositAddressTransaction.bind(this),
    )
  }

  private async processDepositAddressTransaction({ currency, txid }: IConfirmedTransactionEventPayload) {
    this.logger.info(`Received a deposit transaction confirmation for currency ${currency} and transaction hash ${txid}`)
    const depositRequest = await findDepositRequestByDepositTransactionHash(txid)

    if (!depositRequest) {
      this.logger.warn(`Deposit request not found for transaction ${txid}, not processing any further`)
      return
    }

    const { totalAmount: totalAmountToTransfer, depositsRequestsWithInsufficientStatus } = await this.computeTotalAmountToTransfer(depositRequest)

    const cryptoCurrencies = await findCryptoCurrencies()
    const currencyManager = getOnChainCurrencyManagerForEnvironment(
      process.env.NODE_ENV as Environment,
      cryptoCurrencies.map(({ code }) => code),
    )

    const holdingsTransactionHash = await this.holdingsTransactionDispatcher.transferTransactionAmountToHoldingsWallet(
      {
        ...depositRequest,
        amount: totalAmountToTransfer,
      },
      depositsRequestsWithInsufficientStatus,
      currencyManager.getCurrencyFromTicker(currency),
    )

    if (holdingsTransactionHash) {
      this.logger.info(`Queuing deposit request with holdings transaction hash ${txid} for completion`)
      await this.queueForCompletion(holdingsTransactionHash, currency)
    }
  }

  /**
   * We want to add up the amount of all the deposit requests which are recorded in `insufficientBalance` status.
   * The result amount can then be added to the amount fo the current deposit request.
   */
  private async computeTotalAmountToTransfer({
    amount: currentRequestAmount,
    depositAddressId,
    id: depositRequestId,
  }: DepositRequest): Promise<{ totalAmount: number; depositsRequestsWithInsufficientStatus: number[] }> {
    const preExistingDepositRequestsWithInsufficientBalance = await findDepositRequestsWithInsufficientAmount(depositAddressId!)

    const totalAmounOfDepositsWithInsufficientBalance = preExistingDepositRequestsWithInsufficientBalance.reduce(
      (acc, { amount }) => new Decimal(acc).plus(amount),
      new Decimal(0),
    )

    this.logger.info(
      `Found ${preExistingDepositRequestsWithInsufficientBalance} pre existing deposits for deposit address ${depositAddressId} while processing deposit request ${depositRequestId}, total amount of pre existing deposit requests ${totalAmounOfDepositsWithInsufficientBalance}`,
    )

    return {
      totalAmount: new Decimal(currentRequestAmount).plus(totalAmounOfDepositsWithInsufficientBalance).toNumber(),
      depositsRequestsWithInsufficientStatus: preExistingDepositRequestsWithInsufficientBalance.map(({ id }) => id!),
    }
  }

  private queueForCompletion(txid: string, currency: CurrencyCode) {
    return sendAsyncChangeMessage<CompletionPendingTransactionDetails>({
      type: 'holdings-transaction-sent',
      target: {
        local: DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL!,
        deployedEnvironment: DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL!,
      },
      payload: {
        txid,
        currency,
      },
    })
  }
}

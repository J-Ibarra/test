import { DepositRequestStatus } from '@abx-types/deposit'
import { 
  updateDepositRequest, 
  findDepositRequestByDepositTransactionHash, 
  HoldingsTransactionDispatcher, 
  DepositCompleter } 
from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode } from '@abx-types/reference-data'
import { get } from 'lodash'

export class HoldingsTransactionGateway {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'HoldingsTransactionGateway')
  private readonly holdingsTransactionDispatcher = new HoldingsTransactionDispatcher()
  private readonly depositCompleter = new DepositCompleter()

  public static readonly BTC_INSUFFICIENT_UTXO_ERROR_CODE = 2328

  public async dispatchHoldingsTransactionForConfirmedDepositRequest(txid: string, currency: CurrencyCode) {
    this.logger.info(`Received a deposit transaction confirmation for currency ${currency} and transaction hash ${txid}`)
    const depositRequest = await findDepositRequestByDepositTransactionHash(txid)

    if (!depositRequest) {
      this.logger.warn(`Deposit request not found for transaction ${txid}, not processing any further`)
      return
    }

    await updateDepositRequest(depositRequest.id!, { status: DepositRequestStatus.pendingHoldingsTransaction })

    try {
      const readyForCompletionRequests = await this.holdingsTransactionDispatcher.dispatchHoldingsTransactionForDepositRequests([depositRequest], currency)
      await this.depositCompleter.completeDepositRequests(readyForCompletionRequests, currency, DepositRequestStatus.pendingHoldingsTransactionConfirmation)
    } catch (e) {
      await this.handleWithdrawalTransactionDispatchError(depositRequest.id!, currency, e)
    }
  }

  private async handleWithdrawalTransactionDispatchError(depositRequestId: number, currency: CurrencyCode, error) {
    if (currency === CurrencyCode.bitcoin && get(error, 'meta.error.code', -1) === HoldingsTransactionGateway.BTC_INSUFFICIENT_UTXO_ERROR_CODE) {
      await updateDepositRequest(depositRequestId, {
        status: DepositRequestStatus.blockedForHoldingsTransactionConfirmation,
      })
    }
  }
}

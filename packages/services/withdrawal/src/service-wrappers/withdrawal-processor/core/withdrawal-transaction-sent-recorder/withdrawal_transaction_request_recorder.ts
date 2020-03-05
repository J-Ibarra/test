import { WithdrawalTransactionSent } from './model'
import { findWithdrawalRequestByIdWithFeeRequest, updateWithdrawalRequest } from '../../../../core'
import { WithdrawalState, WithdrawalRequest, CurrencyEnrichedWithdrawalRequest } from '@abx-types/withdrawal'
import { WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL } from '@abx-service-clients/withdrawal'
import { CurrencyCode, Environment } from '@abx-types/reference-data'
import { getOnChainCurrencyManagerForEnvironment } from '@abx-utils/blockchain-currency-gateway'
import { findCryptoCurrencies } from '@abx-service-clients/reference-data'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'
import { deductOnChainTransactionFeeFromRevenueBalance } from '../withdrawal-transaction-creation/kinesis_revenie_transaction_fee_reconciler'
import { WithdrawalCompletionPendingPayload } from '../withdrawal-completion/model'
import { Logger } from '@abx-utils/logging'

const currencyToCoverOnChainFeeFor = [CurrencyCode.ethereum, CurrencyCode.kvt, CurrencyCode.bitcoin]
const logger = Logger.getInstance('withdrawal-processor', 'withdrawal_transaction_request_recorder')

export async function recordWithdrawalOnChainTransaction({ withdrawalRequestId, transactionFee, transactionHash }: WithdrawalTransactionSent) {
  const withdrawalRequest = await findWithdrawalRequestByIdWithFeeRequest(withdrawalRequestId)

  if (!withdrawalRequest) {
    logger.warn(`Attempted to record on chain transaction details for withdrawal that could not be found ${withdrawalRequestId}`)
    throw new Error(`Attempted to record withdrawal on chain transaction for non-existent withdrawal request: ${withdrawalRequestId}`)
  }

  const currencies = await findCryptoCurrencies()
  const currencyManager = getOnChainCurrencyManagerForEnvironment(
    process.env.NODE_ENV as Environment,
    currencies.map(({ code }) => code),
  )
  const withdrawalCurrency = currencies.find(({ id }) => id === withdrawalRequest!.currencyId)!

  await deductOnChainTransactionFeeFromRevenueBalance(
    withdrawalRequest.id!,
    transactionFee,
    currencyManager.getCurrencyFromTicker(withdrawalCurrency.code),
    !!withdrawalRequest.feeRequest ? withdrawalRequest.feeRequest.currencyId : withdrawalRequest.currencyId,
  )

  await updateRequestStatuses({ ...withdrawalRequest!, currency: withdrawalCurrency }, transactionHash, transactionFee, withdrawalRequest.feeRequest)

  logger.debug(`Queuing request for completion ${withdrawalRequest.id}`)
  await queueForCompletion(withdrawalRequest.txHash!, withdrawalCurrency.code)
}

async function updateRequestStatuses(
  withdrawalRequest: CurrencyEnrichedWithdrawalRequest,
  withdrawalTransactionHash: string,
  onChainTransactionFee: number,
  feeRequest?: WithdrawalRequest | null,
) {
  return Promise.all([
    updateWithdrawalRequest({
      id: withdrawalRequest.id,
      txHash: withdrawalTransactionHash,
      kinesisCoveredOnChainFee: currencyToCoverOnChainFeeFor.includes(withdrawalRequest.currency.code) ? onChainTransactionFee : 0,
      state: WithdrawalState.holdingsTransactionCompleted,
    }),
    !!feeRequest
      ? updateWithdrawalRequest({
          id: feeRequest.id,
          state: WithdrawalState.holdingsTransactionCompleted,
        })
      : Promise.resolve(null),
  ])
}

async function queueForCompletion(txid: string, currency: CurrencyCode) {
  await sendAsyncChangeMessage<WithdrawalCompletionPendingPayload>({
    id: `withdrawal-completion-pending-${txid}`,
    type: 'withdrawal-transaction-sent',
    target: {
      local: WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL!,
      deployedEnvironment: WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL!,
    },
    payload: {
      txid,
      currency,
    },
  })
}

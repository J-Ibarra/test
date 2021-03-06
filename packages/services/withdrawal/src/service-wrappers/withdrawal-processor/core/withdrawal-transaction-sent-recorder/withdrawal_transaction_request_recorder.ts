import { WithdrawalTransactionSent } from './model'
import { findWithdrawalRequestByIdWithFeeRequest, updateWithdrawalRequest } from '../../../../core'
import { WithdrawalState, WithdrawalRequest, CurrencyEnrichedWithdrawalRequest } from '@abx-types/withdrawal'
import { WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL } from '@abx-service-clients/withdrawal'
import { CurrencyCode, Environment, SymbolPairStateFilter, Currency } from '@abx-types/reference-data'
import { getOnChainCurrencyManagerForEnvironment } from '@abx-utils/blockchain-currency-gateway'
import { findCryptoCurrencies, findCurrencyForId } from '@abx-service-clients/reference-data'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'
import { deductOnChainTransactionFeeFromRevenueBalance } from './kinesis_revenie_transaction_fee_reconciler'
import { WithdrawalCompletionPendingPayload } from '../withdrawal-completion/model'
import { Logger } from '@abx-utils/logging'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { holdingsAddressTransactionNotificationEnabledCurrencies } from '../common'
import { QueueConsumerOutput } from '@abx-utils/async-message-consumer'
import { Transaction } from 'sequelize'

const currencyToCoverOnChainFeeFor = [CurrencyCode.ethereum, CurrencyCode.kvt, CurrencyCode.bitcoin]
const logger = Logger.getInstance('withdrawal-processor', 'withdrawal_transaction_request_recorder')
let cryptoCurrencies: Currency[]

export async function recordWithdrawalOnChainTransaction({
  withdrawalRequestId,
  transactionFee,
  transactionHash,
}: WithdrawalTransactionSent): Promise<void | QueueConsumerOutput> {
  logger.info(`Recording on chain transaction details for withdrawal request ${withdrawalRequestId}`)

  return wrapInTransaction(sequelize, null, async (transaction) => {
    const withdrawalRequest = await findWithdrawalRequestByIdWithFeeRequest(withdrawalRequestId, transaction)

    if (!withdrawalRequest) {
      logger.warn(`Attempted to record on chain transaction details for withdrawal that could not be found ${withdrawalRequestId}`)
      return { skipMessageDeletion: true }
    }

    const { withdrawalCurrency, onChainCurrencyGateway } = await getOnChainCurrencyGatewayAndWithdrawnCurrency(withdrawalRequest.currencyId)
    const feeCurrency = await findCurrencyForId(
      !!withdrawalRequest.feeRequest ? withdrawalRequest.feeRequest.currencyId : withdrawalRequest.currencyId,
      SymbolPairStateFilter.all,
    )
    await deductOnChainTransactionFeeFromRevenueBalance(withdrawalRequest.id!, transactionFee, onChainCurrencyGateway, feeCurrency)

    await updateRequestStatuses(
      { ...withdrawalRequest!, currency: withdrawalCurrency },
      transactionHash,
      transactionFee,
      transaction,
      withdrawalRequest.feeRequest,
    )

    return queueForCompletion(withdrawalRequest.id!, transactionHash, withdrawalCurrency.code)
  })
}

async function getOnChainCurrencyGatewayAndWithdrawnCurrency(currencyId: number) {
  if (!cryptoCurrencies) {
    cryptoCurrencies = await findCryptoCurrencies(SymbolPairStateFilter.all)
  }

  const currencyManager = getOnChainCurrencyManagerForEnvironment(process.env.NODE_ENV as Environment)
  const withdrawalCurrency = cryptoCurrencies.find(({ id }) => id === currencyId)!

  return { withdrawalCurrency, onChainCurrencyGateway: currencyManager.getCurrencyFromTicker(withdrawalCurrency.code) }
}

async function updateRequestStatuses(
  withdrawalRequest: CurrencyEnrichedWithdrawalRequest,
  withdrawalTransactionHash: string,
  onChainTransactionFee: number,
  transaction: Transaction,
  feeRequest?: WithdrawalRequest | null,
) {
  return Promise.all([
    updateWithdrawalRequest(
      {
        id: withdrawalRequest.id,
        txHash: withdrawalTransactionHash,
        kinesisCoveredOnChainFee: currencyToCoverOnChainFeeFor.includes(withdrawalRequest.currency.code) ? onChainTransactionFee : 0,
        state: WithdrawalState.holdingsTransactionCompleted,
      },
      transaction,
    ),
    !!feeRequest
      ? updateWithdrawalRequest(
          {
            id: feeRequest.id,
            state: WithdrawalState.holdingsTransactionCompleted,
          },
          transaction,
        )
      : Promise.resolve(null),
  ])
}

async function queueForCompletion(withdrawalRequestId: number, txid: string, currency: CurrencyCode) {
  if (!holdingsAddressTransactionNotificationEnabledCurrencies.includes(currency)) {
    logger.debug(`Queuing request for completion ${withdrawalRequestId}`)

    await sendAsyncChangeMessage<WithdrawalCompletionPendingPayload>({
      type: 'withdrawal-completion-pending',
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
}

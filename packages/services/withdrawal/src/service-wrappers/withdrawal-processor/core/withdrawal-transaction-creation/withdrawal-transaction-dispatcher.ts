import { OnChainCurrencyGateway, Kinesis } from '@abx-utils/blockchain-currency-gateway'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'
import { WithdrawalTransactionSent } from '../withdrawal-transaction-sent-recorder/model'
import { Logger } from '@abx-utils/logging'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { transferWithdrawalFundsForKinesisCurrency } from './kinesis_currency_transferrer'
import { WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL } from '@abx-service-clients/withdrawal'
import { updateWithdrawalRequest } from '../../../../core'
import { WithdrawalState } from '@abx-types/withdrawal'
import util from 'util'

const logger = Logger.getInstance('withdrawal', 'withdrawal-transaction-dispatcher')
export const DEFAULT_NUMBER_OF_CONFIRMATION_FOR_WITHDRAWAL = 1

export async function dispatchWithdrawalTransaction(
  withdrawalRequestId: number,
  targetAddress: string,
  amount: number,
  onChainCurrencyGateway: OnChainCurrencyGateway,
  memo: string,
) {
  let withdrawalTxHash
  let withdrawalTransactionFee
  try {
    logger.debug(`Creating on-chain transaction for withdrawal request ${withdrawalRequestId}`)
    const { txHash, transactionFee } = await transferFunds(withdrawalRequestId!, onChainCurrencyGateway, targetAddress, memo, amount)

    withdrawalTxHash = txHash
    withdrawalTransactionFee = transactionFee
    await recordTransactionSent(withdrawalRequestId!, withdrawalTxHash, Number(withdrawalTransactionFee || 0))
  } catch (e) {
    logger.error(`Unable to create withdrawal transaction for withdrawal request ${withdrawalRequestId}`)
    logger.error(util.inspect(e))

    await handleTransactionCreationError(withdrawalRequestId, onChainCurrencyGateway.ticker!, e)
  }
}

const kinesisCoins = [CurrencyCode.kau, CurrencyCode.kag]

async function transferFunds(withdrawalRequestId: number, currencyGateway: OnChainCurrencyGateway, address: string, memo: string, amount: number) {
  if (kinesisCoins.includes(currencyGateway.ticker!)) {
    return wrapInTransaction(sequelize, null, (transaction) => {
      return transferWithdrawalFundsForKinesisCurrency(
        {
          withdrawalRequestId,
          kinesisCurrencyGateway: currencyGateway as Kinesis,
          targetAddress: address,
          amount,
          memo,
        },
        transaction,
      )
    })
  }

  return currencyGateway.transferFromExchangeHoldingsTo({
    toAddress: address,
    amount,
    memo,
  })
}

export async function recordTransactionSent(withdrawalRequestId: number, txHash: string, transactionFee: number): Promise<void> {
  await sendAsyncChangeMessage<WithdrawalTransactionSent>({
    id: `withdrawal-transaction-sent-${withdrawalRequestId}`,
    type: 'withdrawal-transaction-sent',
    target: {
      local: WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL!,
      deployedEnvironment: WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL!,
    },
    payload: {
      withdrawalRequestId: withdrawalRequestId,
      transactionHash: txHash,
      transactionFee,
    },
  })
}

export const INSUFFICIENT_UTXO_ERROR_CODE = '2328'

/**
 * Checks if the transaction creation failure happened for BTC
 * and  was caused by insufficient UTXOs in the holdings account.
 * In this case we want to wait until the preceding withdrawal transaction gets confirmed,
 * so that the UTXOs are confirmed.
 *
 * @param withdrawalRequestId  the withdrawal request ID
 * @param currency the withdrawn currency code
 * @param error the error
 */
async function handleTransactionCreationError(withdrawalRequestId: number, currency: CurrencyCode, error) {
  if (currency === CurrencyCode.bitcoin && error.meta.error.code === INSUFFICIENT_UTXO_ERROR_CODE) {
    return updateWithdrawalRequest({
      state: WithdrawalState.waiting,
      id: withdrawalRequestId,
    })
  }

  throw error
}

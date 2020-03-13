import { OnChainCurrencyGateway, Kinesis } from '@abx-utils/blockchain-currency-gateway'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'
import { WithdrawalTransactionSent } from '../withdrawal-transaction-sent-recorder/model'
import { Logger } from '@abx-utils/logging'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { transferWithdrawalFundsForKinesisCurrency } from './kinesis_currency_transferrer'
import { WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL } from '@abx-service-clients/withdrawal'
import { getWithdrawalConfigForCurrency } from '@abx-service-clients/reference-data'

const logger = Logger.getInstance('withdrawal', 'withdrawal-transaction-dispatcher')
const DEFAULT_NUMBER_OF_CONFIRMATION_FOR_WITHDRAWAL = 1

export async function dispatchWithdrawalTransaction(
  withdrawalRequestId: number,
  targetAddress: string,
  amount: number,
  onChainCurrencyGateway: OnChainCurrencyGateway,
  memo: string,
) {
  try {
    logger.debug(`Creating on-chain transaction for withdrawal request ${withdrawalRequestId}`)
    const { txHash, transactionFee } = await transferFunds(withdrawalRequestId!, onChainCurrencyGateway, targetAddress, memo, amount)

    await recordTransactionSent(withdrawalRequestId!, txHash, Number(transactionFee || 0))
  } catch (e) {
    logger.error(`Unable to create withdrawal transaction for withdrawal request ${withdrawalRequestId}`)
    throw e
  }
}

const kinesisCoins = [CurrencyCode.kau, CurrencyCode.kag]

async function transferFunds(withdrawalRequestId: number, currencyGateway: OnChainCurrencyGateway, address: string, memo: string, amount: number) {
  if (kinesisCoins.includes(currencyGateway.ticker!)) {
    return wrapInTransaction(sequelize, null, transaction => {
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

  const withdrawalConfig = await getWithdrawalConfigForCurrency({ currencyCode: currencyGateway.ticker! })

  return currencyGateway.transferFromExchangeHoldingsTo({
    toAddress: address,
    amount,
    memo,
    transactionConfirmationWebhookUrl: process.env.WITHDRAWAL_TRANSACTION_CONFIRMATION_CALLBACK_URL!,
    feeLimit: withdrawalConfig.feeAmount,
    transactionConfirmations: DEFAULT_NUMBER_OF_CONFIRMATION_FOR_WITHDRAWAL,
  })
}

async function recordTransactionSent(withdrawalRequestId: number, txHash: string, transactionFee: number): Promise<void> {
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

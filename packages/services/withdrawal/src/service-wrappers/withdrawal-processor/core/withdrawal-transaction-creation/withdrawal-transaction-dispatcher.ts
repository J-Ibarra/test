import { OnChainCurrencyGateway, Kinesis } from '@abx-utils/blockchain-currency-gateway'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'
import { WithdrawalTransactionSent } from '../withdrawal-transaction-sent-recorder/model'
import { Logger } from '@abx-utils/logging'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { transferWithdrawalFundsForKinesisCurrency } from './kinesis_currency_transferrer'
import { WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL } from '@abx-service-clients/withdrawal'

const logger = Logger.getInstance('withdrawal', 'withdrawal-transaction-dispatcher')

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

    await recordTransactionSent(onChainCurrencyGateway.ticker!, withdrawalRequestId!, txHash, Number(transactionFee || 0))
  } catch (e) {
    logger.error(`Unable to create withdrawal transaction for withdrawal request ${withdrawalRequestId}`)
    throw e
  }
}

const kinesisCoins = [CurrencyCode.kau, CurrencyCode.kag]

function transferFunds(withdrawalRequestId: number, currencyGateway: OnChainCurrencyGateway, address: string, memo: string, amount: number) {
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

  return currencyGateway.transferFromExchangeHoldingsTo(address, amount, process.env.WITHDRAWAL_TRANSACTION_CONFIRMATION_CALLBACK_URL!)
}

export const nativelyImplementedCoins = [CurrencyCode.kag, CurrencyCode.kau, CurrencyCode.ethereum, CurrencyCode.kvt]

async function recordTransactionSent(currency: CurrencyCode, withdrawalRequestId: number, txHash: string, transactionFee: number): Promise<void> {
  if (nativelyImplementedCoins.includes(currency)) {
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
}

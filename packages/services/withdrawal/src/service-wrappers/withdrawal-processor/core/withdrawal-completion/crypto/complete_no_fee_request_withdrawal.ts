import Decimal from 'decimal.js'

import { findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { SourceEventType } from '@abx-types/balance'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode } from '@abx-types/reference-data'
import { TransactionDirection } from '@abx-types/order'
import { WithdrawalRequest, WithdrawalState, CurrencyEnrichedWithdrawalRequest } from '@abx-types/withdrawal'
import { updateWithdrawalRequest, getTotalWithdrawalAmount, getWithdrawalFee } from '../../../../../core'
import { createCurrencyTransaction } from '@abx-service-clients/order'
import { triggerMultipleBalanceChanges, BalanceAsyncRequestType } from '@abx-service-clients/balance'
import { Transaction } from 'sequelize'
import { getTransactionFeeCurrency } from '../../common'

const logger = Logger.getInstance('fiat_withdrawal_completer', 'completeFiatWithdrawal')

export async function completeNoFeeRequestCryptoWithdrawal(
  withdrawalRequest: CurrencyEnrichedWithdrawalRequest,
  transaction: Transaction,
): Promise<WithdrawalRequest> {
  const completedRequest = await updateWithdrawalRequest(
    {
      ...withdrawalRequest,
      state: WithdrawalState.completed,
    },
    transaction,
  )

  const totalAmount = await getTotalWithdrawalAmount(withdrawalRequest.amount, withdrawalRequest.currency.code)

  await updateWithdrawerAndKinesisRevenueAccounts(withdrawalRequest, withdrawalRequest.currency.code, totalAmount)

  await createCurrencyTransaction({
    accountId: completedRequest.accountId,
    amount: totalAmount,
    currencyId: completedRequest.currencyId,
    direction: TransactionDirection.withdrawal,
    requestId: completedRequest.id!,
  })
  logger.debug(
    `Completed withdrawal request for account ${completedRequest.accountId} and amount ${completedRequest.amount} ${withdrawalRequest.currency.code}`,
  )

  return completedRequest
}

async function updateWithdrawerAndKinesisRevenueAccounts(withdrawalRequest: WithdrawalRequest, currencyCode: CurrencyCode, totalAmount: number) {
  const [kinesisRevenueAccount, { withdrawalFee }] = await Promise.all([
    findOrCreateKinesisRevenueAccount(),
    getWithdrawalFee(currencyCode, withdrawalRequest.amount),
  ])

  const transactionFeeCurrencyCode = getTransactionFeeCurrency(currencyCode)

  return await triggerMultipleBalanceChanges([
    {
      type: BalanceAsyncRequestType.confirmPendingDeposit,
      payload: {
        accountId: kinesisRevenueAccount.id,
        amount:
          transactionFeeCurrencyCode === currencyCode
            ? new Decimal(withdrawalFee).minus(withdrawalRequest.kinesisCoveredOnChainFee!).toNumber()
            : withdrawalFee,
        currencyId: withdrawalRequest.currencyId,
        sourceEventId: withdrawalRequest.id!,
        sourceEventType: SourceEventType.currencyWithdrawal,
      },
    },
    {
      type: BalanceAsyncRequestType.confirmPendingWithdrawal,
      payload: {
        accountId: withdrawalRequest.accountId,
        amount: totalAmount,
        currencyId: withdrawalRequest.currencyId,
        sourceEventId: withdrawalRequest.id!,
        sourceEventType: SourceEventType.currencyWithdrawal,
      },
    },
  ])
}

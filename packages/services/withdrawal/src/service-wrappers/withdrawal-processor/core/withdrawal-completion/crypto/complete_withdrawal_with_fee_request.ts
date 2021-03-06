import Decimal from 'decimal.js'

import { findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { SourceEventType } from '@abx-types/balance'
import { Logger } from '@abx-utils/logging'
import { TransactionDirection } from '@abx-types/order'
import { WithdrawalRequest, WithdrawalState, CurrencyEnrichedWithdrawalRequest } from '@abx-types/withdrawal'
import { updateWithdrawalRequests } from '../../../../../core'
import { createCurrencyTransaction } from '@abx-service-clients/order'
import { triggerMultipleBalanceChanges, BalanceAsyncRequestType } from '@abx-service-clients/balance'
import { Transaction } from 'sequelize'

const logger = Logger.getInstance('fiat_withdrawal_completer', 'complete_withdrawal_with_fee_request')

export async function completeCryptoWithdrawalWithSeparateFeeRequest(
  withdrawalRequest: CurrencyEnrichedWithdrawalRequest,
  feeRequest: WithdrawalRequest,
  transaction: Transaction,
): Promise<WithdrawalRequest> {
  logger.debug(
    `Completing crypt withdrawal request for account ${withdrawalRequest.accountId} and id ${withdrawalRequest.id} with a separate fee request ${feeRequest.id}`,
  )
  const completedRequest = await updateWithdrawalRequests(
    [withdrawalRequest.id!, feeRequest.id!],
    {
      state: WithdrawalState.completed,
    },
    transaction,
  )

  await updateWithdrawerAndKinesisRevenueAccounts(withdrawalRequest, feeRequest)
  await createCurrencyTransactionsForWithdrawalAndFee(withdrawalRequest, feeRequest)

  logger.debug(
    `Completed crypt withdrawal request for account ${completedRequest.accountId} and amount ${completedRequest.amount} ${withdrawalRequest.currency.code} with a separate fee request ${feeRequest.id} for ${feeRequest.amount}`,
  )

  return completedRequest
}

async function updateWithdrawerAndKinesisRevenueAccounts(withdrawalRequest: WithdrawalRequest, feeRequest: WithdrawalRequest) {
  const kinesisRevenueAccount = await findOrCreateKinesisRevenueAccount()

  return await triggerMultipleBalanceChanges([
    {
      type: BalanceAsyncRequestType.confirmPendingDeposit,
      payload: {
        accountId: kinesisRevenueAccount.id,
        amount: new Decimal(feeRequest.amount).minus(withdrawalRequest.kinesisCoveredOnChainFee!).toNumber(),
        currencyId: feeRequest.currencyId,
        sourceEventId: feeRequest.id!,
        sourceEventType: SourceEventType.currencyWithdrawalFee,
      },
    },
    {
      type: BalanceAsyncRequestType.confirmPendingWithdrawal,
      payload: {
        accountId: withdrawalRequest.accountId,
        amount: feeRequest.amount,
        currencyId: feeRequest.currencyId,
        sourceEventId: feeRequest.id!,
        sourceEventType: SourceEventType.currencyWithdrawalFee,
      },
    },
    {
      type: BalanceAsyncRequestType.confirmPendingWithdrawal,
      payload: {
        accountId: withdrawalRequest.accountId,
        amount: withdrawalRequest.amount,
        currencyId: withdrawalRequest.currencyId,
        sourceEventId: withdrawalRequest.id!,
        sourceEventType: SourceEventType.currencyWithdrawal,
      },
    },
  ])
}

function createCurrencyTransactionsForWithdrawalAndFee(withdrawalRequest: WithdrawalRequest, feeRequest: WithdrawalRequest) {
  return Promise.all([
    createCurrencyTransaction({
      accountId: withdrawalRequest.accountId,
      amount: withdrawalRequest.amount,
      currencyId: withdrawalRequest.currencyId,
      direction: TransactionDirection.withdrawal,
      requestId: withdrawalRequest.id!,
    }),
    createCurrencyTransaction({
      accountId: feeRequest.accountId,
      amount: feeRequest.amount,
      currencyId: feeRequest.currencyId,
      direction: TransactionDirection.withdrawal,
      requestId: feeRequest.id!,
    }),
  ])
}

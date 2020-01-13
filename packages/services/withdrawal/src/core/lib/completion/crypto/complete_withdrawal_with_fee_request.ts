import Decimal from 'decimal.js'

import { findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { SourceEventType } from '@abx-types/balance'
import { Logger } from '@abx/logging'
import { wrapInTransaction, sequelize } from '@abx/db-connection-utils'
import { TransactionDirection } from '@abx-types/order'
import { WithdrawalRequest, WithdrawalState } from '@abx-types/withdrawal'
import { updateWithdrawalRequests } from '../../common/update_withdrawal_request'
import { findCurrencyForId } from '@abx-service-clients/reference-data'
import { createCurrencyTransaction } from '@abx-service-clients/order'
import { confirmPendingDeposit, confirmPendingWithdrawal } from '@abx-service-clients/balance'

const logger = Logger.getInstance('fiat_withdrawal_completer', 'completeFiatWithdrawal')

export async function completeCryptoWithdrawalWithSeparateFeeRequest(
  withdrawalRequest: WithdrawalRequest,
  feeRequest: WithdrawalRequest,
): Promise<WithdrawalRequest> {
  return wrapInTransaction(sequelize, null, async transaction => {
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

    const { code: withdrawalCurrency } = await findCurrencyForId(withdrawalRequest.currencyId)

    await updateWithdrawerAndKinesisRevenueAccounts(withdrawalRequest, feeRequest)
    await createCurrencyTransactionsForWithdrawalAndFee(withdrawalRequest, feeRequest)

    logger.debug(
      `Completed crypt withdrawal request for account ${completedRequest.accountId} and amount ${completedRequest.amount} ${withdrawalCurrency} with a separate fee request ${feeRequest.id} for ${feeRequest.amount}`,
    )

    return completedRequest
  })
}

async function updateWithdrawerAndKinesisRevenueAccounts(withdrawalRequest: WithdrawalRequest, feeRequest: WithdrawalRequest) {
  const kinesisRevenueAccount = await findOrCreateKinesisRevenueAccount()

  return Promise.all([
    confirmPendingDeposit({
      accountId: kinesisRevenueAccount.id,
      amount: new Decimal(feeRequest.amount).minus(withdrawalRequest.kinesisCoveredOnChainFee!).toNumber(),
      currencyId: feeRequest.currencyId,
      sourceEventId: feeRequest.id!,
      sourceEventType: SourceEventType.currencyWithdrawalFee,
    }),
    confirmPendingWithdrawal({
      accountId: withdrawalRequest.accountId,
      amount: feeRequest.amount,
      currencyId: feeRequest.currencyId,
      sourceEventId: feeRequest.id!,
      sourceEventType: SourceEventType.currencyWithdrawalFee,
    }),
    confirmPendingWithdrawal({
      accountId: withdrawalRequest.accountId,
      amount: withdrawalRequest.amount,
      currencyId: withdrawalRequest.currencyId,
      sourceEventId: withdrawalRequest.id!,
      sourceEventType: SourceEventType.currencyWithdrawal,
    }),
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

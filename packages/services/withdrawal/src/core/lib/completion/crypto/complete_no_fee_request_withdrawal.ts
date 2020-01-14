import Decimal from 'decimal.js'

import { findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { SourceEventType } from '@abx-types/balance'
import { Logger } from '@abx/logging'
import { wrapInTransaction, sequelize } from '@abx/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { TransactionDirection } from '@abx-types/order'
import { getTotalWithdrawalAmount, getWithdrawalFee } from '../../../helper'
import { WithdrawalRequest, WithdrawalState } from '@abx-types/withdrawal'
import { updateWithdrawalRequest } from '../../common/update_withdrawal_request'
import { findCurrencyForId } from '@abx-service-clients/reference-data'
import { createCurrencyTransaction } from '@abx-service-clients/order'
import { confirmPendingDeposit, confirmPendingWithdrawal } from '@abx-service-clients/balance'

const logger = Logger.getInstance('fiat_withdrawal_completer', 'completeFiatWithdrawal')

export async function completeNoFeeRequestCryptoWithdrawal(withdrawalRequest: WithdrawalRequest): Promise<WithdrawalRequest> {
  return wrapInTransaction(sequelize, null, async transaction => {
    const completedRequest = await updateWithdrawalRequest(
      {
        ...withdrawalRequest,
        state: WithdrawalState.completed,
      },
      transaction,
    )

    const { code: withdrawalCurrency } = await findCurrencyForId(withdrawalRequest.currencyId)
    const totalAmount = await getTotalWithdrawalAmount(withdrawalRequest.amount, withdrawalCurrency)

    await updateWithdrawerAndKinesisRevenueAccounts(withdrawalRequest, withdrawalCurrency, totalAmount)

    await createCurrencyTransaction({
      accountId: completedRequest.accountId,
      amount: totalAmount,
      currencyId: completedRequest.currencyId,
      direction: TransactionDirection.withdrawal,
      requestId: completedRequest.id!,
    })
    logger.debug(
      `Completed fiat withdrawal request for account ${completedRequest.accountId} and amount ${completedRequest.amount} ${withdrawalCurrency}`,
    )

    return completedRequest
  })
}

async function updateWithdrawerAndKinesisRevenueAccounts(withdrawalRequest: WithdrawalRequest, currencyCode: CurrencyCode, totalAmount: number) {
  const [kinesisRevenueAccount, { withdrawalFee }] = await Promise.all([
    findOrCreateKinesisRevenueAccount(),
    getWithdrawalFee(currencyCode, withdrawalRequest.amount),
  ])

  return Promise.all([
    confirmPendingDeposit({
      accountId: kinesisRevenueAccount.id,
      amount: new Decimal(withdrawalFee).minus(withdrawalRequest.kinesisCoveredOnChainFee!).toNumber(),
      currencyId: withdrawalRequest.currencyId,
      sourceEventId: withdrawalRequest.id!,
      sourceEventType: SourceEventType.currencyWithdrawal,
    }),
    confirmPendingWithdrawal({
      accountId: withdrawalRequest.accountId,
      amount: totalAmount,
      currencyId: withdrawalRequest.currencyId,
      sourceEventId: withdrawalRequest.id!,
      sourceEventType: SourceEventType.currencyWithdrawal,
    }),
  ])
}

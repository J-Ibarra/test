import { findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { SourceEventType } from '@abx-types/balance'
import { Logger } from '@abx/logging'
import { wrapInTransaction, sequelize } from '@abx/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { TransactionDirection } from '@abx-types/order'
import { getTotalWithdrawalAmount, getWithdrawalFee } from '../../../helper'
import { WithdrawalRequest, WithdrawalState, CurrencyEnrichedWithdrawalRequest } from '@abx-types/withdrawal'
import { updateWithdrawalRequest } from '../../common/update_withdrawal_request'
import { createCurrencyTransaction } from '@abx-service-clients/order'
import { findCurrencyForId } from '@abx-service-clients/reference-data'
import { updateAvailable } from '@abx-service-clients/balance'

const logger = Logger.getInstance('fiat_withdrawal_completer', 'completeFiatWithdrawal')

export async function completeFiatWithdrawalRequest(withdrawalRequest: CurrencyEnrichedWithdrawalRequest, fee?: number): Promise<WithdrawalRequest> {
  return wrapInTransaction(sequelize, null, async transaction => {
    logger.debug(
      `Completing fiat withdrawal request for account ${withdrawalRequest.accountId} and amount ${withdrawalRequest.amount} for currency ${withdrawalRequest.currency.code}`,
    )
    const completedRequest = await updateWithdrawalRequest(
      {
        ...withdrawalRequest,
        state: WithdrawalState.completed,
      },
      transaction,
    )

    const { code: withdrawalCurrency } = await findCurrencyForId(withdrawalRequest.currencyId)
    const totalAmount = await getTotalWithdrawalAmount(withdrawalRequest.amount, withdrawalCurrency, fee)

    await updateWithdrawerAndKinesisRevenueAccounts(withdrawalRequest, withdrawalCurrency, totalAmount, fee)

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

const getKinesisRevAccountAndFee = async (currencyCode, withdrawalRequest, fee) => {
  if (typeof fee !== 'undefined') {
    const kinesisRevenueAccount = await findOrCreateKinesisRevenueAccount()
    return { kinesisRevenueAccount, withdrawalFee: fee }
  } else {
    const [kinesisRevenueAccount, { withdrawalFee }] = await Promise.all([
      findOrCreateKinesisRevenueAccount(),
      getWithdrawalFee(currencyCode, withdrawalRequest.amount),
    ])
    return { kinesisRevenueAccount, withdrawalFee }
  }
}

async function updateWithdrawerAndKinesisRevenueAccounts(
  withdrawalRequest: WithdrawalRequest,
  currencyCode: CurrencyCode,
  totalAmount: number,
  fee?: number,
) {
  const { kinesisRevenueAccount, withdrawalFee } = await getKinesisRevAccountAndFee(currencyCode, withdrawalRequest, fee)

  return Promise.all([
    updateAvailable({
      accountId: kinesisRevenueAccount.id,
      amount: withdrawalFee,
      currencyId: withdrawalRequest.currencyId,
      sourceEventId: withdrawalRequest.id!,
      sourceEventType: SourceEventType.currencyWithdrawal,
    }),
    updateAvailable({
      accountId: withdrawalRequest.accountId,
      amount: -totalAmount,
      currencyId: withdrawalRequest.currencyId,
      sourceEventId: withdrawalRequest.id!,
      sourceEventType: SourceEventType.currencyWithdrawal,
    }),
  ])
}

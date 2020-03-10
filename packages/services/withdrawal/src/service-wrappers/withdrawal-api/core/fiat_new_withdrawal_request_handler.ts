import { Transaction } from 'sequelize'
import { Logger } from '@abx-utils/logging'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { Currency } from '@abx-types/reference-data'
import { InitialiseWithdrawalParams, WithdrawalRequest, WithdrawalState } from '@abx-types/withdrawal'
import { initialiseFiatWithdrawalRequest } from '../../../core'
import { saveClientTriggeredFiatWithdrawalAdminRequest } from '@abx-service-clients/admin-fund-management'

interface FiatWithdrawalRequestParams {
  params: Pick<InitialiseWithdrawalParams, 'amount' | 'accountId' | 'memo' | 'currencyCode' | 'transactionId' | 'transactionFee' | 'adminRequestId'>
  currency: Currency
  createdAt?: Date
  saveAdminRequest?: boolean
  transaction?: Transaction
}

const logger = Logger.getInstance('fiat_new_withdrawal_request_handler', 'handleFiatCurrencyWithdrawalRequest')

export async function handleFiatCurrencyWithdrawalRequest({
  params: { amount, accountId, memo, currencyCode, transactionId, transactionFee, adminRequestId },
  currency,
  createdAt,
  transaction,
  saveAdminRequest = true,
}: FiatWithdrawalRequestParams): Promise<WithdrawalRequest> {
  return wrapInTransaction(sequelize, transaction, async t => {
    logger.info(`Requesting Fiat Withdrawal for ${amount}: ${currency.code}, for account: ${accountId}`)

    let withdrawalAdminRequestId: number
    let withdrawalTransactionId: string
    let withdrawalFee: number

    // If the withdrawal request is made via the admin fund management it will be saved separately
    // and the flag here would be false
    if (saveAdminRequest) {
      logger.debug(`Saving admin request for fiat withdrawal(account ${accountId}) for ${amount}: ${currency.code}, for account: ${accountId}`)

      const savedAdminRequest = await saveClientTriggeredFiatWithdrawalAdminRequest(accountId, currency.code, amount, memo!)

      logger.debug(`Admin request for fiat withdrawal saved with globalTransactionId: ${savedAdminRequest.globalTransactionId}`)

      withdrawalAdminRequestId = savedAdminRequest.id
      withdrawalTransactionId = savedAdminRequest.globalTransactionId
      withdrawalFee = savedAdminRequest.fee!
    }

    const requestedWithdrawal = await initialiseFiatWithdrawalRequest(
      {
        accountId,
        amount,
        currencyCode,
        memo: memo || '',
        state: WithdrawalState.pending,
        createdAt,
        transactionId: transactionId || withdrawalTransactionId!,
        transactionFee: typeof transactionFee === 'number' ? transactionFee : withdrawalFee!,
        adminRequestId: adminRequestId || withdrawalAdminRequestId!,
      },
      t,
    )

    return requestedWithdrawal
  })
}

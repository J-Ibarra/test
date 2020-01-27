import { Transaction } from 'sequelize'

import { Logger } from '@abx-utils/logging'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { FiatCurrency, Currency } from '@abx-types/reference-data'
import { getWithdrawalFee } from '../../../helper'
import { InitialiseWithdrawalParams } from '@abx-types/withdrawal'
import { updatePendingWithdrawerAndKinesisRevenueAccounts } from './balance-update'
import { createWithdrawalRequests, WithdrawalRequestCreationResult } from './request-creation'

const preferredCurrencyCode = FiatCurrency.usd

const logger = Logger.getInstance('initialise_crypto_withdrawal_request', 'initialiseCryptoWithdrawalRequest')

const withdrawalRequestCreated = 'exchange:withdrawal:withdrawalRequestCreated'

export function initialiseCryptoWithdrawalRequest(
  initialiseWithdrawalParams: InitialiseWithdrawalParams,
  withdrawalCurrency: Currency,
  feeCurrency: Currency,
  t?: Transaction,
): Promise<WithdrawalRequestCreationResult> {
  const epicurus = getEpicurusInstance()
  return wrapInTransaction(sequelize, t, async transaction => {
    const { withdrawalFee, feeCurrencyCode } = await getWithdrawalFee(initialiseWithdrawalParams.currencyCode, initialiseWithdrawalParams.amount)

    const { amountRequest, feeRequest } = await createWithdrawalRequests(
      initialiseWithdrawalParams,
      preferredCurrencyCode,
      withdrawalFee,
      withdrawalCurrency,
      feeCurrency,
      transaction,
    )

    await updatePendingWithdrawerAndKinesisRevenueAccounts(
      { ...amountRequest, feeCurrencyId: feeCurrency.id },
      initialiseWithdrawalParams.amount,
      withdrawalFee,
    )

    epicurus.publish(withdrawalRequestCreated, amountRequest)
    if (!!feeRequest) {
      epicurus.publish(withdrawalRequestCreated, feeRequest)
    }

    logger.info(
      `Created withdrawal requests for account ${initialiseWithdrawalParams.accountId}
      and amount ${initialiseWithdrawalParams.amount} ${initialiseWithdrawalParams.currencyCode},
      with a fee of ${initialiseWithdrawalParams.amount} ${feeCurrencyCode}`,
    )

    return !!feeRequest
      ? {
          amountRequest: {
            ...amountRequest,
            currency: withdrawalCurrency,
          },
          feeRequest: {
            ...feeRequest,
            currency: feeCurrency,
          },
        }
      : {
          amountRequest: {
            ...amountRequest,
            currency: withdrawalCurrency,
          },
        }
  })
}

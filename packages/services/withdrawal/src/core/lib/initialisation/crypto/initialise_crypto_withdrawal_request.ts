import { Transaction } from 'sequelize'

import { Logger } from '@abx-utils/logging'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { FiatCurrency, SymbolPairStateFilter } from '@abx-types/reference-data'
import { getWithdrawalFee } from '../../../helper'
import { InitialiseWithdrawalParams } from '@abx-types/withdrawal'
import { updatePendingWithdrawerAndKinesisRevenueAccounts } from './balance-update'
import { createWithdrawalRequests, WithdrawalRequestCreationResult } from './request-creation'
import { findCurrencyForCodes } from '@abx-service-clients/reference-data'
import { WithdrawalPubSubChannels } from '@abx-service-clients/withdrawal'

const preferredCurrencyCode = FiatCurrency.usd

const logger = Logger.getInstance('initialise_crypto_withdrawal_request', 'initialiseCryptoWithdrawalRequest')

export function initialiseCryptoWithdrawalRequest(
  initialiseWithdrawalParams: InitialiseWithdrawalParams,
  t?: Transaction,
): Promise<WithdrawalRequestCreationResult> {
  const epicurus = getEpicurusInstance()
  return wrapInTransaction(sequelize, t, async (transaction) => {
    const { withdrawalFee, feeCurrencyCode } = await getWithdrawalFee(initialiseWithdrawalParams.currencyCode, initialiseWithdrawalParams.amount)
    const [withdrawalCurrency, feeCurrency] = await findCurrencyForCodes(
      [initialiseWithdrawalParams.currencyCode, feeCurrencyCode],
      SymbolPairStateFilter.all,
    )

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

    epicurus.publish(WithdrawalPubSubChannels.withdrawalRequestCreated, { withdrawalRequest: amountRequest })
    if (!!feeRequest) {
      epicurus.publish(WithdrawalPubSubChannels.withdrawalRequestCreated, { withdrawalRequest: feeRequest })
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

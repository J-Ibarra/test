import { Transaction } from 'sequelize'

import { Logger } from '@abx/logging'
import { wrapInTransaction, sequelize } from '@abx/db-connection-utils'
import { getEpicurusInstance } from '@abx/db-connection-utils'
import { CurrencyCode, FiatCurrency } from '@abx-types/reference-data'
import * as helper from '../../../helper'
import { getTotalWithdrawalAmount, getWithdrawalFee } from '../../../helper'
import { EnrichedInitialisationParams, WithdrawalRequest, WithdrawalRequestType } from '@abx-types/withdrawal'

import { createWithdrawalRequest } from '../../common/create_withdrawal_request'
import { findCurrencyForCode } from '@abx-service-clients/reference-data'

const preferredCurrencyCode = FiatCurrency.usd

const withdrawalRequestCreated = 'exchange:withdrawal:withdrawalRequestCreated'

const logger = Logger.getInstance('initialise_fiat_withdrawal_request', 'initialiseFiatWithdrawalRequest')

export function initialiseFiatWithdrawalRequest(
  { accountId, address, amount, currencyCode, memo, state, createdAt, transactionFee, transactionId, adminRequestId }: EnrichedInitialisationParams,
  t?: Transaction,
): Promise<WithdrawalRequest> {
  const epicurus = getEpicurusInstance()
  return wrapInTransaction(sequelize, t, async transaction => {
    const { id: withdrawalCurrencyId } = await findCurrencyForCode(currencyCode)

    const { withdrawalFee, feeCurrencyCode } = await getWithdrawalFee(currencyCode, amount, adminRequestId)
    const { fiatConversion, kauConversion } = await calculateConversionRates({ amount, currencyCode, addFee: true, fee: transactionFee })

    const withdrawalRequest = await createWithdrawalRequest(
      {
        accountId,
        address,
        amount,
        currencyId: withdrawalCurrencyId,
        memo,
        state,
        fiatCurrencyCode: preferredCurrencyCode,
        fiatConversion: Number(fiatConversion),
        kauConversion: Number(kauConversion),
        createdAt,
        type: WithdrawalRequestType.withdrawal,
        adminRequestId,
      },
      transaction,
    )

    epicurus.publish(withdrawalRequestCreated, {
      withdrawalRequest: {
        ...withdrawalRequest,
        transactionFee,
        transactionId,
      },
      adminRequestId,
    })

    logger.debug(
      `Created withdrawal requests for account ${withdrawalRequest.accountId}
      and amount ${withdrawalRequest.amount} ${currencyCode},
      with a fee of ${typeof transactionFee === 'number' ? transactionFee : withdrawalFee} ${feeCurrencyCode}`,
    )

    return withdrawalRequest
  })
}

async function calculateConversionRates({
  amount,
  currencyCode,
  addFee = true,
  fee,
}: {
  amount: number
  currencyCode: CurrencyCode
  addFee: boolean
  fee?: number
}): Promise<{ totalAmount: number; fiatConversion: string; kauConversion: string }> {
  const totalAmount = addFee ? await getTotalWithdrawalAmount(amount, currencyCode, fee) : amount
  const [fiatConversion, kauConversion] = await Promise.all([
    helper.convertAmountToFiatCurrency(currencyCode, preferredCurrencyCode, totalAmount),
    helper.kauConversion(currencyCode, amount),
  ])

  return { totalAmount, fiatConversion, kauConversion }
}

import Decimal from 'decimal.js'
import { Transaction } from 'sequelize'

import { Account } from '@abx-types/account'
import { SourceEventType } from '@abx-types/balance'

import { CurrencyBoundary } from '@abx-types/reference-data'
import { ValidationError } from '@abx-types/error'

import { getCurrencyId } from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'

import { AdminRequest } from '@abx-service-clients/admin-fund-management'
import { createPendingRedemption } from '@abx-service-clients/balance'

const kauIncrement = 100
const kagIncrement = 200

export async function handleRedemptionRequestCreation(
  adminRequest: AdminRequest,
  clientAccount: Account,
  currencyBoundary: CurrencyBoundary,
  transaction: Transaction,
) {
  const currencyId = await getCurrencyId(adminRequest.asset)

  if (!redemptionAmountValid(adminRequest.amount, adminRequest.asset)) {
    throw new ValidationError(`Redemption request for ${adminRequest.amount} ${adminRequest.asset} has invalid amount`)
  }

  return createPendingRedemption({
    sourceEventType: SourceEventType.adminRequest,
    sourceEventId: adminRequest.id,
    currencyId,
    accountId: clientAccount.id,
    amount: new Decimal(adminRequest.amount)
      .plus(adminRequest.fee!)
      .toDecimalPlaces(currencyBoundary.maxDecimals)
      .toNumber(),
    t: transaction,
  })
}

function redemptionAmountValid(amount: number, currency: CurrencyCode) {
  if (currency === CurrencyCode.kau) {
    return amount % kauIncrement === 0
  }

  return amount % kagIncrement === 0
}

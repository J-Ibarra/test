import Decimal from 'decimal.js'
import { Account } from '@abx-types/account'
import { CurrencyBoundary } from '@abx-types/reference-data'

import { SourceEventType } from '@abx-types/balance'

import { getCurrencyId } from '@abx-service-clients/reference-data'
import { AdminRequest } from '@abx-service-clients/admin-fund-management'
import { createPendingDeposit } from '@abx-service-clients/balance'

export async function handleDepositRequestCreation(adminRequest: AdminRequest, clientAccount: Account, currencyBoundary: CurrencyBoundary) {
  const currencyId = await getCurrencyId(adminRequest.asset)

  return createPendingDeposit({
    sourceEventType: SourceEventType.adminRequest,
    sourceEventId: adminRequest.id,
    currencyId,
    accountId: clientAccount.id,
    amount: new Decimal(adminRequest.amount)
      .plus(adminRequest.fee!)
      .toDecimalPlaces(currencyBoundary.maxDecimals)
      .toNumber(),
  })
}

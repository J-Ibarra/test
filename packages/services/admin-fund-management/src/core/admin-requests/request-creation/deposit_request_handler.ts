import Decimal from 'decimal.js'
import { Transaction } from 'sequelize'
import { Account } from '@abx-types/account'
import { CurrencyBoundary } from '@abx-types/reference-data'

import { BalanceMovementFacade } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'

import { getCurrencyId } from '@abx-service-clients/reference-data'
import { AdminRequest } from '@abx-service-clients/admin-fund-management'

const balanceMovementFacade = BalanceMovementFacade.getInstance()

export async function handleDepositRequestCreation(
  adminRequest: AdminRequest,
  clientAccount: Account,
  currencyBoundary: CurrencyBoundary,
  transaction: Transaction,
) {
  const currencyId = await getCurrencyId(adminRequest.asset)

  return balanceMovementFacade.createPendingDeposit({
    sourceEventType: SourceEventType.adminRequest,
    sourceEventId: adminRequest.id,
    currencyId,
    accountId: clientAccount.id,
    amount: new Decimal(adminRequest.amount)
      .plus(adminRequest.fee)
      .toDecimalPlaces(currencyBoundary.maxDecimals)
      .toNumber(),
    t: transaction,
  })
}

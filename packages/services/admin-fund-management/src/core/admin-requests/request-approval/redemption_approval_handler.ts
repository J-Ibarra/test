import Decimal from 'decimal.js'
import { Transaction } from 'sequelize'
import { findAccountWithUserDetails, findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { BalanceMovementFacade } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import { findBoundaryForCurrency, getCurrencyId } from '@abx-service-clients/reference-data'
import { Logger } from '@abx/logging'
import { sequelize, wrapInTransaction } from '@abx/db-connection-utils'
import { AdminRequest, AdminRequestStatus } from '@abx-service-clients/admin-fund-management'
import { getEnvironment } from '@abx-types/reference-data'
import { getOnChainCurrencyManagerForEnvironment, Kinesis } from '@abx-query-libs/blockchain-currency-gateway'

import { updateAdminRequestStatus } from '../update_admin_request'


const balanceMovementFacade = BalanceMovementFacade.getInstance()
const logger = Logger.getInstance('redemption_approval_handler', 'approveRedemption')

export function approveRedemption(
  adminRequest: AdminRequest,
  adminId: string,
  transaction: Transaction,
): Promise<AdminRequest> {
  return wrapInTransaction(sequelize, transaction, async t => {
    logger.info(
      `Processing redemption request approval(${adminRequest.id}) for account hin ${
        adminRequest.hin
      } and amount ${adminRequest.amount} and fee ${adminRequest.fee} `,
    )
    const [clientAccount, currencyId] = await Promise.all([
      findAccountWithUserDetails({ hin: adminRequest.hin }, t),
      getCurrencyId(adminRequest.asset),
    ])

    await updateClientAndKinesisRevenueAccountBalances(
      adminRequest,
      clientAccount.id,
      currencyId,
      t,
    )

    logger.debug(
      `Burning ${adminRequest.amount} ${adminRequest.asset} for redemption request ${
        adminRequest.id
      }`,
    )
    const kauKagOnChainGateway = getOnChainCurrencyManagerForEnvironment(getEnvironment(), [
      adminRequest.asset,
    ])
    await (kauKagOnChainGateway.getCurrencyFromTicker(
      adminRequest.asset,
    ) as Kinesis).transferFromExchangeHoldingsToEmissionsAccount(adminRequest.amount)
    logger.debug(
      `Burned ${adminRequest.amount} ${adminRequest.asset} for redemption request ${
        adminRequest.id
      }`,
    )

    return updateAdminRequestStatus(adminRequest.id, adminId, AdminRequestStatus.approved, t)
  })
}

async function updateClientAndKinesisRevenueAccountBalances(
  adminRequest: AdminRequest,
  clientAccountId: string,
  currencyId: number,
  transaction: Transaction,
) {
  const [kinesisRevenueAccount, boundaryForCurrency] = await Promise.all([
    findOrCreateKinesisRevenueAccount(),
    findBoundaryForCurrency(adminRequest.asset),
  ])

  return Promise.all([
    balanceMovementFacade.confirmPendingRedemption({
      sourceEventType: SourceEventType.adminRequest,
      sourceEventId: adminRequest.id,
      currencyId,
      accountId: clientAccountId,
      amount: new Decimal(adminRequest.amount)
        .plus(adminRequest.fee)
        .toDecimalPlaces(boundaryForCurrency.maxDecimals)
        .toNumber(),
      t: transaction,
    }),
    balanceMovementFacade.updateAvailable({
      sourceEventType: SourceEventType.adminRequest,
      sourceEventId: adminRequest.id,
      currencyId,
      accountId: kinesisRevenueAccount.id,
      amount: adminRequest.fee,
      t: transaction,
    }),
  ])
}

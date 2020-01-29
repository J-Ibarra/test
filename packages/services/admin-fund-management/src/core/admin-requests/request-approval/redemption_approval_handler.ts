import Decimal from 'decimal.js'
import { Transaction } from 'sequelize'
import { findAccountWithUserDetails, findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { SourceEventType } from '@abx-types/balance'
import { findBoundaryForCurrency, getCurrencyId } from '@abx-service-clients/reference-data'
import { Logger } from '@abx-utils/logging'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { AdminRequest, AdminRequestStatus } from '@abx-service-clients/admin-fund-management'
import { getEnvironment } from '@abx-types/reference-data'
import { getOnChainCurrencyManagerForEnvironment, Kinesis } from '@abx-query-libs/blockchain-currency-gateway'

import { updateAdminRequestStatus } from '../update_admin_request'
import { triggerMultipleBalanceChanges, BalanceAsyncRequestType } from '@abx-service-clients/balance'

const logger = Logger.getInstance('redemption_approval_handler', 'approveRedemption')

export function approveRedemption(adminRequest: AdminRequest, adminId: string, transaction: Transaction): Promise<AdminRequest> {
  return wrapInTransaction(sequelize, transaction, async t => {
    logger.info(
      `Processing redemption request approval(${adminRequest.id}) for account hin ${adminRequest.hin} and amount ${adminRequest.amount} and fee ${adminRequest.fee} `,
    )
    const [clientAccount, currencyId] = await Promise.all([findAccountWithUserDetails({ hin: adminRequest.hin }), getCurrencyId(adminRequest.asset)])

    await updateClientAndKinesisRevenueAccountBalances(adminRequest, clientAccount!.id, currencyId!)

    logger.debug(`Burning ${adminRequest.amount} ${adminRequest.asset} for redemption request ${adminRequest.id}`)
    const kauKagOnChainGateway: Kinesis = getOnChainCurrencyManagerForEnvironment(getEnvironment(), [adminRequest.asset]).getCurrencyFromTicker(
      adminRequest.asset,
    ) as Kinesis

    await kauKagOnChainGateway.transferFromExchangeHoldingsToEmissionsAccount(adminRequest.amount)
    logger.debug(`Burned ${adminRequest.amount} ${adminRequest.asset} for redemption request ${adminRequest.id}`)

    return updateAdminRequestStatus(adminRequest.id, adminId, AdminRequestStatus.approved, t)
  })
}

async function updateClientAndKinesisRevenueAccountBalances(adminRequest: AdminRequest, clientAccountId: string, currencyId: number) {
  const [kinesisRevenueAccount, boundaryForCurrency] = await Promise.all([
    findOrCreateKinesisRevenueAccount(),
    findBoundaryForCurrency(adminRequest.asset),
  ])

  return triggerMultipleBalanceChanges([
    {
      type: BalanceAsyncRequestType.confirmPendingRedemption,
      payload: {
        sourceEventType: SourceEventType.adminRequest,
        sourceEventId: adminRequest.id,
        currencyId,
        accountId: clientAccountId,
        amount: new Decimal(adminRequest.amount)
          .plus(adminRequest.fee!)
          .toDecimalPlaces(boundaryForCurrency.maxDecimals)
          .toNumber(),
      },
    },
    {
      type: BalanceAsyncRequestType.updateAvailable,
      payload: {
        sourceEventType: SourceEventType.adminRequest,
        sourceEventId: adminRequest.id,
        currencyId,
        accountId: kinesisRevenueAccount.id,
        amount: adminRequest.fee!,
      },
    },
  ])
}

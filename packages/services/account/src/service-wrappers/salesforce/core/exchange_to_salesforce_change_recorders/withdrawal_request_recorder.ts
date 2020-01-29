import { get } from 'lodash'
import { getBankDetailsForAccount } from '../../../../core/bank-details/bank-details-retrieval'
import * as SalesforceTradingPlatformRecord from '../../../../core/salesforce/object-access-gateways/trading_platform_gateway'
import { updateAdminRequest } from '@abx-service-clients/admin-fund-management'
import { Logger } from '@abx-utils/logging'
import { getModel } from '@abx-utils/db-connection-utils'
import { getCurrencyCode, isFiatCurrency } from '@abx-service-clients/reference-data'
import { WithdrawalRequest } from '@abx-types/withdrawal'
import { SalesforceReferenceTable } from '@abx-types/account'
import { getSalesforceClient } from '../../../../core'

const logger = Logger.getInstance('salesforce', 'withdrawalRequestRecorder')

export async function withdrawalRequestRecorder({
  withdrawalRequest,
  adminRequestId,
}: {
  withdrawalRequest: WithdrawalRequest
  adminRequestId: number
}) {
  const currencyCode = await getCurrencyCode(withdrawalRequest.currencyId)
  if (!isFiatCurrency(currencyCode!)) {
    logger.debug('Not a FIAT currency, not posting to SF')
    return
  }

  const client = await getSalesforceClient()

  const salesforceReferenceForAccount = await getModel<SalesforceReferenceTable>('salesforce').findOne({
    where: { accountId: withdrawalRequest.accountId },
  })

  const accountPersonalBankDetails = (await getBankDetailsForAccount(withdrawalRequest.accountId))!

  try {
    const response = await SalesforceTradingPlatformRecord.createWithdrawalTradingPlatformRecord(client, {
      withdrawalRequest,
      accountPersonalBankDetails,
      salesforceReference: salesforceReferenceForAccount!.get(),
    })

    logger.info(`Adding SalesForce trading platform name ${response.id} to admin request tabale for id ${adminRequestId}`)
    await updateAdminRequest(adminRequestId, { tradingPlatformName: response.id })

    logger.info(`Create salesforce Trading Platform Record for account ${withdrawalRequest.accountId} withdrawal ${withdrawalRequest.id}`)
  } catch (e) {
    logger.error(
      `Error creating Trading Platform Record for account ${withdrawalRequest.accountId} deposit currency transaction ${withdrawalRequest.id}`,
    )
    logger.error(get(e, 'response.data', e))
  }
}

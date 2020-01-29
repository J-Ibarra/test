import { get } from 'lodash'
import { getSalesforceClient } from '../../../../core'
import * as SalesforceTradingPlatformRecord from '../../../../core/salesforce/object-access-gateways/trading_platform_gateway'
import { Logger } from '@abx-utils/logging'
import { WithdrawalUpdateRequest } from '@abx-service-clients/admin-fund-management'

const logger = Logger.getInstance('salesforce', 'fiatWithdrawalRequestUpdater')

export async function fiatWithdrawalRequestUpdater(withdrawalUpdateRequest: WithdrawalUpdateRequest) {
  const client = await getSalesforceClient()

  try {
    await SalesforceTradingPlatformRecord.updateWithdrawalTradingPlatformRecord(client, withdrawalUpdateRequest)

    logger.info(
      `Update salesforce Trading Platform Record for global transaction id ${withdrawalUpdateRequest.globalTransactionId} to status ${withdrawalUpdateRequest.paymentStatus}`,
    )
  } catch (e) {
    logger.error(
      `Error while ocurred while updating Trading Platform Record for global transaction id ${withdrawalUpdateRequest.globalTransactionId} to status ${withdrawalUpdateRequest.paymentStatus}`,
    )
    logger.error(get(e, 'response.data', e))
  }
}

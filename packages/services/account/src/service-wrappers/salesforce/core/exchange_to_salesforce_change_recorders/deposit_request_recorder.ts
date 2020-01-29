import { get } from 'lodash'
import { getBankDetailsForAccount, getSalesforceClient } from '../../../../core'
import * as SalesforceTradingPlatformRecord from '../../../../core/salesforce/object-access-gateways/trading_platform_gateway'
import { Logger } from '@abx-utils/logging'
import { getModel } from '@abx-utils/db-connection-utils'
import { SalesforceReferenceTable } from '@abx-types/account'
import { DepositConfirmationEvent } from '@abx-service-clients/admin-fund-management'

const logger = Logger.getInstance('salesforce', 'depositRequestRecorder')

export async function depositRequestRecorder(fiatDepositEvent: DepositConfirmationEvent) {
  const client = await getSalesforceClient()

  const salesforceReferenceForAccount = await getModel<SalesforceReferenceTable>('salesforce').findOne({
    where: { accountId: fiatDepositEvent.accountId },
  })

  const accountPersonalBankDetails = (await getBankDetailsForAccount(fiatDepositEvent.accountId))!

  try {
    await SalesforceTradingPlatformRecord.createDepositTradingPlatformRecord(client, {
      fiatDepositEvent,
      accountPersonalBankDetails,
      salesforceReference: salesforceReferenceForAccount!.get(),
    })

    logger.info(
      `Create salesforce Trading Platform Record for account ${fiatDepositEvent.accountId} deposit currency transaction for currency ${fiatDepositEvent.currencyCode} and amount ${fiatDepositEvent.amount}`,
    )
  } catch (e) {
    logger.error(
      `Error while creating salesforce Trading Platform Record for account ${fiatDepositEvent.accountId} deposit currency transaction for currency ${fiatDepositEvent.currencyCode} and amount ${fiatDepositEvent.amount}`,
    )
    logger.error(get(e, 'response.data', e))
  }
}

import { get } from 'lodash'
import { SalesforceReferenceTable } from '@abx-types/account'
import * as SalesforceAccount from '../../../../core/salesforce/object-access-gateways/account_gateway'
import * as SalesforcePlatformCredential from '../../../../core/salesforce/object-access-gateways/platform_credential_gateway'
import { Logger } from '@abx-utils/logging'
import { getModel } from '@abx-utils/db-connection-utils'
import { getSalesforceClient, createLinkedAddress, findAccountWithUserDetails } from '../../../../core'
import { findDepositAddressesForAccount } from '@abx-service-clients/deposit'
import { findAllCurrencies } from '@abx-service-clients/reference-data'
import { Currency } from '@abx-types/reference-data'

const logger = Logger.getInstance('salesforce', 'accountCreatedHandler')

export async function accountCreatedRecorder({ accountId }: { accountId: string }) {
  const client = await getSalesforceClient()
  const account = (await findAccountWithUserDetails({ id: accountId }))!
  const accountUser = account.users![0]!

  logger.debug(`Creating new or linking existing Salesforce account for ${accountUser.email}`)
  logger.debug(`And account user: ${accountUser.id}`)

  try {
    const salesforceAccount = await SalesforceAccount.getOrCreateAccount(client, {
      user: accountUser,
    })

    logger.debug(`Salesforce Account retrieved or created ${JSON.stringify(salesforceAccount)}`)

    const referrerSalesforcePlatformCredentialId = (await getReferrerSalesforceAccountId(accountUser.referredBy!))!

    logger.debug(
      `Found referrerSalesforcePlatformCredentialId: ${referrerSalesforcePlatformCredentialId} for account user's referrer ${accountUser.referredBy}`,
    )

    const platformCredentialResponse = await SalesforcePlatformCredential.createPlatformCredential(client, {
      account,
      user: accountUser,
      salesforceAccountId: salesforceAccount.id,
      referrerSalesforcePlatformCredentialId,
    })
    logger.debug(`PlatformCredential Created ${JSON.stringify(platformCredentialResponse)}`)

    const [salesforceReference, depositAddresses] = await Promise.all([
      createSalesforceReferenceForAccount(account.id, salesforceAccount.id, platformCredentialResponse.id),
      findDepositAddressesForAccount(account.id),
    ])
    const currencies = await findAllCurrencies()
    const currencyIdToCurrency = currencies.reduce((acc, currency) => acc.set(currency.id, currency), new Map<number, Currency>())

    const linkedAddressResponse = await Promise.all(
      depositAddresses.map(depositAddress =>
        createLinkedAddress(client, {
          salesforceReference,
          depositAddress: { ...depositAddress, currency: currencyIdToCurrency.get(depositAddress.currencyId) },
        }),
      ),
    )
    logger.debug(`Linked addresses created: ${JSON.stringify(linkedAddressResponse)}`)
  } catch (e) {
    logger.error(get(e, 'response.data', e))
  }
}

async function createSalesforceReferenceForAccount(
  accountId: string,
  salesforceAccountId: string,
  platformCredentialResponseId: string,
): Promise<SalesforceReferenceTable> {
  const account = await getModel<SalesforceReferenceTable>('salesforce').create({
    accountId,
    salesforceAccountId,
    salesforcePlatformCredentialId: platformCredentialResponseId,
  })

  return account.get()
}

async function getReferrerSalesforceAccountId(referrerId: string) {
  if (!!referrerId) {
    const salesforceReference = await getModel<SalesforceReferenceTable>('salesforce').findOne({
      where: { accountId: referrerId },
    })

    return !!salesforceReference ? salesforceReference.get().salesforcePlatformCredentialId : null
  }

  return null
}

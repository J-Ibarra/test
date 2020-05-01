import { get } from 'lodash'
import { SalesforceReferenceTable } from '@abx-types/account'
import * as SalesforceAccount from '../../../../core/salesforce/object-access-gateways/account_gateway'
import * as SalesforcePlatformCredential from '../../../../core/salesforce/object-access-gateways/platform_credential_gateway'
import { Logger } from '@abx-utils/logging'
import { getModel } from '@abx-utils/db-connection-utils'
import { getSalesforceClient, createLinkedAddress, findAccountWithUserDetails } from '../../../../core'
import { getAllCurrenciesEligibleForAccount } from '@abx-service-clients/reference-data'
import { Currency } from '@abx-types/reference-data'
import { DepositAddress } from '@abx-types/deposit'

const logger = Logger.getInstance('salesforce', 'accountCreatedHandler')

export async function accountCreatedRecorder({ accountId, newDepositAddresses }: { accountId: string; newDepositAddresses: DepositAddress[] }) {
  const client = await getSalesforceClient()
  const account = (await findAccountWithUserDetails({ id: accountId }))!
  const accountUser = account.users![0]!

  logger.debug(`Creating new or linking existing Salesforce account for ${accountUser.email}`)
  logger.debug(`And account user: ${accountUser.id}`)

  try {
    const { salesforceAccount, newAccountCreated } = await SalesforceAccount.getOrCreateAccount(client, {
      user: accountUser,
    })

    logger.debug(`Salesforce Account retrieved or created ${JSON.stringify(salesforceAccount)}`)

    const referrerSalesforcePlatformCredentialId = (await getReferrerSalesforceAccountId(accountUser.referredBy!))!

    logger.debug(
      `Found referrerSalesforcePlatformCredentialId: ${referrerSalesforcePlatformCredentialId} for account user's referrer ${accountUser.referredBy}`,
    )

    let salesforceReference = await getSalesforceReferenceForAccount(account.id)

    if (newAccountCreated) {
      const platformCredentialResponse = await SalesforcePlatformCredential.createPlatformCredential(client, {
        account,
        user: accountUser,
        salesforceAccountId: salesforceAccount.id,
        referrerSalesforcePlatformCredentialId,
      })
      logger.debug(`PlatformCredential Created ${JSON.stringify(platformCredentialResponse)}`)

      salesforceReference = await createSalesforceReferenceForAccount(account.id, salesforceAccount.id, platformCredentialResponse.id)
    }

    const currencies = await getAllCurrenciesEligibleForAccount(account.id)
    const currencyIdToCurrency = currencies.reduce((acc, currency) => acc.set(currency.id, currency), new Map<number, Currency>())

    logger.debug(`Deposit address currencies for account ${accountId} : ${newDepositAddresses.map(({ currencyId }) => currencyId).join(',')} `)

    const linkedAddressResponse = await Promise.all(
      newDepositAddresses.map((depositAddress) => {
        logger.info(`Creating a linked address for currency ${depositAddress.currencyId} and account ${accountId}`)

        return createLinkedAddress(client, {
          salesforceReference: salesforceReference!,
          depositAddress: { ...depositAddress, currency: currencyIdToCurrency.get(depositAddress.currencyId) },
        })
      }),
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
  const salesforceReferenceRecord = await getModel<SalesforceReferenceTable>('salesforce').create({
    accountId,
    salesforceAccountId,
    salesforcePlatformCredentialId: platformCredentialResponseId,
  })

  return salesforceReferenceRecord.get()
}

async function getSalesforceReferenceForAccount(accountId: string): Promise<SalesforceReferenceTable | null> {
  const salesforceReferenceRecord = await getModel<SalesforceReferenceTable>('salesforce').findOne({
    where: {
      accountId,
    },
  })

  return salesforceReferenceRecord ? salesforceReferenceRecord.get() : null
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

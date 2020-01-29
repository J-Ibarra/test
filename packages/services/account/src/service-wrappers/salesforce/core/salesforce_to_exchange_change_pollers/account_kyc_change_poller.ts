import { AxiosInstance } from 'axios'
import { get } from 'lodash'
import { Account, AccountStatus, KycStatusChange, SalesforceReferenceTable } from '@abx-types/account'
import { getSalesforceClient, SalesforceAccountStatus } from '../../../../core'
import * as SalesforceAccount from '../../../../core/salesforce/object-access-gateways/account_gateway'
import * as SalesforcePlatformCredential from '../../../../core/salesforce/object-access-gateways/platform_credential_gateway'
import { Logger } from '@abx-utils/logging'
import { getModel, getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { AccountPubSubTopics } from '@abx-service-clients/account'

const logger = Logger.getInstance('salesforce', 'accountKycChangePoller')

const invalidStatuses = [SalesforceAccountStatus.completeRejected]

export async function accountKycChangePoller() {
  logger.debug('Executing account kyc check reconciler')
  const client = await getSalesforceClient()

  const salesforceReferenceRows = await getSalesforceReferencesForKycTriggeredAccounts()
  logger.debug(`${salesforceReferenceRows.length} accounts found with kyc verification triggered`)
  if (salesforceReferenceRows.length === 0) {
    return
  }

  const salesforceAccountIdToReference = salesforceReferenceRows.reduce(
    (acc, referenceRow) => acc.set(referenceRow.salesforceAccountId, referenceRow),
    new Map<string, SalesforceReferenceTable>(),
  )

  try {
    const { verified, failed } = await getSalesforceStatusForAccounts(
      client,
      salesforceReferenceRows.map(({ salesforceAccountId }) => salesforceAccountId),
    )

    logger.debug(`${verified.length} accounts verified`)
    logger.debug(`${failed.length} accounts failed verification`)

    const verifiedRecords = verified.map(r => salesforceAccountIdToReference.get(r.Id)!)

    const verifiedAccountIds = verifiedRecords.map(({ accountId }) => accountId)
    const verifiedPlatformCredentialIds = verifiedRecords.map(({ salesforcePlatformCredentialId }) => salesforcePlatformCredentialId)

    const failedRecords = failed.map(r => salesforceAccountIdToReference.get(r.Id)!)
    const failedAccountIds = failedRecords.map(({ accountId }) => accountId)

    await Promise.all([updateVerifiedAccounts(verifiedAccountIds), updateVerificationFailedAccounts(failedAccountIds)])

    logger.debug(`${verifiedPlatformCredentialIds.length} platform credentials being updated to KYC approved`)

    await Promise.all(
      verifiedPlatformCredentialIds.map(salesforcePlatformCredentialId => {
        SalesforcePlatformCredential.updatePlatformCredential(client, salesforcePlatformCredentialId, {
          Verification_Tier__c: SalesforcePlatformCredential.VerificationTier.tier_two,
        })
      }),
    )
  } catch (e) {
    logger.error(get(e, 'response.data', e))
  }
}

async function getSalesforceReferencesForKycTriggeredAccounts() {
  const salesforceReferenceInstances = await getModel<SalesforceReferenceTable>('salesforce').findAll({
    include: [
      {
        model: getModel<Account>('account'),
        as: 'account',
        where: { hasTriggeredKycCheck: true },
        attributes: ['id'],
      },
    ],
  })

  return salesforceReferenceInstances.map(account => account.get())
}

async function getSalesforceStatusForAccounts(
  client: AxiosInstance,
  salesforceAccountIds: string[],
): Promise<{
  verified: SalesforceAccount.AccountStatusRecord[]
  failed: SalesforceAccount.AccountStatusRecord[]
}> {
  const accountStatusRecords = await SalesforceAccount.getAccountStatusForAll(client, salesforceAccountIds)

  return accountStatusRecords.records.reduce(
    ({ verified, failed }, record) => {
      if (record.Account_Status__c === SalesforceAccountStatus.completeVerified) {
        return { failed, verified: verified.concat(record) }
      } else if (invalidStatuses.includes(record.Account_Status__c)) {
        return { failed: failed.concat(record), verified }
      }

      return { verified, failed }
    },
    { verified: [] as SalesforceAccount.AccountStatusRecord[], failed: [] as SalesforceAccount.AccountStatusRecord[] },
  )
}

function updateVerifiedAccounts(accountIds: string[]) {
  const epicurus = getEpicurusInstance()

  // Notifying services interested in account kyc verification completion (e.g. debit card service)
  accountIds.forEach(accountId => epicurus.publish(AccountPubSubTopics.accountKycStatusChange, { accountId, event: KycStatusChange.approved }))

  return getModel<Account>('account').update(
    {
      hasTriggeredKycCheck: false,
      status: AccountStatus.kycVerified,
    } as Account,
    {
      where: {
        id: accountIds,
      },
    },
  )
}

function updateVerificationFailedAccounts(accountIds: string[]) {
  const epicurus = getEpicurusInstance()

  // Notifying services interested in account kyc verification completion (e.g. debit card service)
  accountIds.forEach(accountId => epicurus.publish(AccountPubSubTopics.accountKycStatusChange, { accountId, event: KycStatusChange.rejected }))

  return getModel<Account>('account').update(
    {
      hasTriggeredKycCheck: false,
    } as Account,
    {
      where: {
        id: accountIds,
      },
    },
  )
}

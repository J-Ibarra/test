import { AxiosInstance } from 'axios'
import { get } from 'lodash'
import { Account, AccountStatus, SalesforceReferenceTable } from '@abx-types/account'
import * as SalesforceAccount from '../../../../core/salesforce/object-access-gateways/account_gateway'
import * as SalesforcePlatformCredential from '../../../../core/salesforce/object-access-gateways/platform_credential_gateway'
import { Logger } from '@abx-utils/logging'
import { getModel } from '@abx-utils/db-connection-utils'
import { getSalesforceClient } from '../../../../core'

const logger = Logger.getInstance('salesforce', 'accountVerifiedRecorder')

const ACCOUNT_STATUS_FIELD = 'Account_Status__c'

export async function accountVerifiedRecorder({ accountId }: { accountId: string }) {
  logger.debug(`Recording account verification for account ${accountId}`)
  const client = await getSalesforceClient()

  const { salesforceAccountId, salesforcePlatformCredentialId } = await findSalesforceReferenceForAccount(accountId)

  try {
    const platformCredentialTier = await getPlatformCredentialTierBasedOnAccountStatus(client, salesforceAccountId)

    logger.debug(`Updating Platform Credential ${salesforcePlatformCredentialId} to tier ${platformCredentialTier}`)

    await SalesforcePlatformCredential.updatePlatformCredential(client, salesforcePlatformCredentialId, {
      Verification_Tier__c: platformCredentialTier,
    })

    if (platformCredentialTier === SalesforcePlatformCredential.VerificationTier.tier_two) {
      await getModel<Partial<Account>>('account').update(
        { status: AccountStatus.kycVerified },
        {
          where: { id: accountId },
        },
      )

      logger.info(`Account status for ${accountId} updated to kyc verified`)
    }
    logger.info(`Platform Credential for account ${accountId} updated to ${platformCredentialTier}`)
  } catch (e) {
    logger.error(get(e, 'response.data', e))
  }
}

async function getPlatformCredentialTierBasedOnAccountStatus(client: AxiosInstance, salesforceAccountId: string) {
  logger.debug(`Fetching KYC Tier from account status for salesforceAccountId: ${salesforceAccountId}`)
  const { Account_Status__c: accountStatus } = await SalesforceAccount.getAccount(client, salesforceAccountId, ACCOUNT_STATUS_FIELD)

  logger.debug(`Account_Status__c value for salesforceAccountId: ${accountStatus}`)

  const platformCredentialTier =
    accountStatus === SalesforceAccount.SalesforceAccountStatus.completeVerified
      ? SalesforcePlatformCredential.VerificationTier.tier_two
      : SalesforcePlatformCredential.VerificationTier.tier_one

  logger.debug(`Returning equivalent platform credential tier for accountStatus of ${accountStatus}: ${platformCredentialTier}`)

  return platformCredentialTier
}

async function findSalesforceReferenceForAccount(accountId: string) {
  const account = await getModel<SalesforceReferenceTable>('salesforce').findOne({
    where: { accountId },
  })

  return account!.get()
}

import { AxiosInstance } from 'axios'
import { Account, AccountStatus, User, SalesforcePostResponse } from '@abx-types/account'

interface SalesforcePlatformCredential {
  RecordType: {
    Name: 'KBE'
  }
  Platform_Status__c: PlatformStatus
  Username__c: string
  Verification_Tier__c: VerificationTier
  Platform_Account_ID__c: string
  HIN__c: string
  Recruiter_ID__c: string
  Recruited_By__c: string
  Account__c: string
}

enum PlatformStatus {
  active = 'active',
  pending = 'pending',
  suspended = 'suspended',
}

export enum VerificationTier {
  tier_zero = 'Tier 0 - Email Not Activated',
  tier_one = 'Tier 1 - Email Activated',
  tier_two = 'Tier 2 - Standard KYC Approved',
  tier_three = 'Tier 3 - Advanced KYC Approved',
}

interface KbeAccountCreationParams {
  account: Account
  user: User
  salesforceAccountId: string
  referrerSalesforcePlatformCredentialId: string
}

const createPlatformCredentialRecord = ({
  account,
  user,
  salesforceAccountId,
  referrerSalesforcePlatformCredentialId,
}: KbeAccountCreationParams): SalesforcePlatformCredential => {
  return {
    RecordType: {
      Name: 'KBE',
    },
    Platform_Status__c: PlatformStatus.active,
    Username__c: user.email,
    HIN__c: account.hin!,
    Platform_Account_ID__c: account.id,
    Verification_Tier__c: mapAccountStatus(account.status),
    Recruiter_ID__c: account.hin!,
    Recruited_By__c: referrerSalesforcePlatformCredentialId,
    Account__c: salesforceAccountId,
  }
}

const mapAccountStatus = (status: AccountStatus): VerificationTier => {
  if (status === AccountStatus.kycVerified) {
    return VerificationTier.tier_two
  }
  if (status === AccountStatus.emailVerified) {
    return VerificationTier.tier_one
  }

  // Default to ZERO
  return VerificationTier.tier_zero
}

export async function createPlatformCredential(client: AxiosInstance, params: KbeAccountCreationParams): Promise<SalesforcePostResponse> {
  const platformCredential = createPlatformCredentialRecord(params)
  const response = await client.post(`/sobjects/Platform_Credential__c/`, platformCredential)

  return response.data
}

export async function updatePlatformCredential(client: AxiosInstance, id: string, values: Partial<SalesforcePlatformCredential>) {
  const response = await client.patch(`/sobjects/Platform_Credential__c/${id}`, values)
  return response.data
}

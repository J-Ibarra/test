import { AxiosInstance } from 'axios'
import { User, SalesforcePostResponse } from '@abx-types/account'
import { Logger } from '@abx-utils/logging'

enum SalesforceAccountRecordType {
  individual = '0121r000000ZwqXAAS',
  corporate = '0121r000000Z0WcAAK',
}

interface SalesforceAccount {
  LastName: string
  PersonEmail: string
  Account_Status__c: SalesforceAccountStatus
  Agrees_to_KBE_Terms_and_Conditions__c: boolean
}

export interface AccountStatusRecord {
  Account_Status__c: SalesforceAccountStatus
  Id: string
}

interface GetAccountStatusResponse {
  records: AccountStatusRecord[]
}

export enum SalesforceAccountStatus {
  created = 'KMS Account Created',
  completeVerified = 'Complete - Verified',
  completeRejected = 'Complete - Rejected',
}

const logger = Logger.getInstance('salesforce', 'account_gateway')

const AGREES_TO_KBE_TCS = 'Agrees_to_KBE_Terms_and_Conditions__c'

const mapExchangeUserToSalesforceAccountCreationDetails = (user: User): SalesforceAccount => {
  return {
    PersonEmail: user.email,
    LastName: user.email,
    Account_Status__c: SalesforceAccountStatus.created,
    Agrees_to_KBE_Terms_and_Conditions__c: true,
  }
}

async function getAccount<F extends string>(client: AxiosInstance, id: string, ...fields: F[]): Promise<{ [K in F]: unknown }> {
  const response = await client.get(`/sobjects/Account/${id}`, {
    params: {
      fields: fields.join(','),
    },
  })

  return response.data
}

async function getAccountFromEmail(client: AxiosInstance, email: string) {
  const query = `SELECT Id From Account WHERE (PersonEmail = '${email}' AND RecordTypeId = '${SalesforceAccountRecordType.individual}') OR (General_Email__c = '${email}' AND RecordTypeId = '${SalesforceAccountRecordType.corporate}')`
  const response = await client.get('/query', {
    params: {
      q: query,
    },
  })
  return response.data
}

async function getAccountStatusForAll(client: AxiosInstance, accountIds: string[]): Promise<GetAccountStatusResponse> {
  const query = `SELECT Id, Account_Status__c FROM Account WHERE Id IN (${accountIds.map((accountId) => `'${accountId}'`).join(',')})`
  const response = await client.get('/query', {
    params: {
      q: query,
    },
  })
  return response.data
}

async function createSalesforceAccount(client: AxiosInstance, { user }: { user: User }): Promise<SalesforcePostResponse> {
  const salesforceAccount = mapExchangeUserToSalesforceAccountCreationDetails(user)
  const response = await client.post(`/sobjects/Account/`, salesforceAccount)
  return response.data
}

async function getOrCreateAccount(
  client: AxiosInstance,
  { user }: { user: User },
): Promise<{ salesforceAccount: { id: string }; newAccountCreated: boolean }> {
  const { records } = await getAccountFromEmail(client, user.email)
  const recordsLength = records.length
  if (recordsLength > 1) {
    logger.error(`Multiple Salesforce accounts exist for email: ${user.email}`)

    throw new Error(`Multiple Salesforce accounts for email: ${user.email}`)
  }

  if (records.length === 0) {
    logger.debug(`Creating new Salesforce account for email ${user.email}.`)
    const newAccount = await createSalesforceAccount(client, { user })

    return {
      salesforceAccount: newAccount,
      newAccountCreated: true,
    }
  }

  const [salesforceAccount = {}] = records

  logger.debug(`Found existing Salesforce account for email ${user.email} with Id ${salesforceAccount.Id}`)
  logger.debug(`Updating found account to agree to KBE T&C's`)

  await updateSalesforceAccountKBETermsAndConditions(client, salesforceAccount.Id)

  return {
    salesforceAccount: {
      id: salesforceAccount.Id,
    },
    newAccountCreated: false,
  }
}

async function updateSalesforceAccountKBETermsAndConditions(client: AxiosInstance, salesforceAccountId: string) {
  const updateAccountValues = {
    [AGREES_TO_KBE_TCS]: true,
  }

  const response = await client.patch<AccountStatusRecord>(`/sobjects/Account/${salesforceAccountId}`, updateAccountValues)

  return response.data
}

export { getAccountFromEmail, createSalesforceAccount, getOrCreateAccount, getAccount, getAccountStatusForAll }

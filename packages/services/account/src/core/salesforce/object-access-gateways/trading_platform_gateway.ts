import { AxiosInstance } from 'axios'
import { get } from 'lodash'
import { DepositConfirmationEvent, WithdrawalUpdateRequest } from '@abx-service-clients/admin-fund-management'
import { CurrencyCode } from '@abx-types/reference-data'
import { getCurrencyCode } from '@abx-service-clients/reference-data'
import { WithdrawalRequest } from '@abx-types/withdrawal'
import { PersonalBankDetails, SalesforcePostResponse } from '@abx-types/account'
import { SalesforceReferenceTable } from '@abx-types/account'

// Need to define `External ID` on the Salesforce record so that
// Can use the withdrawalRequestId as a reference for Salesforce
// Instead of having to store each TPR record created in a database
interface SalesforceTradingPlatformRecord {
  RecordType: {
    Name: 'KBE Fiat Withdrawal' | 'KBE Fiat Deposit'
  }
  Account__c: string
  Platform_Credential__c: string
  Amount_Euro__c: number
  Application_Amount_USD__c: number
  Bank_Account_Name__c: string
  Bank_Account_Number__c: string
  Bank_Address__c: string
  Bank_Code__c: string
  Bank_Name__c: string
  Swift_Code__c: string
  Payment_Type__c: string
  Payment_Status__c: string
  Payment_Received_date__c?: Date
  Notes__c: string
  Transaction_ID__c: string
  Transaction_Fee__c?: number
}

interface AbxWithdrawalParams {
  withdrawalRequest: WithdrawalRequest
  accountPersonalBankDetails?: PersonalBankDetails
  salesforceReference: SalesforceReferenceTable
}

interface AbxDepositParams {
  fiatDepositEvent: DepositConfirmationEvent
  accountPersonalBankDetails?: PersonalBankDetails
  salesforceReference: SalesforceReferenceTable
}

const createFiatWithdrawalRecord = async ({
  withdrawalRequest,
  accountPersonalBankDetails,
  salesforceReference,
}: AbxWithdrawalParams): Promise<SalesforceTradingPlatformRecord> => {
  const currencyCode = await getCurrencyCode(withdrawalRequest.currencyId)

  return {
    RecordType: {
      Name: 'KBE Fiat Withdrawal',
    },
    Account__c: salesforceReference.salesforceAccountId,
    Platform_Credential__c: salesforceReference.salesforcePlatformCredentialId,
    Amount_Euro__c: currencyCode === CurrencyCode.euro ? withdrawalRequest.amount : 0,
    Application_Amount_USD__c: currencyCode === CurrencyCode.usd ? withdrawalRequest.amount : 0,
    Bank_Account_Name__c: get(accountPersonalBankDetails, 'accountHolderName', ''),
    Bank_Account_Number__c: `${get(accountPersonalBankDetails, 'accountNumber', '')} ${get(accountPersonalBankDetails, 'iban', '')}`,
    Bank_Address__c: get(accountPersonalBankDetails, 'bankAddress', ''),
    Bank_Code__c: `${get(accountPersonalBankDetails, 'routingCode', '')} ${get(accountPersonalBankDetails, 'abaNumber', '')}`,
    Bank_Name__c: get(accountPersonalBankDetails, 'bankName', ''),
    Swift_Code__c: get(accountPersonalBankDetails, 'bankSwiftCode', ''),
    Payment_Type__c: currencyCode === CurrencyCode.usd ? 'Funds Transfer (US Dollars)' : 'Euro (EUR)',
    Payment_Status__c: 'New',
    Transaction_ID__c: `${withdrawalRequest.transactionId}`,
    Notes__c: withdrawalRequest.memo || '',
    Transaction_Fee__c: withdrawalRequest.transactionFee,
  }
}

const createFiatDepositRecord = ({
  fiatDepositEvent: { currencyCode, amount, dateOfApproval, notes, transactionId },
  accountPersonalBankDetails,
  salesforceReference,
}: AbxDepositParams): SalesforceTradingPlatformRecord => {
  return {
    RecordType: {
      Name: 'KBE Fiat Deposit',
    },
    Account__c: salesforceReference.salesforceAccountId,
    Platform_Credential__c: salesforceReference.salesforcePlatformCredentialId,
    Amount_Euro__c: currencyCode === CurrencyCode.euro ? amount : 0,
    Application_Amount_USD__c: currencyCode === CurrencyCode.usd ? amount : 0,
    Bank_Account_Name__c: get(accountPersonalBankDetails, 'accountHolderName', ''),
    Bank_Account_Number__c: `${get(accountPersonalBankDetails, 'accountNumber', '')} ${get(accountPersonalBankDetails, 'iban', '')}`,
    Bank_Address__c: get(accountPersonalBankDetails, 'bankAddress', ''),
    Bank_Code__c: `${get(accountPersonalBankDetails, 'routingCode', '')} ${get(accountPersonalBankDetails, 'abaNumber', '')}`,
    Bank_Name__c: get(accountPersonalBankDetails, 'bankName', ''),
    Swift_Code__c: get(accountPersonalBankDetails, 'bankSwiftCode', ''),
    Payment_Type__c: currencyCode === CurrencyCode.usd ? 'Funds Transfer (US Dollars)' : 'Euro (EUR)',
    Payment_Status__c: 'Processed',
    Payment_Received_date__c: dateOfApproval,
    Notes__c: notes || '',
    Transaction_ID__c: transactionId,
  }
}

const createFiatWithdrawalUpdateRecord = async (
  withdrawalUpdateRequest: WithdrawalUpdateRequest,
): Promise<Partial<SalesforceTradingPlatformRecord>> => {
  return {
    Payment_Status__c: withdrawalUpdateRequest.paymentStatus,
    Payment_Received_date__c: withdrawalUpdateRequest.updatedAt,
  }
}

export async function createDepositTradingPlatformRecord(client: AxiosInstance, inputParameters: AbxDepositParams): Promise<SalesforcePostResponse> {
  const record = createFiatDepositRecord(inputParameters)
  const response = await client.post(`/sobjects/Trading_Platform__c/`, record)

  return response.data
}

export async function createWithdrawalTradingPlatformRecord(
  client: AxiosInstance,
  inputParameters: AbxWithdrawalParams,
): Promise<SalesforcePostResponse> {
  const record = await createFiatWithdrawalRecord(inputParameters)
  const response = await client.post(`/sobjects/Trading_Platform__c/`, record)

  return response.data
}

export async function updateWithdrawalTradingPlatformRecord(
  client: AxiosInstance,
  inputParameters: WithdrawalUpdateRequest,
): Promise<SalesforcePostResponse> {
  const record = await createFiatWithdrawalUpdateRecord(inputParameters)
  const response = await client.patch(`/sobjects/Trading_Platform__c/${inputParameters.tradingPlatformName}`, record)

  return response.data
}

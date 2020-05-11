import { AxiosInstance } from 'axios'
import { DepositAddress } from '@abx-types/deposit'
import { CurrencyCode } from '@abx-types/reference-data'
import { SalesforceReferenceTable } from '@abx-types/account'

const SalesforceDepositAddressType = {
  [CurrencyCode.kau]: 'KAU Deposit Address',
  [CurrencyCode.kag]: 'KAG Deposit Address',
  [CurrencyCode.kvt]: 'KVT Deposit Address',
  [CurrencyCode.ethereum]: 'ETH Deposit Address',
  [CurrencyCode.bitcoin]: 'BTC Deposit Address',
  [CurrencyCode.tether]: 'USDT Deposit Address',
}

interface SalesforceLinkedAddress {
  Account__c: string
  RecordType: {
    Name: 'Exchange Deposit Addresses' | 'Customer Controlled Addresses'
  }
  Address__c: string
  Type_of_Address__c: typeof SalesforceDepositAddressType[keyof typeof SalesforceDepositAddressType]
  Exchange_Account_for_Yield__c: string
}

interface AbxDepositParams {
  salesforceReference: SalesforceReferenceTable
  depositAddress: DepositAddress
}

const fromAbx = ({ salesforceReference, depositAddress }: AbxDepositParams): SalesforceLinkedAddress => {
  return {
    Account__c: salesforceReference.salesforceAccountId,
    Address__c: depositAddress.publicKey,
    Type_of_Address__c: SalesforceDepositAddressType[depositAddress.currency!.code],
    Exchange_Account_for_Yield__c: salesforceReference.salesforcePlatformCredentialId,
    RecordType: {
      Name: 'Exchange Deposit Addresses',
    },
  }
}

export async function createLinkedAddress(client: AxiosInstance, inputParameters: AbxDepositParams) {
  const record = fromAbx(inputParameters)

  try {
    const response = await client.post(`/sobjects/Linked_Address__c/`, record)
    return response.data
  } catch (e) {
    console.log(`Error ocurred while creating linked address`)
    console.log(JSON.stringify(e))

    return ''
  }
}

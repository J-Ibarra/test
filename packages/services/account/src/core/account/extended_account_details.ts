import moment from 'moment'

import { getModel } from '@abx-utils/db-connection-utils'
import { Address, Gender, KycVerifiedAccountDetails, SalesforceReferenceTable } from '@abx-types/account'
import { findAccountWithUserDetails } from './accounts'
import { getSalesforceClient } from '../salesforce'
import * as SalesforceAccount from '../salesforce/object-access-gateways/account_gateway'

const salesforceAccountFields = [
  'FirstName',
  'LastName',
  'PersonBirthdate',
  'Gender__pc',
  'Building_House_Number__pc',
  'Unit_Number__pc',
  'Street_Number__pc',
  'Residential_Street__pc',
  'Residential_City__pc',
  'Residential_Zip_Postal_Code__pc',
  'Residential_Country__pc',
]

/**
 * Creates a joint view of account details stored in out db and the details stored in Salesforce.
 *
 * @param accountId the ID of the account
 */
export async function getKycVerifiedAccountDetails(accountId: string): Promise<KycVerifiedAccountDetails> {
  const account = await findAccountWithUserDetails({ id: accountId })

  if (!account) {
    throw new Error(`Account not found ${accountId}`)
  }

  const salesforceReferenceInstance = await getModel<SalesforceReferenceTable>('salesforce').findOne({
    where: { accountId: account.id },
  })

  if (!salesforceReferenceInstance) {
    return {
      id: account.id,
      hin: account.hin!,
      type: account.type!,
      status: account.status,
      email: account.users![0].email,
    }
  }

  const salesforceReference = salesforceReferenceInstance.get()

  const client = await getSalesforceClient()
  const accountDetails = await SalesforceAccount.getAccount(client, salesforceReference.salesforceAccountId, ...salesforceAccountFields)
  const formattedBirthDate = moment(accountDetails.PersonBirthdate as string, 'YYYY-MM-DD').format('DD/MM/YYYY')

  return {
    id: account.id,
    hin: account.hin!,
    type: account.type!,
    status: account.status,
    email: account.users![0].email,
    firstName: accountDetails.FirstName as string,
    lastName: accountDetails.LastName as string,
    dateOfBirth: formattedBirthDate,
    gender: accountDetails.Gender__pc as Gender,
    nationality: accountDetails.Nationality__pc as string,
    address: extractAddressFromSalesforceAccountDetails(accountDetails),
  }
}

function extractAddressFromSalesforceAccountDetails(salesforceAccountDetails): Address {
  return {
    addressLine1: `${salesforceAccountDetails.Building_House_Number__pc || salesforceAccountDetails.Unit_Number__pc || ''}`,
    addressLine2: `${salesforceAccountDetails.Street_Number__pc} ${salesforceAccountDetails.Residential_Street__pc}`,
    addressLine3: salesforceAccountDetails.Residential_City__pc as string,
    postCode: salesforceAccountDetails.Residential_Zip_Postal_Code__pc as string,
    country: salesforceAccountDetails.Residential_Country__pc as string,
  }
}

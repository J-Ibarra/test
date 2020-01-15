import { expect } from 'chai'
import moment from 'moment'
import { v4 } from 'node-uuid'
import sinon from 'sinon'

import { Account, SalesforceReferenceTable } from '@abx-types/account'
import { createAccount, getKycVerifiedAccountDetails } from '../..'
import * as salesforceOperations from '../../salesforce'
import { truncateTables, getModel } from '@abx/db-connection-utils'

describe('extended_account_details', () => {
  const salesforceAccount = {
    FirstName: 'Foo',
    LastName: 'Bar',
    PersonBirthdate: '2018-02-03',
    Gender__pc: 'Male',
    Street_Number__pc: '12',
    Residential_Street__pc: 'Street A',
    Residential_City__pc: 'CityA',
    Residential_Zip_Postal_Code__pc: 'PostCOde',
    Residential_Country__pc: 'Country',
    Nationality__pc: 'Brazil',
    Passport_Number__pc: 'SAS12312341',
    Passport_Date_of_Expiry__pc: '2019-12-10',
  }

  beforeEach(async () => {
    await truncateTables()
  })

  afterEach(async () => {
    sinon.restore()
  })

  it('should load account details and fetch details from salesforce, should use unit number when present', async () => {
    const account = await createAccount({ firstName: 'fn', lastName: 'ln', email: `${v4()}@example.com`, password: 'starlight' })
    const unit = 'Flat 3'
    await getModel<SalesforceReferenceTable>('salesforce').create({
      accountId: account.id,
      salesforceAccountId: v4(),
      salesforcePlatformCredentialId: v4(),
    })

    sinon.stub(salesforceOperations, 'getSalesforceClient').resolves({
      get: () => Promise.resolve({ data: { ...salesforceAccount, Unit_Number__pc: unit } }),
    })

    const extendedAccountDetails = await getKycVerifiedAccountDetails(account.id)
    verifyAccountDetailsMatchExpected(unit, extendedAccountDetails, account)
  })

  it('should load account details and fetch details from salesforce, should use ', async () => {
    const houseNumber = '3 Num'
    const account = await createAccount({ firstName: 'fn', lastName: 'ln', email: `${v4()}@example.com`, password: 'starlight' })
    await getModel<SalesforceReferenceTable>('salesforce').create({
      accountId: account.id,
      salesforceAccountId: v4(),
      salesforcePlatformCredentialId: v4(),
    })

    sinon.stub(salesforceOperations, 'getSalesforceClient').resolves({
      get: () => Promise.resolve({ data: { ...salesforceAccount, Building_House_Number__pc: houseNumber } }),
    })

    const extendedAccountDetails = await getKycVerifiedAccountDetails(account.id)
    verifyAccountDetailsMatchExpected(houseNumber, extendedAccountDetails, account)
  })

  it('should load account details and leave addresLine1 empty when no building number present ', async () => {
    const account = await createAccount({ firstName: 'fn', lastName: 'ln', email: `${v4()}@example.com`, password: 'starlight' })
    await getModel<SalesforceReferenceTable>('salesforce').create({
      accountId: account.id,
      salesforceAccountId: v4(),
      salesforcePlatformCredentialId: v4(),
    })

    sinon.stub(salesforceOperations, 'getSalesforceClient').resolves({
      get: () => Promise.resolve({ data: salesforceAccount }),
    })

    const extendedAccountDetails = await getKycVerifiedAccountDetails(account.id)
    verifyAccountDetailsMatchExpected('', extendedAccountDetails, account)
  })

  function verifyAccountDetailsMatchExpected(addressLine1, extendedAccountDetails, account: Account) {
    expect(extendedAccountDetails).to.eql({
      id: account.id,
      hin: account.hin,
      type: account.type,
      status: account.status,
      email: account.users![0].email,
      firstName: salesforceAccount.FirstName,
      lastName: salesforceAccount.LastName,
      dateOfBirth: moment(salesforceAccount.PersonBirthdate, 'YYYY-MM-DD').format('DD/MM/YYYY'),
      gender: salesforceAccount.Gender__pc,
      nationality: salesforceAccount.Nationality__pc,
      address: {
        addressLine1,
        addressLine2: `${salesforceAccount.Street_Number__pc} ${salesforceAccount.Residential_Street__pc}`,
        addressLine3: salesforceAccount.Residential_City__pc,
        postCode: salesforceAccount.Residential_Zip_Postal_Code__pc,
        country: salesforceAccount.Residential_Country__pc,
      },
    })
  }
})

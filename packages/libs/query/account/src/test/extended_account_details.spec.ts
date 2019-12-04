import { expect } from 'chai'
import moment from 'moment'
import { v4 } from 'node-uuid'
import sinon from 'sinon'

import { getModel } from '../../db/abx_modules'
import { truncateTables } from '../../db/test_helpers/test_cleaner'
import { SalesforceReferenceTable } from '../interface'
import { createAccount } from '../lib/accounts'
import { getKycVerifiedAccountDetails } from '../lib/extended_account_details'
import * as salesforceOperations from '../lib/salesforce'

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

  it('should load account details and fetch details from salesforce', async () => {
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
    expect(extendedAccountDetails).to.eql({
      id: account.id,
      hin: account.hin,
      type: account.type,
      status: account.status,
      email: account.users[0].email,
      firstName: salesforceAccount.FirstName,
      lastName: salesforceAccount.LastName,
      dateOfBirth: moment(salesforceAccount.PersonBirthdate, 'YYYY-MM-DD').format('DD/MM/YYYY'),
      gender: salesforceAccount.Gender__pc,
      nationality: salesforceAccount.Nationality__pc,
      passportNumber: salesforceAccount.Passport_Number__pc,
      passportExpiryDate: moment(salesforceAccount.Passport_Date_of_Expiry__pc, 'YYYY-MM-DD').format('DD/MM/YYYY'),
      address: {
        addressLine1: salesforceAccount.Street_Number__pc,
        addressLine2: salesforceAccount.Residential_Street__pc,
        addressLine3: salesforceAccount.Residential_City__pc,
        postCode: salesforceAccount.Residential_Zip_Postal_Code__pc,
        country: salesforceAccount.Residential_Country__pc,
      },
    })
  })
})

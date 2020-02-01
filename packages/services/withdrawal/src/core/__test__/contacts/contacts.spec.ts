import { expect } from 'chai'
import { AccountType } from '@abx-types/account'
import { createTemporaryTestingAccount } from '@abx-utils/account'
import { CurrencyCode } from '@abx-types/reference-data'
import { createContactForAccount, findContactsForAccountByCurrency } from '../../contacts/contacts_data_retriever'

describe('Contacts module', () => {
  it('should create a new contact in the database and find contact', async () => {
    const TEST_ACCOUNT = await createTemporaryTestingAccount(AccountType.individual)

    const newContact = {
      accountId: TEST_ACCOUNT.id,
      currency: CurrencyCode.ethereum,
      name: 'TEST_NAME',
      publicKey: 'TEST_PUBLIC_KEY',
    }

    const savedContact = await createContactForAccount(newContact)
    expect(savedContact.name).to.eql(newContact.name)
    expect(savedContact.publicKey).to.eql(newContact.publicKey)

    const retrievedContact = await findContactsForAccountByCurrency({ accountId: TEST_ACCOUNT.id, currencyCode: CurrencyCode.ethereum })
    expect(retrievedContact[0].name).to.eql(newContact.name)
    expect(retrievedContact[0].publicKey).to.eql(newContact.publicKey)
  })
})

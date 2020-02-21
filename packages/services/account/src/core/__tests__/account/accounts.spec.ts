import { expect } from 'chai'
import { v4 } from 'node-uuid'
import sinon from 'sinon'

import * as dbConnectionUtils from '@abx-utils/db-connection-utils'
import { AccountStatus, AccountType } from '@abx-types/account'
import { findAccountById, verifyUserAccount, createAccount, findUserById, validatePassword, createCookie } from '../..'
import { truncateTables } from '@abx-utils/db-connection-utils'

describe.only('accounts', () => {
  beforeEach(async () => {
    await truncateTables()
  })

  afterEach(async () => {
    sinon.restore()
  })

  it('createAccount creates an account and user with the correct pw', async () => {
    const account = await createAccount({ firstName: 'fn', lastName: 'ln', email: `${v4()}@example.com`, password: 'starlight' })

    expect(account.type).to.eql(AccountType.individual)

    const fullUser = await findUserById(account.users![0].id)

    const validation = await validatePassword('starlight', fullUser!.passwordHash)

    expect(validation).to.eql(true)
    expect(account.id).to.eql(account.users![0].accountId)
  })

  it('verifyUserAccount should flip the account verified flag to true when the verification token has not expired', async () => {
    const account = await createAccount({ firstName: 'fn', lastName: 'ln', email: `${v4()}@example.com`, password: 'starlight' })

    await dbConnectionUtils.wrapInTransaction(dbConnectionUtils.sequelize, null, async t => {
      const cookie = await createCookie(account.users![0].id, t)

      const updatedUser = await verifyUserAccount(cookie, t)

      const verifiedAccount = await findAccountById(account.id, t)
      expect(verifiedAccount!.status).to.eql(AccountStatus.emailVerified)
      expect(updatedUser.firstName).to.eql(account.users![0].firstName)
      expect(updatedUser.lastName).to.eql(account.users![0].lastName)
      expect(updatedUser.mfaEnabled).to.eql(account.users![0].mfaEnabled)
      expect(updatedUser.accountType).to.eql(account.type)
      expect(updatedUser.status).to.eql(AccountStatus.emailVerified)
    })
  })

  // it('generateWalletAddresses should generate and store crypto addresses for the account', async () => {
  //   const account = await createAccount({ firstName: 'fn', lastName: 'ln', email: `${v4()}@example.com`, password: 'starlight' })
  //   await generateWalletAddresses(account.id)
  //   const foundAddresses = await findDepositAddressesForAccount(account.id)

  //   expect(foundAddresses.length).to.eql(Object.keys(CryptoCurrency).length)
  // })
})

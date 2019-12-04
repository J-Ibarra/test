import { expect } from 'chai'
import { v4 } from 'node-uuid'
import sinon from 'sinon'

import { EpicurusPubSubChannel } from '../../commons'
import sequelize from '../../db/abx_modules'
import * as epicurusClient from '../../db/epicurus'
import { wrapInTransaction } from '../../db/transaction_wrapper'
import { findDepositAddressesForAccount } from '../../deposits/lib/deposit_address'
import { CryptoCurrency } from '../../symbols'
import { createAccount } from '../index'
import { AccountStatus, AccountType, KycStatusChange } from '../interface'
import { findAccountById, generateWalletAddresses, updateAccountStatus, verifyUserAccount } from '../lib/accounts'
import { createCookie } from '../lib/session'
import { findUserById, validatePassword } from '../lib/users'

describe('accounts', () => {
  afterEach(async () => {
    sinon.restore()
  })

  it('createAccount creates an account and user with the correct pw', async () => {
    const account = await createAccount({ firstName: 'fn', lastName: 'ln', email: `${v4()}@example.com`, password: 'starlight' })

    expect(account.type).to.eql(AccountType.individual)

    const fullUser = await findUserById(account.users[0].id)

    const validation = await validatePassword('starlight', fullUser.passwordHash)

    expect(validation).to.eql(true)
    expect(account.id).to.eql(account.users[0].accountId)
  })

  it('verifyUserAccount should flip the account verified flag to true when the verification token has not expired', async () => {
    const account = await createAccount({ firstName: 'fn', lastName: 'ln', email: `${v4()}@example.com`, password: 'starlight' })

    await wrapInTransaction(sequelize, null, async t => {
      const cookie = await createCookie(account.users[0].id, t)

      const updatedUser = await verifyUserAccount(cookie, t)

      const verifiedAccount = await findAccountById(account.id, t)
      expect(verifiedAccount.status).to.eql(AccountStatus.emailVerified)
      expect(updatedUser.firstName).to.eql(account.users[0].firstName)
      expect(updatedUser.lastName).to.eql(account.users[0].lastName)
      expect(updatedUser.mfaEnabled).to.eql(account.users[0].mfaEnabled)
      expect(updatedUser.accountType).to.eql(account.type)
      expect(updatedUser.status).to.eql(AccountStatus.emailVerified)
    })
  })

  it('generateWalletAddresses should generate and store crypto addresses for the account', async () => {
    const account = await createAccount({ firstName: 'fn', lastName: 'ln', email: `${v4()}@example.com`, password: 'starlight' })
    await generateWalletAddresses(account.id)
    const foundAddresses = await findDepositAddressesForAccount(account.id)

    expect(foundAddresses.length).to.eql(Object.keys(CryptoCurrency).length)
  })

  it('updateAccountStatus should send notification when status set to kycVerified', async () => {
    const account = await createAccount({ firstName: 'fn', lastName: 'ln', email: `${v4()}@example.com`, password: 'starlight' })

    const epicurusPublishMock = sinon.mock()

    sinon.stub(epicurusClient, 'getInstance').returns({ publish: epicurusPublishMock } as any)
    await updateAccountStatus(account.id, AccountStatus.kycVerified)

    const updatedAccount = await findAccountById(account.id)

    expect(updatedAccount.status).to.eql(AccountStatus.kycVerified)
    expect(
      epicurusPublishMock.calledWith(EpicurusPubSubChannel.accountKycStatusChange, {
        accountId: updatedAccount.id,
        status: KycStatusChange.approved,
      }),
    ).to.eql(true)
  })
})

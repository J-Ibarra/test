import { expect } from 'chai'
import { v4 } from 'node-uuid'
import sinon from 'sinon'
import { AccountType, EmailValidationError, User } from '@abx-types/account'
import {
  createHashedPassword,
  createUser,
  findUsersByAccountId,
  updateUser,
  validatePassword,
  validateUserCredentials,
  validateUserEmail,
} from '../..'
import { createTemporaryTestingAccount, TEST_PASSWORD } from '@abx-query-libs/account'
import { truncateTables } from '@abx/db-connection-utils'

describe('users', () => {
  beforeEach(async () => {
    await truncateTables()
  })

  afterEach(async () => {
    sinon.restore()
  })

  describe('userCreationEmailValid', () => {
    it('should return validation error when email invalid', async () => {
      try {
        await validateUserEmail('foo.bar')
      } catch (err) {
        expect(err.message).to.eql(EmailValidationError.emailInvalid)
      }
    })

    it('should return validation error when email already taken', async () => {
      const account = await createTemporaryTestingAccount()
      const newUser = account.users![0]

      try {
        await validateUserEmail(newUser.email)
      } catch (err) {
        expect(err.message).to.eql(EmailValidationError.emailTaken)
      }
    })
  })

  describe('validatePassword', () => {
    it('a password hash created with bcrypt returns true when validated', async () => {
      const hash = await createHashedPassword('starlight')
      const validation = await validatePassword('starlight', hash)
      expect(validation).to.eql(true)
    })

    it('a password hash created with bcrypt returns false when incorrectly validated', async () => {
      const hash = await createHashedPassword('starlight')
      const validation = await validatePassword('starlights', hash)
      expect(validation).to.eql(false)
    })
  })

  describe('validateUserCredentials', () => {
    it('returns nothing with incorrect email', async function() {
      try {
        await validateUserCredentials('a@b.c', 'anything')
      } catch (err) {
        expect(err.message).to.eql('Invalid user credentials')
      }
    })

    it('returns nothing with incorrect password', async function() {
      // Password TEST_PASSWORD
      const account = await createTemporaryTestingAccount()
      const newUser = account.users![0]

      try {
        await validateUserCredentials(newUser.email, `${TEST_PASSWORD}123`)
      } catch (err) {
        expect(err.message).to.eql('Invalid user credentials')
      }
    })

    it('correctly returns the userId with valid first name, last name and password', async function() {
      const account = await createTemporaryTestingAccount()
      const newUser = account.users![0]
      const loginCredentialsValidationResult = await validateUserCredentials(newUser.email, TEST_PASSWORD)
      expect(loginCredentialsValidationResult).to.eql({
        id: newUser.id,
        accountId: newUser.accountId,
        accountType: AccountType.individual,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        hin: account.hin,
        lastLogin: null,
        mfaEnabled: false,
        status: account.status,
      })
    })
  })

  describe('activateUser', () => {
    it('updates 0 fields when given data that doesnt exist', async () => {
      const response = await updateUser({ id: v4(), activated: true } as Partial<User>)
      expect(response[0]).to.eql(0)
    })

    it('updates 1 field when given correct data', async () => {
      const account = await createTemporaryTestingAccount()
      expect(account.type).to.eql(AccountType.individual)

      const [rowsEffected, rows] = await updateUser({
        id: account.users![0].id,
        activated: true,
      } as Partial<User>)
      const row = rows[0].get()

      expect(rowsEffected).to.eql(1)
      expect(row.activated).to.eql(true)
    })
  })

  describe('findUsersByAccountId', () => {
    it('returns an array of users when they exist for the account id', async () => {
      const { id: accountId } = await createTemporaryTestingAccount()
      // create another user
      await createUser({
        accountId,
        email: 'a@b.com',
        password: '123qwe',
        firstName: 'Joe',
        lastName: 'Doe',
      })

      const usersForAccount = await findUsersByAccountId(accountId)

      expect(usersForAccount).to.be.an('array')
      expect(usersForAccount).to.have.lengthOf(2)
      usersForAccount.forEach(user => {
        expect(user).to.have.property('accountId', accountId)
      })
    })

    it('returns an empty array when account does not exist', async () => {
      const accountId = v4()
      const usersForAccount = await findUsersByAccountId(accountId)

      expect(usersForAccount).to.be.an('array')
      expect(usersForAccount).to.have.lengthOf(0)
    })
  })
})

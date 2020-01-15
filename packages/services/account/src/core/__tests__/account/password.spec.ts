import { expect } from 'chai'
import {
  createUser,
  findUserByEmail,
  findUserByEmailWithAccount,
  validatePassword,
  createAndSaveNewPassword,
  generateResetPasswordPayload,
  resetPasswordRequired,
  validateResetPasswordToken,
  generateJWToken,
} from '../..'
import { EmailTemplates } from '@abx-types/notification'
import { ResetPasswordValidationError } from '@abx-types/account'
import { validatePartialMatch } from './helper'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'
import { truncateTables } from '@abx/db-connection-utils'

describe('Reset password', () => {
  beforeEach(async () => {
    await truncateTables()
  })

  describe('get reset password require', () => {
    it('get reset password markup', async () => {
      const kmsDomain = 'foo.bar'
      process.env.KMS_DOMAIN = kmsDomain
      const { id: accountId } = await createTemporaryTestingAccount()
      const user = {
        id: 1,
        accountId,
        password: 'qpewoirupoqwijer',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe1234@abx.com',
      }
      const createdUser = await createUser(user)

      const expectedEmailMarkup = {
        to: user.email,
        subject: 'Kinesis Money Reset Password',
        templateName: EmailTemplates.ResetPassword,
        templateContent: {
          firstname: user.firstName || '',
          username: user.email,
        },
      }
      const resetPasswordEmailMarkup = await resetPasswordRequired(user.email)
      validatePartialMatch(expectedEmailMarkup, resetPasswordEmailMarkup)
      expect(
        (resetPasswordEmailMarkup.templateContent as any).resetPasswordUrl.startsWith(`${kmsDomain}/reset-password?userId=${createdUser.id}&token=`),
      ).to.eql(true)
    })
  })

  describe('validate reset password link', () => {
    it('return true if the token is valid', () => {
      const userId = 'jofjekcjieod'
      const payload = generateResetPasswordPayload(userId)
      const token = generateJWToken(payload)

      const validation = validateResetPasswordToken(userId, token)
      expect(validation).to.be.equal(true)
    })

    it('return false if the token is invalid', () => {
      const userId = 'jofjekcji1232dfdfeod'

      const validation = validateResetPasswordToken(userId, 'asdfasdfasdfasdfasdfsadfsadf')
      expect(validation).to.be.equal(false)
    })

    it('return false if the token is valid but not matched user id', () => {
      const userId = 'jofjekcjiasdfsadfsadfeod'
      const payload = generateResetPasswordPayload(userId)
      const token = generateJWToken(payload)

      const validation = validateResetPasswordToken('jon123', token)
      expect(validation).to.be.equal(false)
    })
  })

  describe('Resetting password', () => {
    it('return invalid when 2 password is not matched', async () => {
      const pw1 = 'asl;kfjs;alkjf'
      const pw2 = '09e75ty908dgjhdf'

      try {
        await createAndSaveNewPassword('Jane', pw1, pw2)
      } catch (error) {
        expect(error.message).to.be.equal(ResetPasswordValidationError.passwordNotMatch)
      }
    })

    it('return invalid when the new password length is < 12', async () => {
      const pw1 = 'as'
      const pw2 = 'as'

      try {
        await createAndSaveNewPassword('Jane', pw1, pw2)
      } catch (error) {
        expect(error.message).to.be.equal(ResetPasswordValidationError.passwordNotStrength)
      }
    })

    it('reset the password correctly', async () => {
      const { id: accountId } = await createTemporaryTestingAccount()
      const user = {
        accountId,
        password: 'qpewoirupoqwijer',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe1234@abx.com',
      }
      await createUser(user)
      const userFromDBBeforeChange = (await findUserByEmailWithAccount(user.email))!
      const hashedPassword = userFromDBBeforeChange.passwordHash
      const validationResult = await validatePassword(user.password, hashedPassword)

      expect(validationResult).to.be.equal(true)

      const newPassword1 = 'asdfasdfsdafsadfsdaf'
      const newPassword2 = 'asdfasdfsdafsadfsdaf'

      const userData = await createAndSaveNewPassword(userFromDBBeforeChange.id, newPassword1, newPassword2)
      expect(userData.id).to.be.equal(userFromDBBeforeChange.id)
      expect(userData.accountId).to.be.equal(userFromDBBeforeChange.accountId)
      expect(userData.firstName).to.be.equal(userFromDBBeforeChange.firstName)
      expect(userData.lastName).to.be.equal(userFromDBBeforeChange.lastName)
      expect(userData.email).to.be.equal(userFromDBBeforeChange.email)
      expect(userData.accountType).to.be.equal(userFromDBBeforeChange.account!.type)
      expect(userData.lastLogin).to.be.equal(userFromDBBeforeChange.lastLogin)

      const userFromDBAfterChange = await findUserByEmail(user.email)
      const hashedNewPassword = userFromDBAfterChange!.passwordHash
      const newValidationResult = await validatePassword(newPassword1, hashedNewPassword)

      expect(newValidationResult).to.be.equal(true)
    })
  })
})
